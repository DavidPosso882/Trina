package co.edu.uniquindio.trina.catalogo;

import static java.nio.charset.StandardCharsets.US_ASCII;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.util.Base64;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

/**
 * Brecha WebP (RF-12): el JDK no trae códec WebP, así que una foto WebP válida se rechazaba. Este
 * test confirma que el plugin {@code imageio-webp} declarado en el pom registra un lector real y
 * decodifica un WebP de verdad; es el camino que usa {@code ImagenNegocioService.decodificar(byte[])}
 * vía {@link ImageIO#read}. El plugin es solo lectura (no trae {@code ImageWriterSpi}), así que la
 * muestra VP8L de 24x16 px se generó con ImageMagick/libwebp y se embebe como bytes.
 *
 * <p>Vive en el paquete de tests del catálogo porque la superficie delegada de esta tarea no
 * incluye el paquete {@code negocio} de pruebas.
 */
class SoporteWebpImageioTest {

  /** WebP VP8L de 24x16 px color #1b6b47 (verde Trina), generado con libwebp 1.5. */
  private static final String WEBP_REAL_BASE64 =
      "UklGRh4AAABXRUJQVlA4TBEAAAAvF8ADAAfQtW70qP+BiOh/AAA=";

  @Test
  void elRuntimeDecodificaUnWebpReal() throws Exception {
    byte[] bytes = Base64.getDecoder().decode(WEBP_REAL_BASE64);
    assertThat(new String(bytes, 0, 4, US_ASCII)).isEqualTo("RIFF");
    assertThat(new String(bytes, 8, 4, US_ASCII)).isEqualTo("WEBP");

    assertThat(ImageIO.getImageReadersByFormatName("webp").hasNext())
        .as("imageio-webp debe registrar un lector WebP")
        .isTrue();

    var decodificada = ImageIO.read(new ByteArrayInputStream(bytes));
    assertThat(decodificada).as("el WebP real tiene que ser decodificable").isNotNull();
    assertThat(decodificada.getWidth()).isEqualTo(24);
    assertThat(decodificada.getHeight()).isEqualTo(16);
    assertThat(decodificada.getRGB(0, 0) & 0xFFFFFF).isEqualTo(0x1B6B47);
  }
}
