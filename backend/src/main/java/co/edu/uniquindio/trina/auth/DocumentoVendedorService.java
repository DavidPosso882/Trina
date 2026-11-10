package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.almacenamiento.StoragePort;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Documentos del vendedor (RUT + cédula) al crear cuenta COMERCIANTE.
 * Patrón adaptado de ViviGo: allá `documentoLegal` es una URL de Cloudinary con
 * `accept="application/pdf"` y tope 5MB; acá se guardan bytes en MinIO vía
 * StoragePort, se validan por contenido real (PDF/JPG/PNG/WEBP) y la descarga
 * es privada (solo dueño o admin), no URL pública.
 */
@Service
public class DocumentoVendedorService {

  static final int MAX_MB = 5;
  static final long MAX_BYTES = 5L * 1024L * 1024L;

  private final StoragePort almacenamiento;

  public DocumentoVendedorService(
      StoragePort almacenamiento,
      @Value("${app.minio.base-media:/media}") String baseMedia) {
    this.almacenamiento = almacenamiento;
  }

  public record DocumentosGuardados(
      String rutClave, String rutTipo, String cedulaClave, String cedulaTipo) {}

  public DocumentosGuardados guardar(Long usuarioId, byte[] rut, byte[] cedula) {
    Validado rutV = validar("RUT", rut);
    Validado cedV = validar("cédula", cedula);
    String rutClave = "vendedores/" + usuarioId + "/rut_" + UUID.randomUUID() + "." + rutV.extension;
    String cedulaClave =
        "vendedores/" + usuarioId + "/cedula_" + UUID.randomUUID() + "." + cedV.extension;
    almacenamiento.guardar(rutClave, rut, rutV.tipoContenido);
    try {
      almacenamiento.guardar(cedulaClave, cedula, cedV.tipoContenido);
    } catch (RuntimeException e) {
      try {
        almacenamiento.eliminar(rutClave);
      } catch (RuntimeException ignorada) {
        // Limpieza best-effort: lo importante es el error original.
      }
      throw e;
    }
    return new DocumentosGuardados(rutClave, rutV.tipoContenido, cedulaClave, cedV.tipoContenido);
  }

  public byte[] leer(String clave) {
    return almacenamiento.leer(clave);
  }

  private record Validado(String extension, String tipoContenido) {}

  private static Validado validar(String cual, byte[] bytes) {
    String nombre = "RUT".equalsIgnoreCase(cual) ? "RUT" : "cédula";
    String articulo = "RUT".equalsIgnoreCase(cual) ? "el" : "la";
    if (bytes == null || bytes.length == 0) {
      throw new DocumentoVendedorException("Adjunta " + articulo + " " + nombre + " en PDF o imagen.");
    }
    if (bytes.length > MAX_BYTES) {
      throw new DocumentoVendedorException(
          ("El " + nombre + " no puede superar los " + MAX_MB + " MB.").replace("El cédula", "La cédula"));
    }
    Formato formato = formato(bytes);
    if (formato == Formato.OTRO) {
      throw new DocumentoVendedorException(
          "Sube " + articulo + " " + nombre + " en PDF o imagen (JPG, PNG o WebP).");
    }
    return switch (formato) {
      case PDF -> new Validado("pdf", "application/pdf");
      case JPG -> new Validado("jpg", "image/jpeg");
      case PNG -> new Validado("png", "image/png");
      case WEBP -> new Validado("webp", "image/webp");
      case OTRO -> throw new DocumentoVendedorException(
          "Sube " + articulo + " " + nombre + " en PDF o imagen (JPG, PNG o WebP).");
    };
  }

  private enum Formato {
    PDF,
    JPG,
    PNG,
    WEBP,
    OTRO
  }

  /** Tipo real por magia, como ImagenNegocioService pero admitiendo PDF. */
  static Formato formato(byte[] bytes) {
    if (bytes.length >= 4
        && (bytes[0] & 0xFF) == 0x25
        && (bytes[1] & 0xFF) == 0x50
        && (bytes[2] & 0xFF) == 0x44
        && (bytes[3] & 0xFF) == 0x46) {
      return Formato.PDF;
    }
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
}
