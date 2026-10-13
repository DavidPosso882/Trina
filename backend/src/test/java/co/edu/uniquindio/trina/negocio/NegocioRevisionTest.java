package co.edu.uniquindio.trina.negocio;

import static org.hamcrest.Matchers.nullValue;
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
import org.springframework.test.web.servlet.ResultActions;

/**
 * RED: revisión de negocios por el Administrador (RF-07) — cola por estado, aprobar, rechazar con
 * motivo, solicitar corrección, suspender/reactivar, autorización y códigos §5.9.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NegocioRevisionTest {

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
  private String tokenAdmin;

  @BeforeEach
  void sembrar() {
    imagenes.deleteAll();
    horarios.deleteAll();
    negocios.deleteAll();
    categorias.deleteAll();
    usuarios.deleteAll();
    cat = categorias.save(new CategoriaNegocio("Restaurantes"));
    var comerciante =
        usuarios.save(
            new Usuario("comerciante@trina.co", claves.encode("clave1234"), "Comerciante", "COMERCIANTE"));
    var admin =
        usuarios.save(new Usuario("admin@trina.co", claves.encode("clave1234"), "Admin", "ADMINISTRADOR"));
    tokenComerciante =
        "Bearer " + jwt.generar(comerciante.getId(), "COMERCIANTE", comerciante.getTokenVersion());
    tokenAdmin = "Bearer " + jwt.generar(admin.getId(), "ADMINISTRADOR", admin.getTokenVersion());
  }

  @AfterEach
  void limpiar() {
    imagenes.deleteAll();
    horarios.deleteAll();
  }

  /** Comerciante crea, completa y envía a revisión; devuelve el id en estado PENDIENTE. */
  private long pendiente() throws Exception {
    return conDatos("Panadería del Parque", true);
  }

  /** Crea el negocio del comerciante y, si {@code completo}, lo completa y lo envía a revisión. */
  private long conDatos(String nombre, boolean completo) throws Exception {
    var creado =
        mvc.perform(
                post("/api/v1/negocios")
                    .header("Authorization", tokenComerciante)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of("nombre", nombre, "categoriaId", cat.getId()))))
            .andExpect(status().isCreated())
            .andReturn();
    long id = json.readTree(creado.getResponse().getContentAsString()).get("id").asLong();
    if (completo) {
      mvc.perform(
              put("/api/v1/negocios/" + id)
                  .header("Authorization", tokenComerciante)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      json.writeValueAsString(
                          Map.of(
                              "nombre", nombre,
                              "categoriaId", cat.getId(),
                              "descripcion", "Pan casero",
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
      mvc.perform(
              post("/api/v1/negocios/" + id + "/enviar-revision")
                  .header("Authorization", tokenComerciante))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.estado").value("PENDIENTE"));
    }
    return id;
  }

  private ResultActions cambiar(long id, String token, Map<String, Object> cuerpo) throws Exception {
    return mvc.perform(
        patch("/api/v1/admin/negocios/" + id + "/estado")
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(cuerpo)));
  }

  @Test
  void colaPendientesYaprobarPublica() throws Exception {
    long id = pendiente();

    mvc.perform(
            get("/api/v1/admin/negocios")
                .param("estado", "PENDIENTE")
                .header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(id))
        .andExpect(jsonPath("$[0].estado").value("PENDIENTE"));

    cambiar(id, tokenAdmin, Map.of("accion", "APROBAR"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"));

    mvc.perform(get("/api/v1/negocios/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"));
  }

  @Test
  void rechazoSinMotivoDa400() throws Exception {
    long id = pendiente();

    cambiar(id, tokenAdmin, Map.of("accion", "RECHAZAR"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"));
    cambiar(id, tokenAdmin, Map.of("accion", "SOLICITAR_CORRECCION"))
        .andExpect(status().isBadRequest());
    cambiar(id, tokenAdmin, Map.of("accion", "SUSPENDER"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void rechazoConMotivoPermiteReenviar() throws Exception {
    long id = pendiente();

    cambiar(id, tokenAdmin, Map.of("accion", "RECHAZAR", "motivo", "Las fotos no se ven bien."))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADO"))
        .andExpect(jsonPath("$.motivoRevision").value("Las fotos no se ven bien."));

    mvc.perform(get("/api/v1/mi-negocio").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.motivoRevision").value("Las fotos no se ven bien."));

    mvc.perform(
            post("/api/v1/negocios/" + id + "/enviar-revision")
                .header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("PENDIENTE"));
  }

  @Test
  void solicitarCorreccionConMotivoPermiteReenviar() throws Exception {
    long id = pendiente();

    cambiar(id, tokenAdmin, Map.of("accion", "SOLICITAR_CORRECCION", "motivo", "Agregá los horarios."))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CORRECCION_SOLICITADA"))
        .andExpect(jsonPath("$.motivoRevision").value("Agregá los horarios."));

    mvc.perform(
            post("/api/v1/negocios/" + id + "/enviar-revision")
                .header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("PENDIENTE"));
  }

  @Test
  void comercianteNoPuedeAprobarYsinSesionDa401() throws Exception {
    long id = pendiente();

    cambiar(id, tokenComerciante, Map.of("accion", "APROBAR"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));

    mvc.perform(
            patch("/api/v1/admin/negocios/" + id + "/estado")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("accion", "APROBAR"))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void aprobarBorradorDa409() throws Exception {
    long id = conDatos("Todavía en borrador", false);

    cambiar(id, tokenAdmin, Map.of("accion", "APROBAR"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));
  }

  @Test
  void suspenderYReactivar() throws Exception {
    long id = pendiente();

    cambiar(id, tokenAdmin, Map.of("accion", "APROBAR")).andExpect(status().isOk());

    cambiar(id, tokenAdmin, Map.of("accion", "SUSPENDER", "motivo", "Reclamos de los clientes."))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("SUSPENDIDO"))
        .andExpect(jsonPath("$.motivoRevision").value("Reclamos de los clientes."));

    mvc.perform(get("/api/v1/negocios/" + id)).andExpect(status().isNotFound());

    cambiar(id, tokenAdmin, Map.of("accion", "REACTIVAR"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"))
        .andExpect(jsonPath("$.motivoRevision").value(nullValue()));

    mvc.perform(get("/api/v1/negocios/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"));
  }
}
