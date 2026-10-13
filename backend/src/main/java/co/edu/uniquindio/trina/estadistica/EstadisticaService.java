package co.edu.uniquindio.trina.estadistica;

import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.pedido.Pedido;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Estadísticas del Comerciante (RF-40/RF-42) y del Administrador (RF-41). Los contadores de vistas
 * viven por día en tablas propias y se incrementan con upsert atómico (diseño §7.7); pedidos,
 * reservas e ingresos se leen de sus tablas dentro del periodo. La fecha operativa es
 * {@code app.zona-horaria} ({@code America/Bogota}).
 */
@Service
public class EstadisticaService {

  private static final Set<Integer> PERIODOS = Set.of(7, 30);
  private static final List<String> ORDEN_ESTADOS =
      List.of("BORRADOR", "PENDIENTE", "CORRECCION_SOLICITADA", "RECHAZADO", "APROBADO", "SUSPENDIDO");
  private static final List<String> ORDEN_ROLES =
      List.of("CLIENTE", "COMERCIANTE", "ADMINISTRADOR");
  private static final int RANKING_LIMITE = 5;
  private static final int RANKING_LIMITE_MAX = 20;

  private final EstadisticaQueryRepository datos;
  private final VistaPerfilDiariaRepository vistasPerfil;
  private final VistaItemDiariaRepository vistasItem;
  private final ZoneId zona;

  public EstadisticaService(
      EstadisticaQueryRepository datos,
      VistaPerfilDiariaRepository vistasPerfil,
      VistaItemDiariaRepository vistasItem,
      @Value("${app.zona-horaria:America/Bogota}") String zonaHoraria) {
    this.datos = datos;
    this.vistasPerfil = vistasPerfil;
    this.vistasItem = vistasItem;
    this.zona = ZoneId.of(zonaHoraria);
  }

  /**
   * RF-40: cuenta una visita al perfil en el día de Bogotá. Va en transacción propia porque el
   * perfil público se consulta en modo lectura y la visita debe persistir aunque aquella termine.
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void registrarVistaPerfil(Long negocioId) {
    LocalDate fecha = LocalDate.now(zona);
    if (vistasPerfil.insertarSiNoExiste(negocioId, fecha) == 0) {
      vistasPerfil.incrementar(negocioId, fecha);
    }
  }

  /** RF-42: cuenta una vista de ítem en el día de Bogotá, también en transacción propia. */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void registrarVistaItem(Long itemId) {
    LocalDate fecha = LocalDate.now(zona);
    if (vistasItem.insertarSiNoExiste(itemId, fecha) == 0) {
      vistasItem.incrementar(itemId, fecha);
    }
  }

  /** RF-40: resumen del negocio propio para los últimos {@code dias} (7 o 30). */
  @Transactional(readOnly = true)
  public EstadisticaDto.Resumen resumen(Long propietarioId, int dias) {
    exigirPeriodo(dias);
    var negocio = negocioPropio(propietarioId);
    LocalDate desdeFecha = LocalDate.now(zona).minusDays(dias - 1L);
    Instant desde = desdeFecha.atStartOfDay(zona).toInstant();
    var pedidos = datos.pedidosDesde(negocio.getId(), desde);
    long ingresos =
        pedidos.stream()
            .filter(p -> Pedido.COMPLETADO.equals(p.getEstado()))
            .mapToLong(Pedido::getTotalCop)
            .sum();
    return new EstadisticaDto.Resumen(
        dias,
        valor(datos.visitasPerfilDesde(negocio.getId(), desdeFecha)),
        pedidos.size(),
        datos.reservasDesde(negocio.getId(), desde).size(),
        ingresos);
  }

  /** RF-42: top de ítems más vistos del negocio propio (por defecto 5, tope 20). */
  @Transactional(readOnly = true)
  public List<EstadisticaDto.ItemRanking> productosMasVistos(
      Long propietarioId, int dias, int limite) {
    exigirPeriodo(dias);
    var negocio = negocioPropio(propietarioId);
    LocalDate desdeFecha = LocalDate.now(zona).minusDays(dias - 1L);
    int tope = limite <= 0 ? RANKING_LIMITE : Math.min(limite, RANKING_LIMITE_MAX);
    return datos.rankingItemsDesde(negocio.getId(), desdeFecha).stream()
        .limit(tope)
        .map(
            fila ->
                new EstadisticaDto.ItemRanking(
                    (Long) fila[0], (String) fila[1], ((Number) fila[2]).longValue()))
        .toList();
  }

  /** RF-41: indicadores globales del panel administrativo. */
  @Transactional(readOnly = true)
  public EstadisticaDto.PanelAdmin panelAdmin() {
    Map<String, Long> estados = aMapa(datos.negociosPorEstado());
    Map<String, Long> roles = aMapa(datos.usuariosPorRol());
    long totalUsuarios = datos.usuariosTotales();
    long noResidentes = datos.usuariosNoResidentes();
    double proporcion = totalUsuarios == 0 ? 0.0 : (double) noResidentes / totalUsuarios;
    return new EstadisticaDto.PanelAdmin(
        ORDEN_ESTADOS.stream()
            .map(e -> new EstadisticaDto.ConteoEstado(e, estados.getOrDefault(e, 0L)))
            .filter(c -> c.cantidad() > 0)
            .toList(),
        ORDEN_ROLES.stream()
            .map(r -> new EstadisticaDto.ConteoRol(r, roles.getOrDefault(r, 0L)))
            .filter(c -> c.cantidad() > 0)
            .toList(),
        datos.pedidosTotales(),
        valor(datos.comisionesAprobadas()),
        datos.membresiasActivas(Instant.now()),
        noResidentes,
        totalUsuarios,
        proporcion);
  }

  private Negocio negocioPropio(Long propietarioId) {
    return datos
        .negocioDelPropietario(propietarioId)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Todavía no tenés un negocio."));
  }

  private static void exigirPeriodo(int dias) {
    if (!PERIODOS.contains(dias)) {
      throw new IllegalArgumentException("El periodo tiene que ser 7 o 30 días.");
    }
  }

  private static Map<String, Long> aMapa(List<Object[]> filas) {
    Map<String, Long> mapa = new HashMap<>();
    for (var fila : filas) {
      mapa.put((String) fila[0], ((Number) fila[1]).longValue());
    }
    return mapa;
  }

  private static long valor(Long numero) {
    return numero == null ? 0 : numero;
  }
}
