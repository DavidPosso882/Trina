package co.edu.uniquindio.trina.negocio;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Fotografías del negocio (RF-12): el dueño sube, ordena, elige la principal y elimina; cualquiera
 * lee las de un negocio APROBADO.
 */
@RestController
public class ImagenNegocioController {

  private final ImagenNegocioService servicio;

  public ImagenNegocioController(ImagenNegocioService servicio) {
    this.servicio = servicio;
  }

  @PostMapping("/api/v1/negocios/{id}/imagenes")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public ImagenNegocioDto.ImagenRespuesta subir(
      @PathVariable Long id,
      @RequestParam(value = "file", required = false) MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ImagenInvalidaException("Subí una foto en JPG, PNG o WebP.");
    }
    try {
      return servicio.subir(sesionId(), id, file.getBytes(), file.getContentType());
    } catch (IOException e) {
      throw new ImagenInvalidaException("No pudimos leer el archivo; probá de nuevo.");
    }
  }

  @PatchMapping("/api/v1/negocios/{id}/imagenes/{imagenId}")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public ImagenNegocioDto.ImagenRespuesta actualizar(
      @PathVariable Long id,
      @PathVariable Long imagenId,
      @Valid @RequestBody ImagenNegocioDto.ActualizarRequest req) {
    return servicio.actualizar(sesionId(), id, imagenId, req.principal(), req.orden());
  }

  @DeleteMapping("/api/v1/negocios/{id}/imagenes/{imagenId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public void eliminar(@PathVariable Long id, @PathVariable Long imagenId) {
    servicio.eliminar(sesionId(), id, imagenId);
  }

  @GetMapping("/api/v1/negocios/{id}/imagenes")
  public List<ImagenNegocioDto.ImagenRespuesta> listar(@PathVariable Long id) {
    return servicio.listar(id, sesionIdOpcional());
  }

  private Long sesionId() {
    return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
  }

  private Long sesionIdOpcional() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth != null && auth.getPrincipal() instanceof Long id ? id : null;
  }
}
