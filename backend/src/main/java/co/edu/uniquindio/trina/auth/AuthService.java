package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.admin.CambioClaveObligatorioException;
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

  public AuthService(
      UsuarioRepository usuarios,
      PasswordEncoder claves,
      JwtService jwt,
      IntentoLoginService intentos) {
    this.usuarios = usuarios;
    this.claves = claves;
    this.jwt = jwt;
    this.intentos = intentos;
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
    return usuarios.save(u);
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
      throw new BadCredentialsException("El correo o la contraseña no coinciden. Revisá e intentalo de nuevo.");
    }
    if (!u.isActivo()) {
      throw new DisabledException("Tu cuenta está desactivada. Contactá al administrador.");
    }
    if (u.isCambioClaveObligatorio()) {
      throw new CambioClaveObligatorioException(
          "Entraste con una clave temporal. Cambiala con \"Olvidé mi clave\" para continuar.");
    }
    intentos.limpiar(correoClave, ipClave);
    return new AuthDto.AuthResponse(jwt.generar(u.getId(), u.getRol(), u.getTokenVersion()), u.getRol());
  }
}
