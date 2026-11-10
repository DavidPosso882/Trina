package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.compartido.CorreoService;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-03: recuperación de clave con token aleatorio de un solo uso, guardado como hash SHA-256 y
 * vigente 30 minutos. El enlace se envía por correo; en el log solo queda constancia sin el token.
 */
@Service
public class RecuperacionClaveService {

  static final Duration VIGENCIA = Duration.ofMinutes(30);
  static final String MENSAJE_INVALIDO = "El enlace venció o ya se usó. Pide uno nuevo.";
  private static final Logger log = LoggerFactory.getLogger(RecuperacionClaveService.class);

  private final UsuarioRepository usuarios;
  private final RecuperacionClaveRepository recuperaciones;
  private final PasswordEncoder claves;
  private final CorreoService correos;
  private final SecureRandom azar = new SecureRandom();
  private final String frontendUrl;

  public RecuperacionClaveService(
      UsuarioRepository usuarios,
      RecuperacionClaveRepository recuperaciones,
      PasswordEncoder claves,
      CorreoService correos,
      @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:5173}")
          String frontendUrl) {
    this.usuarios = usuarios;
    this.recuperaciones = recuperaciones;
    this.claves = claves;
    this.correos = correos;
    this.frontendUrl = frontendUrl;
  }

  /**
   * E1: la respuesta es idéntica exista o no la cuenta. Si el correo pertenece a una cuenta se crea
   * el token y se envía el enlace por correo. En el log no se guarda el token.
   */
  @Transactional
  public void solicitar(String email) {
    usuarios
        .findByEmailIgnoreCase(email.trim())
        .ifPresent(
            u -> {
              String token = nuevoToken();
              recuperaciones.save(
                  new RecuperacionClave(u, hash(token), Instant.now().plus(VIGENCIA)));
              String enlace = frontendUrl + "/restablecer-clave?token=" + token;
              log.info("Enlace de recuperación generado para {}", u.getEmail());
              correos.enviar(
                  u.getEmail(),
                  "Recupera tu contraseña de TRINA (vence en 30 minutos)",
                  "Hola "
                      + u.getNombre()
                      + ",\n\nPediste cambiar tu contraseña. Usa este enlace antes de 30 minutos:\n"
                      + enlace
                      + "\n\nSi no fuiste tú, ignora este correo.\n\nEquipo TRINA");
            });
  }

  /** E2/E3: un token vencido o ya usado se rechaza; el válido cambia la clave e invalida sesiones. */
  @Transactional
  public void restablecer(String token, String nuevaClave) {
    var recuperacion =
        recuperaciones
            .findByTokenHash(hash(token))
            .filter(r -> r.estaVigente(Instant.now()))
            .orElseThrow(() -> new IllegalArgumentException(MENSAJE_INVALIDO));
    recuperacion.marcarUsado();
    recuperacion.getUsuario().cambiarClave(claves.encode(nuevaClave));
    correos.enviar(
        recuperacion.getUsuario().getEmail(),
        "Tu contraseña de TRINA cambió",
        "Hola "
            + recuperacion.getUsuario().getNombre()
            + ",\n\nTu contraseña cambió correctamente y las sesiones anteriores quedaron cerradas.\n"
            + "Si no fuiste tú, pide un nuevo enlace de recuperación de inmediato.\n\nEquipo TRINA");
  }

  /** 32 bytes al azar en base64url: 256 bits de entropía (no se guarda en claro). */
  private String nuevoToken() {
    byte[] bytes = new byte[32];
    azar.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  static String hash(String token) {
    try {
      byte[] digerido =
          MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder(digerido.length * 2);
      for (byte b : digerido) {
        hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
      }
      return hex.toString();
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 no disponible", e);
    }
  }
}
