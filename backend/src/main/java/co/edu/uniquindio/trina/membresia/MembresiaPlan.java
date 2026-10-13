package co.edu.uniquindio.trina.membresia;

import jakarta.persistence.*;

/**
 * Plan de membresía (RF-33). BASICA es gratuita y siempre está disponible; DESTACADA es el pago
 * mensual con tope de ítems destacados. El precio demo se siembra en V7 (P-02).
 */
@Entity
@Table(name = "membresia_plan")
public class MembresiaPlan {

  public static final String BASICA = "BASICA";
  public static final String DESTACADA = "DESTACADA";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String codigo;

  @Column(nullable = false)
  private String nombre;

  @Column(name = "precio_mensual_cop", nullable = false)
  private int precioMensualCop;

  @Column(name = "max_destacados", nullable = false)
  private int maxDestacados;

  @Column(nullable = false)
  private boolean activo = true;

  protected MembresiaPlan() {}

  public MembresiaPlan(
      String codigo, String nombre, int precioMensualCop, int maxDestacados, boolean activo) {
    this.codigo = codigo;
    this.nombre = nombre;
    this.precioMensualCop = precioMensualCop;
    this.maxDestacados = maxDestacados;
    this.activo = activo;
  }

  public Long getId() {
    return id;
  }

  public String getCodigo() {
    return codigo;
  }

  public String getNombre() {
    return nombre;
  }

  public int getPrecioMensualCop() {
    return precioMensualCop;
  }

  public int getMaxDestacados() {
    return maxDestacados;
  }

  public boolean isActivo() {
    return activo;
  }
}
