package co.edu.uniquindio.trina.notificacion;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Consultas de la campana (RF-32): lista por usuario, filtro de no leídas y contador. */
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

  List<Notificacion> findByUsuario_IdOrderByCreadoEnDescIdDesc(Long usuarioId);

  List<Notificacion> findByUsuario_IdAndLeidaFalseOrderByCreadoEnDescIdDesc(Long usuarioId);

  List<Notificacion> findByUsuario_IdAndLeidaFalse(Long usuarioId);

  long countByUsuario_IdAndLeidaFalse(Long usuarioId);
}
