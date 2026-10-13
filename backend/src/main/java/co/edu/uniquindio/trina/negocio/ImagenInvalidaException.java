package co.edu.uniquindio.trina.negocio;

/** Error de validación de una foto (tipo real, tamaño, archivo vacío): §5.9 400. */
public class ImagenInvalidaException extends RuntimeException {

  public ImagenInvalidaException(String mensaje) {
    super(mensaje);
  }
}
