package co.edu.uniquindio.trina.negocio;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Horarios de atención (RF-13) y estado "abierto ahora" (RF-23) — diseño §7.4. Las franjas se
 * evalúan en memoria sobre el conjunto ya filtrado; una franja con {@code cierra <= abre} cruza la
 * medianoche. Día sin filas = cerrado.
 */
@Service
public class HorarioService {

  private static final String APROBADO = "APROBADO";

  private final HorarioAtencionRepository horarios;
  private final NegocioRepository negocios;
  private final ZoneId zona;

  public HorarioService(
      HorarioAtencionRepository horarios,
      NegocioRepository negocios,
      @Value("${app.zona-horaria:America/Bogota}") String zonaHoraria) {
    this.horarios = horarios;
    this.negocios = negocios;
    this.zona = ZoneId.of(zonaHoraria);
  }

  /** Reemplaza todas las franjas del negocio propio (RF-13). Lista vacía = sin horarios. */
  @Transactional
  public List<HorarioDto.FranjaRespuesta> reemplazar(
      Long propietarioId, Long negocioId, List<HorarioDto.FranjaRequest> franjas) {
    var negocio = propio(propietarioId, negocioId);
    horarios.deleteByNegocio_Id(negocioId);
    var nuevas = new ArrayList<HorarioAtencion>();
    if (franjas != null) {
      for (var f : franjas) {
        if (f == null || f.diaSemana() == null) {
          throw new IllegalArgumentException("Elegí el día de cada franja.");
        }
        if (f.diaSemana() < 1 || f.diaSemana() > 7) {
          throw new IllegalArgumentException("El día tiene que estar entre lunes (1) y domingo (7).");
        }
        nuevas.add(
            new HorarioAtencion(
                negocio, f.diaSemana(), hora(f.abre(), "apertura"), hora(f.cierra(), "cierre")));
      }
    }
    return horarios.saveAll(nuevas).stream()
        .sorted(
            Comparator.comparingInt(HorarioAtencion::getDiaSemana)
                .thenComparing(HorarioAtencion::getAbre))
        .map(HorarioDto.FranjaRespuesta::de)
        .toList();
  }

  /** El negocio APROBADO muestra sus horarios a cualquiera; el dueño siempre los ve (RF-13). */
  @Transactional(readOnly = true)
  public List<HorarioDto.FranjaRespuesta> listar(Long negocioId, Long solicitanteId) {
    var negocio = negocio(negocioId);
    boolean dueno = solicitanteId != null && negocio.getPropietario().getId().equals(solicitanteId);
    if (!APROBADO.equals(negocio.getEstado()) && !dueno) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no publicado.");
    }
    return franjasDe(negocioId).stream().map(HorarioDto.FranjaRespuesta::de).toList();
  }

  /** RF-23: ¿el negocio está abierto en el instante dado? Zona America/Bogota por defecto. */
  @Transactional(readOnly = true)
  public boolean abiertoAhora(Long negocioId, Instant instante) {
    return abierto(franjasDe(negocioId), instante, zona);
  }

  /**
   * RF-25/RF-26: exige horario solo si el negocio tiene franjas configuradas. Sin franjas devuelve
   * {@code true} para no bloquear negocios viejos que nunca guardaron horarios.
   */
  @Transactional(readOnly = true)
  public boolean abiertoSiTieneFranjas(Long negocioId, Instant instante) {
    var franjas = franjasDe(negocioId);
    return franjas.isEmpty() || abierto(franjas, instante, zona);
  }

  /** Variante en lote para el directorio: una sola consulta para todas las fichas. */
  @Transactional(readOnly = true)
  public Set<Long> abiertos(Collection<Long> negocioIds, Instant instante) {
    if (negocioIds == null || negocioIds.isEmpty()) {
      return Set.of();
    }
    var porNegocio =
        horarios.findByNegocio_IdIn(negocioIds).stream()
            .collect(Collectors.groupingBy(h -> h.getNegocio().getId()));
    var resultado = new HashSet<Long>();
    for (Long id : negocioIds) {
      if (abierto(porNegocio.getOrDefault(id, List.of()), instante, zona)) {
        resultado.add(id);
      }
    }
    return resultado;
  }

  /** Cálculo puro del diseño §7.4, testeable con cualquier instante y zona. */
  static boolean abierto(List<HorarioAtencion> franjas, Instant instante, ZoneId zona) {
    ZonedDateTime momento = instante.atZone(zona);
    int hoy = momento.getDayOfWeek().getValue();
    int ayer = hoy == 1 ? 7 : hoy - 1;
    LocalTime hora = momento.toLocalTime();
    for (var f : franjas) {
      if (f.getDiaSemana() == hoy) {
        if (f.cruzaMedianoche()) {
          if (!hora.isBefore(f.getAbre())) {
            return true;
          }
        } else if (!hora.isBefore(f.getAbre()) && hora.isBefore(f.getCierra())) {
          return true;
        }
      } else if (f.getDiaSemana() == ayer && f.cruzaMedianoche() && hora.isBefore(f.getCierra())) {
        return true;
      }
    }
    return false;
  }

  private List<HorarioAtencion> franjasDe(Long negocioId) {
    return horarios.findByNegocio_IdOrderByDiaSemanaAscAbreAsc(negocioId);
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

  private static LocalTime hora(String valor, String campo) {
    try {
      return LocalTime.parse(valor);
    } catch (RuntimeException e) {
      throw new IllegalArgumentException("La hora de " + campo + " tiene que ser HH:mm.");
    }
  }
}
