package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.negocio.ParametroSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

/** RF-45: actualización de valor de parametro_sistema (la entidad no expone setter). */
public interface AdminParametroRepository extends JpaRepository<ParametroSistema, String> {

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("update ParametroSistema p set p.valor = :valor where p.clave = :clave")
  int actualizarValor(String clave, String valor);
}
