package co.edu.uniquindio.trina.negocio;

import co.edu.uniquindio.trina.admin.AuditoriaService;
import co.edu.uniquindio.trina.notificacion.NotificacionService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Revisión de negocios por el Administrador (RF-07): cola por estado y transiciones §5.1. */
@Service
public class NegocioRevisionService {

  private final NegocioRepository negocios;
  private final NotificacionService notificaciones;
  private final AuditoriaService auditoria;

  public NegocioRevisionService(
      NegocioRepository negocios, NotificacionService notificaciones, AuditoriaService auditoria) {
    this.negocios = negocios;
    this.notificaciones = notificaciones;
    this.auditoria = auditoria;
  }

  @Transactional(readOnly = true)
  public List<Negocio> listar(String estado) {
    return estado == null || estado.isBlank() ? negocios.findAll() : negocios.findByEstado(estado);
  }

  @Transactional
  public Negocio cambiarEstado(Long negocioId, NegocioRevisionDto.CambiarEstadoRequest req) {
    var negocio =
        negocios
            .findById(negocioId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado."));
    Long actorId = actorActual();
    switch (req.accion()) {
      case APROBAR -> {
        negocio.aprobar();
        notificaciones.notificar(negocio.getPropietario().getId(), "NEGOCIO_APROBADO", "¡Tu negocio " + negocio.getNombre() + " fue aprobado! Ya aparece en el directorio.", "NEGOCIO", negocio.getId());
        auditoria.registrar(actorId, "APROBAR", "NEGOCIO", negocio.getId(), "estado=" + negocio.getEstado(), req.motivo());
      }
      case RECHAZAR -> {
        negocio.rechazar(req.motivo());
        notificaciones.notificar(negocio.getPropietario().getId(), "NEGOCIO_RECHAZADO", "Tu negocio " + negocio.getNombre() + " fue rechazado: " + negocio.getMotivoRevision(), "NEGOCIO", negocio.getId());
        auditoria.registrar(actorId, "RECHAZAR", "NEGOCIO", negocio.getId(), "estado=" + negocio.getEstado(), req.motivo());
      }
      case SOLICITAR_CORRECCION -> {
        negocio.solicitarCorreccion(req.motivo());
        notificaciones.notificar(negocio.getPropietario().getId(), "NEGOCIO_CORRECCION", "Tu negocio " + negocio.getNombre() + " necesita ajustes: " + negocio.getMotivoRevision(), "NEGOCIO", negocio.getId());
        auditoria.registrar(actorId, "SOLICITAR_CORRECCION", "NEGOCIO", negocio.getId(), "estado=" + negocio.getEstado(), req.motivo());
      }
      case SUSPENDER -> {
        negocio.suspender(req.motivo());
        auditoria.registrar(actorId, "SUSPENDER", "NEGOCIO", negocio.getId(), "estado=" + negocio.getEstado(), req.motivo());
      }
      case REACTIVAR -> {
        negocio.reactivar();
        auditoria.registrar(actorId, "REACTIVAR", "NEGOCIO", negocio.getId(), "estado=" + negocio.getEstado(), req.motivo());
      }
    }
    return negocio;
  }

  /** RF-46: el actor es el Administrador autenticado por el filtro JWT; puede faltar en pruebas. */
  private static Long actorActual() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return auth != null && auth.getPrincipal() instanceof Long id ? id : null;
  }
}
