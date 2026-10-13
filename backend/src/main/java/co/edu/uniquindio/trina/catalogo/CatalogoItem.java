package co.edu.uniquindio.trina.catalogo;

import co.edu.uniquindio.trina.negocio.Negocio;
import jakarta.persistence.*;

/**
 * Ítem del catálogo (RF-15/RF-16): producto o servicio con precio entero en COP. La baja es lógica
 * (activo = false) y "no disponible" lo deja visible pero no pedible.
 */
@Entity
@Table(name = "catalogo_item")
public class CatalogoItem {

  public static final String PRODUCTO = "producto";
  public static final String SERVICIO = "servicio";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "catalogo_categoria_id")
  private CatalogoCategoria categoria;

  @Column(nullable = false)
  private String tipo = PRODUCTO;

  @Column(nullable = false)
  private String nombre;

  @Column(columnDefinition = "TEXT")
  private String descripcion;

  @Column(name = "precio_cop", nullable = false)
  private int precioCop;

  @Column(name = "clave_imagen")
  private String claveImagen;

  @Column(nullable = false)
  private boolean disponible = true;

  @Column(nullable = false)
  private boolean destacado = false;

  @Column(nullable = false)
  private boolean activo = true;

  protected CatalogoItem() {}

  public static CatalogoItem crear(
      Negocio negocio,
      CatalogoCategoria categoria,
      String tipo,
      String nombre,
      String descripcion,
      int precioCop,
      String claveImagen) {
    var item = new CatalogoItem();
    item.negocio = negocio;
    item.categoria = categoria;
    item.tipo = SERVICIO.equals(tipo) ? SERVICIO : PRODUCTO;
    item.nombre = nombre;
    item.descripcion = descripcion;
    item.precioCop = precioCop;
    item.claveImagen = claveImagen;
    return item;
  }

  public void actualizar(
      CatalogoCategoria categoria,
      String tipo,
      String nombre,
      String descripcion,
      int precioCop,
      String claveImagen) {
    this.categoria = categoria;
    this.tipo = SERVICIO.equals(tipo) ? SERVICIO : PRODUCTO;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precioCop = precioCop;
    this.claveImagen = claveImagen;
  }

  public void cambiarDisponibilidad(boolean disponible) {
    this.disponible = disponible;
  }

  public void darDeBaja() {
    this.activo = false;
  }

  public void quitarCategoria() {
    this.categoria = null;
  }

  public Long getId() {
    return id;
  }

  public Negocio getNegocio() {
    return negocio;
  }

  public CatalogoCategoria getCategoria() {
    return categoria;
  }

  public String getTipo() {
    return tipo;
  }

  public String getNombre() {
    return nombre;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public int getPrecioCop() {
    return precioCop;
  }

  public String getClaveImagen() {
    return claveImagen;
  }

  public boolean isDisponible() {
    return disponible;
  }

  public boolean isDestacado() {
    return destacado;
  }

  public boolean isActivo() {
    return activo;
  }
}
