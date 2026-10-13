package co.edu.uniquindio.trina.almacenamiento;

import java.net.URI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Cliente S3 contra MinIO (ADR-03). Endpoint, bucket y base pública salen de {@code app.minio.*};
 * las credenciales se pueden pisar con {@code app.minio.access-key}/{@code app.minio.secret-key} o
 * con {@code MINIO_ROOT_USER}/{@code MINIO_ROOT_PASSWORD}. Path style es obligatorio con MinIO.
 */
@Configuration
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "app.storage",
    havingValue = "minio",
    matchIfMissing = true)
public class StorageConfig {

  @Bean
  S3Client s3Client(Environment env) {
    String endpoint = env.getProperty("app.minio.endpoint", "http://minio:9000");
    String accessKey =
        env.getProperty("app.minio.access-key", env.getProperty("MINIO_ROOT_USER", "trina-minio"));
    String secretKey =
        env.getProperty(
            "app.minio.secret-key", env.getProperty("MINIO_ROOT_PASSWORD", "trina-minio"));
    return S3Client.builder()
        .endpointOverride(URI.create(endpoint))
        // MinIO ignora la región, pero el SDK exige una para construir el cliente.
        .region(Region.US_EAST_1)
        .forcePathStyle(true)
        .credentialsProvider(
            StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
        .build();
  }
}
