package co.edu.uniquindio.trina.estadistica;

import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.pedido.Pedido;
import co.edu.uniquindio.trina.reserva.Reserva;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Consultas agregadas de estadísticas (RF-40 a RF-42, diseño §7.7). Viven en este paquete porque
 * el módulo es el dueño de los reportes; ninguna consulta cambia datos de origen.
 */
public interface EstadisticaQueryRepository extends JpaRepository<Negocio, Long> {

  /** RF-40 E3: el negocio del Comerciante autenticado; el aislamiento sale de su propio dueño. */
  @Query("select n from Negocio n where n.propietario.id = :propietarioId")
  Optional<Negocio> negocioDelPropietario(Long propietarioId);

  @Query("select p from Pedido p where p.negocio.id = :negocioId and p.creadoEn >= :desde")
  List<Pedido> pedidosDesde(Long negocioId, Instant desde);

  @Query("select r from Reserva r where r.negocio.id = :negocioId and r.creadoEn >= :desde")
  List<Reserva> reservasDesde(Long negocioId, Instant desde);

  /** RF-40: suma de visitas al perfil en el periodo. */
  @Query(
      """
      select coalesce(sum(v.contador), 0) from VistaPerfilDiaria v
      where v.id.negocioId = :negocioId and v.id.fecha >= :desde
      """)
  Long visitasPerfilDesde(Long negocioId, LocalDate desde);

  /** RF-42: ranking de ítems del negocio por vistas en el periodo, de mayor a menor. */
  @Query(
      """
      select i.id, i.nombre, coalesce(sum(v.contador), 0)
      from VistaItemDiaria v join CatalogoItem i on i.id = v.id.itemId
      where i.negocio.id = :negocioId and v.id.fecha >= :desde
      group by i.id, i.nombre
      order by coalesce(sum(v.contador), 0) desc, i.id asc
      """)
  List<Object[]> rankingItemsDesde(Long negocioId, LocalDate desde);

  @Query("select n.estado, count(n) from Negocio n group by n.estado")
  List<Object[]> negociosPorEstado();

  @Query("select u.rol, count(u) from Usuario u group by u.rol")
  List<Object[]> usuariosPorRol();

  @Query("select count(p) from Pedido p")
  long pedidosTotales();

  @Query("select coalesce(sum(p.comisionCop), 0) from Pago p where p.estado = 'APROBADO'")
  Long comisionesAprobadas();

  @Query(
      "select count(s) from MembresiaSuscripcion s "
          + "where s.estado = 'ACTIVA' and s.fin > :momento")
  long membresiasActivas(Instant momento);

  @Query("select count(u) from Usuario u where u.esResidente = false")
  long usuariosNoResidentes();

  @Query("select count(u) from Usuario u")
  long usuariosTotales();
}
