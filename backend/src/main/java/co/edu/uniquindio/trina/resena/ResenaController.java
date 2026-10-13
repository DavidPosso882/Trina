package co.edu.uniquindio.trina.resena;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Reseñas (RF-38/RF-39). El listado es público; publicar y editar quedan para el Cliente autor; el
 * Comerciante dueño del negocio reporta con motivo.
 */
@RestController
public class ResenaController {

  private final ResenaService servicio;

  public ResenaController(ResenaService servicio) {
    this.servicio = servicio;
  }

  /** RF-38: listado público con promedio de visibles; 404 si el negocio no está aprobado. */
  @GetMapping("/api/v1/negocios/{negocioId}/resenas")
  public ResenaDto.ListadoRespuesta listar(@PathVariable Long negocioId) {
    return servicio.listar(negocioId);
  }

  @PostMapping("/api/v1/negocios/{negocioId}/resenas")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('CLIENTE')")
  public ResenaDto.ResenaRespuesta publicar(
      @AuthenticationPrincipal Long clienteId,
      @PathVariable Long negocioId,
      @Valid @RequestBody ResenaDto.PublicarRequest req) {
    return servicio.publicar(clienteId, negocioId, req);
  }

  /** RF-38 E3: solo el autor edita; una segunda reseña del mismo par responde 409 en POST. */
  @PutMapping("/api/v1/resenas/{id}")
  @PreAuthorize("hasRole('CLIENTE')")
  public ResenaDto.ResenaRespuesta editar(
      @AuthenticationPrincipal Long clienteId,
      @PathVariable Long id,
      @Valid @RequestBody ResenaDto.PublicarRequest req) {
    return servicio.editar(clienteId, id, req);
  }

  /** RF-39 E1: reporte del Comerciante dueño con motivo obligatorio. */
  @PostMapping("/api/v1/resenas/{id}/reportar")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public ResenaDto.ResenaRespuesta reportar(
      @AuthenticationPrincipal Long comercianteId,
      @PathVariable Long id,
      @Valid @RequestBody ResenaDto.ReportarRequest req) {
    return servicio.reportar(comercianteId, id, req.motivo());
  }
}
