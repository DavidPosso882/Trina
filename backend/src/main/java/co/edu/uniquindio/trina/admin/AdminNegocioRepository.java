package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.negocio.Negocio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

/** RF-47: la entidad Negocio no expone un setter de estado para el alta asistida. */
public interface AdminNegocioRepository extends JpaRepository<Negocio, Long> {

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("update Negocio n set n.estado = :estado, n.motivoRevision = null where n.id = :id")
  int cambiarEstado(Long id, String estado);
}
