package co.edu.uniquindio.trina.almacenamiento;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sirve los archivos guardados en local ({@code app.storage=local}) bajo {@code /media/**} para
 * desarrollo sin MinIO. En cualquier otro valor manda MinIO y esta configuración no se activa.
 */
@Configuration
@ConditionalOnProperty(name = "app.storage", havingValue = "local")
public class MediaWebConfig implements WebMvcConfigurer {

  private final String directorio;

  public MediaWebConfig(
      @Value("${app.storage-local-dir:${java.io.tmpdir}/trina-media}") String directorio) {
    this.directorio = directorio.endsWith("/") ? directorio : directorio + "/";
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registro) {
    registro
        .addResourceHandler("/media/**")
        .addResourceLocations("file:" + directorio)
        .setCachePeriod(3600);
  }
}
