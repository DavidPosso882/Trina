package co.edu.uniquindio.trina.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/** Consultas de la bitácora (RF-46). El filtrado dinámico vive en el servicio con Specifications. */
public interface AuditoriaRepository
    extends JpaRepository<Auditoria, Long>, JpaSpecificationExecutor<Auditoria> {}
