package co.edu.uniquindio.trina.compartido.seed;

import static org.junit.jupiter.api.Assertions.*;

import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verificación de arranque: con ADMIN_EMAIL/ADMIN_PASSWORD simulados como propiedades, el
 * ApplicationRunner corre al levantar el contexto, crea el administrador y volver a invocarlo no
 * duplica nada. Deja el H2 compartido limpio para no romper al resto de los tests.
 */
@SpringBootTest(
    properties = {
      "ADMIN_EMAIL=seed-arranque@trina.test",
      "ADMIN_PASSWORD=clave-arranque-1234"
    })
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AdminSeedArranqueTest {

  private static final String EMAIL = "seed-arranque@trina.test";

  @Autowired UsuarioRepository usuarios;
  @Autowired PasswordEncoder claves;
  @Autowired JdbcTemplate jdbc;
  @Autowired AdminSeed seed;

  @AfterAll
  void limpiar() {
    usuarios.findByEmailIgnoreCase(EMAIL).ifPresent(u -> usuarios.deleteById(u.getId()));
  }

  @Test
  void alArrancarCreaElAdminConElEntorno() {
    var creado = usuarios.findByEmailIgnoreCase(EMAIL).orElseThrow();
    assertEquals("ADMINISTRADOR", creado.getRol());
    assertTrue(claves.matches("clave-arranque-1234", creado.getPasswordHash()));
    assertEquals("v1", creado.getVersionConsentimiento());
  }

  @Test
  void volverARunNoDuplica() {
    assertTrue(usuarios.findByEmailIgnoreCase(EMAIL).isPresent());

    seed.run(null);

    assertEquals(
        1,
        jdbc.queryForObject(
            "select count(*) from usuario where rol = 'ADMINISTRADOR'", Integer.class));
    assertTrue(usuarios.findByEmailIgnoreCase(EMAIL).isPresent());
  }
}
