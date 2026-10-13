package co.edu.uniquindio.trina.usuario;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Usuario — tabla `usuario` (V1). El rol se valida en la capa de servicio/DTO. */
@Entity
@Table(name = "usuario")
public class Usuario {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(nullable = false)
  private String nombre;

  private String telefono;

  @Column(nullable = false)
  private String rol;

  @Column(nullable = false)
  private boolean activo = true;

  @Column(name = "es_residente")
  private Boolean esResidente;

  @Column(name = "token_version", nullable = false)
  private int tokenVersion = 0;

  /** RF-47 E2: clave temporal asignada por el Administrador; obliga a cambiarla al entrar. */
  @Column(name = "cambio_clave_obligatorio", nullable = false)
  private boolean cambioClaveObligatorio = false;

  @Column(name = "version_consentimiento")
  private String versionConsentimiento;

  @Column(name = "consentimiento_en")
  private Instant consentimientoEn;

  @Column(name = "eliminado_en")
  private Instant eliminadoEn;

  protected Usuario() {}

  public Usuario(String email, String passwordHash, String nombre, String rol) {
    this.email = email;
    this.passwordHash = passwordHash;
    this.nombre = nombre;
    this.rol = rol;
  }

  public Long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getTelefono() {
    return telefono;
  }

  public void setTelefono(String telefono) {
    this.telefono = telefono;
  }

  public Boolean getEsResidente() {
    return esResidente;
  }

  public String getVersionConsentimiento() {
    return versionConsentimiento;
  }

  public Instant getConsentimientoEn() {
    return consentimientoEn;
  }

  public Instant getEliminadoEn() {
    return eliminadoEn;
  }

  public String getRol() {
    return rol;
  }

  public boolean isActivo() {
    return activo;
  }

  public int getTokenVersion() {
    return tokenVersion;
  }

  public boolean isCambioClaveObligatorio() {
    return cambioClaveObligatorio;
  }

  public void setCambioClaveObligatorio(boolean cambioClaveObligatorio) {
    this.cambioClaveObligatorio = cambioClaveObligatorio;
  }

  public void setActivo(boolean activo) {
    this.activo = activo;
  }

  public void setEsResidente(Boolean esResidente) {
    this.esResidente = esResidente;
  }

  public void setVersionConsentimiento(String v) {
    this.versionConsentimiento = v;
  }

  public void setConsentimientoEn(Instant t) {
    this.consentimientoEn = t;
  }

  /** Invalida todos los JWT previos (RF-04 E4). */
  public void rotarVersion() {
    this.tokenVersion++;
  }

  /** RF-49 E2 / RF-03 E3: cambia el hash de la clave e invalida las sesiones previas. */
  public void cambiarClave(String nuevoHash) {
    this.passwordHash = nuevoHash;
    this.cambioClaveObligatorio = false;
    rotarVersion();
  }

  /** RF-48 E2: anonimiza los datos personales y deja la cuenta sin acceso (RN-10). */
  public void anonimizar() {
    this.email = "eliminado_" + id + "@trina.local";
    this.nombre = "Usuario eliminado";
    this.passwordHash = UUID.randomUUID().toString().replace("-", "");
    this.telefono = null;
    this.activo = false;
    this.eliminadoEn = Instant.now();
    rotarVersion();
  }

  /** RF-43/RF-04 E4: el Administrador desactiva la cuenta; los JWT previos quedan invalidados. */
  public void desactivar() {
    this.activo = false;
    rotarVersion();
  }

  /** RF-43/RF-04 E4: el Administrador cambia el rol; los JWT previos quedan invalidados. */
  public void cambiarRol(String nuevoRol) {
    this.rol = nuevoRol;
    rotarVersion();
  }
}
