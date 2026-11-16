package co.edu.uniquindio.trina.admin;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registro y consulta de la bitácora administrativa (RF-46). */
@Service
public class AuditoriaService {

  private final AuditoriaRepository auditorias;

  public AuditoriaService(AuditoriaRepository auditorias) {
    this.auditorias = auditorias;
  }

  /** Registra una acción; {@code actorId} puede ser nulo si la origina el sistema. */
  @Transactional
  public Auditoria registrar(
      Long actorId,
      String accion,
      String entidad,
      Long entidadId,
      String detalle,
      String motivo) {
    return auditorias.save(Auditoria.de(actorId, accion, entidad, entidadId, detalle, motivo));
  }

  @Transactional(readOnly = true)
  public AuditoriaDto.Pagina listar(
      LocalDate fecha,
      String desde,
      String hasta,
      Long usuarioId,
      String entidad,
      int page,
      int size) {
    Instant inicio = parse(desde, "desde");
    Instant fin = parse(hasta, "hasta");
    if (fecha != null) {
      inicio = fecha.atStartOfDay(ZoneOffset.UTC).toInstant();
      fin = fecha.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }
    int pagina = Math.max(page, 0);
    int tamano = Math.min(Math.max(size, 1), 100);
    String entidadNorm = blankToNull(entidad);
    if (entidadNorm != null) {
      entidadNorm = entidadNorm.toUpperCase(java.util.Locale.ROOT);
    }
    final String entidadFiltro = entidadNorm;
    Specification<Auditoria> spec = Specification.where(null);
    if (usuarioId != null) {
      final Long uid = usuarioId;
      spec = spec.and((root, query, cb) -> cb.equal(root.get("usuarioId"), uid));
    }
    if (entidadFiltro != null) {
      spec = spec.and((root, query, cb) -> cb.equal(cb.upper(root.get("entidad")), entidadFiltro));
    }
    if (inicio != null) {
      final Instant desdeFiltro = inicio;
      spec =
          spec.and(
              (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("creadoEn"), desdeFiltro));
    }
    if (fin != null) {
      final Instant hastaFiltro = fin;
      spec =
          spec.and(
              (root, query, cb) -> cb.lessThanOrEqualTo(root.get("creadoEn"), hastaFiltro));
    }
    var resultado =
        auditorias.findAll(
            spec, PageRequest.of(pagina, tamano, Sort.by(Sort.Direction.DESC, "id")));
    return new AuditoriaDto.Pagina(
        resultado.getContent().stream().map(AuditoriaDto.Respuesta::de).toList(),
        resultado.getNumber(),
        resultado.getSize(),
        resultado.getTotalElements());
  }

  private static String blankToNull(String valor) {
    return valor == null || valor.isBlank() ? null : valor.trim();
  }

  private static Instant parse(String valor, String campo) {
    if (valor == null || valor.isBlank()) {
      return null;
    }
    try {
      return Instant.parse(valor.trim());
    } catch (DateTimeParseException e) {
      throw new IllegalArgumentException("El parámetro " + campo + " no es una fecha válida.");
    }
  }
}
