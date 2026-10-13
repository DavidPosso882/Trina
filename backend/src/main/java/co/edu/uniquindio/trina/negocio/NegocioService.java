package co.edu.uniquindio.trina.negocio;

import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.estadistica.EstadisticaService;
import co.edu.uniquindio.trina.membresia.MembresiaService;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Directorio público RF-08/RF-20: solo APROBADO, búsqueda sin tildes ni mayúsculas. Con ~200 negocios
 * el filtro y el Haversine en memoria alcanzan (diseño §7.3); si el volumen creciera, se migra la
 * misma API a SQL. RF-37: la insignia y la prioridad DESTACADA salen de una sola consulta de
 * membresías vigentes.
 */
@Service
public class NegocioService {

  /** RF-22: distancia de la respuesta cuando se pidió cercanía; null en el resto de los casos. */
  public record Ficha(
      Long id,
      String nombre,
      String categoria,
      String estado,
      boolean abiertoAhora,
      boolean destacado,
      String insignia,
      String descripcion,
      String direccion,
      String telefono,
      String whatsapp,
      BigDecimal latitud,
      BigDecimal longitud,
      boolean aceptaPedidos,
      boolean aceptaReservas,
      String tipoReserva,
      Integer nivelPrecio,
      @JsonInclude(JsonInclude.Include.NON_NULL) Double distanciaKm) {}

  public record Pagina(List<Ficha> contenido, int pagina, int tamano, long total) {}

  /** RF-24: marcador del mapa; solo negocios con coordenadas válidas (E4). */
  public record Marcador(
      Long id,
      String nombre,
      String categoria,
      BigDecimal latitud,
      BigDecimal longitud,
      boolean abiertoAhora,
      boolean destacado) {}

  /** Filtros opcionales compartidos por la lista y el mapa (RF-20/RF-22/RF-23/RF-37). */
  public record Filtro(
      String q,
      Long categoriaId,
      Boolean abiertoAhora,
      Integer nivelPrecio,
      BigDecimal lat,
      BigDecimal lng,
      Double radioKm,
      String orden) {}

  private static final String ORDEN_CERCANIA = "cercania";
  private static final String ORDEN_NOMBRE = "nombre";

  private final NegocioRepository negocios;
  private final MembresiaService membresias;
  private final HorarioService horarios;
  private final EstadisticaService estadisticas;
  private final CatalogoItemRepository items;

  public NegocioService(
      NegocioRepository negocios,
      MembresiaService membresias,
      HorarioService horarios,
      EstadisticaService estadisticas,
      CatalogoItemRepository items) {
    this.negocios = negocios;
    this.membresias = membresias;
    this.horarios = horarios;
    this.estadisticas = estadisticas;
    this.items = items;
  }

  @Transactional(readOnly = true)
  public Pagina listar(Filtro filtro, int page, int size) {
    List<Hallazgo> hallazgos = buscar(filtro);
    int desde = Math.min(page * size, hallazgos.size());
    int hasta = Math.min(desde + size, hallazgos.size());
    return new Pagina(
        hallazgos.subList(desde, hasta).stream().map(NegocioService::ficha).toList(),
        page,
        size,
        hallazgos.size());
  }

  /** RF-24: mismos filtros que la lista, sin paginar y solo con coordenadas válidas (E4). */
  @Transactional(readOnly = true)
  public List<Marcador> mapa(Filtro filtro) {
    return buscar(filtro).stream()
        .filter(h -> coordenadaValida(h.negocio().getLatitud(), h.negocio().getLongitud()))
        .map(
            h ->
                new Marcador(
                    h.negocio().getId(),
                    h.negocio().getNombre(),
                    h.negocio().getCategoria() == null
                        ? null
                        : h.negocio().getCategoria().getNombre(),
                    h.negocio().getLatitud(),
                    h.negocio().getLongitud(),
                    h.abierto(),
                    h.destacado()))
        .toList();
  }

  @Transactional(readOnly = true)
  public Ficha perfil(Long id) {
    var n =
        negocios
            .findById(id)
            .filter(x -> "APROBADO".equals(x.getEstado()))
            .orElseThrow(
                () ->
                    new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Negocio no publicado"));
    estadisticas.registrarVistaPerfil(n.getId());
    return ficha(
        new Hallazgo(
            n,
            horarios.abiertoAhora(n.getId(), Instant.now()),
            membresias.negociosDestacados().contains(n.getId()),
            null));
  }

  // ---- Búsqueda ----

  private record Hallazgo(Negocio negocio, boolean abierto, boolean destacado, Double distanciaKm) {}

  private List<Hallazgo> buscar(Filtro filtro) {
    List<Negocio> base =
        filtro.categoriaId() == null
            ? negocios.findByEstado("APROBADO")
            : negocios.findByEstadoAndCategoriaId("APROBADO", filtro.categoriaId());
    Set<Long> destacados = membresias.negociosDestacados();
    Set<Long> abiertos =
        horarios.abiertos(base.stream().map(Negocio::getId).toList(), Instant.now());
    String qn = filtro.q() == null ? "" : normalizar(filtro.q());
    Set<Long> conItem = qn.isEmpty() ? Set.of() : idsConItem(qn);
    boolean cerca = filtro.lat() != null && filtro.lng() != null;

    var hallazgos =
        base.stream()
            .filter(
                n ->
                    filtro.nivelPrecio() == null
                        || filtro.nivelPrecio().equals(n.getNivelPrecio()))
            .filter(
                n -> !Boolean.TRUE.equals(filtro.abiertoAhora()) || abiertos.contains(n.getId()))
            .filter(n -> qn.isEmpty() || coincide(n, qn, conItem))
            .map(
                n ->
                    new Hallazgo(
                        n,
                        abiertos.contains(n.getId()),
                        destacados.contains(n.getId()),
                        cerca ? distanciaKm(filtro.lat(), filtro.lng(), n) : null))
            .filter(h -> !cerca || h.distanciaKm() != null)
            .filter(
                h ->
                    filtro.radioKm() == null
                        || (h.distanciaKm() != null && h.distanciaKm() <= filtro.radioKm()));

    return hallazgos.sorted(comparador(filtro.orden(), cerca)).toList();
  }

  /**
   * RF-37 E2/E3: por defecto DESTACADA primero; con orden=cercania manda la distancia y la insignia
   * se conserva; orden=nombre es alfabético puro.
   */
  private static Comparator<Hallazgo> comparador(String orden, boolean cerca) {
    if (ORDEN_CERCANIA.equals(orden) && cerca) {
      return Comparator.comparing(Hallazgo::distanciaKm).thenComparing(h -> h.negocio().getNombre());
    }
    if (ORDEN_NOMBRE.equals(orden)) {
      return Comparator.comparing(h -> h.negocio().getNombre());
    }
    return Comparator.comparing((Hallazgo h) -> !h.destacado())
        .thenComparing(h -> h.negocio().getNombre());
  }

  /** RF-20: nombre del negocio, nombre de la categoría o nombre de un ítem activo del catálogo. */
  private boolean coincide(Negocio n, String qn, Set<Long> conItem) {
    if (normalizar(n.getNombre()).contains(qn)) {
      return true;
    }
    if (n.getCategoria() != null && normalizar(n.getCategoria().getNombre()).contains(qn)) {
      return true;
    }
    return conItem.contains(n.getId());
  }

  /**
   * RF-20: ítems ACTIVOS cuyo nombre matchea. El repositorio no ofrece consulta por lote y el
   * catálogo es chico (diseño §7.3: ~200 negocios), así que se filtra en memoria.
   */
  private Set<Long> idsConItem(String qn) {
    return items.findAll().stream()
        .filter(CatalogoItem::isActivo)
        .filter(i -> normalizar(i.getNombre()).contains(qn))
        .map(i -> i.getNegocio().getId())
        .collect(Collectors.toSet());
  }

  /** Haversine con radio terrestre medio (diseño §7.3); null si el destino no tiene coordenadas. */
  static Double distanciaKm(BigDecimal latOrigen, BigDecimal lngOrigen, Negocio destino) {
    BigDecimal lat = destino.getLatitud();
    BigDecimal lng = destino.getLongitud();
    if (!coordenadaValida(lat, lng)) {
      return null;
    }
    double dLat = Math.toRadians(lat.doubleValue() - latOrigen.doubleValue());
    double dLng = Math.toRadians(lng.doubleValue() - lngOrigen.doubleValue());
    double a =
        Math.pow(Math.sin(dLat / 2), 2)
            + Math.cos(Math.toRadians(latOrigen.doubleValue()))
                * Math.cos(Math.toRadians(lat.doubleValue()))
                * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * 6371.0 * Math.asin(Math.sqrt(Math.min(1.0, a)));
  }

  static boolean coordenadaValida(BigDecimal lat, BigDecimal lng) {
    return lat != null
        && lng != null
        && lat.compareTo(BigDecimal.valueOf(-90)) >= 0
        && lat.compareTo(BigDecimal.valueOf(90)) <= 0
        && lng.compareTo(BigDecimal.valueOf(-180)) >= 0
        && lng.compareTo(BigDecimal.valueOf(180)) <= 0;
  }

  /** RF-37 E1: la insignia "Destacado" viaja con el negocio cuando su plan efectivo es DESTACADA. */
  private static Ficha ficha(Hallazgo h) {
    var n = h.negocio();
    return new Ficha(
        n.getId(),
        n.getNombre(),
        n.getCategoria() == null ? null : n.getCategoria().getNombre(),
        n.getEstado(),
        h.abierto(),
        h.destacado(),
        h.destacado() ? "Destacado" : null,
        n.getDescripcion(),
        n.getDireccion(),
        n.getTelefono(),
        n.getWhatsapp(),
        n.getLatitud(),
        n.getLongitud(),
        n.isAceptaPedidos(),
        n.isAceptaReservas(),
        n.getTipoReserva(),
        n.getNivelPrecio(),
        h.distanciaKm());
  }

  static String normalizar(String s) {
    return Normalizer.normalize(s, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase();
  }
}
