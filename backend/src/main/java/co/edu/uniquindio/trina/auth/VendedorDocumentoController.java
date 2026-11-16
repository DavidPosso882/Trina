package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.util.Map;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Documentos privados del vendedor (RUT + cédula). Solo el dueño o un
 * administrador pueden descargarlos; nunca son URL públicas (PII Ley 1581).
 */
@RestController
public class VendedorDocumentoController {

  private final UsuarioRepository usuarios;
  private final DocumentoVendedorService documentos;

  public VendedorDocumentoController(
      UsuarioRepository usuarios, DocumentoVendedorService documentos) {
    this.usuarios = usuarios;
    this.documentos = documentos;
  }

  @GetMapping("/api/v1/vendedores/{id}/documentos")
  @PreAuthorize("hasAnyRole('COMERCIANTE','ADMINISTRADOR')")
  public Map<String, Boolean> estado(@PathVariable Long id) {
    var u =
        usuarios
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese usuario no existe."));
    exigirDuenoOAdmin(id);
    return Map.of(
        "rut", u.getRutDocClave() != null && !u.getRutDocClave().isBlank(),
        "cedula", u.getCedulaDocClave() != null && !u.getCedulaDocClave().isBlank());
  }

  @GetMapping("/api/v1/vendedores/{id}/documentos/{tipo}")
  @PreAuthorize("hasAnyRole('COMERCIANTE','ADMINISTRADOR')")
  public ResponseEntity<byte[]> descargar(@PathVariable Long id, @PathVariable String tipo) {
    var u =
        usuarios
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese usuario no existe."));
    exigirDuenoOAdmin(id);
    String t = tipo == null ? "" : tipo.trim().toLowerCase();
    String clave;
    String contenido;
    String nombre;
    switch (t) {
      case "rut" -> {
        clave = u.getRutDocClave();
        contenido = u.getRutDocTipo();
        nombre = "rut";
      }
      case "cedula", "cédula" -> {
        clave = u.getCedulaDocClave();
        contenido = u.getCedulaDocTipo();
        nombre = "cedula";
      }
      default ->
          throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese documento no existe.");
    }
    if (clave == null || clave.isBlank()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese documento no existe.");
    }
    byte[] bytes;
    try {
      bytes = documentos.leer(clave);
    } catch (RuntimeException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese documento no existe.");
    }
    MediaType media;
    try {
      media = contenido == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contenido);
    } catch (Exception e) {
      media = MediaType.APPLICATION_OCTET_STREAM;
    }
    String extension =
        switch (contenido == null ? "" : contenido) {
          case "application/pdf" -> "pdf";
          case "image/png" -> "png";
          case "image/webp" -> "webp";
          default -> "jpg";
        };
    HttpHeaders cabeza = new HttpHeaders();
    cabeza.setContentType(media);
    cabeza.setContentDisposition(
        ContentDisposition.inline().filename(nombre + "-" + id + "." + extension).build());
    return new ResponseEntity<>(bytes, cabeza, HttpStatus.OK);
  }

  private void exigirDuenoOAdmin(Long duenoId) {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    Long actor = auth != null && auth.getPrincipal() instanceof Long l ? l : null;
    boolean admin =
        auth != null
            && auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMINISTRADOR".equals(a.getAuthority()));
    if (admin) {
      return;
    }
    if (actor == null || !actor.equals(duenoId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ese documento no es tuyo.");
    }
  }
}
