package co.edu.uniquindio.trina.compartido.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Dataset de demostración (V15): el flag {@code app.seed-demo} (default false) se publica como
 * placeholder de Flyway para que la migración quede aplicada en todos los entornos pero solo
 * inserte filas cuando el flag está encendido. En producción se deja apagado y V15 no hace nada.
 *
 * <p>Se activa con la propiedad/env {@code APP_SEED_DEMO=true} (o {@code -Dapp.seed-demo=true});
 * no vive en application.yml a propósito, igual que lee {@link co.edu.uniquindio.trina.compartido.seed.AdminSeed}.
 */
@Configuration
public class DemoSeedConfig {

  public static final String PLACEHOLDER = "seedDemo";

  @Bean
  FlywayConfigurationCustomizer demoSeedPlaceholder(
      @Value("${app.seed-demo:false}") boolean seedDemo) {
    return configuration ->
        configuration.getPlaceholders().put(PLACEHOLDER, Boolean.toString(seedDemo));
  }
}
