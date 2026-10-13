package co.edu.uniquindio.trina.catalogo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogoItemRepository extends JpaRepository<CatalogoItem, Long> {

  List<CatalogoItem> findByNegocio_IdAndActivoTrueOrderByNombreAsc(Long negocioId);

  List<CatalogoItem> findByNegocio_IdOrderByNombreAsc(Long negocioId);

  List<CatalogoItem> findByCategoria_Id(Long categoriaId);
}
