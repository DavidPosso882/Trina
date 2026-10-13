package co.edu.uniquindio.trina.negocio;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Directorio público RF-08/RF-09/RF-20 a RF-24: solo negocios APROBADO. Paginación page (desde 0) +
 * size (máx 50). Los filtros de búsqueda son opcionales y compatibles con la versión anterior.
 */
@RestController
@RequestMapping("/api/v1/negocios")
public class NegocioController {

  private static final Set<String> ORDENES = Set.of("destacados", "cercania", "nombre");

  private final NegocioService servicio;

  public NegocioController(NegocioService servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public NegocioService.Pagina listar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Long categoriaId,
      @RequestParam(required = false) Boolean abiertoAhora,
      @RequestParam(required = false) Integer nivelPrecio,
      @RequestParam(required = false) BigDecimal lat,
      @RequestParam(required = false) BigDecimal lng,
      @RequestParam(required = false) Double radioKm,
      @RequestParam(required = false) String orden,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    validar(nivelPrecio, lat, lng, radioKm, orden);
    return servicio.listar(
        filtro(q, categoriaId, abiertoAhora, nivelPrecio, lat, lng, radioKm, orden),
        page,
        Math.min(size, 50));
  }

  /** RF-24: mismos filtros que la lista, sin paginar para dibujar todos los marcadores. */
  @GetMapping("/mapa")
  public List<NegocioService.Marcador> mapa(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Long categoriaId,
      @RequestParam(required = false) Boolean abiertoAhora,
      @RequestParam(required = false) Integer nivelPrecio,
      @RequestParam(required = false) BigDecimal lat,
      @RequestParam(required = false) BigDecimal lng,
      @RequestParam(required = false) Double radioKm,
      @RequestParam(required = false) String orden) {
    validar(nivelPrecio, lat, lng, radioKm, orden);
    return servicio.mapa(filtro(q, categoriaId, abiertoAhora, nivelPrecio, lat, lng, radioKm, orden));
  }

  @GetMapping("/{id}")
  public NegocioService.Ficha perfil(@PathVariable Long id) {
    return servicio.perfil(id);
  }

  private static NegocioService.Filtro filtro(
      String q,
      Long categoriaId,
      Boolean abiertoAhora,
      Integer nivelPrecio,
      BigDecimal lat,
      BigDecimal lng,
      Double radioKm,
      String orden) {
    return new NegocioService.Filtro(
        q, categoriaId, abiertoAhora, nivelPrecio, lat, lng, radioKm, orden);
  }

  /** §5.9: los parámetros inválidos responden 400 de validación; las reglas de negocio, 422. */
  private static void validar(
      Integer nivelPrecio, BigDecimal lat, BigDecimal lng, Double radioKm, String orden) {
    if (nivelPrecio != null && (nivelPrecio < 1 || nivelPrecio > 3)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "El nivel de precio tiene que ser 1, 2 o 3.");
    }
    if ((lat == null) != (lng == null)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Para buscar por cercanía indicá latitud y longitud juntas.");
    }
    if (lat != null
        && (lat.compareTo(BigDecimal.valueOf(-90)) < 0
            || lat.compareTo(BigDecimal.valueOf(90)) > 0)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "La latitud tiene que estar entre -90 y 90.");
    }
    if (lng != null
        && (lng.compareTo(BigDecimal.valueOf(-180)) < 0
            || lng.compareTo(BigDecimal.valueOf(180)) > 0)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "La longitud tiene que estar entre -180 y 180.");
    }
    if (radioKm != null && lat == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "El radio en kilómetros necesita latitud y longitud.");
    }
    if (radioKm != null && radioKm <= 0) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "El radio tiene que ser mayor que cero.");
    }
    if (orden != null && !ORDENES.contains(orden)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "El orden tiene que ser destacados, cercania o nombre.");
    }
    if ("cercania".equals(orden) && lat == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Para ordenar por cercanía indicá latitud y longitud.");
    }
  }
}
