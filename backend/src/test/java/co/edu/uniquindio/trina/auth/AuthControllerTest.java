package co.edu.uniquindio.trina.auth;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RED: endpoints /auth/registro, /auth/login y /auth/me aún no existen. RF-01, RF-02, RF-04.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  @Test
  void registroValidoCreaCuenta() throws Exception {
    mvc.perform(
            post("/api/v1/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "email", "cliente1@trina.co",
                            "password", "clave1234",
                            "nombre", "Cliente Uno",
                            "rol", "CLIENTE",
                            "consentimiento", true))))
        .andExpect(status().isCreated());
  }

  @Test
  void registroDuplicadoDa409() throws Exception {
    var cuerpo =
        json.writeValueAsString(
            Map.of(
                "email", "dupli@trina.co",
                "password", "clave1234",
                "nombre", "Dupli",
                "rol", "CLIENTE",
                "consentimiento", true));
    mvc.perform(post("/api/v1/auth/registro").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isCreated());
    mvc.perform(post("/api/v1/auth/registro").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
        .andExpect(status().isConflict());
  }

  @Test
  void registroSinConsentimientoDa400() throws Exception {
    mvc.perform(
            post("/api/v1/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "email", "sincon@trina.co",
                            "password", "clave1234",
                            "nombre", "Sin Con",
                            "rol", "CLIENTE",
                            "consentimiento", false))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void registroAdminRechazado() throws Exception {
    mvc.perform(
            post("/api/v1/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "email", "vivo@trina.co",
                            "password", "clave1234",
                            "nombre", "Vivo",
                            "rol", "ADMINISTRADOR",
                            "consentimiento", true))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void loginOkDevuelveJwtYMeResponde() throws Exception {
    mvc.perform(
            post("/api/v1/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "email", "juan@trina.co",
                            "password", "clave1234",
                            "nombre", "Juan",
                            "rol", "CLIENTE",
                            "consentimiento", true))))
        .andExpect(status().isCreated());

    var login =
        mvc.perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of("email", "juan@trina.co", "password", "clave1234"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andReturn();
    String token = json.readTree(login.getResponse().getContentAsString()).get("token").asText();

    mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("juan@trina.co"));
  }

  @Test
  void loginClaveMalaDa401SinFiltrar() throws Exception {
    mvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("email", "nadie@trina.co", "password", "xxxx1234"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.codigo").value("AUTENTICACION"))
        .andExpect(content().string(containsString("correo o la contrase")));
  }
}
