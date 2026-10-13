package co.edu.uniquindio.trina.admin;

import jakarta.persistence.*;
import java.time.Instant;

/** Bitácora de acciones administrativas (RF-46). El actor puede ser nulo (procesos de sistema). */
@Entity
@Table(name = "auditoria")
public class Auditoria {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "usuario_id")
  private Long usuarioId;

  @Column(nullable = false, length = 40)
  private String accion;

  @Column(nullable = false, length = 60)
  private String entidad;

  @Column(name = "entidad_id")
  private Long entidadId;

  @Column(columnDefinition = "TEXT")
  private String detalle;

  @Column(columnDefinition = "TEXT")
  private String motivo;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn;

  protected Auditoria() {}

  static Auditoria de(
      Long usuarioId, String accion, String entidad, Long entidadId, String detalle, String motivo) {
    var a = new Auditoria();
    a.usuarioId = usuarioId;
    a.accion = accion;
    a.entidad = entidad;
    a.entidadId = entidadId;
    a.detalle = detalle;
    a.motivo = motivo;
    a.creadoEn = Instant.now();
    return a;
  }

  public Long getId() {
    return id;
  }

  public Long getUsuarioId() {
    return usuarioId;
  }

  public String getAccion() {
    return accion;
  }

  public String getEntidad() {
    return entidad;
  }

  public Long getEntidadId() {
    return entidadId;
  }

  public String getDetalle() {
    return detalle;
  }

  public String getMotivo() {
    return motivo;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }
}
