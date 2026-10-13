package co.edu.uniquindio.trina.pago;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** D-08: el simulador interno cuelga del puerto para poder reemplazarlo por un sandbox externo. */
@Configuration
public class PagoConfig {

  @Bean
  PagoPorts.PaymentGatewayPort pagoGatewayPort() {
    return new PagoPorts.SimuladorPagoGateway();
  }
}
