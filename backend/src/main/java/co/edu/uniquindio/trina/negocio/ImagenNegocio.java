package co.edu.uniquindio.trina.negocio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Fotografía de un negocio (RF-12): acá solo viven las claves; los bytes quedan en MinIO (RNF-05).
 * {@code principal} marca la que se muestra primero y {@code orden} define el resto del carrusel.
 */
@Entity
@Table(name = "imagen_negocio")
public class ImagenNegocio {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @Column(name = "clave_objeto", nullable = false, unique = true)
  private String claveObjeto;

  @Column(name = "clave_miniatura", nullable = false)
  private String claveMiniatura;

  @Column(nullable = false)
  private boolean principal;

  @Column(nullable = false)
  private int orden;

  protected ImagenNegocio() {}

  private ImagenNegocio(
      Negocio negocio, String claveObjeto, String claveMiniatura, boolean principal, int orden) {
    this.negocio = negocio;
    this.claveObjeto = claveObjeto;
    this.claveMiniatura = claveMiniatura;
    this.principal = principal;
    this.orden = orden;
  }

  public static ImagenNegocio nueva(
      Negocio negocio, String claveObjeto, String claveMiniatura, boolean principal, int orden) {
    return new ImagenNegocio(negocio, claveObjeto, claveMiniatura, principal, orden);
  }

  public Long getId() {
    return id;
  }

  public String getClaveObjeto() {
    return claveObjeto;
  }

  public String getClaveMiniatura() {
    return claveMiniatura;
  }

  public boolean esPrincipal() {
    return principal;
  }

  public int getOrden() {
    return orden;
  }

  public void marcarPrincipal(boolean principal) {
    this.principal = principal;
  }

  public void setOrden(int orden) {
    this.orden = orden;
  }
}
