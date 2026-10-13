package co.edu.uniquindio.trina.catalogo;

import co.edu.uniquindio.trina.negocio.Negocio;
import jakarta.persistence.*;

/** Categoría interna del catálogo (RF-18). Pertenece a un negocio; el orden define la agrupación. */
@Entity
@Table(name = "catalogo_categoria")
public class CatalogoCategoria {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @Column(nullable = false)
  private String nombre;

  @Column(nullable = false)
  private int orden = 0;

  protected CatalogoCategoria() {}

  public CatalogoCategoria(Negocio negocio, String nombre, int orden) {
    this.negocio = negocio;
    this.nombre = nombre;
    this.orden = orden;
  }

  public Long getId() {
    return id;
  }

  public Negocio getNegocio() {
    return negocio;
  }

  public String getNombre() {
    return nombre;
  }

  public int getOrden() {
    return orden;
  }

  public void actualizar(String nombre, int orden) {
    this.nombre = nombre;
    this.orden = orden;
  }
}
