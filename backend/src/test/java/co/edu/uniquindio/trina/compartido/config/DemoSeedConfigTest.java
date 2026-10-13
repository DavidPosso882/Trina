package co.edu.uniquindio.trina.compartido.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

/** El flag app.seed-demo viaja a V15 como placeholder: encendido carga demo, apagado no. */
class DemoSeedConfigTest {

  private final DemoSeedConfig config = new DemoSeedConfig();

  @Test
  void conFlagApagadoElPlaceholderQuedaEnFalse() {
    var flyway = Flyway.configure();

    config.demoSeedPlaceholder(false).customize(flyway);

    assertEquals("false", flyway.getPlaceholders().get(DemoSeedConfig.PLACEHOLDER));
  }

  @Test
  void conFlagEncendidoElPlaceholderQuedaEnTrue() {
    var flyway = Flyway.configure();

    config.demoSeedPlaceholder(true).customize(flyway);

    assertEquals("true", flyway.getPlaceholders().get(DemoSeedConfig.PLACEHOLDER));
  }
}
