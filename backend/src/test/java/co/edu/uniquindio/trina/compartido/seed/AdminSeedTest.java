package co.edu.uniquindio.trina.compartido.seed;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seed del administrador inicial (hito §8.2): crea una sola vez, con clave BCrypt, consentimiento
 * v1 y sin duplicar cuando ya hay un ADMINISTRADOR. El entorno se simula pasando los valores que en
 * producción llegan por ADMIN_EMAIL/ADMIN_PASSWORD y app.seed-demo.
 */
class AdminSeedTest {

  private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
  private final PasswordEncoder claves = new BCryptPasswordEncoder();
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);

  @Test
  void sinAdminCreaUnoConElEntornoSimulado() {
    sinAdmin();
    when(usuarios.existsByEmailIgnoreCase(anyString())).thenReturn(false);

    new AdminSeed(usuarios, claves, jdbc, "Seed-Admin@Trina.Test", "clave-seed-1234", false)
        .run(null);

    var guardado = capturarGuardado();
    assertEquals("seed-admin@trina.test", guardado.getEmail());
    assertEquals("ADMINISTRADOR", guardado.getRol());
    assertTrue(claves.matches("clave-seed-1234", guardado.getPasswordHash()));
    assertEquals("v1", guardado.getVersionConsentimiento());
    assertNotNull(guardado.getConsentimientoEn());
    assertTrue(guardado.isActivo());
  }

  @Test
  void conAdminExistenteNoDuplica() {
    when(jdbc.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true);

    new AdminSeed(usuarios, claves, jdbc, "seed-admin@trina.test", "clave-seed-1234", false)
        .run(null);

    verify(usuarios, never()).save(any());
  }

  @Test
  void sinClaveYSeedDemoApagadoNoCrea() {
    sinAdmin();

    new AdminSeed(usuarios, claves, jdbc, "seed-admin@trina.test", "", false).run(null);

    verify(usuarios, never()).save(any());
  }

  @Test
  void sinClaveYSeedDemoEncendidoUsaLaClaveDemo() {
    sinAdmin();
    when(usuarios.existsByEmailIgnoreCase(anyString())).thenReturn(false);

    new AdminSeed(usuarios, claves, jdbc, "seed-demo@trina.test", "   ", true).run(null);

    assertTrue(claves.matches(AdminSeed.CLAVE_DEMO, capturarGuardado().getPasswordHash()));
  }

  @Test
  void correoVacioUsaElDefault() {
    sinAdmin();
    when(usuarios.existsByEmailIgnoreCase(anyString())).thenReturn(false);

    new AdminSeed(usuarios, claves, jdbc, " ", "clave-seed-1234", false).run(null);

    assertEquals("admin@trina.local", capturarGuardado().getEmail());
  }

  @Test
  void correoYaUsadoPorOtroRolNoCrea() {
    sinAdmin();
    when(usuarios.existsByEmailIgnoreCase(anyString())).thenReturn(true);

    new AdminSeed(usuarios, claves, jdbc, "seed-admin@trina.test", "clave-seed-1234", false)
        .run(null);

    verify(usuarios, never()).save(any());
  }

  @Test
  void correAlFinal() {
    var orden = AdminSeed.class.getAnnotation(Order.class);
    assertNotNull(orden);
    assertEquals(Ordered.LOWEST_PRECEDENCE, orden.value());
  }

  private void sinAdmin() {
    when(jdbc.queryForObject(anyString(), eq(Boolean.class))).thenReturn(false);
  }

  private Usuario capturarGuardado() {
    var captor = ArgumentCaptor.forClass(Usuario.class);
    verify(usuarios).save(captor.capture());
    return captor.getValue();
  }
}
