package co.edu.uniquindio.trina.membresia;

import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Membresías (RF-33 a RF-37, RN-05). El cobro queda stub: {@link #solicitarDestacada} crea la
 * suscripción PENDIENTE_PAGO con la ventana de RF-36 ya planificada y el pago del siguiente slice
 * la activará. El plan efectivo se calcula al consultar, independiente del barrido horario.
 */
@Service
public class MembresiaService {

  private final MembresiaPlanRepository planes;
  private final MembresiaSuscripcionRepository suscripciones;
  private final NegocioRepository negocios;

  public MembresiaService(
      MembresiaPlanRepository planes,
      MembresiaSuscripcionRepository suscripciones,
      NegocioRepository negocios) {
    this.planes = planes;
    this.suscripciones = suscripciones;
    this.negocios = negocios;
  }

  /** RF-33: planes activos para el catálogo público y "Mi membresía". */
  @Transactional(readOnly = true)
  public List<MembresiaDto.PlanRespuesta> planes() {
    return planes.findByActivoTrueOrderByPrecioMensualCopAsc().stream()
        .map(MembresiaDto.PlanRespuesta::de)
        .toList();
  }

  /**
   * RF-34/RF-36: crea (o reprograma) la suscripción PENDIENTE_PAGO del negocio propio. La ventana
   * sigue RN-05/RF-36: si hay una DESTACADA vigente, se extiende desde su fin; si no, cuenta 30
   * días desde ahora. Queda pendiente hasta que el pago se conecte (siguiente slice).
   */
  @Transactional
  public MembresiaDto.SuscripcionRespuesta solicitarDestacada(Long usuarioId) {
    var negocio = negocioPropio(usuarioId);
    var plan =
        planes
            .findByCodigo(MembresiaPlan.DESTACADA)
            .filter(MembresiaPlan::isActivo)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ese plan no está disponible."));
    var ahora = Instant.now();
    var vigente = vigenteDe(negocio.getId(), ahora);
    Instant inicio =
        vigente.map(MembresiaSuscripcion::getFin).filter(f -> f.isAfter(ahora)).orElse(ahora);
    Instant fin = inicio.plus(MembresiaSuscripcion.DIAS_VIGENCIA, ChronoUnit.DAYS);
    var pendiente =
        suscripciones
            .findFirstByNegocio_IdAndEstadoOrderByIdDesc(
                negocio.getId(), MembresiaSuscripcion.PENDIENTE_PAGO)
            .map(
                s -> {
                  s.reprogramar(plan, inicio, fin);
                  return s;
                })
            .orElseGet(() -> MembresiaSuscripcion.pendiente(negocio, plan, inicio, fin));
    suscripciones.save(pendiente);
    return MembresiaDto.SuscripcionRespuesta.de(pendiente, planEfectivoDe(vigente), false);
  }

  /** RF-35/RN-05: vigencia, estado, plan efectivo y aviso de renovación del negocio propio. */
  @Transactional(readOnly = true)
  public MembresiaDto.SuscripcionRespuesta miSuscripcion(Long usuarioId) {
    var negocio = negocioPropio(usuarioId);
    return respuestaDe(negocio.getId(), Instant.now());
  }

  /** RF-37: una sola query con los negocios que hoy tienen DESTACADA vigente. */
  @Transactional(readOnly = true)
  public Set<Long> negociosDestacados() {
    return new HashSet<>(suscripciones.idsDestacadosVigentes(Instant.now()));
  }

  /** RF-35 E1: cada hora, ACTIVA con fin pasado pasa a VENCIDA (reportes; RN-05 no depende). */
  @Scheduled(fixedDelay = 3_600_000, initialDelay = 3_600_000)
  @Transactional
  public void marcarVencidas() {
    var ahora = Instant.now();
    for (var suscripcion :
        suscripciones.findByEstadoAndFinBefore(MembresiaSuscripcion.ACTIVA, ahora)) {
      suscripcion.vencer();
    }
  }

  /**
   * RN-05: arma la respuesta con el plan efectivo calculado al momento y el aviso de vencimiento.
   * Si no hay ACTIVA vigente se muestra la última fila (por ejemplo VENCIDA o PENDIENTE_PAGO).
   */
  private MembresiaDto.SuscripcionRespuesta respuestaDe(Long negocioId, Instant ahora) {
    var vigente = vigenteDe(negocioId, ahora);
    String planEfectivo = planEfectivoDe(vigente);
    var visible =
        vigente
            .orElseGet(
                () ->
                    suscripciones
                        .findFirstByNegocio_IdOrderByIdDesc(negocioId)
                        .orElse(null));
    if (visible == null) {
      return MembresiaDto.SuscripcionRespuesta.sinSuscripcion(planEfectivo);
    }
    return MembresiaDto.SuscripcionRespuesta.de(
        visible, planEfectivo, visible.porVencerEn(ahora));
  }

  /** RN-05: DESTACADA solo si la suscripción vigente es del plan pago; si no, BASICA. */
  private static String planEfectivoDe(Optional<MembresiaSuscripcion> vigente) {
    boolean destacada =
        vigente.map(s -> MembresiaPlan.DESTACADA.equals(s.getPlan().getCodigo())).orElse(false);
    return destacada ? MembresiaPlan.DESTACADA : MembresiaPlan.BASICA;
  }

  private Optional<MembresiaSuscripcion> vigenteDe(Long negocioId, Instant ahora) {
    return suscripciones.findFirstByNegocio_IdAndEstadoAndFinAfterOrderByFinDesc(
        negocioId, MembresiaSuscripcion.ACTIVA, ahora);
  }

  private Negocio negocioPropio(Long usuarioId) {
    return negocios.findAll().stream()
        .filter(n -> n.getPropietario().getId().equals(usuarioId))
        .findFirst()
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Todavía no creaste tu negocio."));
  }
}
