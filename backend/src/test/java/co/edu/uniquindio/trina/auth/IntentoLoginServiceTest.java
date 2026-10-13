package co.edu.uniquindio.trina.auth;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

/** Caso alterno RF-02 E4: 5 fallidos en 15 min → 429; el éxito limpia el contador. */
class IntentoLoginServiceTest {

  @Test
  void quintoFalloTodaviaPermiteYSextoBloquea() {
    var svc = new IntentoLoginService();
    String correo = "correo:x@trina.co";
    String ip = "ip:1.2.3.4";
    for (int i = 0; i < 5; i++) {
      svc.exigirPermitido(correo, ip);
      svc.registrarFallo(correo, ip);
    }
    assertThrows(IntentoLoginService.LimiteExcedido.class, () -> svc.exigirPermitido(correo, ip));
  }

  @Test
  void exitoLimpiaContador() {
    var svc = new IntentoLoginService();
    String correo = "correo:y@trina.co";
    String ip = "ip:5.6.7.8";
    for (int i = 0; i < 4; i++) {
      svc.registrarFallo(correo, ip);
    }
    svc.limpiar(correo, ip);
    assertDoesNotThrow(() -> svc.exigirPermitido(correo, ip));
  }
}
