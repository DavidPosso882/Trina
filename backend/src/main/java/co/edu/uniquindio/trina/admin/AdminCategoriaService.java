package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * RF-44: alta, edición y estado de categorías. Desactivar una categoría con negocios existentes
 * se permite: los negocios ya asociados la conservan (el catálogo público solo oculta categorías
 * inactivas para altas nuevas).
 */
@Service
public class AdminCategoriaService {

  private final AdminCategoriaRepository categorias;
  private final AuditoriaService auditoria;

  public AdminCategoriaService(AdminCategoriaRepository categorias, AuditoriaService auditoria) {
    this.categorias = categorias;
    this.auditoria = auditoria;
  }

  @Transactional(readOnly = true)
  public List<AdminCategoriaDto.CategoriaRespuesta> publicas() {
    return mapear(categorias.activas());
  }

  @Transactional(readOnly = true)
  public List<AdminCategoriaDto.CategoriaRespuesta> todas() {
    return mapear(categorias.todas());
  }

  @Transactional
  public AdminCategoriaDto.CategoriaRespuesta crear(
      Long actorId, AdminCategoriaDto.CategoriaRequest req) {
    String nombre = req.nombre().trim();
    if (categorias.existsByNombreIgnoreCase(nombre)) {
      throw new IllegalStateException("Ya existe una categoría con ese nombre.");
    }
    var creada = categorias.save(new CategoriaNegocio(nombre));
    categorias.editar(creada.getId(), nombre, limpiar(req.icono()), orden(req.orden()));
    auditoria.registrar(actorId, "CREAR_CATEGORIA", "CATEGORIA", creada.getId(), nombre, null);
    return una(creada.getId());
  }

  @Transactional
  public AdminCategoriaDto.CategoriaRespuesta editar(
      Long actorId, Long id, AdminCategoriaDto.CategoriaRequest req) {
    var actual = exigir(id);
    String nombre = req.nombre().trim();
    if (!actual.getNombre().equalsIgnoreCase(nombre)
        && categorias.existsByNombreIgnoreCase(nombre)) {
      throw new IllegalStateException("Ya existe una categoría con ese nombre.");
    }
    categorias.editar(id, nombre, limpiar(req.icono()), orden(req.orden()));
    auditoria.registrar(actorId, "EDITAR_CATEGORIA", "CATEGORIA", id, nombre, null);
    return una(id);
  }

  /** Desactivar no toca los negocios existentes: solo deja de ofrecerse para altas nuevas. */
  @Transactional
  public AdminCategoriaDto.CategoriaRespuesta cambiarEstado(
      Long actorId, Long id, boolean activa) {
    exigir(id);
    categorias.cambiarActiva(id, activa);
    auditoria.registrar(
        actorId,
        activa ? "ACTIVAR_CATEGORIA" : "DESACTIVAR_CATEGORIA",
        "CATEGORIA",
        id,
        "activa=" + activa,
        null);
    return una(id);
  }

  private CategoriaNegocio exigir(Long id) {
    return categorias
        .findById(id)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Esa categoría no existe."));
  }

  private AdminCategoriaDto.CategoriaRespuesta una(Long id) {
    var filas = categorias.cruda(id);
    if (filas.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Esa categoría no existe.");
    }
    return mapear(filas.get(0));
  }

  private static List<AdminCategoriaDto.CategoriaRespuesta> mapear(List<Object[]> filas) {
    return filas.stream().map(AdminCategoriaService::mapear).toList();
  }

  private static AdminCategoriaDto.CategoriaRespuesta mapear(Object[] fila) {
    return new AdminCategoriaDto.CategoriaRespuesta(
        (Long) fila[0],
        (String) fila[1],
        (String) fila[2],
        ((Number) fila[3]).intValue(),
        (Boolean) fila[4]);
  }

  private static int orden(Integer orden) {
    return orden == null ? 0 : orden;
  }

  private static String limpiar(String valor) {
    return valor == null || valor.isBlank() ? null : valor.trim();
  }
}
