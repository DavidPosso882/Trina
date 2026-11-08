package co.edu.uniquindio.trina.catalogo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImagenCatalogoItemRepository extends JpaRepository<ImagenCatalogoItem, Long> {

  List<ImagenCatalogoItem> findByItem_IdOrderByOrdenAscIdAsc(Long itemId);

  long countByItem_Id(Long itemId);

  java.util.Optional<ImagenCatalogoItem> findByIdAndItem_Id(Long id, Long itemId);
}
