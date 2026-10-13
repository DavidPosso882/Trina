package co.edu.uniquindio.trina.admin;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** RF-47 E3: alta asistida de negocios por el Administrador. */
@RestController
@RequestMapping("/api/v1/admin/negocios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminNegocioController {

  private final AdminNegocioService servicio;

  public AdminNegocioController(AdminNegocioService servicio) {
    this.servicio = servicio;
  }

  @PostMapping
  public ResponseEntity<AdminNegocioDto.Respuesta> crear(
      @AuthenticationPrincipal Long actorId,
      @Valid @RequestBody AdminNegocioDto.AltaRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(servicio.crear(actorId, req));
  }
}
