package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

/**
 * RF-44: acceso de administración a categoria_negocio. Los campos icono/orden/activa no tienen
 * setters en la entidad; se actualizan con JPQL y se leen como proyecciones de columnas.
 */
public interface AdminCategoriaRepository extends JpaRepository<CategoriaNegocio, Long> {

  boolean existsByNombreIgnoreCase(String nombre);

  @Query(
      "select c.id, c.nombre, c.icono, c.orden, c.activa from CategoriaNegocio c "
          + "where c.activa = true order by c.orden asc, c.nombre asc")
  List<Object[]> activas();

  @Query(
      "select c.id, c.nombre, c.icono, c.orden, c.activa from CategoriaNegocio c "
          + "order by c.orden asc, c.nombre asc")
  List<Object[]> todas();

  @Query(
      "select c.id, c.nombre, c.icono, c.orden, c.activa from CategoriaNegocio c where c.id = :id")
  List<Object[]> cruda(Long id);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query(
      "update CategoriaNegocio c set c.nombre = :nombre, c.icono = :icono, c.orden = :orden "
          + "where c.id = :id")
  int editar(Long id, String nombre, String icono, int orden);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("update CategoriaNegocio c set c.activa = :activa where c.id = :id")
  int cambiarActiva(Long id, boolean activa);
}
