package co.edu.uniquindio.trina.notificacion;

import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Notificación en plataforma (RF-32). Cada fila apunta a su destinatario y guarda el evento con su
 * entidad de origen para que el frontend pueda navegar. La crea {@link NotificacionService} dentro
 * de la misma transacción del cambio que la origina (diseño §7.8). El correo (E4) es P3 y no entra.
 */
@Entity
@Table(name = "notificacion")
public class Notificacion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Usuario usuario;

  @Column(nullable = false, length = 40)
  private String tipo;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String mensaje;

  @Column(name = "entidad_tipo", length = 30)
  private String entidadTipo;

  @Column(name = "entidad_id")
  private Long entidadId;

  @Column(nullable = false)
  private boolean leida = false;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn = Instant.now();

  protected Notificacion() {}

  public static Notificacion crear(
      Usuario usuario, String tipo, String mensaje, String entidadTipo, Long entidadId) {
    var notificacion = new Notificacion();
    notificacion.usuario = usuario;
    notificacion.tipo = tipo;
    notificacion.mensaje = mensaje;
    notificacion.entidadTipo = entidadTipo;
    notificacion.entidadId = entidadId;
    return notificacion;
  }

  /** RF-32 E3: marca la notificación como leída. */
  public void marcarLeida() {
    this.leida = true;
  }

  public Long getId() {
    return id;
  }

  public Usuario getUsuario() {
    return usuario;
  }

  public String getTipo() {
    return tipo;
  }

  public String getMensaje() {
    return mensaje;
  }

  public String getEntidadTipo() {
    return entidadTipo;
  }

  public Long getEntidadId() {
    return entidadId;
  }

  public boolean isLeida() {
    return leida;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }
}
