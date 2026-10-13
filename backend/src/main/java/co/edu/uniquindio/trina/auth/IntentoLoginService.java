package co.edu.uniquindio.trina.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Límite de intentos RF-02 E4: 5 fallidos en 15 min por correo y por IP → 429. Implementación en memoria
 * suficiente para un despliegue único; con más réplicas se mueve a Redis/Bucket4j distribuido (ADR
 * pendiente, sin cambiar la API).
 */
@Service
public class IntentoLoginService {

  static final int MAX_FALLOS = 5;
  static final Duration VENTANA = Duration.ofMinutes(15);

  private final ConcurrentHashMap<String, Deque<Instant>> fallos = new ConcurrentHashMap<>();

  public void exigirPermitido(String correoClave, String ipClave) {
    podar(correoClave);
    podar(ipClave);
    if (fallos.getOrDefault(correoClave, new ArrayDeque<>()).size() >= MAX_FALLOS
        || fallos.getOrDefault(ipClave, new ArrayDeque<>()).size() >= MAX_FALLOS) {
      throw new LimiteExcedido("Hiciste varios intentos. Esperá unos minutos y volvé a probar.");
    }
  }

  public void registrarFallo(String correoClave, String ipClave) {
    Instant ahora = Instant.now();
    fallos.computeIfAbsent(correoClave, k -> new ArrayDeque<>()).addLast(ahora);
    fallos.computeIfAbsent(ipClave, k -> new ArrayDeque<>()).addLast(ahora);
    podar(correoClave);
    podar(ipClave);
  }

  public void limpiar(String correoClave, String ipClave) {
    fallos.remove(correoClave);
    fallos.remove(ipClave);
  }

  private void podar(String clave) {
    Deque<Instant> cola = fallos.get(clave);
    if (cola == null) {
      return;
    }
    Instant corte = Instant.now().minus(VENTANA);
    while (!cola.isEmpty() && cola.peekFirst().isBefore(corte)) {
      cola.pollFirst();
    }
    if (cola.isEmpty()) {
      fallos.remove(clave);
    }
  }

  public static class LimiteExcedido extends RuntimeException {
    public LimiteExcedido(String mensaje) {
      super(mensaje);
    }
  }
}
