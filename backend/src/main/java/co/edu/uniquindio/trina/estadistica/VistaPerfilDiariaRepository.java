package co.edu.uniquindio.trina.estadistica;

import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

/**
 * Upsert atómico del contador diario de visitas al perfil (diseño §7.7). El INSERT con
 * {@code ON CONFLICT DO NOTHING} funciona en PostgreSQL y en H2 modo PostgreSQL; si la fila ya
 * existía, el UPDATE incrementa. Así dos visitas simultáneas no rompen la clave compuesta.
 */
public interface VistaPerfilDiariaRepository
    extends JpaRepository<VistaPerfilDiaria, VistaPerfilDiaria.Clave> {

  @Modifying
  @Query(
      value =
          "INSERT INTO vista_perfil_diaria (negocio_id, fecha, contador) "
              + "VALUES (:negocioId, :fecha, 1) ON CONFLICT DO NOTHING",
      nativeQuery = true)
  int insertarSiNoExiste(Long negocioId, LocalDate fecha);

  @Modifying
  @Query(
      value =
          "UPDATE vista_perfil_diaria SET contador = contador + 1 "
              + "WHERE negocio_id = :negocioId AND fecha = :fecha",
      nativeQuery = true)
  int incrementar(Long negocioId, LocalDate fecha);
}
