package co.edu.uniquindio.trina.usuario;

import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import co.edu.uniquindio.trina.reserva.ReservaRepository;
import jakarta.persistence.EntityManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** RF-48 y RF-49: edición, cambio de clave, exportación y eliminación anonimizada de la cuenta. */
@Service
public class CuentaService {

  /** RF-48 E3: motivo con el que queda el negocio del Comerciante que elimina su cuenta. */
  static final String MOTIVO_SUSPENSION = "La cuenta del propietario fue eliminada.";

  private final UsuarioRepository usuarios;
  private final PedidoRepository pedidos;
  private final ReservaRepository reservas;
  private final PasswordEncoder claves;
  private final EntityManager em;

  public CuentaService(
      UsuarioRepository usuarios,
      PedidoRepository pedidos,
      ReservaRepository reservas,
      PasswordEncoder claves,
      EntityManager em) {
    this.usuarios = usuarios;
    this.pedidos = pedidos;
    this.reservas = reservas;
    this.claves = claves;
    this.em = em;
  }

  /** Usuario de la sesión; si no existe, la sesión dejó de ser válida (401). */
  private Usuario exigir(Long usuarioId) {
    return usuarios.findById(usuarioId).orElseThrow(() -> new BadCredentialsException("Iniciá sesión"));
  }

  /** RF-49 E1: actualiza solo los campos presentes en el cuerpo. */
  @Transactional
  public Usuario editar(Long usuarioId, CuentaDto.EditarRequest req) {
    var u = exigir(usuarioId);
    if (req.nombre() != null) {
      String nombre = req.nombre().trim();
      if (nombre.isEmpty()) {
        throw new IllegalArgumentException("El nombre no puede quedar vacío.");
      }
      u.setNombre(nombre);
    }
    if (req.telefono() != null) {
      String telefono = req.telefono().trim();
      u.setTelefono(telefono.isEmpty() ? null : telefono);
    }
    return u;
  }

  /** RF-49 E2: exige la clave actual; el cambio rota la versión e invalida las sesiones previas. */
  @Transactional
  public void cambiarClave(Long usuarioId, String actual, String nueva) {
    var u = exigir(usuarioId);
    if (!claves.matches(actual, u.getPasswordHash())) {
      throw new IllegalArgumentException("La contraseña actual no coincide.");
    }
    u.cambiarClave(claves.encode(nueva));
  }

  /** RF-48 E1: datos personales y actividad (pedidos, reservas y negocio propio resumido). */
  @Transactional(readOnly = true)
  public CuentaDto.DatosResponse datos(Long usuarioId) {
    var u = exigir(usuarioId);
    var pedidosPropios =
        pedidos.findByCliente_IdOrderByCreadoEnDesc(usuarioId).stream()
            .map(
                p ->
                    new CuentaDto.PedidoResumen(
                        p.getId(),
                        p.getNegocio().getNombre(),
                        p.getEstado(),
                        p.getTotalCop(),
                        p.getCreadoEn()))
            .toList();
    var reservasPropias =
        reservas.findByCliente_IdOrderByCreadoEnDesc(usuarioId).stream()
            .map(
                r ->
                    new CuentaDto.ReservaResumen(
                        r.getId(),
                        r.getNegocio().getNombre(),
                        r.getEstado(),
                        r.getInicio(),
                        r.getFin(),
                        r.getPersonas()))
            .toList();
    var negocioPropio =
        em.createQuery("select n from Negocio n where n.propietario.id = :id", Negocio.class)
            .setParameter("id", usuarioId)
            .getResultList()
            .stream()
            .findFirst()
            .map(n -> new CuentaDto.NegocioResumen(n.getId(), n.getNombre(), n.getEstado()))
            .orElse(null);
    return new CuentaDto.DatosResponse(
        u.getId(),
        u.getEmail(),
        u.getNombre(),
        u.getTelefono(),
        u.getRol(),
        u.getEsResidente(),
        u.getVersionConsentimiento(),
        u.getConsentimientoEn(),
        pedidosPropios,
        reservasPropias,
        negocioPropio);
  }

  /** RF-48 E2/E3: anonimiza la cuenta y suspende el negocio propio si es Comerciante. */
  @Transactional
  public void eliminar(Long usuarioId) {
    var u = exigir(usuarioId);
    if ("COMERCIANTE".equals(u.getRol())) {
      // Acción forzada por la baja de la cuenta: suspende el negocio sea cual sea su estado, ya que
      // la transición pública suspender() solo acepta APROBADO.
      em.createQuery(
              "update Negocio n set n.estado = 'SUSPENDIDO', n.motivoRevision = :motivo"
                  + " where n.propietario.id = :usuarioId")
          .setParameter("motivo", MOTIVO_SUSPENSION)
          .setParameter("usuarioId", usuarioId)
          .executeUpdate();
    }
    u.anonimizar();
    usuarios.save(u);
  }
}
