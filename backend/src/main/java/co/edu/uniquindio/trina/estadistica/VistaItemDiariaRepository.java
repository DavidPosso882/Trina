package co.edu.uniquindio.trina.estadistica;

import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

/**
 * Upsert atómico del contador diario de vistas de ítem (diseño §7.7). Mismo criterio portátil que
 * {@link VistaPerfilDiariaRepository}: INSERT ... ON CONFLICT DO NOTHING + UPDATE de respaldo.
 */
public interface VistaItemDiariaRepository
    extends JpaRepository<VistaItemDiaria, VistaItemDiaria.Clave> {

  @Modifying
  @Query(
      value =
          "INSERT INTO vista_item_diaria (item_id, fecha, contador) "
              + "VALUES (:itemId, :fecha, 1) ON CONFLICT DO NOTHING",
      nativeQuery = true)
  int insertarSiNoExiste(Long itemId, LocalDate fecha);

  @Modifying
  @Query(
      value =
          "UPDATE vista_item_diaria SET contador = contador + 1 "
              + "WHERE item_id = :itemId AND fecha = :fecha",
      nativeQuery = true)
  int incrementar(Long itemId, LocalDate fecha);
}
