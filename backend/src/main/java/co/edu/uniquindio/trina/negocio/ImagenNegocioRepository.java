package co.edu.uniquindio.trina.negocio;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImagenNegocioRepository extends JpaRepository<ImagenNegocio, Long> {

  List<ImagenNegocio> findByNegocio_IdOrderByOrdenAscIdAsc(Long negocioId);

  long countByNegocio_Id(Long negocioId);

  boolean existsByNegocio_Id(Long negocioId);

  Optional<ImagenNegocio> findByIdAndNegocio_Id(Long id, Long negocioId);
}
