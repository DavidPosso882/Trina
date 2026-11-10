package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.admin.CambioClaveObligatorioException;
import co.edu.uniquindio.trina.compartido.CorreoService;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.time.Instant;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Casos de uso RF-01 (registro) y RF-02 (login). */
@Service
public class AuthService {

  private final UsuarioRepository usuarios;
  private final PasswordEncoder claves;
  private final JwtService jwt;
  private final IntentoLoginService intentos;
  private final CorreoService correos;

  public AuthService(
      UsuarioRepository usuarios,
      PasswordEncoder claves,
      JwtService jwt,
      IntentoLoginService intentos,
      CorreoService correos) {
    this.usuarios = usuarios;
    this.claves = claves;
    this.jwt = jwt;
    this.intentos = intentos;
    this.correos = correos;
  }

  @Transactional
  public Usuario registrar(AuthDto.RegistroRequest req) {
    if (usuarios.existsByEmailIgnoreCase(req.email().trim())) {
      throw new IllegalStateException("Ese correo ya está en uso");
    }
    var u =
        new Usuario(
            req.email().trim().toLowerCase(), claves.encode(req.password()), req.nombre().trim(), req.rol());
    u.setEsResidente(req.esResidente().orElse(null));
    u.setVersionConsentimiento("v1");
    u.setConsentimientoEn(Instant.now());
    if ("COMERCIANTE".equalsIgnoreCase(req.rol())) {
      u.setActivo(false);
    }
    var guardado = usuarios.save(u);
    if ("COMERCIANTE".equalsIgnoreCase(guardado.getRol())) {
      correos.enviar(
          guardado.getEmail(),
          "Cuenta creada en TRINA: pendiente de aprobación para vender",
          "Hola "
              + guardado.getNombre()
              + ",\n\nTu cuenta en TRINA quedó creada y pendiente de aprobación.\n"
              + "Como quieres vender, un administrador debe aprobar tu cuenta antes de que puedas publicar tu negocio.\n"
              + "Te avisaremos por este mismo correo cuando quede aprobada. Mientras tanto no podrás ingresar a vender.\n\nEquipo TRINA");
    } else {
      correos.enviar(
          guardado.getEmail(),
          "Cuenta creada en TRINA",
          "Hola "
              + guardado.getNombre()
              + ",\n\nTu cuenta en TRINA quedó creada. Ya puedes ingresar y descubrir negocios.\n\nEquipo TRINA");
    }
    return guardado;
  }

  @Transactional
  public AuthDto.AuthResponse login(String email, String passwordPlana, String ip) {
    String correoClave = "correo:" + email.trim().toLowerCase();
    String ipClave = "ip:" + ip;
    intentos.exigirPermitido(correoClave, ipClave);

    var u = usuarios.findByEmailIgnoreCase(email.trim()).orElse(null);
    if (u == null || !claves.matches(passwordPlana, u.getPasswordHash())) {
      intentos.registrarFallo(correoClave, ipClave);
      // Mensaje genérico: no revela si falló el correo o la clave (RF-02 E2)
      throw new BadCredentialsException("El correo o la contraseña no coinciden. Revisa e inténtalo de nuevo.");
    }
    if (!u.isActivo()) {
      if ("COMERCIANTE".equalsIgnoreCase(u.getRol())) {
        throw new DisabledException(
            "Tu cuenta está pendiente de aprobación por un administrador de TRINA. Te avisaremos por correo cuando quede aprobada.");
      }
      throw new DisabledException("Tu cuenta está desactivada. Contacta al administrador.");
    }
    if (u.isCambioClaveObligatorio()) {
      throw new CambioClaveObligatorioException(
          "Entraste con una clave temporal. Cambiala con \"Olvidé mi clave\" para continuar.");
    }
    intentos.limpiar(correoClave, ipClave);
    return new AuthDto.AuthResponse(jwt.generar(u.getId(), u.getRol(), u.getTokenVersion()), u.getRol());
  }
}
