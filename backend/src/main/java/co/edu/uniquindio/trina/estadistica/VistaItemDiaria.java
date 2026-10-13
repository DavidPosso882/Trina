package co.edu.uniquindio.trina.estadistica;

import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Contador diario de vistas de un ítem del catálogo (RF-42, diseño §7.7). La clave compuesta
 * (ítem, fecha) permite el ranking del negocio sin guardar una fila por visita. La FK cascadea al
 * borrar el ítem para no bloquear la baja lógica/limpieza.
 */
@Entity
@Table(name = "vista_item_diaria")
public class VistaItemDiaria {

  @EmbeddedId private Clave id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("itemId")
  @JoinColumn(name = "item_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private CatalogoItem item;

  @Column(nullable = false)
  private int contador;

  protected VistaItemDiaria() {}

  public VistaItemDiaria(Long itemId, LocalDate fecha) {
    this.id = new Clave(itemId, fecha);
  }

  public Long getItemId() {
    return id.getItemId();
  }

  public LocalDate getFecha() {
    return id.getFecha();
  }

  public int getContador() {
    return contador;
  }

  /** Clave compuesta (item_id, fecha). */
  @Embeddable
  public static class Clave implements Serializable {

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    protected Clave() {}

    public Clave(Long itemId, LocalDate fecha) {
      this.itemId = itemId;
      this.fecha = fecha;
    }

    public Long getItemId() {
      return itemId;
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
      return Objects.equals(itemId, clave.itemId) && Objects.equals(fecha, clave.fecha);
    }

    @Override
    public int hashCode() {
      return Objects.hash(itemId, fecha);
    }
  }
}
