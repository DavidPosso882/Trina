package co.edu.uniquindio.trina.membresia;

import java.time.Instant;

/** DTOs de membresías (RF-33 a RF-37). */
public final class MembresiaDto {

  private MembresiaDto() {}

  public record PlanRespuesta(
      Long id, String codigo, String nombre, int precioMensualCop, int maxDestacados, boolean activo) {
    static PlanRespuesta de(MembresiaPlan p) {
      return new PlanRespuesta(
          p.getId(),
          p.getCodigo(),
          p.getNombre(),
          p.getPrecioMensualCop(),
          p.getMaxDestacados(),
          p.isActivo());
    }
  }

  /** RF-35: vigencia, estado, plan efectivo y aviso de renovación. */
  public record SuscripcionRespuesta(
      Long id,
      String estado,
      String planCodigo,
      String planNombre,
      Integer precioMensualCop,
      Instant inicio,
      Instant fin,
      String planEfectivo,
      boolean avisoRenovacion) {

    static SuscripcionRespuesta de(
        MembresiaSuscripcion s, String planEfectivo, boolean avisoRenovacion) {
      var plan = s.getPlan();
      return new SuscripcionRespuesta(
          s.getId(),
          s.getEstado(),
          plan.getCodigo(),
          plan.getNombre(),
          plan.getPrecioMensualCop(),
          s.getInicio(),
          s.getFin(),
          planEfectivo,
          avisoRenovacion);
    }

    /** RN-05: sin filas de suscripción el plan efectivo es BASICA. */
    static SuscripcionRespuesta sinSuscripcion(String planEfectivo) {
      return new SuscripcionRespuesta(
          null, null, null, null, null, null, null, planEfectivo, false);
    }
  }
}
