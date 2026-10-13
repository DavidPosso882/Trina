package co.edu.uniquindio.trina.almacenamiento;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Sustituto en memoria del S3 real para los tests de imágenes (RNF-05). Reemplaza al
 * {@link MinioStorageAdapter} como {@link StoragePort} {@code @Primary} para poder inspeccionar
 * claves, bytes y borrados sin levantar MinIO.
 */
@TestConfiguration
public class StubAlmacenamientoConfig {

  @Bean
  @Primary
  public StubAlmacenamiento almacenamientoStub() {
    return new StubAlmacenamiento();
  }

  /** Almacenamiento en memoria, thread-safe, suficiente para MockMvc. */
  public static class StubAlmacenamiento implements StoragePort {

    private final Map<String, byte[]> objetos = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<String> eliminados = new CopyOnWriteArrayList<>();

    @Override
    public void guardar(String clave, byte[] datos, String tipoContenido) {
      objetos.put(clave, datos.clone());
    }

    @Override
    public void eliminar(String clave) {
      objetos.remove(clave);
      eliminados.add(clave);
    }

    public Set<String> claves() {
      return Set.copyOf(objetos.keySet());
    }

    public byte[] bytes(String clave) {
      return objetos.get(clave);
    }

    public boolean fueEliminada(String clave) {
      return eliminados.contains(clave);
    }
  }
}
