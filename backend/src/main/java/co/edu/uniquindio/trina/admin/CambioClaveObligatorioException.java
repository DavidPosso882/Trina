package co.edu.uniquindio.trina.admin;

/**
 * RF-47 E2: la cuenta entró con una clave temporal y debe cambiarla antes de operar. Vive en el
 * paquete admin porque es donde se crea la clave temporal; AuthService la lanza en el login.
 */
public class CambioClaveObligatorioException extends RuntimeException {

  public CambioClaveObligatorioException(String mensaje) {
    super(mensaje);
  }
}
