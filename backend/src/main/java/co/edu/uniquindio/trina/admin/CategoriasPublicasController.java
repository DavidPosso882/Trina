package co.edu.uniquindio.trina.admin;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * RF-44: categorías públicas (solo activas). Vive en admin porque comparte el servicio con el ABM,
 * pero el endpoint es abierto (permitAll en SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/categorias")
public class CategoriasPublicasController {

  private final AdminCategoriaService servicio;

  public CategoriasPublicasController(AdminCategoriaService servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<AdminCategoriaDto.CategoriaRespuesta> listar() {
    return servicio.publicas();
  }
}
