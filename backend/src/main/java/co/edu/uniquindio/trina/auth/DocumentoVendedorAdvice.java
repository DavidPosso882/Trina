package co.edu.uniquindio.trina.auth;

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

/** §5.9: RUT/cédula inválidos responden 400 VALIDACION con mensaje para el usuario final. */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DocumentoVendedorAdvice {

  @ExceptionHandler(DocumentoVendedorException.class)
  public ResponseEntity<ApiExceptionHandler.ApiError> documentoInvalido(
      DocumentoVendedorException ex) {
    return cuerpo(ex.getMessage());
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<ApiExceptionHandler.ApiError> documentoDemasiadoGrande(
      MaxUploadSizeExceededException ex) {
    return cuerpo("El documento no puede superar los 5 MB.");
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
