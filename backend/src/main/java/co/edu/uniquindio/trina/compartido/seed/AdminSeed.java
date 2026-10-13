package co.edu.uniquindio.trina.compartido.seed;

import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Siembra el administrador inicial (hito §8.2) una única vez: si todavía no existe ningún usuario
 * ADMINISTRADOR crea uno con el correo de {@code ADMIN_EMAIL} (default admin@trina.local) y la
 * clave de {@code ADMIN_PASSWORD}.
 *
 * <p>En producción la clave es obligatoria: sin {@code ADMIN_PASSWORD} no se crea nada y queda un
 * aviso en el log. En entornos locales con {@code app.seed-demo=true} se permite la clave demo
 * {@code admin1234} para arrancar la demostración sin variables de entorno.
 *
 * <p>La clave se guarda con BCrypt, la cuenta nace con consentimiento v1 y el log nunca incluye la
 * clave. Corre al final ({@link Ordered#LOWEST_PRECEDENCE}) después de las otras tareas de arranque.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class AdminSeed implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(AdminSeed.class);

  /** Clave de arranque para demos locales; solo se usa con app.seed-demo=true. */
  public static final String CLAVE_DEMO = "admin1234";

  private static final String EMAIL_DEFAULT = "admin@trina.local";
  private static final String NOMBRE = "Administrador TRINA";

  private final UsuarioRepository usuarios;
  private final PasswordEncoder claves;
  private final JdbcTemplate jdbc;
  private final String adminEmail;
  private final String adminPassword;
  private final boolean seedDemo;

  public AdminSeed(
      UsuarioRepository usuarios,
      PasswordEncoder claves,
      JdbcTemplate jdbc,
      @Value("${ADMIN_EMAIL:admin@trina.local}") String adminEmail,
      @Value("${ADMIN_PASSWORD:}") String adminPassword,
      @Value("${app.seed-demo:false}") boolean seedDemo) {
    this.usuarios = usuarios;
    this.claves = claves;
    this.jdbc = jdbc;
    this.adminEmail = adminEmail;
    this.adminPassword = adminPassword;
    this.seedDemo = seedDemo;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (hayAdministrador()) {
      log.info("Ya existe un administrador: no se siembra otro.");
      return;
    }

    String password = adminPassword == null ? "" : adminPassword.trim();
    if (password.isEmpty()) {
      if (!seedDemo) {
        log.warn(
            "ADMIN_PASSWORD no está definido y app.seed-demo=false: no se crea el administrador inicial.");
        return;
      }
      password = CLAVE_DEMO;
      log.warn(
          "ADMIN_PASSWORD no está definido; app.seed-demo=true → se usa la clave de demo. No usar en producción.");
    }

    String email = adminEmail == null || adminEmail.isBlank() ? EMAIL_DEFAULT : adminEmail.trim().toLowerCase();
    if (usuarios.existsByEmailIgnoreCase(email)) {
      log.warn("El correo {} ya pertenece a otra cuenta: no se crea el administrador inicial.", email);
      return;
    }

    var admin = new Usuario(email, claves.encode(password), NOMBRE, "ADMINISTRADOR");
    admin.setVersionConsentimiento("v1");
    admin.setConsentimientoEn(Instant.now());
    usuarios.save(admin);
    log.info("Administrador inicial creado con el correo {}.", email);
  }

  private boolean hayAdministrador() {
    return Boolean.TRUE.equals(
        jdbc.queryForObject(
            "select exists(select 1 from usuario where rol = 'ADMINISTRADOR')", Boolean.class));
  }
}
