package co.edu.uniquindio.trina.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecuperacionClaveRepository extends JpaRepository<RecuperacionClave, Long> {
  Optional<RecuperacionClave> findByTokenHash(String tokenHash);
}
