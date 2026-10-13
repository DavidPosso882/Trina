package co.edu.uniquindio.trina.negocio;

import jakarta.persistence.*;

@Entity
@Table(name = "categoria_negocio")
public class CategoriaNegocio {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String nombre;

  private String icono;

  @Column(nullable = false)
  private boolean activa = true;

  @Column(nullable = false)
  private int orden = 0;

  protected CategoriaNegocio() {}

  public CategoriaNegocio(String nombre) {
    this.nombre = nombre;
  }

  public Long getId() {
    return id;
  }

  public String getNombre() {
    return nombre;
  }

  public boolean isActiva() {
    return activa;
  }
}
