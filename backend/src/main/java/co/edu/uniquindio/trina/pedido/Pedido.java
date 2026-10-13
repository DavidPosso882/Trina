package co.edu.uniquindio.trina.pedido;

import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Pedido para recoger (RF-25, RF-27, RF-31). La fábrica {@link #crear} copia nombre y precio
 * vigentes de cada ítem (RN-03) y calcula el total. Los estados y transiciones siguen el SRS §5.1:
 * EN_LOCAL nace PENDIENTE y SANDBOX nace PENDIENTE_PAGO hasta que el pago sandbox lo apruebe
 * (RF-28) o venza el plazo de 30 minutos.
 */
@Entity
@Table(name = "pedido")
public class Pedido {

  public static final String PENDIENTE_PAGO = "PENDIENTE_PAGO";
  public static final String PENDIENTE = "PENDIENTE";
  public static final String EN_PREPARACION = "EN_PREPARACION";
  public static final String LISTO = "LISTO";
  public static final String COMPLETADO = "COMPLETADO";
  public static final String RECHAZADO = "RECHAZADO";
  public static final String CANCELADO = "CANCELADO";

  public static final String SANDBOX = "SANDBOX";
  public static final String EN_LOCAL = "EN_LOCAL";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "cliente_id", nullable = false)
  private Usuario cliente;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @Column(nullable = false)
  private String estado;

  @Column(name = "metodo_pago", nullable = false)
  private String metodoPago;

  @Column(name = "total_cop", nullable = false)
  private int totalCop;

  @Column(columnDefinition = "TEXT")
  private String nota;

  @Column(columnDefinition = "TEXT")
  private String motivo;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn = Instant.now();

  @OneToMany(
      mappedBy = "pedido",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  @OrderBy("id ASC")
  private List<PedidoItem> items = new ArrayList<>();

  protected Pedido() {}

  /** Línea del carrito ya validada por el servicio: ítem vigente y cantidad pedida. */
  public record Linea(CatalogoItem item, int cantidad) {}

  /**
   * Crea el pedido con copia de nombre y precio de cada ítem (RN-03) y total calculado. La
   * validación de negocio aprobado, ítems activos, disponibles y del mismo negocio la hace el
   * servicio antes de llamar acá.
   */
  public static Pedido crear(
      Usuario cliente, Negocio negocio, String metodoPago, String nota, List<Linea> lineas) {
    if (!SANDBOX.equals(metodoPago) && !EN_LOCAL.equals(metodoPago)) {
      throw new IllegalArgumentException("Elegí cómo vas a pagar el pedido.");
    }
    if (lineas == null || lineas.isEmpty()) {
      throw new IllegalArgumentException("El pedido tiene que tener al menos un ítem.");
    }
    var pedido = new Pedido();
    pedido.cliente = cliente;
    pedido.negocio = negocio;
    pedido.metodoPago = metodoPago;
    pedido.nota = limpiar(nota);
    // RF-25: en el local se paga al recoger (PENDIENTE); en línea espera el pago (PENDIENTE_PAGO).
    pedido.estado = EN_LOCAL.equals(metodoPago) ? PENDIENTE : PENDIENTE_PAGO;
    for (var linea : lineas) {
      if (linea.cantidad() <= 0) {
        throw new IllegalArgumentException("La cantidad tiene que ser mayor que cero.");
      }
      pedido.items.add(PedidoItem.crear(pedido, linea.item(), linea.cantidad()));
      pedido.totalCop += linea.item().getPrecioCop() * linea.cantidad();
    }
    return pedido;
  }

  // ---- Transiciones (§5.1) ----

  /** RF-27: el Comerciante acepta; PENDIENTE → EN_PREPARACION. */
  public void aceptar() {
    exigirEstado(PENDIENTE);
    this.estado = EN_PREPARACION;
  }

  /** RF-27: rechazo con motivo obligatorio; PENDIENTE → RECHAZADO. */
  public void rechazar(String motivo) {
    exigirEstado(PENDIENTE);
    exigirMotivo(motivo);
    this.estado = RECHAZADO;
    this.motivo = motivo.trim();
  }

  /** RF-27: EN_PREPARACION → LISTO. */
  public void marcarListo() {
    exigirEstado(EN_PREPARACION);
    this.estado = LISTO;
  }

  /** RF-27: LISTO → COMPLETADO (si era EN_LOCAL, acá se cobra en el local). */
  public void completar() {
    exigirEstado(LISTO);
    this.estado = COMPLETADO;
  }

  /** RF-28 E1: el pago aprobado mueve PENDIENTE_PAGO → PENDIENTE. */
  public void pagar() {
    exigirEstado(PENDIENTE_PAGO);
    this.estado = PENDIENTE;
  }

  /** RF-28 E5: vencidos los 30 minutos sin pagar, PENDIENTE_PAGO → CANCELADO. */
  public void expirarPago() {
    exigirEstado(PENDIENTE_PAGO);
    this.estado = CANCELADO;
    this.motivo = "Pasaron más de 30 minutos sin completar el pago.";
  }

  /** §5.1: el Cliente cancela su pedido mientras sigue PENDIENTE o PENDIENTE_PAGO. */
  public void cancelar() {
    if (!PENDIENTE.equals(estado) && !PENDIENTE_PAGO.equals(estado)) {
      throw new IllegalStateException(
          "Ese cambio no corresponde ahora: el pedido está en " + estado + ".");
    }
    this.estado = CANCELADO;
  }

  /** §5.1: el Comerciante cancela un pedido EN_PREPARACION con motivo obligatorio. */
  public void cancelar(String motivo) {
    exigirEstado(EN_PREPARACION);
    exigirMotivo(motivo);
    this.estado = CANCELADO;
    this.motivo = motivo.trim();
  }

  private void exigirEstado(String esperado) {
    if (!esperado.equals(estado)) {
      throw new IllegalStateException(
          "Ese cambio no corresponde ahora: el pedido está en " + estado + ".");
    }
  }

  private static void exigirMotivo(String motivo) {
    if (motivo == null || motivo.isBlank()) {
      throw new IllegalArgumentException("Contanos el motivo de esta decisión.");
    }
  }

  private static String limpiar(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  // ---- Lectura ----

  public Long getId() {
    return id;
  }

  public Usuario getCliente() {
    return cliente;
  }

  public Negocio getNegocio() {
    return negocio;
  }

  public String getEstado() {
    return estado;
  }

  public String getMetodoPago() {
    return metodoPago;
  }

  public int getTotalCop() {
    return totalCop;
  }

  public String getNota() {
    return nota;
  }

  public String getMotivo() {
    return motivo;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }

  /** Solo pruebas: simula que el pedido se creó hace tiempo (RF-28 E5). */
  public void ajustarCreadoEn(Instant momento) {
    if (momento != null) {
      this.creadoEn = momento;
    }
  }

  public List<PedidoItem> getItems() {
    return items;
  }
}
