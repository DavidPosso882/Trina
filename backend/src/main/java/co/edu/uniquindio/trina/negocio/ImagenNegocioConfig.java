package co.edu.uniquindio.trina.negocio;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RF-12 admite fotos de hasta 5 MB, pero Spring Boot corta los multipart en 1 MB por defecto y en
 * este slice no se toca {@code application.yml}; este bean sube el tope real del contenedor. El
 * servicio igual valida el límite de negocio con un 400 claro.
 */
@Configuration
public class ImagenNegocioConfig {

  @Bean
  MultipartConfigElement imagenesMultipartConfig() {
    return new MultipartConfigElement("", 6L * 1024 * 1024, 12L * 1024 * 1024, 0);
  }
}
