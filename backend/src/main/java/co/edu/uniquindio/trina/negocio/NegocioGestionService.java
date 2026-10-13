package co.edu.uniquindio.trina.negocio;

import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Gestión del negocio propio del comerciante (RF-06, RF-11, D-01: un solo negocio). */
@Service
public class NegocioGestionService {

  private final NegocioRepository negocios;
  private final CategoriaNegocioRepository categorias;
  private final UsuarioRepository usuarios;
  private final HorarioAtencionRepository horarios;
  private final ImagenNegocioRepository imagenes;

  public NegocioGestionService(
      NegocioRepository negocios,
      CategoriaNegocioRepository categorias,
      UsuarioRepository usuarios,
      HorarioAtencionRepository horarios,
      ImagenNegocioRepository imagenes) {
    this.negocios = negocios;
    this.categorias = categorias;
    this.usuarios = usuarios;
    this.horarios = horarios;
    this.imagenes = imagenes;
  }

  @Transactional
  public Negocio crear(Long propietarioId, String nombre, Long categoriaId) {
    if (negocios.existsByPropietario_Id(propietarioId)) {
      throw new IllegalStateException("Ya tenés un negocio registrado.");
    }
    var dueno =
        usuarios
            .findById(propietarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Iniciá sesión"));
    CategoriaNegocio cat = categoriaId == null ? null : categorias.findById(categoriaId).orElse(null);
    return negocios.save(Negocio.borrador(dueno, cat, nombre));
  }

  @Transactional
  public Negocio actualizar(Long propietarioId, Long negocioId, NegocioGestionDto.ActualizarRequest req) {
    var n = propio(propietarioId, negocioId);
    if (req.categoriaId() != null && !"APROBADO".equals(n.getEstado())) {
      n.setCategoria(categorias.findById(req.categoriaId()).orElse(null));
    }
    n.actualizar(
        req.nombre(),
        req.descripcion(),
        req.direccion(),
        req.latitud(),
        req.longitud(),
        req.telefono(),
        req.whatsapp());
    return n;
  }

  @Transactional
  public Negocio enviarARevision(Long propietarioId, Long negocioId) {
    var n = propio(propietarioId, negocioId);
    n.enviarARevision(
        horarios.existsByNegocio_Id(negocioId), imagenes.existsByNegocio_Id(negocioId));
    return n;
  }

  @Transactional(readOnly = true)
  public Negocio miNegocio(Long propietarioId) {
    return negocios.findAll().stream()
        .filter(n -> n.getPropietario().getId().equals(propietarioId))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todavía no creaste tu negocio."));
  }

  private Negocio propio(Long propietarioId, Long negocioId) {
    var n =
        negocios
            .findById(negocioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado."));
    if (!n.getPropietario().getId().equals(propietarioId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ese negocio no es tuyo.");
    }
    return n;
  }

  /** Miembros visibles para perfiles futuros; hoy solo se usa en listados. */
  @Transactional(readOnly = true)
  public List<Negocio> todos() {
    return negocios.findAll();
  }
}
