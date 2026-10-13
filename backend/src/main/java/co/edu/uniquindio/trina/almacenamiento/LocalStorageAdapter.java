package co.edu.uniquindio.trina.almacenamiento;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Adaptador de archivos locales para desarrollo/CI sin MinIO. Se activa con {@code
 * app.storage=local}; en cualquier otro valor manda MinIO (ADR-03). No apto para producción.
 */
@Component
@ConditionalOnProperty(name = "app.storage", havingValue = "local")
public class LocalStorageAdapter implements StoragePort {

  private final Path raiz;

  public LocalStorageAdapter(@Value("${app.storage-local-dir:${java.io.tmpdir}/trina-media}") String dir) {
    this.raiz = Path.of(dir);
  }

  @Override
  public void guardar(String clave, byte[] datos, String tipoContenido) {
    try {
      Path destino = raiz.resolve(clave);
      Files.createDirectories(destino.getParent());
      Files.write(destino, datos);
    } catch (IOException e) {
      throw new UncheckedIOException("No se pudo guardar la imagen. Intentá de nuevo.", e);
    }
  }

  @Override
  public void eliminar(String clave) {
    try {
      Files.deleteIfExists(raiz.resolve(clave));
    } catch (IOException e) {
      throw new UncheckedIOException("No se pudo eliminar la imagen. Intentá de nuevo.", e);
    }
  }
}
