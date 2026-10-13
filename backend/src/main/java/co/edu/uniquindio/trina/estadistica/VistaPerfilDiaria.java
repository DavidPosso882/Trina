package co.edu.uniquindio.trina.estadistica;

import co.edu.uniquindio.trina.negocio.Negocio;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Contador diario de visitas al perfil de un negocio (RF-40, diseño §7.7). La clave compuesta
 * (negocio, fecha) y el upsert nativo evitan que la tabla crezca por visita; la fecha se calcula
 * en {@code America/Bogota}. La FK cascadea al borrar el negocio para no bloquear la baja.
 */
@Entity
@Table(name = "vista_perfil_diaria")
public class VistaPerfilDiaria {

  @EmbeddedId private Clave id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("negocioId")
  @JoinColumn(name = "negocio_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Negocio negocio;

  @Column(nullable = false)
  private int contador;

  protected VistaPerfilDiaria() {}

  public VistaPerfilDiaria(Long negocioId, LocalDate fecha) {
    this.id = new Clave(negocioId, fecha);
  }

  public Long getNegocioId() {
    return id.getNegocioId();
  }

  public LocalDate getFecha() {
    return id.getFecha();
  }

  public int getContador() {
    return contador;
  }

  /** Clave compuesta (negocio_id, fecha). */
  @Embeddable
  public static class Clave implements Serializable {

    @Column(name = "negocio_id", nullable = false)
    private Long negocioId;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    protected Clave() {}

    public Clave(Long negocioId, LocalDate fecha) {
      this.negocioId = negocioId;
      this.fecha = fecha;
    }

    public Long getNegocioId() {
      return negocioId;
    }

    public LocalDate getFecha() {
      return fecha;
    }

    @Override
    public boolean equals(Object otro) {
      if (this == otro) {
        return true;
      }
      if (!(otro instanceof Clave clave)) {
        return false;
      }
      return Objects.equals(negocioId, clave.negocioId) && Objects.equals(fecha, clave.fecha);
    }

    @Override
    public int hashCode() {
      return Objects.hash(negocioId, fecha);
    }
  }
}
