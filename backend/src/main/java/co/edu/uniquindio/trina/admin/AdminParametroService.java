package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.negocio.ParametroSistema;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** RF-45: consulta y edición de parámetros. Solo comision_pct tiene rango validado (0-30). */
@Service
public class AdminParametroService {

  private static final Set<String> CLAVES_CONOCIDAS =
      Set.of(
          "comision_pct",
          "destacada_precio_cop",
          "max_destacados_basica",
          "max_destacados_destacada",
          "max_imagenes",
          "max_mb_imagen",
          "pedido_expira_min",
          "reserva_expira_horas");
  private static final BigDecimal COMISION_MAXIMA = new BigDecimal("30");

  private final AdminParametroRepository parametros;
  private final AuditoriaService auditoria;

  public AdminParametroService(
      AdminParametroRepository parametros, AuditoriaService auditoria) {
    this.parametros = parametros;
    this.auditoria = auditoria;
  }

  @Transactional(readOnly = true)
  public List<AdminParametroDto.ParametroRespuesta> listar() {
    return parametros.findAll().stream()
        .sorted(Comparator.comparing(ParametroSistema::getClave))
        .map(AdminParametroService::respuesta)
        .toList();
  }

  @Transactional
  public AdminParametroDto.ParametroRespuesta actualizar(Long actorId, String clave, String valor) {
    String normalizada = clave == null ? "" : clave.trim();
    if (!CLAVES_CONOCIDAS.contains(normalizada)) {
      throw noExiste();
    }
    var parametro = parametros.findById(normalizada).orElseThrow(AdminParametroService::noExiste);
    String nuevo = valor.trim();
    if ("comision_pct".equals(normalizada)) {
      validarComision(nuevo);
    }
    String anterior = parametro.getValor();
    parametros.actualizarValor(normalizada, nuevo);
    auditoria.registrar(
        actorId,
        "ACTUALIZAR_PARAMETRO",
        "PARAMETRO",
        null,
        "{\"clave\":\"" + normalizada + "\",\"anterior\":\"" + anterior + "\",\"nuevo\":\"" + nuevo + "\"}",
        null);
    return respuesta(parametros.findById(normalizada).orElseThrow(AdminParametroService::noExiste));
  }

  private static void validarComision(String valor) {
    BigDecimal porcentaje;
    try {
      porcentaje = new BigDecimal(valor);
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("La comisión debe ser un número entre 0 y 30.");
    }
    if (porcentaje.compareTo(BigDecimal.ZERO) < 0 || porcentaje.compareTo(COMISION_MAXIMA) > 0) {
      throw new IllegalArgumentException("La comisión debe estar entre 0 y 30.");
    }
  }

  private static AdminParametroDto.ParametroRespuesta respuesta(ParametroSistema p) {
    return new AdminParametroDto.ParametroRespuesta(
        p.getClave(), p.getValor(), p.getDescripcion());
  }

  private static ResponseStatusException noExiste() {
    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Esa clave no existe.");
  }
}
