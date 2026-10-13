package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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

  private final UsuarioRepository usuarios;
  private final PasswordEncoder claves;
  private final AuditoriaService auditoria;
  private final SecureRandom azar = new SecureRandom();

  public AdminUsuarioService(
      UsuarioRepository usuarios, PasswordEncoder claves, AuditoriaService auditoria) {
    this.usuarios = usuarios;
    this.claves = claves;
    this.auditoria = auditoria;
  }

  @Transactional(readOnly = true)
  public List<AdminUsuarioDto.UsuarioRespuesta> listar(String rol, Boolean activo, String q) {
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
        .map(AdminUsuarioDto.UsuarioRespuesta::de)
        .toList();
  }

  @Transactional
  public AdminUsuarioDto.UsuarioRespuesta cambiarEstado(Long actorId, Long usuarioId, boolean activo) {
    if (!activo && Objects.equals(actorId, usuarioId)) {
      throw new IllegalArgumentException("No podés desactivar tu propia cuenta.");
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
      throw new IllegalArgumentException("Ese rol no existe. Elegí CLIENTE, COMERCIANTE o ADMINISTRADOR.");
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
