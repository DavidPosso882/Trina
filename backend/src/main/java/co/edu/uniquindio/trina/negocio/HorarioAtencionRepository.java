package co.edu.uniquindio.trina.negocio;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorarioAtencionRepository extends JpaRepository<HorarioAtencion, Long> {

  List<HorarioAtencion> findByNegocio_IdOrderByDiaSemanaAscAbreAsc(Long negocioId);

  List<HorarioAtencion> findByNegocio_IdIn(Collection<Long> negocioIds);

  void deleteByNegocio_Id(Long negocioId);

  boolean existsByNegocio_Id(Long negocioId);
}
