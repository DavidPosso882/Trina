package co.edu.uniquindio.trina.pedido;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import java.util.List;

/** DTOs de pedidos para recoger (RF-25, RF-27, RF-31). */
public final class PedidoDto {

  private PedidoDto() {}

  public record LineaRequest(
      @NotNull(message = "Indicá el ítem") Long itemId,
      @NotNull(message = "Indicá la cantidad")
          @Positive(message = "La cantidad tiene que ser mayor que cero")
          Integer cantidad) {}

  public record CrearPedidoRequest(
      @NotNull(message = "Indicá el negocio") Long negocioId,
      @NotBlank(message = "Elegí cómo vas a pagar")
          @Pattern(
              regexp = "SANDBOX|EN_LOCAL",
              message = "El método de pago tiene que ser SANDBOX o EN_LOCAL")
          String metodoPago,
      String nota,
      @NotEmpty(message = "Agregá al menos un ítem al pedido")
          @Valid
          List<LineaRequest> items) {}

  public record AccionRequest(
      @NotBlank(message = "Indicá la acción")
          @Pattern(
              regexp = "ACEPTAR|RECHAZAR|MARCAR_LISTO|COMPLETAR|CANCELAR",
              message = "Esa acción no existe")
          String accion,
      String motivo) {}

  public record ItemRespuesta(
      Long id, Long itemId, String nombre, int precioUnitarioCop, int cantidad) {
    static ItemRespuesta de(PedidoItem i) {
      return new ItemRespuesta(
          i.getId(),
          i.getCatalogoItem() == null ? null : i.getCatalogoItem().getId(),
          i.getNombreCopia(),
          i.getPrecioUnitarioCop(),
          i.getCantidad());
    }
  }

  public record PedidoRespuesta(
      Long id,
      Long clienteId,
      Long negocioId,
      String negocio,
      String estado,
      String metodoPago,
      int totalCop,
      String nota,
      String motivo,
      Instant creadoEn,
      List<ItemRespuesta> items) {
    static PedidoRespuesta de(Pedido p) {
      return new PedidoRespuesta(
          p.getId(),
          p.getCliente().getId(),
          p.getNegocio().getId(),
          p.getNegocio().getNombre(),
          p.getEstado(),
          p.getMetodoPago(),
          p.getTotalCop(),
          p.getNota(),
          p.getMotivo(),
          p.getCreadoEn(),
          p.getItems().stream().map(ItemRespuesta::de).toList());
    }
  }
}
