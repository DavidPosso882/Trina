package co.edu.uniquindio.trina.negocio;

import co.edu.uniquindio.trina.almacenamiento.StoragePort;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

/**
 * Fotografías del negocio (RF-12) con optimización en la subida (RNF-05): valida tipo real y
 * tamaño, aplica tope de fotos según {@code parametro_sistema}, redimensiona a 1200 px y genera
 * miniatura de 400 px. Las claves quedan en {@code imagen_negocio} y los bytes en MinIO.
 */
@Service
public class ImagenNegocioService {

  private static final Logger log = LoggerFactory.getLogger(ImagenNegocioService.class);

  static final String TIPO_PERMITIDO = "Usá una imagen JPG, PNG o WebP";
  static final int ANCHO_PRINCIPAL = 1200;
  static final int ANCHO_MINIATURA = 400;
  private static final int MAX_IMAGENES_POR_DEFECTO = 10;
  private static final int MAX_MB_POR_DEFECTO = 5;
  private static final String APROBADO = "APROBADO";

  private final ImagenNegocioRepository imagenes;
  private final NegocioRepository negocios;
  private final ParametroSistemaRepository parametros;
  private final StoragePort almacenamiento;
  private final String baseMedia;

  public ImagenNegocioService(
      ImagenNegocioRepository imagenes,
      NegocioRepository negocios,
      ParametroSistemaRepository parametros,
      StoragePort almacenamiento,
      @Value("${app.minio.base-media:/media}") String baseMedia) {
    this.imagenes = imagenes;
    this.negocios = negocios;
    this.parametros = parametros;
    this.almacenamiento = almacenamiento;
    this.baseMedia = baseMedia;
  }

  /** Sube una foto propia: valida, limita, redimensiona y guarda original + miniatura. */
  @Transactional
  public ImagenNegocioDto.ImagenRespuesta subir(
      Long propietarioId, Long negocioId, byte[] bytes, String tipoContenido) {
    var negocio = propio(propietarioId, negocioId);
    if (bytes == null || bytes.length == 0) {
      throw new ImagenInvalidaException("Subí una foto en JPG, PNG o WebP.");
    }
    int maxMb = parametro("max_mb_imagen", MAX_MB_POR_DEFECTO);
    if (bytes.length > maxMb * 1024L * 1024L) {
      throw new ImagenInvalidaException("La foto no puede superar los " + maxMb + " MB.");
    }
    BufferedImage original = decodificar(bytes);
    int maxImagenes = parametro("max_imagenes", MAX_IMAGENES_POR_DEFECTO);
    if (imagenes.countByNegocio_Id(negocioId) >= maxImagenes) {
      throw new IllegalArgumentException(
          "Ya tenés " + maxImagenes + " fotos; eliminá una para subir otra.");
    }
    boolean principal = !imagenes.existsByNegocio_Id(negocioId);
    int orden =
        imagenes.findByNegocio_IdOrderByOrdenAscIdAsc(negocioId).stream()
                .mapToInt(ImagenNegocio::getOrden)
                .max()
                .orElse(-1)
            + 1;
    String uuid = UUID.randomUUID().toString();
    String clave = "negocios/" + negocioId + "/" + uuid + ".jpg";
    String claveMiniatura = "negocios/" + negocioId + "/" + uuid + "_m.jpg";
    // Thumbnailator decodifica a píxeles y vuelve a codificar: EXIF/ICC y demás metadatos del
    // original quedan afuera (RNF-05 E1, privacidad RNF-03).
    almacenamiento.guardar(
        clave, redimensionar(original, ANCHO_PRINCIPAL), "image/jpeg");
    almacenamiento.guardar(
        claveMiniatura, redimensionar(original, ANCHO_MINIATURA), "image/jpeg");
    return respuesta(
        imagenes.save(ImagenNegocio.nueva(negocio, clave, claveMiniatura, principal, orden)));
  }

  /** Marca la foto como principal (desmarcando el resto) o le cambia el orden. */
  @Transactional
  public ImagenNegocioDto.ImagenRespuesta actualizar(
      Long propietarioId, Long negocioId, Long imagenId, Boolean principal, Integer orden) {
    propio(propietarioId, negocioId);
    var imagen = imagenDe(negocioId, imagenId);
    if (Boolean.TRUE.equals(principal)) {
      for (var otra : imagenes.findByNegocio_IdOrderByOrdenAscIdAsc(negocioId)) {
        otra.marcarPrincipal(otra.getId().equals(imagenId));
      }
    }
    if (orden != null) {
      imagen.setOrden(orden);
    }
    return respuesta(imagen);
  }

  /** El negocio APROBADO muestra sus fotos a cualquiera; el dueño siempre las ve (RF-12). */
  @Transactional(readOnly = true)
  public List<ImagenNegocioDto.ImagenRespuesta> listar(Long negocioId, Long solicitanteId) {
    var negocio = negocio(negocioId);
    boolean dueno = solicitanteId != null && negocio.getPropietario().getId().equals(solicitanteId);
    if (!APROBADO.equals(negocio.getEstado()) && !dueno) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no publicado.");
    }
    return imagenes.findByNegocio_IdOrderByOrdenAscIdAsc(negocioId).stream()
        .map(this::respuesta)
        .toList();
  }

  /** Borra la fila en la transacción y los objetos del storage recién cuando ya commiteó (RNF-05). */
  @Transactional
  public void eliminar(Long propietarioId, Long negocioId, Long imagenId) {
    propio(propietarioId, negocioId);
    var imagen = imagenDe(negocioId, imagenId);
    String clave = imagen.getClaveObjeto();
    String claveMiniatura = imagen.getClaveMiniatura();
    boolean eraPrincipal = imagen.esPrincipal();
    imagenes.delete(imagen);
    if (eraPrincipal) {
      // Si se va la principal, la primera del orden pasa a serlo para no quedar sin portada.
      imagenes.findByNegocio_IdOrderByOrdenAscIdAsc(negocioId).stream()
          .findFirst()
          .ifPresent(siguiente -> siguiente.marcarPrincipal(true));
    }
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            borrarSilencioso(clave);
            borrarSilencioso(claveMiniatura);
          }
        });
  }

  private void borrarSilencioso(String clave) {
    try {
      almacenamiento.eliminar(clave);
    } catch (RuntimeException e) {
      // RNF-05 E2: un fallo de limpieza no debe romper la respuesta ya confirmada.
      log.warn("No se pudo borrar el objeto {} del storage: {}", clave, e.getMessage());
    }
  }

  private ImagenNegocioDto.ImagenRespuesta respuesta(ImagenNegocio imagen) {
    return new ImagenNegocioDto.ImagenRespuesta(
        imagen.getId(),
        almacenamiento.urlPublica(imagen.getClaveObjeto(), baseMedia),
        almacenamiento.urlPublica(imagen.getClaveMiniatura(), baseMedia),
        imagen.esPrincipal(),
        imagen.getOrden());
  }

  private int parametro(String clave, int porDefecto) {
    return parametros
        .findById(clave)
        .map(
            p -> {
              try {
                return Integer.parseInt(p.getValor().trim());
              } catch (NumberFormatException e) {
                return porDefecto;
              }
            })
        .filter(valor -> valor > 0)
        .orElse(porDefecto);
  }

  /** Decodifica y valida el tipo REAL por contenido; PDF u otro formato cae con 400. */
  private static BufferedImage decodificar(byte[] bytes) {
    Formato formato = formato(bytes);
    if (formato == Formato.OTRO) {
      throw new ImagenInvalidaException(TIPO_PERMITIDO);
    }
    BufferedImage imagen;
    try (var entrada = new ByteArrayInputStream(bytes)) {
      imagen = ImageIO.read(entrada);
    } catch (IOException e) {
      imagen = null;
    }
    if (imagen == null) {
      // El JDK no trae lector WebP: haría falta un plugin ImageIO (dependencia nueva, fuera de
      // este slice). Si el runtime lo agrega, este camino acepta WebP sin más cambios.
      throw new ImagenInvalidaException(
          formato == Formato.WEBP
              ? "Por ahora no podemos procesar WebP: subí la foto en JPG o PNG."
              : TIPO_PERMITIDO);
    }
    return imagen;
  }

  private enum Formato {
    JPG,
    PNG,
    WEBP,
    OTRO
  }

  private static Formato formato(byte[] bytes) {
    if (bytes.length >= 3
        && (bytes[0] & 0xFF) == 0xFF
        && (bytes[1] & 0xFF) == 0xD8
        && (bytes[2] & 0xFF) == 0xFF) {
      return Formato.JPG;
    }
    if (bytes.length >= 8
        && (bytes[0] & 0xFF) == 0x89
        && bytes[1] == 'P'
        && bytes[2] == 'N'
        && bytes[3] == 'G'
        && (bytes[4] & 0xFF) == 0x0D
        && (bytes[5] & 0xFF) == 0x0A
        && (bytes[6] & 0xFF) == 0x1A
        && (bytes[7] & 0xFF) == 0x0A) {
      return Formato.PNG;
    }
    if (bytes.length >= 12
        && bytes[0] == 'R'
        && bytes[1] == 'I'
        && bytes[2] == 'F'
        && bytes[3] == 'F'
        && bytes[8] == 'W'
        && bytes[9] == 'E'
        && bytes[10] == 'B'
        && bytes[11] == 'P') {
      return Formato.WEBP;
    }
    return Formato.OTRO;
  }

  /** Redimensiona manteniendo proporción y sin agrandar; siempre reencoda JPEG comprimido. */
  static byte[] redimensionar(BufferedImage original, int anchoMax) {
    var utilizable = sinTransparencia(original);
    double escala = Math.min(1.0, (double) anchoMax / utilizable.getWidth());
    try {
      var salida = new ByteArrayOutputStream();
      Thumbnails.of(utilizable)
          .scale(escala)
          .outputFormat("jpg")
          .outputQuality(0.85)
          .toOutputStream(salida);
      return salida.toByteArray();
    } catch (IOException e) {
      throw new ImagenInvalidaException("No pudimos procesar la imagen; probá con otra foto.");
    }
  }

  /** JPEG no tiene alfa: si viene PNG transparente, se aplana sobre blanco. */
  private static BufferedImage sinTransparencia(BufferedImage original) {
    if (!original.getColorModel().hasAlpha()) {
      return original;
    }
    var rgb =
        new BufferedImage(original.getWidth(), original.getHeight(), BufferedImage.TYPE_INT_RGB);
    Graphics2D g = rgb.createGraphics();
    g.setColor(Color.WHITE);
    g.fillRect(0, 0, original.getWidth(), original.getHeight());
    g.drawImage(original, 0, 0, null);
    g.dispose();
    return rgb;
  }

  private Negocio negocio(Long negocioId) {
    return negocios
        .findById(negocioId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado."));
  }

  private Negocio propio(Long propietarioId, Long negocioId) {
    var n = negocio(negocioId);
    if (!n.getPropietario().getId().equals(propietarioId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ese negocio no es tuyo.");
    }
    return n;
  }

  private ImagenNegocio imagenDe(Long negocioId, Long imagenId) {
    return imagenes
        .findByIdAndNegocio_Id(imagenId, negocioId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Esa foto no existe."));
  }
}
