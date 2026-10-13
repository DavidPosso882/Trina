package co.edu.uniquindio.trina.pago;

import co.edu.uniquindio.trina.pedido.Pedido;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Pago simulado por pedido o membresía (RF-28/RF-29). Sigue el ciclo §5.1: INICIADO → APROBADO o
 * RECHAZADO; APROBADO → REEMBOLSADO. Nunca se almacena el PAN: solo marca y últimos 4 dígitos.
 */
@Entity
@Table(
    name = "pago",
    uniqueConstraints =
        @UniqueConstraint(
            name = "pago_clave_idempotencia_uk",
            columnNames = "clave_idempotencia"))
public class Pago {

  public static final String INICIADO = "INICIADO";
  public static final String APROBADO = "APROBADO";
  public static final String RECHAZADO = "RECHAZADO";
  public static final String REEMBOLSADO = "REEMBOLSADO";
  public static final String SIMULADOR = "SIMULADOR";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "pedido_id")
  private Pedido pedido;

  @Column(name = "suscripcion_id")
  private Long suscripcionId;

  @Column(nullable = false)
  private String proveedor = SIMULADOR;

  @Column(nullable = false)
  private String estado = INICIADO;

  @Column(name = "monto_cop", nullable = false)
  private int montoCop;

  @Column(name = "comision_cop", nullable = false)
  private int comisionCop;

  @Column(name = "neto_cop", nullable = false)
  private int netoCop;

  private String referencia;

  @Column(name = "marca_tarjeta")
  private String marcaTarjeta;

  @Column(name = "ultimos4", length = 4)
  private String ultimos4;

  @Column(name = "clave_idempotencia", nullable = false, length = 120)
  private String claveIdempotencia;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn = Instant.now();

  protected Pago() {}

  /** Inicia el cobro con el total congelado del pedido y los datos enmascarados de la tarjeta. */
  public static Pago iniciar(Pedido pedido, String tarjetaPan, String claveIdempotencia) {
    String digitos = exigirPan(tarjetaPan);
    var pago = new Pago();
    pago.pedido = pedido;
    pago.montoCop = pedido.getTotalCop();
    pago.netoCop = pedido.getTotalCop();
    pago.claveIdempotencia = claveIdempotencia;
    enmascararTarjeta(pago, digitos);
    return pago;
  }

  /**
   * RF-34: inicia el cobro del precio mensual de una suscripción. La comisión de pedido (RN-06) no
   * aplica: el monto completo entra como neto del plan.
   */
  public static Pago iniciarSuscripcion(
      Long suscripcionId, int montoCop, String tarjetaPan, String claveIdempotencia) {
    String digitos = exigirPan(tarjetaPan);
    var pago = new Pago();
    pago.suscripcionId = suscripcionId;
    pago.montoCop = montoCop;
    pago.netoCop = montoCop;
    pago.claveIdempotencia = claveIdempotencia;
    enmascararTarjeta(pago, digitos);
    return pago;
  }

  private static void enmascararTarjeta(Pago pago, String digitos) {
    pago.marcaTarjeta =
        switch (digitos.charAt(0)) {
          case '4' -> "VISA";
          case '5' -> "MASTERCARD";
          case '3' -> "AMEX";
          default -> "GENERICA";
        };
    pago.ultimos4 = digitos.substring(digitos.length() - 4);
  }

  /** RN-06: registra la comisión aprobada y el neto del Comerciante. */
  public void aprobar(String referencia, int comisionCop) {
    exigirEstado(INICIADO);
    this.estado = APROBADO;
    this.referencia = referencia;
    this.comisionCop = comisionCop;
    this.netoCop = montoCop - comisionCop;
  }

  /** RF-28 E2: el pedido queda PENDIENTE_PAGO para reintentar con otra clave. */
  public void rechazar() {
    exigirEstado(INICIADO);
    this.estado = RECHAZADO;
    this.comisionCop = 0;
    this.netoCop = montoCop;
  }

  /** RN-06: el reembolso revierte la comisión. */
  public void reembolsar() {
    exigirEstado(APROBADO);
    this.estado = REEMBOLSADO;
    this.comisionCop = 0;
    this.netoCop = montoCop;
  }

  private void exigirEstado(String esperado) {
    if (!esperado.equals(estado)) {
      throw new IllegalStateException(
          "Ese cambio no corresponde ahora: el pago está en " + estado + ".");
    }
  }

  /** Valida el PAN de prueba y devuelve solo sus dígitos (sin espacios ni guiones). */
  private static String exigirPan(String tarjetaPan) {
    if (tarjetaPan == null || tarjetaPan.isBlank()) {
      throw new IllegalArgumentException("Ingresá el número de la tarjeta.");
    }
    String digitos = tarjetaPan.replaceAll("[\\s-]", "");
    if (!digitos.matches("\\d{13,19}")) {
      throw new IllegalArgumentException("El número de la tarjeta no es válido.");
    }
    return digitos;
  }

  public Long getId() {
    return id;
  }

  public Pedido getPedido() {
    return pedido;
  }

  public Long getSuscripcionId() {
    return suscripcionId;
  }

  public String getProveedor() {
    return proveedor;
  }

  public String getEstado() {
    return estado;
  }

  public int getMontoCop() {
    return montoCop;
  }

  public int getComisionCop() {
    return comisionCop;
  }

  public int getNetoCop() {
    return netoCop;
  }

  public String getReferencia() {
    return referencia;
  }

  public String getMarcaTarjeta() {
    return marcaTarjeta;
  }

  public String getUltimos4() {
    return ultimos4;
  }

  public String getClaveIdempotencia() {
    return claveIdempotencia;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }
}
