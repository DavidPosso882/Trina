package co.edu.uniquindio.trina.pedido;

import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import jakarta.persistence.*;

/**
 * Línea del pedido (RN-03): guarda copia del nombre y del precio vigentes al crear el pedido, para
 * que un cambio posterior del catálogo no altere lo pactado. La referencia al ítem es nullable
 * porque el ítem puede darse de baja (baja lógica) sin borrar la línea.
 */
@Entity
@Table(name = "pedido_item")
public class PedidoItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "pedido_id", nullable = false)
  private Pedido pedido;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "catalogo_item_id")
  private CatalogoItem catalogoItem;

  @Column(name = "nombre_copia", nullable = false)
  private String nombreCopia;

  @Column(name = "precio_unitario_cop", nullable = false)
  private int precioUnitarioCop;

  @Column(nullable = false)
  private int cantidad;

  protected PedidoItem() {}

  /** Copia nombre y precio del ítem vigente. La cantidad se valida en {@link Pedido#crear}. */
  static PedidoItem crear(Pedido pedido, CatalogoItem catalogoItem, int cantidad) {
    var linea = new PedidoItem();
    linea.pedido = pedido;
    linea.catalogoItem = catalogoItem;
    linea.nombreCopia = catalogoItem.getNombre();
    linea.precioUnitarioCop = catalogoItem.getPrecioCop();
    linea.cantidad = cantidad;
    return linea;
  }

  public Long getId() {
    return id;
  }

  public CatalogoItem getCatalogoItem() {
    return catalogoItem;
  }

  public String getNombreCopia() {
    return nombreCopia;
  }

  public int getPrecioUnitarioCop() {
    return precioUnitarioCop;
  }

  public int getCantidad() {
    return cantidad;
  }
}
