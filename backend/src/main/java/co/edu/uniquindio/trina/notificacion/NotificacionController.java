package co.edu.uniquindio.trina.notificacion;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Campana de notificaciones (RF-32): lista, contador y marcado de leídas para Cliente y
 * Comerciante. La propiedad se verifica en el servicio (403 ajena, 404 inexistente).
 */
@RestController
@RequestMapping("/api/v1/notificaciones")
@PreAuthorize("hasAnyRole('CLIENTE','COMERCIANTE')")
public class NotificacionController {

  private final NotificacionService servicio;

  public NotificacionController(NotificacionService servicio) {
    this.servicio = servicio;
  }

  private Long sesionId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return (Long) auth.getPrincipal();
  }

  @GetMapping
  public List<NotificacionDto.Respuesta> listar(
      @RequestParam(defaultValue = "false") boolean soloNoLeidas) {
    return servicio.listar(sesionId(), soloNoLeidas);
  }

  @GetMapping("/contador")
  public NotificacionDto.ContadorRespuesta contador() {
    return servicio.contador(sesionId());
  }

  @PatchMapping("/{id}/leida")
  public NotificacionDto.Respuesta marcarLeida(@PathVariable Long id) {
    return servicio.marcarLeida(sesionId(), id);
  }

  @PostMapping("/leer-todas")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void leerTodas() {
    servicio.leerTodas(sesionId());
  }
}
