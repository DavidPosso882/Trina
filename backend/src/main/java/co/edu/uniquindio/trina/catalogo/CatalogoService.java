package co.edu.uniquindio.trina.catalogo;

import co.edu.uniquindio.trina.almacenamiento.StoragePort;
import co.edu.uniquindio.trina.estadistica.EstadisticaService;
import co.edu.uniquindio.trina.negocio.ImagenInvalidaException;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Catálogo digital (RF-15 a RF-18): gestión del comerciante propietario y lectura pública. La
 * propiedad se verifica siempre contra el negocio de la ruta; un ítem o categoría de otro negocio
 * da 409 y un negocio ajeno da 403.
 */
@Service
public class CatalogoService {

  private static final String APROBADO = "APROBADO";

  private final NegocioRepository negocios;
  private final CatalogoItemRepository items;
  private final CatalogoCategoriaRepository categorias;
  private final EstadisticaService estadisticas;
  private final StoragePort almacenamiento;
  private final ImagenCatalogoItemRepository imagenesItems;
  private final String baseMedia;

  public CatalogoService(
      NegocioRepository negocios,
      CatalogoItemRepository items,
      CatalogoCategoriaRepository categorias,
      EstadisticaService estadisticas,
      StoragePort almacenamiento,
      ImagenCatalogoItemRepository imagenesItems,
      @org.springframework.beans.factory.annotation.Value("${app.minio.base-media:/media}")
          String baseMedia) {
    this.negocios = negocios;
    this.items = items;
    this.categorias = categorias;
    this.estadisticas = estadisticas;
    this.almacenamiento = almacenamiento;
    this.imagenesItems = imagenesItems;
    this.baseMedia = baseMedia;
  }

  // ---- Lectura pública (RF-17/RF-18) ----

  /** Catálogo agrupado por categoría interna; 404 si el negocio no está APROBADO. */
  @Transactional(readOnly = true)
  public CatalogoDto.CatalogoPublico publico(Long negocioId) {
    var negocio =
        negocios
            .findByIdAndEstado(negocioId, APROBADO)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Negocio no publicado."));
    var activos = items.findByNegocio_IdAndActivoTrueOrderByNombreAsc(negocioId);
    activos.forEach(item -> estadisticas.registrarVistaItem(item.getId()));
    return agrupar(negocio, activos);
  }

  /**
   * RF-15/RF-16: catálogo propio del comerciante dueño, agrupado igual que el público pero con
   * todos los ítems (incluidas las bajas lógicas y los no disponibles) y sus flags; sirve para la
   * gestión y la pre-aprobación aunque el negocio todavía no esté APROBADO.
   */
  @Transactional(readOnly = true)
  public CatalogoDto.CatalogoPublico catalogoPropio(Long propietarioId, Long negocioId) {
    var negocio = propio(propietarioId, negocioId);
    return agrupar(negocio, items.findByNegocio_IdOrderByNombreAsc(negocioId));
  }

  /** Categorías internas visibles sin sesión; 404 solo si el negocio no existe. */
  @Transactional(readOnly = true)
  public List<CatalogoDto.CategoriaRespuesta> listarCategorias(Long negocioId) {
    if (!negocios.existsById(negocioId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado.");
    }
    return categorias.findByNegocio_IdOrderByOrdenAscNombreAsc(negocioId).stream()
        .map(CatalogoDto.CategoriaRespuesta::de)
        .toList();
  }

  // ---- Gestión del comerciante propietario (RF-15/RF-16/RF-18) ----

  @Transactional
  public CatalogoDto.ItemRespuesta crearItem(
      Long propietarioId, Long negocioId, CatalogoDto.ItemRequest req) {
    var negocio = propio(propietarioId, negocioId);
    var item =
        CatalogoItem.crear(
            negocio,
            categoriaDe(negocioId, req.categoriaId()),
            req.tipo(),
            req.nombre().trim(),
            limpiar(req.descripcion()),
            req.precioCop(),
            limpiar(req.claveImagen()));
    return CatalogoDto.ItemRespuesta.de(items.save(item), baseMedia, portadasItem(item.getId()));
  }

  @Transactional
  public CatalogoDto.ItemRespuesta actualizarItem(
      Long propietarioId, Long negocioId, Long itemId, CatalogoDto.ItemRequest req) {
    propio(propietarioId, negocioId);
    var item = itemDe(negocioId, itemId);
    exigirActivo(item);
    String clave = req.claveImagen() == null ? item.getClaveImagen() : limpiar(req.claveImagen());
    item.actualizar(
        categoriaDe(negocioId, req.categoriaId()),
        req.tipo(),
        req.nombre().trim(),
        limpiar(req.descripcion()),
        req.precioCop(),
        clave);
    return CatalogoDto.ItemRespuesta.de(item, baseMedia, portadasItem(item.getId()));
  }

  @Transactional
  public CatalogoDto.ItemRespuesta cambiarDisponibilidad(
      Long propietarioId, Long negocioId, Long itemId, boolean disponible) {
    propio(propietarioId, negocioId);
    var item = itemDe(negocioId, itemId);
    exigirActivo(item);
    item.cambiarDisponibilidad(disponible);
    return CatalogoDto.ItemRespuesta.de(item, baseMedia, portadasItem(item.getId()));
  }

  /**
   * Foto del producto (RF-12 en catálogo): valida, guarda en el almacenamiento y deja la clave en
   * el ítem. Devuelve el ítem con la URL pública resuelta.
   */
  @Transactional
  public CatalogoDto.ItemRespuesta subirImagenItem(
      Long propietarioId, Long negocioId, Long itemId, byte[] datos, String tipoContenido) {
    propio(propietarioId, negocioId);
    var item = itemDe(negocioId, itemId);
    exigirActivo(item);
    String extension =
        switch (tipoContenido == null ? "" : tipoContenido.toLowerCase()) {
          case "image/jpeg" -> "jpg";
          case "image/png" -> "png";
          case "image/webp" -> "webp";
          default -> throw new ImagenInvalidaException("Usa una imagen JPG, PNG o WebP.");
        };
    if (datos == null || datos.length == 0 || datos.length > 5 * 1024 * 1024) {
      throw new ImagenInvalidaException("La foto no puede superar los 5 MB.");
    }
    String clave =
        "catalogo/" + negocioId + "/" + java.util.UUID.randomUUID() + "." + extension;
    almacenamiento.guardar(clave, datos, tipoContenido);
    item.asignarImagen(clave);
    return CatalogoDto.ItemRespuesta.de(item, baseMedia, portadasItem(item.getId()));
  }

  /** Galería adicional del producto (la principal viaja en el ítem). */
  @Transactional(readOnly = true)
  public java.util.List<CatalogoDto.ImagenItem> listarImagenesItem(Long propietarioId, Long negocioId, Long itemId) {
    propio(propietarioId, negocioId);
    var item = itemDe(negocioId, itemId);
    exigirActivo(item);
    return imagenesItems.findByItem_IdOrderByOrdenAscIdAsc(itemId).stream()
        .map(g -> new CatalogoDto.ImagenItem(g.getId(), baseMedia + "/" + g.getClave()))
        .toList();
  }

  /** Suma una foto a la galería (máximo 5 entre principal y adicionales; solo hospedaje). */
  @Transactional
  public CatalogoDto.ItemRespuesta agregarImagenItem(
      Long propietarioId, Long negocioId, Long itemId, byte[] datos, String tipoContenido) {
    var negocio = propio(propietarioId, negocioId);
    if (!"ALOJAMIENTO".equals(negocio.getTipoReserva())) {
      throw new ImagenInvalidaException("Solo los hospedajes pueden tener varias fotos por producto.");
    }
    var item = itemDe(negocioId, itemId);
    exigirActivo(item);
    long actuales =
        (item.getClaveImagen() == null ? 0 : 1) + imagenesItems.countByItem_Id(itemId);
    if (actuales >= 5) {
      throw new ImagenInvalidaException("Cada producto admite hasta 5 fotos.");
    }
    String extension =
        switch (tipoContenido == null ? "" : tipoContenido.toLowerCase()) {
          case "image/jpeg" -> "jpg";
          case "image/png" -> "png";
          case "image/webp" -> "webp";
          default -> throw new ImagenInvalidaException("Usa una imagen JPG, PNG o WebP.");
        };
    if (datos == null || datos.length == 0 || datos.length > 5 * 1024 * 1024) {
      throw new ImagenInvalidaException("La foto no puede superar los 5 MB.");
    }
    int orden = (int) imagenesItems.countByItem_Id(itemId);
    String clave = "catalogo/" + negocioId + "/" + itemId + "/" + java.util.UUID.randomUUID() + "." + extension;
    almacenamiento.guardar(clave, datos, tipoContenido);
    imagenesItems.save(ImagenCatalogoItem.nueva(item, clave, orden));
    return CatalogoDto.ItemRespuesta.de(item, baseMedia, portadasItem(itemId));
  }

  /** Quita una foto adicional de la galería (la principal se cambia subiendo otra). */
  @Transactional
  public void eliminarImagenItem(Long propietarioId, Long negocioId, Long itemId, Long imagenId) {
    propio(propietarioId, negocioId);
    var item = itemDe(negocioId, itemId);
    exigirActivo(item);
    var img =
        imagenesItems
            .findByIdAndItem_Id(imagenId, itemId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto no encontrada."));
    try {
      almacenamiento.eliminar(img.getClave());
    } catch (RuntimeException ignored) {
      // Si el archivo ya no está, igual se borra el registro.
    }
    imagenesItems.delete(img);
  }

  private java.util.List<String> portadasItem(Long itemId) {
    return imagenesItems.findByItem_IdOrderByOrdenAscIdAsc(itemId).stream()
        .map(g -> baseMedia + "/" + g.getClave())
        .toList();
  }

  /** Baja lógica: el ítem queda inactivo y desaparece del catálogo público (RF-16 E2). */
  @Transactional
  public void eliminarItem(Long propietarioId, Long negocioId, Long itemId) {
    propio(propietarioId, negocioId);
    var item = itemDe(negocioId, itemId);
    exigirActivo(item);
    item.darDeBaja();
  }

  @Transactional
  public CatalogoDto.CategoriaRespuesta crearCategoria(
      Long propietarioId, Long negocioId, CatalogoDto.CategoriaRequest req) {
    var negocio = propio(propietarioId, negocioId);
    var cat =
        categorias.save(
            new CatalogoCategoria(negocio, req.nombre().trim(), req.orden() == null ? 0 : req.orden()));
    return CatalogoDto.CategoriaRespuesta.de(cat);
  }

  @Transactional
  public CatalogoDto.CategoriaRespuesta actualizarCategoria(
      Long propietarioId, Long negocioId, Long catId, CatalogoDto.CategoriaRequest req) {
    propio(propietarioId, negocioId);
    var cat = categoriaDe(negocioId, catId);
    cat.actualizar(req.nombre().trim(), req.orden() == null ? cat.getOrden() : req.orden());
    return CatalogoDto.CategoriaRespuesta.de(cat);
  }

  /** Al eliminar una categoría sus ítems quedan sin categoría; no se borran (RF-18). */
  @Transactional
  public void eliminarCategoria(Long propietarioId, Long negocioId, Long catId) {
    propio(propietarioId, negocioId);
    var cat = categoriaDe(negocioId, catId);
    items.findByCategoria_Id(catId).forEach(CatalogoItem::quitarCategoria);
    categorias.delete(cat);
  }

  // ---- Apoyo ----

  /** Agrupa cualquier conjunto de ítems por categoría interna, igual que el catálogo público. */
  private CatalogoDto.CatalogoPublico agrupar(Negocio negocio, List<CatalogoItem> visibles) {
    var grupos = new ArrayList<CatalogoDto.GrupoCategoria>();
    for (var cat : categorias.findByNegocio_IdOrderByOrdenAscNombreAsc(negocio.getId())) {
      var suyos =
          visibles.stream()
              .filter(i -> i.getCategoria() != null && i.getCategoria().getId().equals(cat.getId()))
              .map(i -> CatalogoDto.ItemRespuesta.de(i, baseMedia, portadasItem(i.getId())))
              .toList();
      if (!suyos.isEmpty()) {
        grupos.add(new CatalogoDto.GrupoCategoria(CatalogoDto.CategoriaRespuesta.de(cat), suyos));
      }
    }
    var sinCategoria =
        visibles.stream()
            .filter(i -> i.getCategoria() == null)
            .map(i -> CatalogoDto.ItemRespuesta.de(i, baseMedia, portadasItem(i.getId())))
            .toList();
    return new CatalogoDto.CatalogoPublico(
        negocio.getId(), negocio.getNombre(), grupos, sinCategoria);
  }

  private Negocio propio(Long propietarioId, Long negocioId) {
    var n =
        negocios
            .findById(negocioId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado."));
    if (!n.getPropietario().getId().equals(propietarioId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ese negocio no es tuyo.");
    }
    return n;
  }

  private CatalogoItem itemDe(Long negocioId, Long itemId) {
    var item =
        items
            .findById(itemId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ítem no encontrado."));
    if (!item.getNegocio().getId().equals(negocioId)) {
      throw new IllegalStateException("Ese ítem es de otro negocio.");
    }
    return item;
  }

  private CatalogoCategoria categoriaDe(Long negocioId, Long categoriaId) {
    if (categoriaId == null) {
      return null;
    }
    var cat =
        categorias
            .findById(categoriaId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Esa categoría no existe."));
    if (!cat.getNegocio().getId().equals(negocioId)) {
      throw new IllegalStateException("Esa categoría es de otro negocio.");
    }
    return cat;
  }

  private static void exigirActivo(CatalogoItem item) {
    if (!item.isActivo()) {
      throw new IllegalStateException("Ese ítem está dado de baja.");
    }
  }

  private static String limpiar(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
