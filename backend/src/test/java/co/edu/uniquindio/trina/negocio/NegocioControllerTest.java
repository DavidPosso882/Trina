package co.edu.uniquindio.trina.negocio;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** RED: directorio público RF-08 — solo APROBADO, 404 para lo no publicado. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NegocioControllerTest {

  @Autowired MockMvc mvc;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository categorias;
  @Autowired NegocioRepository negocios;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired ImagenNegocioRepository imagenes;
  @Autowired PasswordEncoder claves;

  private Negocio aprobado;
  private Negocio pendiente;

  @BeforeEach
  void sembrar() {
    imagenes.deleteAll();
    horarios.deleteAll();
    negocios.deleteAll();
    categorias.deleteAll();
    usuarios.deleteAll();
    var cat = categorias.save(new CategoriaNegocio("Cafés"));
    var dueno1 =
        usuarios.save(new Usuario("a@trina.co", claves.encode("clave1234"), "A", "COMERCIANTE"));
    var dueno2 =
        usuarios.save(new Usuario("b@trina.co", claves.encode("clave1234"), "B", "COMERCIANTE"));
    aprobado = negocios.save(Negocio.publicado(dueno1, cat, "Café Plaza"));
    pendiente = negocios.save(Negocio.borrador(dueno2, cat, "Café Oculto"));
  }

  @Test
  void listaSoloAprobados() throws Exception {
    mvc.perform(get("/api/v1/negocios"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.contenido[0].nombre").value("Café Plaza"));
  }

  @Test
  void perfilNoPublicadoDa404() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + pendiente.getId())).andExpect(status().isNotFound());
  }

  @Test
  void perfilAprobadoSeVe() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + aprobado.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value("Café Plaza"));
  }

  @Test
  void buscaSinTildes() throws Exception {
    mvc.perform(get("/api/v1/negocios").param("q", "cafe"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1));
  }
}
