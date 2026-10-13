package co.edu.uniquindio.trina.pago;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

/** RN-06 sin necesidad de BD: ejemplo del SRS §4 RF-29 E1. */
class PagoPortsTest {

  @Test
  void comisionCincoPorcientoDe100mil() {
    int[] r = PagoPorts.comisionYNeto(100_000, new BigDecimal("5"));
    assertEquals(5_000, r[0]);
    assertEquals(95_000, r[1]);
  }

  @Test
  void simuladorApruebaYRechaza() {
    var gw = new PagoPorts.SimuladorPagoGateway();
    var ok =
        gw.cobrar(new PagoPorts.SolicitudCobro(9_500, "4111 1111 1111 1111", "k-1"));
    var sinFondos =
        gw.cobrar(new PagoPorts.SolicitudCobro(9_500, "4000 0000 0000 0002", "k-2"));
    assertEquals(true, ok.aprobado());
    assertEquals(false, sinFondos.aprobado());
  }
}
