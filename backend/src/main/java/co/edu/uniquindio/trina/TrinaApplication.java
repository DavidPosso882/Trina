package co.edu.uniquindio.trina;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Punto de entrada del monolito modular TRINA. */
@SpringBootApplication
@EnableScheduling
public class TrinaApplication {
  public static void main(String[] args) {
    SpringApplication.run(TrinaApplication.class, args);
  }
}
