package co.edu.uniquindio.trina.catalogo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Foto de la galería de un producto del catálogo (hasta 5 por ítem). La foto principal vive en
 * {@code catalogo_item.clave_imagen}; acá van las adicionales en orden de exhibición.
 */
@Entity
@Table(name = "imagen_catalogo_item")
public class ImagenCatalogoItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "item_id", nullable = false)
  private CatalogoItem item;

  @Column(name = "clave", nullable = false, unique = true)
  private String clave;

  @Column(name = "orden", nullable = false)
  private int orden;

  protected ImagenCatalogoItem() {}

  private ImagenCatalogoItem(CatalogoItem item, String clave, int orden) {
    this.item = item;
    this.clave = clave;
    this.orden = orden;
  }

  public static ImagenCatalogoItem nueva(CatalogoItem item, String clave, int orden) {
    return new ImagenCatalogoItem(item, clave, orden);
  }

  public Long getId() {
    return id;
  }

  public CatalogoItem getItem() {
    return item;
  }

  public String getClave() {
    return clave;
  }

  public int getOrden() {
    return orden;
  }
}
