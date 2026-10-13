package co.edu.uniquindio.trina.resena;

import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.pedido.Pedido;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import co.edu.uniquindio.trina.reserva.Reserva;
import co.edu.uniquindio.trina.reserva.ReservaRepository;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Reseñas y moderación (RF-38/RF-39, D-09/RN-08). Una reseña por cliente y negocio; la insignia
 * "Compra verificada" sale de un pedido o reserva COMPLETADA en ese negocio; el promedio y el
 * listado público usan solo las visibles.
 */
@Service
public class ResenaService {

  private static final String APROBADO = "APROBADO";

  private final ResenaRepository resenas;
  private final NegocioRepository negocios;
  private final UsuarioRepository usuarios;
  private final PedidoRepository pedidos;
  private final ReservaRepository reservas;

  public ResenaService(
      ResenaRepository resenas,
      NegocioRepository negocios,
      UsuarioRepository usuarios,
      PedidoRepository pedidos,
      ReservaRepository reservas) {
    this.resenas = resenas;
    this.negocios = negocios;
    this.usuarios = usuarios;
    this.pedidos = pedidos;
    this.reservas = reservas;
  }

  /** RF-38: listado público de un negocio APROBADO con promedio solo de visibles (RN-08). */
  @Transactional(readOnly = true)
  public ResenaDto.ListadoRespuesta listar(Long negocioId) {
    exigirNegocioPublicado(negocioId);
    var visibles = resenas.findByNegocio_IdAndVisibleTrueOrderByCreadoEnDesc(negocioId);
    Double promedio =
        visibles.isEmpty()
            ? null
            : visibles.stream().mapToInt(Resena::getCalificacion).average().orElse(0);
    return new ResenaDto.ListadoRespuesta(
        visibles.stream().map(ResenaDto.ResenaRespuesta::de).toList(), promedio, visibles.size());
  }

  /** RF-38: publica una reseña; la segunda del mismo cliente responde 409 y ofrece editar. */
  @Transactional
  public ResenaDto.ResenaRespuesta publicar(
      Long clienteId, Long negocioId, ResenaDto.PublicarRequest req) {
    var negocio = exigirNegocioPublicado(negocioId);
    var cliente =
        usuarios
            .findById(clienteId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Iniciá sesión."));
    if (resenas.findByNegocio_IdAndCliente_Id(negocioId, clienteId).isPresent()) {
      throw new IllegalStateException("Ya reseñaste este negocio. Editá tu reseña anterior.");
    }
    boolean verificada = tieneCompraCompletada(clienteId, negocioId);
    var resena =
        resenas.save(
            Resena.publicar(negocio, cliente, req.calificacion(), req.comentario(), verificada));
    return ResenaDto.ResenaRespuesta.de(resena);
  }

  /** RF-38 E3: el autor edita su reseña; si es ajena responde 403. */
  @Transactional
  public ResenaDto.ResenaRespuesta editar(
      Long clienteId, Long resenaId, ResenaDto.PublicarRequest req) {
    var resena = exigir(resenaId);
    if (!resena.getCliente().getId().equals(clienteId)) {
      throw new AccessDeniedException("Esa reseña no es tuya.");
    }
    resena.editar(req.calificacion(), req.comentario());
    return ResenaDto.ResenaRespuesta.de(resena);
  }

  /** RF-39 E1: el Comerciante dueño del negocio reporta con motivo (422 si falta). */
  @Transactional
  public ResenaDto.ResenaRespuesta reportar(Long comercianteId, Long resenaId, String motivo) {
    var resena = exigir(resenaId);
    if (!resena.getNegocio().getPropietario().getId().equals(comercianteId)) {
      throw new AccessDeniedException("Esa reseña no es de tu negocio.");
    }
    resena.reportar(motivo);
    return ResenaDto.ResenaRespuesta.de(resena);
  }

  /** RF-39: cola del Administrador; con {@code soloReportadas} solo las reportadas pendientes. */
  @Transactional(readOnly = true)
  public List<ResenaDto.ResenaRespuesta> listarParaAdmin(boolean soloReportadas) {
    var encontradas =
        soloReportadas
            ? resenas.findByReportadaTrueOrderByCreadoEnDesc()
            : resenas.findAllByOrderByCreadoEnDesc();
    return encontradas.stream().map(ResenaDto.ResenaRespuesta::de).toList();
  }

  /** RF-39 E2/RN-08: ocultar saca la reseña del listado público y del promedio. */
  @Transactional
  public ResenaDto.ResenaRespuesta cambiarVisibilidad(Long resenaId, boolean visible) {
    var resena = exigir(resenaId);
    resena.cambiarVisibilidad(visible);
    return ResenaDto.ResenaRespuesta.de(resena);
  }

  private Negocio exigirNegocioPublicado(Long negocioId) {
    return negocios
        .findByIdAndEstado(negocioId, APROBADO)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Ese negocio no está publicado."));
  }

  private Resena exigir(Long resenaId) {
    return resenas
        .findById(resenaId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Esa reseña no existe."));
  }

  /** D-09: la insignia sale de un pedido COMPLETADO o una reserva COMPLETADA en ese negocio. */
  private boolean tieneCompraCompletada(Long clienteId, Long negocioId) {
    boolean conPedido =
        pedidos
            .findByCliente_IdAndEstadoOrderByCreadoEnDesc(clienteId, Pedido.COMPLETADO)
            .stream()
            .anyMatch(p -> p.getNegocio().getId().equals(negocioId));
    if (conPedido) {
      return true;
    }
    return reservas
        .findByCliente_IdAndEstadoOrderByCreadoEnDesc(clienteId, Reserva.COMPLETADA)
        .stream()
        .anyMatch(r -> r.getNegocio().getId().equals(negocioId));
  }
}
