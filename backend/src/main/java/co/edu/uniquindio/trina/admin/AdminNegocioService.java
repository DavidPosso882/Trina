package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * RF-47 E3: alta asistida de un negocio a nombre de un comerciante. El Administrador puede dejarlo
 * PENDIENTE (entra a la cola de revisión) o APROBADO directo (publicado).
 */
@Service
public class AdminNegocioService {

  private final NegocioRepository negocios;
  private final CategoriaNegocioRepository categorias;
  private final UsuarioRepository usuarios;
  private final AdminNegocioRepository adminNegocios;
  private final AuditoriaService auditoria;

  public AdminNegocioService(
      NegocioRepository negocios,
      CategoriaNegocioRepository categorias,
      UsuarioRepository usuarios,
      AdminNegocioRepository adminNegocios,
      AuditoriaService auditoria) {
    this.negocios = negocios;
    this.categorias = categorias;
    this.usuarios = usuarios;
    this.adminNegocios = adminNegocios;
    this.auditoria = auditoria;
  }

  @Transactional
  public AdminNegocioDto.Respuesta crear(Long actorId, AdminNegocioDto.AltaRequest req) {
    var dueno =
        usuarios
            .findById(req.comercianteId())
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ese comerciante no existe."));
    if (!"COMERCIANTE".equals(dueno.getRol())) {
      throw new IllegalArgumentException("Ese usuario no es comerciante.");
    }
    if (negocios.existsByPropietario_Id(dueno.getId())) {
      throw new IllegalStateException("Ese comerciante ya tiene un negocio registrado.");
    }
    CategoriaNegocio categoria =
        req.categoriaId() == null
            ? null
            : categorias
                .findById(req.categoriaId())
                .orElseThrow(
                    () ->
                        new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Esa categoría no existe."));

    String nombre = req.nombre().trim();
    Negocio negocio =
        req.estadoInicial() == AdminNegocioDto.EstadoInicial.APROBADO
            ? Negocio.publicado(dueno, categoria, nombre)
            : Negocio.borrador(dueno, categoria, nombre);
    negocio.actualizar(
        nombre,
        req.descripcion(),
        req.direccion(),
        req.latitud(),
        req.longitud(),
        req.telefono(),
        req.whatsapp());
    negocios.save(negocio);

    if (req.estadoInicial() == AdminNegocioDto.EstadoInicial.PENDIENTE) {
      adminNegocios.cambiarEstado(negocio.getId(), "PENDIENTE");
    }
    var guardado = negocios.findById(negocio.getId()).orElse(negocio);
    auditoria.registrar(
        actorId,
        "CREAR_NEGOCIO",
        "NEGOCIO",
        guardado.getId(),
        "estado=" + req.estadoInicial().name(),
        null);
    return AdminNegocioDto.Respuesta.de(guardado);
  }
}
