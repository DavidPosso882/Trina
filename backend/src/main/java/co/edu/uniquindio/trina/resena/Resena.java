package co.edu.uniquindio.trina.resena;

import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Reseña de un Cliente sobre un negocio (RF-38/RF-39). Una sola por par negocio+cliente; la
 * insignia "Compra verificada" sale de un pedido o reserva COMPLETADA (D-09) y solo las visibles
 * entran al promedio (RN-08).
 */
@Entity
@Table(name = "resena")
public class Resena {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "cliente_id", nullable = false)
  private Usuario cliente;

  /** SMALLINT 1..5 (V13), como {@code HorarioAtencion.diaSemana}. */
  @Column(nullable = false)
  private short calificacion;

  @Column(columnDefinition = "TEXT")
  private String comentario;

  @Column(nullable = false)
  private boolean verificada;

  @Column(nullable = false)
  private boolean visible = true;

  @Column(nullable = false)
  private boolean reportada;

  @Column(name = "motivo_reporte", columnDefinition = "TEXT")
  private String motivoReporte;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn = Instant.now();

  protected Resena() {}

  /** RF-38: publica la reseña; la calificación y el comentario se validan una sola vez. */
  public static Resena publicar(
      Negocio negocio, Usuario cliente, int calificacion, String comentario, boolean verificada) {
    var resena = new Resena();
    resena.negocio = negocio;
    resena.cliente = cliente;
    resena.asignar(calificacion, comentario);
    resena.verificada = verificada;
    return resena;
  }

  /** RF-38 E3: el autor edita su reseña; el resto del estado (visible, reportada) se conserva. */
  public void editar(int calificacion, String comentario) {
    asignar(calificacion, comentario);
  }

  /** RF-39 E1: reporte del Comerciante con motivo obligatorio; queda en la cola del Administrador. */
  public void reportar(String motivo) {
    if (motivo == null || motivo.isBlank()) {
      throw new IllegalArgumentException("Contanos por qué reportás esta reseña.");
    }
    this.reportada = true;
    this.motivoReporte = motivo.trim();
  }

  /** RF-39 E2: el Administrador oculta o vuelve a mostrar; RN-08 recalcula el promedio al vuelo. */
  public void cambiarVisibilidad(boolean visible) {
    this.visible = visible;
  }

  private void asignar(int calificacion, String comentario) {
    if (calificacion < 1 || calificacion > 5) {
      throw new IllegalArgumentException("Elegí una calificación de 1 a 5 estrellas.");
    }
    if (comentario == null || comentario.isBlank()) {
      throw new IllegalArgumentException("Contanos qué te pareció el negocio.");
    }
    this.calificacion = (short) calificacion;
    this.comentario = comentario.trim();
  }

  // ---- Lectura ----

  public Long getId() {
    return id;
  }

  public Negocio getNegocio() {
    return negocio;
  }

  public Usuario getCliente() {
    return cliente;
  }

  public int getCalificacion() {
    return calificacion;
  }

  public String getComentario() {
    return comentario;
  }

  public boolean isVerificada() {
    return verificada;
  }

  public boolean isVisible() {
    return visible;
  }

  public boolean isReportada() {
    return reportada;
  }

  public String getMotivoReporte() {
    return motivoReporte;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }
}
