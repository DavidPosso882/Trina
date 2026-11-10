package co.edu.uniquindio.trina.auth;

/** Error de validación de RUT/cédula del vendedor: responde 400 VALIDACION (§5.9). */
public class DocumentoVendedorException extends RuntimeException {
  public DocumentoVendedorException(String mensaje) {
    super(mensaje);
  }
}
