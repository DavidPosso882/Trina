package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.compartido.error.ApiExceptionHandler;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * RF-47 E2: el handler global no distingue el motivo del 403, así que acá se le da a la clave
 * temporal el código {@code CAMBIO_CLAVE_REQUERIDO} con el cuerpo común §5.9. La precedencia alta
 * solo afecta a esta excepción; el resto sigue cayendo en ApiExceptionHandler.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AdminErrorAdvice {

  @ExceptionHandler(CambioClaveObligatorioException.class)
  public ResponseEntity<ApiExceptionHandler.ApiError> cambioClaveObligatorio(
      CambioClaveObligatorioException ex) {
    String traceId =
        MDC.get("traceId") != null ? MDC.get("traceId") : UUID.randomUUID().toString();
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(
            new ApiExceptionHandler.ApiError(
                "CAMBIO_CLAVE_REQUERIDO",
                ex.getMessage(),
                List.of(),
                traceId,
                OffsetDateTime.now()));
  }
}
