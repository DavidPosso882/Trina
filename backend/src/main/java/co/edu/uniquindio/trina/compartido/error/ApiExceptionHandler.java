package co.edu.uniquindio.trina.compartido.error;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Cuerpo común de errores §5.9: {codigo, mensaje, campos, traceId, timestamp}. Mensajes para usuario final (RNF-01).
 */
@RestControllerAdvice
public class ApiExceptionHandler {

  public record ApiError(
      String codigo, String mensaje, List<String> campos, String traceId, OffsetDateTime timestamp) {}

  private ResponseEntity<ApiError> body(HttpStatus status, String codigo, String mensaje) {
    String traceId = MDC.get("traceId") != null ? MDC.get("traceId") : UUID.randomUUID().toString();
    return ResponseEntity.status(status)
        .body(new ApiError(codigo, mensaje, List.of(), traceId, OffsetDateTime.now()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> validacion(MethodArgumentNotValidException ex) {
    List<String> campos =
        ex.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .toList();
    String traceId = UUID.randomUUID().toString();
    return ResponseEntity.badRequest()
        .body(
            new ApiError(
                "VALIDACION",
                "Revisá los datos marcados e intentá de nuevo.",
                campos,
                traceId,
                OffsetDateTime.now()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> reglaNegocio(IllegalArgumentException ex) {
    return body(HttpStatus.UNPROCESSABLE_ENTITY, "REGLA_NEGOCIO", ex.getMessage());
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiError> conflicto(IllegalStateException ex) {
    return body(HttpStatus.CONFLICT, "CONFLICTO", ex.getMessage());
  }

  /** Rol sin permiso para el endpoint (@PreAuthorize). §5.9: 403 AUTORIZACION con cuerpo. */
  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  public ResponseEntity<ApiError> sinPermiso(
      org.springframework.security.access.AccessDeniedException ex) {
    return body(HttpStatus.FORBIDDEN, "AUTORIZACION", "No tenés permiso para hacer esto.");
  }

  @ExceptionHandler({
    org.springframework.security.authentication.BadCredentialsException.class,
    org.springframework.security.authentication.DisabledException.class
  })
  public ResponseEntity<ApiError> autenticacion(RuntimeException ex) {
    return body(HttpStatus.UNAUTHORIZED, "AUTENTICACION", ex.getMessage());
  }

  @ExceptionHandler(co.edu.uniquindio.trina.auth.IntentoLoginService.LimiteExcedido.class)
  public ResponseEntity<ApiError> demasiadosIntentos(RuntimeException ex) {
    return body(HttpStatus.TOO_MANY_REQUESTS, "DEMASIADOS_INTENTOS", ex.getMessage());
  }

  @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
  public ResponseEntity<ApiError> estadoExplícito(
      org.springframework.web.server.ResponseStatusException ex) {
    int estado = ex.getStatusCode().value();
    String codigo = estado == 404 ? "NO_ENCONTRADO" : estado == 403 ? "AUTORIZACION" : "INTERNO";
    String mensaje =
        estado == 404
            ? "Ese negocio no está publicado."
            : estado == 403 ? "Ese negocio no es tuyo." : ex.getReason();
    return body((org.springframework.http.HttpStatus) ex.getStatusCode(), codigo, mensaje);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> interno(Exception ex) {
    var resp = body(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "INTERNO",
        "Algo salió mal. Intentá de nuevo en un momento.");
    org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class)
        .error("Error no controlado traceId={}", resp.getBody() == null ? "-" : resp.getBody().traceId(), ex);
    return resp;
  }
}
