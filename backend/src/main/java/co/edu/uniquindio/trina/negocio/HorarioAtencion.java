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
import java.time.LocalTime;

/** Franja de atención de un negocio (RF-13). {@code diaSemana} usa ISO: 1 lunes … 7 domingo. */
@Entity
@Table(name = "horario_atencion")
public class HorarioAtencion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "negocio_id", nullable = false)
  private Negocio negocio;

  @Column(name = "dia_semana", nullable = false)
  private short diaSemana;

  @Column(nullable = false)
  private LocalTime abre;

  @Column(nullable = false)
  private LocalTime cierra;

  protected HorarioAtencion() {}

  public HorarioAtencion(Negocio negocio, int diaSemana, LocalTime abre, LocalTime cierra) {
    this.negocio = negocio;
    this.diaSemana = (short) diaSemana;
    this.abre = abre;
    this.cierra = cierra;
  }

  public Long getId() {
    return id;
  }

  public Negocio getNegocio() {
    return negocio;
  }

  /** ISO-8601: 1 lunes … 7 domingo. */
  public int getDiaSemana() {
    return diaSemana;
  }

  public LocalTime getAbre() {
    return abre;
  }

  public LocalTime getCierra() {
    return cierra;
  }

  /** RF-13: una franja con cierre menor o igual a la apertura cruza la medianoche. */
  public boolean cruzaMedianoche() {
    return !cierra.isAfter(abre);
  }
}
