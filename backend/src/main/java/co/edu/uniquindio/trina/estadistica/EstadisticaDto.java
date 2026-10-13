package co.edu.uniquindio.trina.estadistica;

import java.util.List;

/** DTOs de estadísticas (RF-40 a RF-42). */
public final class EstadisticaDto {

  private EstadisticaDto() {}

  /** RF-40: resumen del periodo elegido (7 o 30 días) para el negocio del Comerciante. */
  public record Resumen(int dias, long visitas, long pedidos, long reservas, long ingresosCop) {}

  /** RF-42: ítem del ranking con su nombre y total de vistas. */
  public record ItemRanking(Long itemId, String nombre, long visitas) {}

  public record ConteoEstado(String estado, long cantidad) {}

  public record ConteoRol(String rol, long cantidad) {}

  /** RF-41: indicadores globales del panel administrativo. */
  public record PanelAdmin(
      List<ConteoEstado> negociosPorEstado,
      List<ConteoRol> usuariosPorRol,
      long pedidosTotales,
      long comisionesCop,
      long membresiasActivas,
      long usuariosNoResidentes,
      long usuariosTotales,
      double proporcionNoResidentes) {}
}
