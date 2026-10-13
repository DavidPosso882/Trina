package co.edu.uniquindio.trina.catalogo;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Catálogo digital (RF-15 a RF-18): lectura pública y gestión del comerciante propietario. Todo lo
 * que escribe exige rol COMERCIANTE y que el negocio de la ruta sea suyo.
 */
@RestController
@RequestMapping("/api/v1/negocios/{id}/catalogo")
public class CatalogoController {

  private final CatalogoService servicio;

  public CatalogoController(CatalogoService servicio) {
    this.servicio = servicio;
  }

  private Long sesionId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof Long usuarioId)) {
      throw new BadCredentialsException("Iniciá sesión.");
    }
    return usuarioId;
  }

  @GetMapping
  public CatalogoDto.CatalogoPublico publico(@PathVariable Long id) {
    return servicio.publico(id);
  }

  /**
   * Catálogo propio del panel: dueño con rol de comerciante, con bajas y no disponibles incluidos.
   * La propiedad la verifica el servicio (403 ajeno); la sesión, {@link #sesionId()} (401).
   */
  @GetMapping("/propio")
  public CatalogoDto.CatalogoPublico propio(@PathVariable Long id) {
    return servicio.catalogoPropio(sesionId(), id);
  }

  @GetMapping("/categorias")
  public List<CatalogoDto.CategoriaRespuesta> categorias(@PathVariable Long id) {
    return servicio.listarCategorias(id);
  }

  @PostMapping("/items")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public CatalogoDto.ItemRespuesta crearItem(
      @PathVariable Long id, @Valid @RequestBody CatalogoDto.ItemRequest req) {
    return servicio.crearItem(sesionId(), id, req);
  }

  @PutMapping("/items/{itemId}")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public CatalogoDto.ItemRespuesta actualizarItem(
      @PathVariable Long id,
      @PathVariable Long itemId,
      @Valid @RequestBody CatalogoDto.ItemRequest req) {
    return servicio.actualizarItem(sesionId(), id, itemId, req);
  }

  @PatchMapping("/items/{itemId}/disponibilidad")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public CatalogoDto.ItemRespuesta disponibilidad(
      @PathVariable Long id,
      @PathVariable Long itemId,
      @Valid @RequestBody CatalogoDto.DisponibilidadRequest req) {
    return servicio.cambiarDisponibilidad(sesionId(), id, itemId, req.disponible());
  }

  @DeleteMapping("/items/{itemId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public void eliminarItem(@PathVariable Long id, @PathVariable Long itemId) {
    servicio.eliminarItem(sesionId(), id, itemId);
  }

  @PostMapping("/categorias")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public CatalogoDto.CategoriaRespuesta crearCategoria(
      @PathVariable Long id, @Valid @RequestBody CatalogoDto.CategoriaRequest req) {
    return servicio.crearCategoria(sesionId(), id, req);
  }

  @PutMapping("/categorias/{catId}")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public CatalogoDto.CategoriaRespuesta actualizarCategoria(
      @PathVariable Long id,
      @PathVariable Long catId,
      @Valid @RequestBody CatalogoDto.CategoriaRequest req) {
    return servicio.actualizarCategoria(sesionId(), id, catId, req);
  }

  @DeleteMapping("/categorias/{catId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public void eliminarCategoria(@PathVariable Long id, @PathVariable Long catId) {
    servicio.eliminarCategoria(sesionId(), id, catId);
  }
}
