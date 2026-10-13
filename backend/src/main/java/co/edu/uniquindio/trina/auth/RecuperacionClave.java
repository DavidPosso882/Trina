package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Token de recuperación de clave (RF-03, tabla V11). Se persiste el hash SHA-256 del token, no el
 * token en claro; vence a los 30 minutos y es de un solo uso ({@code usado_en}).
 */
@Entity
@Table(name = "recuperacion_clave")
public class RecuperacionClave {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  @Column(name = "token_hash", nullable = false, unique = true, length = 64)
  private String tokenHash;

  @Column(name = "expira_en", nullable = false)
  private Instant expiraEn;

  @Column(name = "usado_en")
  private Instant usadoEn;

  protected RecuperacionClave() {}

  public RecuperacionClave(Usuario usuario, String tokenHash, Instant expiraEn) {
    this.usuario = usuario;
    this.tokenHash = tokenHash;
    this.expiraEn = expiraEn;
  }

  /** Solo es usable si no se usó todavía y no pasó su vencimiento. */
  public boolean estaVigente(Instant ahora) {
    return usadoEn == null && ahora.isBefore(expiraEn);
  }

  public void marcarUsado() {
    this.usadoEn = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public Usuario getUsuario() {
    return usuario;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public Instant getExpiraEn() {
    return expiraEn;
  }

  public Instant getUsadoEn() {
    return usadoEn;
  }
}
