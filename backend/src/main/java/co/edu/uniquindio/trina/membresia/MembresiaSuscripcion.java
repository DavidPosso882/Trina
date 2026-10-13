package co.edu.uniquindio.trina.membresia;

import co.edu.uniquindio.trina.negocio.Negocio;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Suscripción de un negocio a un plan (RF-34 a RF-36). El cobro es un stub en este slice: la fila
 * nace {@code PENDIENTE_PAGO} con la ventana planificada y el pago (RF-28) la activará después.
 */
@Entity
@Table(name = "membresia_suscripcion")
public class MembresiaSuscripcion {

  public static final String PENDIENTE_PAGO = "PENDIENTE_PAGO";
  public static final String ACTIVA = "ACTIVA";
  public static final String VENCIDA = "VENCIDA";
  public static final int DIAS_VIGENCIA = 30;
  public static final int DIAS_AVISO = 7;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "plan_id", nullable = false)
  private MembresiaPlan plan;

  @Column(nullable = false)
  private String estado;

  private Instant inicio;

  private Instant fin;

  protected MembresiaSuscripcion() {}

  /** RF-34: suscripción a la espera del pago, con la ventana que se activará al aprobarse. */
  public static MembresiaSuscripcion pendiente(
      Negocio negocio, MembresiaPlan plan, Instant inicio, Instant fin) {
    var s = new MembresiaSuscripcion();
    s.negocio = negocio;
    s.plan = plan;
    s.estado = PENDIENTE_PAGO;
    s.inicio = inicio;
    s.fin = fin;
    return s;
  }

  /**
   * RF-34 E1: el pago aprobado deja la suscripción ACTIVA. Si la solicitud ya planificó la
   * ventana (RF-36), se respeta; si no, arranca 30 días desde {@code ahora}.
   */
  public void activar(Instant ahora) {
    exigirEstado(PENDIENTE_PAGO);
    if (inicio == null || fin == null) {
      inicio = ahora;
      fin = ahora.plus(DIAS_VIGENCIA, ChronoUnit.DAYS);
    }
    estado = ACTIVA;
  }

  /**
   * RF-34 E1/RF-36: el pago aprobado deja la suscripción ACTIVA y respeta la ventana ya
   * planificada por {@link #pendiente}. Si esa ventana quedó en el pasado (pago tardío), arranca
   * 30 días desde {@code ahora}.
   */
  public void activarAlCobrar(Instant ahora) {
    exigirEstado(PENDIENTE_PAGO);
    if (fin == null || !fin.isAfter(ahora)) {
      inicio = ahora;
      fin = ahora.plus(DIAS_VIGENCIA, ChronoUnit.DAYS);
    }
    estado = ACTIVA;
  }

  /**
   * RF-36: si sigue vigente, extiende 30 días desde el fin actual (E1 anticipada); si ya venció,
   * arranca una ventana nueva de 30 días desde {@code ahora} (E2 tras vencer).
   */
  public void renovar(Instant ahora) {
    if (ACTIVA.equals(estado) && fin != null && fin.isAfter(ahora)) {
      fin = fin.plus(DIAS_VIGENCIA, ChronoUnit.DAYS);
    } else {
      inicio = ahora;
      fin = ahora.plus(DIAS_VIGENCIA, ChronoUnit.DAYS);
      estado = ACTIVA;
    }
  }

  /** RF-35 E1: el barrido horario deja VENCIDA una ACTIVA con fin pasado. */
  public void vencer() {
    exigirEstado(ACTIVA);
    estado = VENCIDA;
  }

  /** Reutiliza el pendiente existente al volver a solicitar la suscripción. */
  public void reprogramar(MembresiaPlan plan, Instant inicio, Instant fin) {
    exigirEstado(PENDIENTE_PAGO);
    this.plan = plan;
    this.inicio = inicio;
    this.fin = fin;
  }

  /** RN-05: solo la ACTIVA con fin futuro da beneficios. */
  public boolean vigenteEn(Instant momento) {
    return ACTIVA.equals(estado) && fin != null && fin.isAfter(momento);
  }

  /** RF-35 E2: aviso cuando quedan 7 días o menos de vigencia. */
  public boolean porVencerEn(Instant momento) {
    return vigenteEn(momento) && !fin.isAfter(momento.plus(DIAS_AVISO, ChronoUnit.DAYS));
  }

  private void exigirEstado(String esperado) {
    if (!esperado.equals(estado)) {
      throw new IllegalStateException(
          "Ese cambio no corresponde ahora: la suscripción está en " + estado + ".");
    }
  }

  // ---- Lectura ----

  public Long getId() {
    return id;
  }

  public Negocio getNegocio() {
    return negocio;
  }

  public MembresiaPlan getPlan() {
    return plan;
  }

  public String getEstado() {
    return estado;
  }

  public Instant getInicio() {
    return inicio;
  }

  public Instant getFin() {
    return fin;
  }
}
