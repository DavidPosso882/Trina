package co.edu.uniquindio.trina.reserva;

import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Reserva con intervalo [inicio, fin) (RF-26/RF-27, D-03). FRANJA calcula el fin con la duración
 * del negocio; ALOJAMIENTO usa la entrada y la salida dadas. Ocupa capacidad mientras está
 * {@code PENDIENTE_CONFIRMACION} o {@code CONFIRMADA} (RN-07). Las transiciones siguen el SRS
 * §5.1: la condición "después de la hora de inicio" para completar no se valida en esta entrega
 * (tampoco hay validación de horario de atención porque la entidad Horario todavía no existe).
 */
@Entity
@Table(name = "reserva")
public class Reserva {

  public static final String PENDIENTE_CONFIRMACION = "PENDIENTE_CONFIRMACION";
  public static final String CONFIRMADA = "CONFIRMADA";
  public static final String RECHAZADA = "RECHAZADA";
  public static final String CANCELADA = "CANCELADA";
  public static final String COMPLETADA = "COMPLETADA";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "cliente_id", nullable = false)
  private Usuario cliente;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @Column(nullable = false)
  private String estado;

  @Column(nullable = false)
  private Instant inicio;

  @Column(nullable = false)
  private Instant fin;

  @Column(nullable = false)
  private int personas;

  @Column(columnDefinition = "TEXT")
  private String nota;

  @Column(columnDefinition = "TEXT")
  private String motivo;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn = Instant.now();

  protected Reserva() {}

  /**
   * Crea la reserva en {@code PENDIENTE_CONFIRMACION}. El servicio ya validó negocio aprobado,
   * acepta reservas, fecha futura y cupo (RN-07); acá solo se exige un intervalo válido.
   */
  public static Reserva crear(
      Usuario cliente, Negocio negocio, Instant inicio, Instant fin, int personas, String nota) {
    if (inicio == null || fin == null) {
      throw new IllegalArgumentException("Indicá el inicio y el fin de la reserva.");
    }
    if (!fin.isAfter(inicio)) {
      throw new IllegalArgumentException("La salida tiene que ser posterior a la entrada.");
    }
    if (personas <= 0) {
      throw new IllegalArgumentException("La reserva tiene que ser para al menos una persona.");
    }
    var reserva = new Reserva();
    reserva.cliente = cliente;
    reserva.negocio = negocio;
    reserva.inicio = inicio;
    reserva.fin = fin;
    reserva.personas = personas;
    reserva.nota = limpiar(nota);
    reserva.estado = PENDIENTE_CONFIRMACION;
    return reserva;
  }

  // ---- Transiciones (§5.1) ----

  /** RF-27: el Comerciante confirma; PENDIENTE_CONFIRMACION → CONFIRMADA. */
  public void confirmar() {
    exigirEstado(PENDIENTE_CONFIRMACION);
    this.estado = CONFIRMADA;
  }

  /** RF-27: rechazo con motivo obligatorio; PENDIENTE_CONFIRMACION → RECHAZADA. */
  public void rechazar(String motivo) {
    exigirEstado(PENDIENTE_CONFIRMACION);
    exigirMotivo(motivo);
    this.estado = RECHAZADA;
    this.motivo = motivo.trim();
  }

  /** §5.1: el Cliente cancela su reserva mientras sigue pendiente o confirmada. */
  public void cancelar() {
    exigirCancelable();
    this.estado = CANCELADA;
  }

  /** §5.1/RF-27 E3: el Comerciante cancela con motivo obligatorio. */
  public void cancelar(String motivo) {
    exigirCancelable();
    exigirMotivo(motivo);
    this.estado = CANCELADA;
    this.motivo = motivo.trim();
  }

  /** RF-27: el Comerciante completa una reserva confirmada; CONFIRMADA → COMPLETADA. */
  public void completar() {
    exigirEstado(CONFIRMADA);
    this.estado = COMPLETADA;
  }

  /** RF-26 E5: más de 24 horas sin respuesta; PENDIENTE_CONFIRMACION → CANCELADA. */
  public void expirar() {
    exigirEstado(PENDIENTE_CONFIRMACION);
    this.estado = CANCELADA;
    this.motivo = "Pasaron más de 24 horas sin respuesta del negocio.";
  }

  private void exigirCancelable() {
    if (!PENDIENTE_CONFIRMACION.equals(estado) && !CONFIRMADA.equals(estado)) {
      throw new IllegalStateException(
          "Ese cambio no corresponde ahora: la reserva está en " + estado + ".");
    }
  }

  private void exigirEstado(String esperado) {
    if (!esperado.equals(estado)) {
      throw new IllegalStateException(
          "Ese cambio no corresponde ahora: la reserva está en " + estado + ".");
    }
  }

  private static void exigirMotivo(String motivo) {
    if (motivo == null || motivo.isBlank()) {
      throw new IllegalArgumentException("Contanos el motivo de esta decisión.");
    }
  }

  private static String limpiar(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  // ---- Lectura ----

  public Long getId() {
    return id;
  }

  public Usuario getCliente() {
    return cliente;
  }

  public Negocio getNegocio() {
    return negocio;
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

  public int getPersonas() {
    return personas;
  }

  public String getNota() {
    return nota;
  }

  public String getMotivo() {
    return motivo;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }

  /** Solo pruebas: simula que la reserva se creó hace tiempo (RF-26 E5). */
  public void ajustarCreadoEn(Instant momento) {
    if (momento != null) {
      this.creadoEn = momento;
    }
  }
}
