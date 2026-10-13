package co.edu.uniquindio.trina.pago;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

/** DTOs del pago simulado (RF-28/RF-29): la tarjeta llega como PAN de prueba y no se persiste. */
public final class PagoDto {

  private PagoDto() {}

  public record CobroRequest(
      Long pedidoId,
      Long suscripcionId,
      @NotBlank(message = "Ingresá el número de la tarjeta") String tarjeta) {}

  /** Respuesta del cobro: `motivo` solo llega cuando el simulador rechaza o repetís una clave. */
  public record CobroRespuesta(
      Long pagoId,
      Long suscripcionId,
      String estado,
      String motivo,
      int montoCop,
      int comisionCop,
      int netoCop,
      String referencia) {
    static CobroRespuesta de(Pago p, String motivo) {
      return new CobroRespuesta(
          p.getId(),
          p.getSuscripcionId(),
          p.getEstado(),
          motivo,
          p.getMontoCop(),
          p.getComisionCop(),
          p.getNetoCop(),
          p.getReferencia());
    }
  }

  public record PagoRespuesta(
      Long id,
      Long pedidoId,
      Long suscripcionId,
      String proveedor,
      String estado,
      int montoCop,
      int comisionCop,
      int netoCop,
      String referencia,
      String marcaTarjeta,
      String ultimos4,
      Instant creadoEn) {
    static PagoRespuesta de(Pago p) {
      return new PagoRespuesta(
          p.getId(),
          p.getPedido() == null ? null : p.getPedido().getId(),
          p.getSuscripcionId(),
          p.getProveedor(),
          p.getEstado(),
          p.getMontoCop(),
          p.getComisionCop(),
          p.getNetoCop(),
          p.getReferencia(),
          p.getMarcaTarjeta(),
          p.getUltimos4(),
          p.getCreadoEn());
    }
  }
}
