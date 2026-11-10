package co.edu.uniquindio.trina.almacenamiento;

/** Puerto de almacenamiento — todo acceso a MinIO pasa por acá (ADR-03). */
public interface StoragePort {
  void guardar(String clave, byte[] datos, String tipoContenido);

  byte[] leer(String clave);

  void eliminar(String clave);

  default String urlPublica(String clave, String baseMedia) {
    return baseMedia + "/" + clave;
  }
}
