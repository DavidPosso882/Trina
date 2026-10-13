package co.edu.uniquindio.trina.catalogo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogoCategoriaRepository extends JpaRepository<CatalogoCategoria, Long> {

  List<CatalogoCategoria> findByNegocio_IdOrderByOrdenAscNombreAsc(Long negocioId);
}
