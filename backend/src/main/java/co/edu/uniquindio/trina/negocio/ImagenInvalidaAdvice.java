package co.edu.uniquindio.trina.negocio;

import co.edu.uniquindio.trina.compartido.error.ApiExceptionHandler;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * §5.9: la validación de fotos responde 400 con código VALIDACION. El handler global mapea
 * {@code ResponseStatusException} 400 a código INTERNO, así que este advice puntual se adelanta
 * solo para los errores de imagen (el resto sigue en {@link ApiExceptionHandler}).
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ImagenInvalidaAdvice {

  @ExceptionHandler(ImagenInvalidaException.class)
  public ResponseEntity<ApiExceptionHandler.ApiError> fotoInvalida(ImagenInvalidaException ex) {
    return cuerpo(ex.getMessage());
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<ApiExceptionHandler.ApiError> fotoDemasiadoGrande(
      MaxUploadSizeExceededException ex) {
    return cuerpo("La foto no puede superar los 5 MB.");
  }

  private static ResponseEntity<ApiExceptionHandler.ApiError> cuerpo(String mensaje) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(
            new ApiExceptionHandler.ApiError(
                "VALIDACION",
                mensaje,
                List.of(),
                UUID.randomUUID().toString(),
                OffsetDateTime.now()));
  }
}
