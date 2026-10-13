package co.edu.uniquindio.trina.admin;

import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/** Consultas de la bitácora (RF-46). */
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

  @Query(
      """
      select a from Auditoria a
      where (:usuarioId is null or a.usuarioId = :usuarioId)
        and (:entidad is null or upper(a.entidad) = upper(:entidad))
        and (:desde is null or a.creadoEn >= :desde)
        and (:hasta is null or a.creadoEn <= :hasta)
      """)
  Page<Auditoria> filtrar(
      Long usuarioId, String entidad, Instant desde, Instant hasta, Pageable pageable);
}
