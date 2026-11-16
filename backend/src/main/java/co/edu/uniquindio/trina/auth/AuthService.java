package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.admin.CambioClaveObligatorioException;
import co.edu.uniquindio.trina.compartido.CorreoService;
import co.edu.uniquindio.trina.notificacion.NotificacionService;
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
  private final NotificacionService notificaciones;
  private final DocumentoVendedorService documentos;

  public AuthService(
      UsuarioRepository usuarios,
      PasswordEncoder claves,
      JwtService jwt,
      IntentoLoginService intentos,
      CorreoService correos,
      NotificacionService notificaciones,
      DocumentoVendedorService documentos) {
    this.usuarios = usuarios;
    this.claves = claves;
    this.jwt = jwt;
    this.intentos = intentos;
    this.correos = correos;
    this.notificaciones = notificaciones;
    this.documentos = documentos;
  }

  @Transactional
  public Usuario registrar(AuthDto.RegistroRequest req) {
    if ("COMERCIANTE".equalsIgnoreCase(req.rol())) {
      throw new DocumentoVendedorException(
          "Para vender adjunta el RUT y la cédula en PDF o imagen al crear tu cuenta.");
    }
    if (usuarios.existsByEmailIgnoreCase(req.email().trim())) {
      throw new IllegalStateException("Ese correo ya está en uso");
    }
    var u =
        new Usuario(
            req.email().trim().toLowerCase(), claves.encode(req.password()), req.nombre().trim(), req.rol());
    u.setEsResidente(req.esResidente().orElse(null));
    u.setVersionConsentimiento("v2");
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
      avisarAdminsVendedorPendiente(guardado);
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

  /** Registro COMERCIANTE con RUT + cédula obligatorios (PDF o imagen, máx 5MB c/u). */
  @Transactional
  public Usuario registrarVendedor(
      String email,
      String password,
      String nombre,
      boolean consentimiento,
      Boolean esResidente,
      byte[] rut,
      byte[] cedula) {
    if (!consentimiento) {
      throw new DocumentoVendedorException(
          "Necesitas aceptar la política de datos para continuar");
    }
    String correo = email == null ? "" : email.trim().toLowerCase();
    if (usuarios.existsByEmailIgnoreCase(correo)) {
      throw new IllegalStateException("Ese correo ya está en uso");
    }
    var u = new Usuario(correo, claves.encode(password), nombre.trim(), "COMERCIANTE");
    u.setEsResidente(esResidente);
    u.setVersionConsentimiento("v2");
    u.setConsentimientoEn(Instant.now());
    u.setActivo(false);
    var guardado = usuarios.save(u);
    var docs = documentos.guardar(guardado.getId(), rut, cedula);
    guardado.setRutDocClave(docs.rutClave());
    guardado.setRutDocTipo(docs.rutTipo());
    guardado.setCedulaDocClave(docs.cedulaClave());
    guardado.setCedulaDocTipo(docs.cedulaTipo());
    usuarios.save(guardado);
    correos.enviar(
        guardado.getEmail(),
        "Cuenta creada en TRINA: pendiente de aprobación para vender",
        "Hola "
            + guardado.getNombre()
            + ",\n\nTu cuenta en TRINA quedó creada y pendiente de aprobación.\n"
            + "Recibimos tu RUT y tu cédula; un administrador debe aprobar tu cuenta antes de que puedas publicar tu negocio.\n"
            + "Te avisaremos por este mismo correo cuando quede aprobada. Mientras tanto no podrás ingresar a vender.\n\nEquipo TRINA");
    avisarAdminsVendedorPendiente(guardado);
    return guardado;
  }

  /** RF-47 E3: avisa a cada admin activo por correo y en plataforma. */
  private void avisarAdminsVendedorPendiente(Usuario vendedor) {
    for (var admin : usuarios.findAll()) {
      if (!"ADMINISTRADOR".equalsIgnoreCase(admin.getRol()) || !admin.isActivo()) {
        continue;
      }
      notificaciones.notificar(
          admin.getId(),
          "COMERCIANTE_PENDIENTE",
          "Nuevo vendedor pendiente: "
              + vendedor.getNombre()
              + " ("
              + vendedor.getEmail()
              + "). Revisa la gestión de usuarios para aprobarlo.",
          "USUARIO",
          vendedor.getId());
      correos.enviar(
          admin.getEmail(),
          "Vendedor pendiente de aprobación en TRINA",
          "Hola "
              + admin.getNombre()
              + ",\n\nEl vendedor "
              + vendedor.getNombre()
              + " ("
              + vendedor.getEmail()
              + ") creó su cuenta y espera tu aprobación.\n"
              + "Ingresa a la gestión de usuarios para revisarla y aprobarla.\n\nEquipo TRINA");
    }
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
