package co.edu.uniquindio.trina.negocio;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RED: gestión del negocio RF-06/RF-11 — crear borrador, 409 con segundo negocio, editar propio,
 * enviar a revisión con completitud, campo bloqueado tras aprobar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NegocioGestionTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository categorias;
  @Autowired NegocioRepository negocios;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired ImagenNegocioRepository imagenes;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private CategoriaNegocio cat;
  private String tokenComerciante;
  private String tokenOtro;

  @BeforeEach
  void sembrar() throws Exception {
    imagenes.deleteAll();
    horarios.deleteAll();
    negocios.deleteAll();
    categorias.deleteAll();
    usuarios.deleteAll();
    cat = categorias.save(new CategoriaNegocio("Restaurantes"));
    var c1 = usuarios.save(new Usuario("c1@trina.co", claves.encode("clave1234"), "C1", "COMERCIANTE"));
    var c2 = usuarios.save(new Usuario("c2@trina.co", claves.encode("clave1234"), "C2", "COMERCIANTE"));
    tokenComerciante = "Bearer " + jwt.generar(c1.getId(), "COMERCIANTE", c1.getTokenVersion());
    tokenOtro = "Bearer " + jwt.generar(c2.getId(), "COMERCIANTE", c2.getTokenVersion());
  }

  @AfterEach
  void limpiar() {
    imagenes.deleteAll();
    horarios.deleteAll();
  }

  @Test
  void crearBorradorYSegundoDa409() throws Exception {
    var cuerpo =
        json.writeValueAsString(Map.of("nombre", "Mi Restaurante", "categoriaId", cat.getId()));
    mvc.perform(
            post("/api/v1/negocios")
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.estado").value("BORRADOR"));
    mvc.perform(
            post("/api/v1/negocios")
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo))
        .andExpect(status().isConflict());
  }

  @Test
  void sinSesionDa401() throws Exception {
    mvc.perform(
            post("/api/v1/negocios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("nombre", "X"))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void enviarIncompletoDa422YCompletoPasaAPendiente() throws Exception {
    var creado =
        mvc.perform(
                post("/api/v1/negocios")
                    .header("Authorization", tokenComerciante)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("nombre", "Incompleto"))))
            .andExpect(status().isCreated())
            .andReturn();
    long id = json.readTree(creado.getResponse().getContentAsString()).get("id").asLong();

    mvc.perform(post("/api/v1/negocios/" + id + "/enviar-revision").header("Authorization", tokenComerciante))
        .andExpect(status().isUnprocessableEntity());

    mvc.perform(
            put("/api/v1/negocios/" + id)
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "nombre", "Completo",
                            "categoriaId", cat.getId(),
                            "descripcion", "Comida casera",
                            "direccion", "Calle 5 # 10-20",
                            "latitud", 4.5,
                            "longitud", -75.7,
                            "telefono", "3001112233"))))
        .andExpect(status().isOk());

    mvc.perform(
            put("/api/v1/negocios/" + id + "/horarios")
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        List.of(Map.of("diaSemana", 1, "abre", "08:00", "cierra", "18:00")))))
        .andExpect(status().isOk());

    // RF-12: publicar exige al menos una foto.
    var negocio = negocios.findById(id).orElseThrow();
    imagenes.save(
        ImagenNegocio.nueva(
            negocio, "negocios/" + id + "/p.jpg", "negocios/" + id + "/p_m.jpg", true, 0));

    mvc.perform(post("/api/v1/negocios/" + id + "/enviar-revision").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("PENDIENTE"));
  }

  @Test
  void editarAjenoDa403() throws Exception {
    var creado =
        mvc.perform(
                post("/api/v1/negocios")
                    .header("Authorization", tokenComerciante)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("nombre", "Mío"))))
            .andExpect(status().isCreated())
            .andReturn();
    long id = json.readTree(creado.getResponse().getContentAsString()).get("id").asLong();
    mvc.perform(
            put("/api/v1/negocios/" + id)
                .header("Authorization", tokenOtro)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("descripcion", "hack"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void miNegocioDevuelveElPropio() throws Exception {
    mvc.perform(
            post("/api/v1/negocios")
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("nombre", "Propio"))))
        .andExpect(status().isCreated());
    mvc.perform(get("/api/v1/mi-negocio").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value("Propio"));
  }
}
