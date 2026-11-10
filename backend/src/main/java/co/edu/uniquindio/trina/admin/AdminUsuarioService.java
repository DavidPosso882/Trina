package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.compartido.CorreoService;
import co.edu.uniquindio.trina.notificacion.NotificacionService;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.security.SecureRandom;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** RF-43/RF-47: listado, estado, rol y alta asistida de comerciantes. */
@Service
public class AdminUsuarioService {

  private static final Set<String> ROLES_ASIGNABLES =
      Set.of("CLIENTE", "COMERCIANTE", "ADMINISTRADOR");
  private static final char[] ALFABETO =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".toCharArray();

  /** RF-47 E3: minutos que dura el bloqueo de quien abrió el pendiente. */
  static final long BLOQUEO_MINUTOS = 15;

  private final UsuarioRepository usuarios;
  private final PasswordEncoder claves;
  private final AuditoriaService auditoria;
  private final NotificacionService notificaciones;
  private final CorreoService correos;
  private final SecureRandom azar = new SecureRandom();

  public AdminUsuarioService(
      UsuarioRepository usuarios,
      PasswordEncoder claves,
      AuditoriaService auditoria,
      NotificacionService notificaciones,
      CorreoService correos) {
    this.usuarios = usuarios;
    this.claves = claves;
    this.auditoria = auditoria;
    this.notificaciones = notificaciones;
    this.correos = correos;
  }

  @Transactional(readOnly = true)
  public List<AdminUsuarioDto.UsuarioRespuesta> listar(
      Long actorId, String rol, Boolean activo, String q) {
    String rolBuscado = rol == null ? null : rol.trim().toUpperCase(Locale.ROOT);
    String texto = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
    return usuarios.findAll().stream()
        .filter(u -> rolBuscado == null || rolBuscado.isBlank() || rolBuscado.equals(u.getRol()))
        .filter(u -> activo == null || u.isActivo() == activo)
        .filter(
            u ->
                texto.isEmpty()
                    || u.getEmail().toLowerCase(Locale.ROOT).contains(texto)
                    || u.getNombre().toLowerCase(Locale.ROOT).contains(texto))
        .sorted(Comparator.comparing(Usuario::getId))
        .map(u -> AdminUsuarioDto.UsuarioRespuesta.de(u, actorId, nombres()))
        .toList();
  }

  @Transactional
  public AdminUsuarioDto.UsuarioRespuesta cambiarEstado(Long actorId, Long usuarioId, boolean activo) {
    if (!activo && Objects.equals(actorId, usuarioId)) {
      throw new IllegalArgumentException("No puedes desactivar tu propia cuenta.");
    }
    var usuario = exigir(usuarioId);
    if (activo) {
      usuario.setActivo(true);
    } else {
      usuario.desactivar();
    }
    auditoria.registrar(
        actorId,
        activo ? "ACTIVAR_USUARIO" : "DESACTIVAR_USUARIO",
        "USUARIO",
        usuarioId,
        "activo=" + activo,
        null);
    return AdminUsuarioDto.UsuarioRespuesta.de(usuario);
  }

  @Transactional
  public AdminUsuarioDto.UsuarioRespuesta cambiarRol(Long actorId, Long usuarioId, String rol) {
    String nuevo = rol == null ? "" : rol.trim().toUpperCase(Locale.ROOT);
    if (!ROLES_ASIGNABLES.contains(nuevo)) {
      throw new IllegalArgumentException("Ese rol no existe. Elige CLIENTE, COMERCIANTE o ADMINISTRADOR.");
    }
    var usuario = exigir(usuarioId);
    if (!nuevo.equals(usuario.getRol())) {
      String anterior = usuario.getRol();
      usuario.cambiarRol(nuevo);
      auditoria.registrar(
          actorId, "CAMBIAR_ROL", "USUARIO", usuarioId, "rol=" + anterior + "->" + nuevo, null);
    }
    return AdminUsuarioDto.UsuarioRespuesta.de(usuario);
  }

  @Transactional
  public AdminUsuarioDto.ComercianteCreado crearComerciante(
      Long actorId, AdminUsuarioDto.ComercianteRequest req) {
    String email = req.email().trim().toLowerCase(Locale.ROOT);
    if (usuarios.existsByEmailIgnoreCase(email)) {
      throw new IllegalStateException("Ese correo ya está en uso.");
    }
    String temporal = claveTemporal();
    var usuario = new Usuario(email, claves.encode(temporal), req.nombre().trim(), "COMERCIANTE");
    usuario.setTelefono(req.telefono());
    usuario.setCambioClaveObligatorio(true);
    usuarios.save(usuario);
    auditoria.registrar(
        actorId, "CREAR_COMERCIANTE", "USUARIO", usuario.getId(), "asignó clave temporal", null);
    return new AdminUsuarioDto.ComercianteCreado(
        usuario.getId(), usuario.getEmail(), usuario.getNombre(), usuario.getRol(), temporal);
  }

  /** RF-47 E3: el admin que abre el pendiente lo bloquea para los demás. */
  @Transactional
  public AdminUsuarioDto.UsuarioRespuesta tomarBloqueo(Long actorId, Long usuarioId) {
    var usuario = exigirPendiente(usuarioId);
    if (usuario.bloqueoVigente(BLOQUEO_MINUTOS)
        && !actorId.equals(usuario.getRevisionBloqueoPor())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Otro administrador ya está revisando esta cuenta. Intenta más tarde.");
    }
    usuario.tomarBloqueo(actorId);
    auditoria.registrar(actorId, "TOMAR_REVISION", "USUARIO", usuarioId, "bloqueo revision", null);
    return AdminUsuarioDto.UsuarioRespuesta.de(usuario, actorId, nombres());
  }

  /** Libera el bloqueo sin resolver (abandonar la revisión). */
  @Transactional
  public AdminUsuarioDto.UsuarioRespuesta liberarBloqueo(Long actorId, Long usuarioId) {
    var usuario = exigirPendiente(usuarioId);
    if (usuario.getRevisionBloqueoPor() != null
        && !actorId.equals(usuario.getRevisionBloqueoPor())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Solo quien tomó la revisión puede liberarla.");
    }
    usuario.liberarBloqueo();
    auditoria.registrar(actorId, "LIBERAR_REVISION", "USUARIO", usuarioId, "libera bloqueo", null);
    return AdminUsuarioDto.UsuarioRespuesta.de(usuario, actorId, nombres());
  }

  /** RF-47 E3: aprueba la cuenta del vendedor y le avisa por correo y en plataforma. */
  @Transactional
  public AdminUsuarioDto.UsuarioRespuesta aprobarComerciante(Long actorId, Long usuarioId) {
    var usuario = exigirPendiente(usuarioId);
    if (usuario.bloqueoVigente(BLOQUEO_MINUTOS)
        && !actorId.equals(usuario.getRevisionBloqueoPor())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Otro administrador ya está revisando esta cuenta. Intenta más tarde.");
    }
    usuario.setActivo(true);
    usuario.liberarBloqueo();
    auditoria.registrar(
        actorId, "APROBAR_COMERCIANTE", "USUARIO", usuarioId, "activo=true", null);
    correos.enviar(
        usuario.getEmail(),
        "Tu cuenta TRINA para vender quedó aprobada",
        "Hola "
            + usuario.getNombre()
            + ",\n\nTu cuenta para vender en TRINA quedó aprobada. Ya puedes ingresar y publicar tu negocio.\n\nEquipo TRINA");
    notificaciones.notificar(
        usuario.getId(),
        "COMERCIANTE_APROBADO",
        "¡Tu cuenta para vender quedó aprobada! Ya puedes ingresar y publicar tu negocio.",
        "USUARIO",
        usuario.getId());
    return AdminUsuarioDto.UsuarioRespuesta.de(usuario, actorId, nombres());
  }

  /** Solo un COMERCIANTE inactivo sigue pendiente; el resto ya fue resuelto. */
  private Usuario exigirPendiente(Long usuarioId) {
    var usuario = exigir(usuarioId);
    if (!"COMERCIANTE".equalsIgnoreCase(usuario.getRol()) || usuario.isActivo()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Esa cuenta ya fue resuelta.");
    }
    return usuario;
  }

  private Map<Long, String> nombres() {
    var mapa = new HashMap<Long, String>();
    for (var u : usuarios.findAll()) {
      mapa.put(u.getId(), u.getNombre());
    }
    return mapa;
  }

  /** 12 caracteres base62 con prefijo que garantiza letras y números (RF-47 E1). */
  private String claveTemporal() {
    var sb = new StringBuilder("T7");
    for (int i = 0; i < 12; i++) {
      sb.append(ALFABETO[azar.nextInt(ALFABETO.length)]);
    }
    return sb.toString();
  }

  private Usuario exigir(Long usuarioId) {
    return usuarios
        .findById(usuarioId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese usuario no existe."));
  }
}
