package co.edu.uniquindio.trina.pago;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Puertos para lo que puede cambiar (principio §1.2). El simulador cuelga de este puerto (RF-28/29).
 */
public final class PagoPorts {

  private PagoPorts() {}

  public record SolicitudCobro(int montoCop, String tarjetaPan, String claveIdempotencia) {}

  public record ResultadoCobro(boolean aprobado, String referencia, String motivo) {}

  public interface PaymentGatewayPort {
    ResultadoCobro cobrar(SolicitudCobro solicitud);

    boolean reembolsar(String referencia);
  }

  /** Simulador interno determinista por número de tarjeta de prueba (§7.1). */
  public static final class SimuladorPagoGateway implements PaymentGatewayPort {
    @Override
    public ResultadoCobro cobrar(SolicitudCobro s) {
      String pan = s.tarjetaPan().replaceAll("\\s", "");
      return switch (pan) {
        case "4111111111111111" -> new ResultadoCobro(true, "SIM-" + s.claveIdempotencia(), null);
        case "4000000000000002" ->
            new ResultadoCobro(false, null, "Fondos insuficientes. Probá con otra tarjeta.");
        case "4000000000000069" ->
            new ResultadoCobro(false, null, "Tarjeta vencida. Probá con otra tarjeta.");
        default -> new ResultadoCobro(false, null, "No se pudo procesar el pago. Intentá de nuevo.");
      };
    }

    @Override
    public boolean reembolsar(String referencia) {
      return referencia != null && referencia.startsWith("SIM-");
    }
  }

  /** RN-06: comisión = round(total * pct / 100); neto = total − comisión. */
  public static int[] comisionYNeto(int totalCop, BigDecimal porcentaje) {
    int comision =
        new BigDecimal(totalCop)
            .multiply(porcentaje)
            .divide(new BigDecimal(100), 0, RoundingMode.HALF_UP)
            .intValueExact();
    return new int[] {comision, totalCop - comision};
  }
}
