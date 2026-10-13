package co.edu.uniquindio.trina.compartido.migracion;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import co.edu.uniquindio.trina.compartido.config.DemoSeedConfig;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Verifica contra un PostgreSQL real que V1..V15 migran sin errores de sintaxis, que con
 * app.seed-demo=true (placeholder seedDemo) queda cargado el dataset del hito §8.2 y que V15 es
 * idempotente al reejecutarse. Con el flag apagado la migración corre, pero no inserta demo.
 *
 * <p>Si no hay Docker disponible, los tests se saltean (mismo espíritu que
 * {@code @Testcontainers(disabledWithoutDocker = true)}). El manejo es manual para fijar
 * {@code api.version}: docker-java trae la API 1.32 y los daemons modernos exigen >= 1.40.
 */
class DemoDataMigrationTest {

  static {
    System.setProperty("api.version", "1.41");
  }

  static PostgreSQLContainer<?> postgres;

  @BeforeAll
  static void levantar() {
    assumeTrue(dockerDisponible(), "Docker no disponible: se saltea la verificación de V15");
    postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    postgres.start();
  }

  @AfterAll
  static void bajar() {
    if (postgres != null && postgres.isRunning()) {
      postgres.stop();
    }
  }

  @Test
  void conFlagEncendidoCargaElDatasetYV15EsIdempotente() throws SQLException {
    var flyway = flyway(postgres.getJdbcUrl(), true);
    flyway.migrate();
    assertDatasetDemo();

    // Reejecuta V15 (misma versión y checksum) para probar los ON CONFLICT DO NOTHING.
    ejecutar("delete from flyway_schema_history where version = '15'");
    flyway.migrate();
    assertDatasetDemo();
  }

  @Test
  void conFlagApagadoLasMigracionesCorrenPeroSinDatosDemo() throws SQLException {
    String url = crearBase("demo_off");
    flyway(url, false).migrate();

    assertEquals(
        1,
        contarEn(url, "select count(*) from flyway_schema_history where version = '15' and success"));
    assertEquals(
        0, contarEn(url, "select count(*) from usuario where rol in ('COMERCIANTE','CLIENTE')"));
    assertEquals(0, contarEn(url, "select count(*) from negocio"));
    assertEquals(0, contarEn(url, "select count(*) from pedido"));
    // Los datos base de V1/V7 siguen ahí.
    assertEquals(7, contarEn(url, "select count(*) from categoria_negocio"));
    assertEquals(2, contarEn(url, "select count(*) from membresia_plan"));
  }

  private Flyway flyway(String url, boolean seedDemo) {
    return Flyway.configure()
        .dataSource(url, postgres.getUsername(), postgres.getPassword())
        .locations("classpath:db/migration")
        .placeholders(Map.of(DemoSeedConfig.PLACEHOLDER, Boolean.toString(seedDemo)))
        .load();
  }

  private void assertDatasetDemo() throws SQLException {
    assertEquals(4, contar("select count(*) from usuario where rol = 'COMERCIANTE'"));
    assertEquals(1, contar("select count(*) from usuario where rol = 'CLIENTE'"));
    assertEquals(0, contar("select count(*) from usuario where rol = 'ADMINISTRADOR'"));
    assertEquals(4, contar("select count(*) from negocio where estado = 'APROBADO'"));
    assertEquals(
        1,
        contar(
            """
            select count(*) from membresia_suscripcion s
            join membresia_plan p on p.id = s.plan_id
            where s.estado = 'ACTIVA' and s.fin > now() and p.codigo = 'DESTACADA'
            """));
    assertEquals(8, contar("select count(*) from catalogo_categoria"));
    assertEquals(8, contar("select count(*) from catalogo_item where activo"));
    assertEquals(1, contar("select count(*) from pedido where estado = 'COMPLETADO'"));
    assertEquals(1, contar("select count(*) from pedido where estado = 'PENDIENTE'"));
    assertEquals(1, contar("select count(*) from reserva where estado = 'CONFIRMADA'"));
    assertEquals(2, contar("select count(*) from resena where visible"));
    assertClaveDemo();
    assertSecuenciasAdelantadas();
  }

  /** Las 5 cuentas demo entran con "demo1234". */
  private void assertClaveDemo() throws SQLException {
    try (Connection c = conectar(postgres.getJdbcUrl());
        Statement s = c.createStatement();
        ResultSet rs =
            s.executeQuery("select password_hash from usuario where id between 9001 and 9099")) {
      int cuentas = 0;
      while (rs.next()) {
        assertTrue(new BCryptPasswordEncoder().matches("demo1234", rs.getString(1)));
        cuentas++;
      }
      assertEquals(5, cuentas);
    }
  }

  private void assertSecuenciasAdelantadas() throws SQLException {
    assertTrue(
        contar("select last_value from usuario_id_seq") >= 9010,
        "la secuencia de usuario debe quedar por encima de los ids demo");
    assertTrue(
        contar("select last_value from negocio_id_seq") >= 8004,
        "la secuencia de negocio debe quedar por encima de los ids demo");
  }

  private String crearBase(String nombre) throws SQLException {
    ejecutar("create database " + nombre);
    return postgres.getJdbcUrl().replace("/" + postgres.getDatabaseName(), "/" + nombre);
  }

  private void ejecutar(String sql) throws SQLException {
    try (Connection c = conectar(postgres.getJdbcUrl());
        Statement s = c.createStatement()) {
      s.execute(sql);
    }
  }

  private int contar(String sql) throws SQLException {
    return contarEn(postgres.getJdbcUrl(), sql);
  }

  private int contarEn(String url, String sql) throws SQLException {
    try (Connection c = conectar(url);
        Statement s = c.createStatement();
        ResultSet rs = s.executeQuery(sql)) {
      rs.next();
      return rs.getInt(1);
    }
  }

  private Connection conectar(String url) throws SQLException {
    return DriverManager.getConnection(url, postgres.getUsername(), postgres.getPassword());
  }

  private static boolean dockerDisponible() {
    try {
      return DockerClientFactory.instance().isDockerAvailable();
    } catch (RuntimeException sinDocker) {
      return false;
    }
  }
}
