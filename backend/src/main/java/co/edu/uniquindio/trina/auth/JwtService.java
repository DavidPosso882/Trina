package co.edu.uniquindio.trina.auth;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * JWT HS256 con reclamos sub, rol, ver, iat, exp (RF-02/RF-04). El reclamo {@code ver} se compara con
 * usuario.token_version: desactivar, cambiar rol o clave invalida tokens previos sin lista negra.
 */
@Service
public class JwtService {

  public record Sesion(long usuarioId, String rol, int ver) {}

  private final SecretKey llave;
  private final Duration vigencia;

  @Autowired
  public JwtService(
      @Value("${app.jwt.secret}") String secreto,
      @Value("${app.jwt.minutos-vigencia:60}") long minutosVigencia) {
    this(secreto, Duration.ofMinutes(minutosVigencia));
  }

  /** Constructor directo (tests). El secreto debe tener al menos 32 bytes. */
  public JwtService(String secreto, Duration vigencia) {
    byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalArgumentException("El secreto JWT debe tener al menos 32 bytes");
    }
    this.llave = Keys.hmacShaKeyFor(bytes);
    this.vigencia = vigencia;
  }

  public String generar(long usuarioId, String rol, int ver) {
    Instant ahora = Instant.now();
    return Jwts.builder()
        .subject(String.valueOf(usuarioId))
        .claim("rol", rol)
        .claim("ver", ver)
        .issuedAt(Date.from(ahora))
        .expiration(Date.from(ahora.plus(vigencia)))
        .signWith(llave)
        .compact();
  }

  /** Valida firma y expiración sin exigir versión (solo para extraer el id antes del filtro). */
  public Sesion validarSinVersion(String token) {
    try {
      var claims = Jwts.parser().verifyWith(llave).build().parseSignedClaims(token).getPayload();
      return new Sesion(
          Long.parseLong(claims.getSubject()),
          claims.get("rol", String.class),
          ((Number) claims.get("ver")).intValue());
    } catch (JwtException | IllegalArgumentException e) {
      throw new SecurityException("Token inválido o vencido", e);
    }
  }

  /** Valida firma y expiración, y exige que {@code ver} coincida con la versión vigente. */
  public Sesion validar(String token, int versionActual) {
    try {
      var claims = Jwts.parser().verifyWith(llave).build().parseSignedClaims(token).getPayload();
      int ver = ((Number) claims.get("ver")).intValue();
      if (ver != versionActual) {
        throw new SecurityException("Token invalidado por cambio de cuenta");
      }
      return new Sesion(Long.parseLong(claims.getSubject()), claims.get("rol", String.class), ver);
    } catch (JwtException | IllegalArgumentException e) {
      throw new SecurityException("Token inválido o vencido", e);
    }
  }
}
