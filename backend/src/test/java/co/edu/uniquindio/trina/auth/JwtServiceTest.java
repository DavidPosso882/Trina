package co.edu.uniquindio.trina.auth;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Duration;
import org.junit.jupiter.api.Test;

/**
 * RED: JwtService aún no existe. Criterios RF-02/RF-04: firma HS256, expiración 60 min, reclamo ver.
 */
class JwtServiceTest {

  private JwtService servicio() {
    return new JwtService("test-secreto-32-bytes-minimo-123456", Duration.ofMinutes(60));
  }

  @Test
  void generaYValidaConVerIgual() {
    JwtService jwt = servicio();
    String token = jwt.generar(42L, "CLIENTE", 3);
    JwtService.Sesion s = jwt.validar(token, 3);
    assertEquals(42L, s.usuarioId());
    assertEquals("CLIENTE", s.rol());
    assertEquals(3, s.ver());
  }

  @Test
  void rechazaVerDistinto() {
    JwtService jwt = servicio();
    String token = jwt.generar(1L, "CLIENTE", 1);
    // token_version en BD ya va en 2 → el token viejo no vale (RF-04 E4)
    assertThrows(SecurityException.class, () -> jwt.validar(token, 2));
  }

  @Test
  void rechazaTokenVencido() throws InterruptedException {
    JwtService corto = new JwtService("test-secreto-32-bytes-minimo-123456", Duration.ofMillis(1));
    String token = corto.generar(1L, "CLIENTE", 0);
    Thread.sleep(20);
    assertThrows(SecurityException.class, () -> corto.validar(token, 0));
  }

  @Test
  void rechazaFirmaAjena() {
    JwtService otro = new JwtService("otro-secreto-32-bytes-minimo-654321", Duration.ofMinutes(60));
    String token = servicio().generar(1L, "CLIENTE", 0);
    assertThrows(SecurityException.class, () -> otro.validar(token, 0));
  }
}
