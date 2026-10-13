package co.edu.uniquindio.trina.negocio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Parámetros de sistema (semillas V1): acá viven {@code max_imagenes} y {@code max_mb_imagen}
 * que usa RF-12. La entidad es de solo lectura para este slice.
 */
@Entity
@Table(name = "parametro_sistema")
public class ParametroSistema {

  @Id
  @Column(length = 80)
  private String clave;

  @Column(nullable = false, length = 200)
  private String valor;

  @Column(length = 300)
  private String descripcion;

  protected ParametroSistema() {}

  public String getClave() {
    return clave;
  }

  public String getValor() {
    return valor;
  }

  public String getDescripcion() {
    return descripcion;
  }
}
