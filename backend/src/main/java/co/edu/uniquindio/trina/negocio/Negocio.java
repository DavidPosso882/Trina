package co.edu.uniquindio.trina.negocio;

import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.persistence.*;

@Entity
@Table(name = "negocio")
public class Negocio {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "propietario_id", nullable = false, unique = true)
  private Usuario propietario;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "categoria_id")
  private CategoriaNegocio categoria;

  @Column(nullable = false)
  private String nombre;

  @Column(columnDefinition = "TEXT")
  private String descripcion;

  private String direccion;

  @Column(precision = 9, scale = 6)
  private java.math.BigDecimal latitud;

  @Column(precision = 9, scale = 6)
  private java.math.BigDecimal longitud;

  private String telefono;
  private String whatsapp;

  @Column(name = "motivo_revision", columnDefinition = "TEXT")
  private String motivoRevision;

  @Column(nullable = false)
  private String estado = "BORRADOR";

  @Column(name = "acepta_pedidos", nullable = false)
  private boolean aceptaPedidos = true;

  @Column(name = "acepta_reservas", nullable = false)
  private boolean aceptaReservas = false;

  /** D-03/RF-26: FRANJA (mesa o servicio por hora) o ALOJAMIENTO (por noches). Default FRANJA. */
  @Column(name = "tipo_reserva", nullable = false)
  private String tipoReserva = "FRANJA";

  /** RF-26/RN-07: reservas activas que se pueden superponer. Default 10. */
  @Column(name = "capacidad_reservas", nullable = false)
  private int capacidadReservas = 10;

  /** RF-26: duración de una franja desde el inicio, en minutos. Default 60. */
  @Column(name = "duracion_reserva_min", nullable = false)
  private int duracionReservaMin = 60;

  /**
   * RF-23 E2: nivel de precio declarado (1 = $, 2 = $$, 3 = $$$). V14 agrega la columna nullable:
   * null significa "sin declarar" y el negocio queda fuera del filtro nivelPrecio. Única edición
   * de esta entidad para la búsqueda avanzada.
   */
  @Column(name = "nivel_precio")
  private Short nivelPrecio;

  protected Negocio() {}

  private Negocio(Usuario propietario, CategoriaNegocio categoria, String nombre, String estado) {
    this.propietario = propietario;
    this.categoria = categoria;
    this.nombre = nombre;
    this.estado = estado;
  }

  public static Negocio borrador(Usuario propietario, CategoriaNegocio categoria, String nombre) {
    return new Negocio(propietario, categoria, nombre, "BORRADOR");
  }

  public static Negocio publicado(Usuario propietario, CategoriaNegocio categoria, String nombre) {
    return new Negocio(propietario, categoria, nombre, "APROBADO");
  }

  public Long getId() {
    return id;
  }

  public String getNombre() {
    return nombre;
  }

  public String getEstado() {
    return estado;
  }

  public String getMotivoRevision() {
    return motivoRevision;
  }

  public CategoriaNegocio getCategoria() {
    return categoria;
  }

  public Usuario getPropietario() {
    return propietario;
  }

  public boolean isAceptaPedidos() {
    return aceptaPedidos;
  }

  /** RF-26: el Cliente solo puede reservar en negocios que acepten reservas. */
  public boolean isAceptaReservas() {
    return aceptaReservas;
  }

  public String getTipoReserva() {
    return tipoReserva;
  }

  public void setTipoReserva(String tipoReserva) {
    this.tipoReserva = tipoReserva;
  }

  public int getCapacidadReservas() {
    return capacidadReservas;
  }

  public void setCapacidadReservas(int capacidadReservas) {
    this.capacidadReservas = capacidadReservas;
  }

  public int getDuracionReservaMin() {
    return duracionReservaMin;
  }

  public void setDuracionReservaMin(int duracionReservaMin) {
    this.duracionReservaMin = duracionReservaMin;
  }

  /** RF-23 E2: nivel de precio declarado; null = sin declarar. Se guarda SMALLINT. */
  public Integer getNivelPrecio() {
    return nivelPrecio == null ? null : (int) nivelPrecio;
  }

  public void setNivelPrecio(Integer nivelPrecio) {
    this.nivelPrecio = nivelPrecio == null ? null : nivelPrecio.shortValue();
  }

  public String getDescripcion() {
    return descripcion;
  }

  public String getDireccion() {
    return direccion;
  }

  public java.math.BigDecimal getLatitud() {
    return latitud;
  }

  public java.math.BigDecimal getLongitud() {
    return longitud;
  }

  public String getTelefono() {
    return telefono;
  }

  public String getWhatsapp() {
    return whatsapp;
  }

  public void setCategoria(CategoriaNegocio categoria) {
    this.categoria = categoria;
  }

  /** Edición del propietario. Tras APROBADO, nombre y categoría quedan bloqueados (D-10). */
  public void actualizar(
      String nombre,
      String descripcion,
      String direccion,
      java.math.BigDecimal latitud,
      java.math.BigDecimal longitud,
      String telefono,
      String whatsapp) {
    if ("APROBADO".equals(estado) && nombre != null && !nombre.equals(this.nombre)) {
      throw new IllegalArgumentException(
          "Para cambiar el nombre de tu negocio, escribinos y lo actualizamos.");
    }
    if (nombre != null) {
      this.nombre = nombre;
    }
    if (descripcion != null) {
      this.descripcion = descripcion;
    }
    if (direccion != null) {
      this.direccion = direccion;
    }
    if (latitud != null) {
      this.latitud = latitud;
    }
    if (longitud != null) {
      this.longitud = longitud;
    }
    if (telefono != null) {
      this.telefono = telefono;
    }
    if (whatsapp != null) {
      this.whatsapp = whatsapp;
    }
  }

  /** RF-07: el Administrador aprueba un negocio PENDIENTE; queda visible en el directorio. */
  public void aprobar() {
    exigirEstado("PENDIENTE");
    this.estado = "APROBADO";
    this.motivoRevision = null;
  }

  /** RF-07: rechazo con motivo obligatorio; el Comerciante corrige y puede reenviar. */
  public void rechazar(String motivo) {
    exigirMotivo(motivo);
    exigirEstado("PENDIENTE");
    this.estado = "RECHAZADO";
    this.motivoRevision = motivo.trim();
  }

  /** RF-07: el Administrador pide ajustes con motivo obligatorio antes de aprobar. */
  public void solicitarCorreccion(String motivo) {
    exigirMotivo(motivo);
    exigirEstado("PENDIENTE");
    this.estado = "CORRECCION_SOLICITADA";
    this.motivoRevision = motivo.trim();
  }

  /** RF-07: suspensión de un negocio APROBADO con motivo obligatorio. */
  public void suspender(String motivo) {
    exigirMotivo(motivo);
    exigirEstado("APROBADO");
    this.estado = "SUSPENDIDO";
    this.motivoRevision = motivo.trim();
  }

  /** RF-07: el Administrador reactiva un negocio SUSPENDIDO; vuelve al directorio. */
  public void reactivar() {
    exigirEstado("SUSPENDIDO");
    this.estado = "APROBADO";
    this.motivoRevision = null;
  }

  private void exigirEstado(String esperado) {
    if (!esperado.equals(estado)) {
      throw new IllegalStateException(
          "Ese cambio no corresponde ahora: el negocio está en " + estado + ".");
    }
  }

  private static void exigirMotivo(String motivo) {
    if (motivo == null || motivo.isBlank()) {
      throw new IllegalArgumentException("Contanos el motivo de esta decisión.");
    }
  }

  /**
   * Envío a revisión RF-06: exige nombre, categoría, descripción, dirección, ubicación, al menos un
   * contacto, al menos una franja de horario configurada (RF-13) y al menos una foto (RF-12).
   */
  public void enviarARevision(boolean tieneHorarios, boolean tieneImagenes) {
    if (nombre == null
        || nombre.isBlank()
        || categoria == null
        || descripcion == null
        || descripcion.isBlank()
        || direccion == null
        || direccion.isBlank()
        || latitud == null
        || longitud == null
        || ((telefono == null || telefono.isBlank()) && (whatsapp == null || whatsapp.isBlank()))) {
      throw new IllegalArgumentException(
          "Falta un paso para publicar: completá datos, ubicación y al menos un contacto.");
    }
    if (!"BORRADOR".equals(estado) && !"RECHAZADO".equals(estado) && !"CORRECCION_SOLICITADA".equals(estado)) {
      throw new IllegalStateException("Este negocio ya está en revisión o publicado.");
    }
    if (!tieneHorarios) {
      throw new IllegalArgumentException("Falta un paso para publicar: configurá tus horarios");
    }
    if (!tieneImagenes) {
      throw new IllegalArgumentException("Falta un paso para publicar: agregá al menos una foto");
    }
    this.estado = "PENDIENTE";
  }
}
