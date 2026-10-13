package co.edu.uniquindio.trina.almacenamiento;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;

/** Adaptador S3/MinIO del {@link StoragePort} (ADR-03). Las claves son relativas al bucket. */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "app.storage",
    havingValue = "minio",
    matchIfMissing = true)
public class MinioStorageAdapter implements StoragePort {

  private final S3Client s3;
  private final String bucket;

  public MinioStorageAdapter(S3Client s3, @Value("${app.minio.bucket:trina-media}") String bucket) {
    this.s3 = s3;
    this.bucket = bucket;
  }

  @Override
  public void guardar(String clave, byte[] datos, String tipoContenido) {
    s3.putObject(
        b -> b.bucket(bucket).key(clave).contentType(tipoContenido),
        RequestBody.fromBytes(datos));
  }

  @Override
  public void eliminar(String clave) {
    s3.deleteObject(b -> b.bucket(bucket).key(clave));
  }
}
