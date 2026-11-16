package co.edu.uniquindio.trina.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.almacenamiento.StubAlmacenamientoConfig;
import co.edu.uniquindio.trina.almacenamiento.StubAlmacenamientoConfig.StubAlmacenamiento;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** RUT + cédula obligatorios al crear cuenta COMERCIANTE (PDF o imagen, máx 5MB c/u). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(StubAlmacenamientoConfig.class)
class RegistroVendedorTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;
  @Autowired StubAlmacenamiento almacenamiento;

  @BeforeEach
  void limpiarAntes() {
    usuarios.deleteAll();
    almacenamiento.claves().forEach(almacenamiento::eliminar);
  }

  @AfterEach
  void limpiar() {
    usuarios.deleteAll();
    almacenamiento.claves().forEach(almacenamiento::eliminar);
  }

  @Test
  void registroVendedorPdfEImagenQuedaPendiente() throws Exception {
    String email = "vende-" + UUID.randomUUID().toString().substring(0, 8) + "@trina.co";
    byte[] rut = "%PDF-1.4 rut de prueba".getBytes(StandardCharsets.UTF_8);
    byte[] cedula = imagen("jpg", 40);

    var creado =
        mvc.perform(
                multipart("/api/v1/auth/registro-vendedor")
                    .file(new MockMultipartFile("rut", "rut.pdf", "application/pdf", rut))
                    .file(new MockMultipartFile("cedula", "cedula.jpg", "image/jpeg", cedula))
                    .param("email", email)
                    .param("password", "clave1234")
                    .param("nombre", "Vende")
                    .param("consentimiento", "true"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.rol").value("COMERCIANTE"))
            .andReturn();
    long id = json.readTree(creado.getResponse().getContentAsString()).get("id").asLong();

    var guardado = usuarios.findById(id).orElseThrow();
    assertThat(guardado.isActivo()).isFalse();
    assertThat(guardado.getRutDocClave()).startsWith("vendedores/" + id + "/rut_");
    assertThat(guardado.getCedulaDocClave()).startsWith("vendedores/" + id + "/cedula_");
    assertThat(almacenamiento.claves()).hasSize(2);

    // Como en ViviGo el vendedor queda pendiente: el login responde 401 con espera.
    mvc.perform(
            post("/api/v1/auth/login")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        java.util.Map.of("email", email, "password", "clave1234"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.mensaje", containsString("pendiente de aprobaci")));
  }

  @Test
  void registroVendedorSinRutDa400() throws Exception {
    mvc.perform(
            multipart("/api/v1/auth/registro-vendedor")
                .file(new MockMultipartFile("cedula", "cedula.jpg", "image/jpeg", imagen("jpg", 20)))
                .param("email", "sinrut@trina.co")
                .param("password", "clave1234")
                .param("nombre", "Sin Rut")
                .param("consentimiento", "true"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"))
        .andExpect(jsonPath("$.mensaje", containsString("RUT")));
    assertThat(almacenamiento.claves()).isEmpty();
  }

  @Test
  void registroVendedorTipoInvalidoDa400() throws Exception {
    byte[] txt = "no soy pdf ni imagen".getBytes(StandardCharsets.UTF_8);
    mvc.perform(
            multipart("/api/v1/auth/registro-vendedor")
                .file(new MockMultipartFile("rut", "rut.txt", "text/plain", txt))
                .file(new MockMultipartFile("cedula", "cedula.jpg", "image/jpeg", imagen("jpg", 20)))
                .param("email", "mal@trina.co")
                .param("password", "clave1234")
                .param("nombre", "Mal")
                .param("consentimiento", "true"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"))
        .andExpect(jsonPath("$.mensaje", containsString("PDF o imagen")));
  }

  @Test
  void registroVendedorMuyGrandeDa400() throws Exception {
    byte[] grande = new byte[5 * 1024 * 1024 + 1];
    grande[0] = 0x25;
    grande[1] = 0x50;
    grande[2] = 0x44;
    grande[3] = 0x46;
    mvc.perform(
            multipart("/api/v1/auth/registro-vendedor")
                .file(new MockMultipartFile("rut", "rut.pdf", "application/pdf", grande))
                .file(new MockMultipartFile("cedula", "cedula.jpg", "image/jpeg", imagen("jpg", 20)))
                .param("email", "grande@trina.co")
                .param("password", "clave1234")
                .param("nombre", "Grande")
                .param("consentimiento", "true"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"))
        .andExpect(jsonPath("$.mensaje", containsString("5 MB")));
  }

  @Test
  void descargaSoloDuenoOAdmin() throws Exception {
    String email = "doc-" + UUID.randomUUID().toString().substring(0, 8) + "@trina.co";
    byte[] rut = "%PDF-1.4 rut".getBytes(StandardCharsets.UTF_8);
    byte[] cedula = imagen("png", 30);
    var creado =
        mvc.perform(
                multipart("/api/v1/auth/registro-vendedor")
                    .file(new MockMultipartFile("rut", "rut.pdf", "application/pdf", rut))
                    .file(new MockMultipartFile("cedula", "cedula.png", "image/png", cedula))
                    .param("email", email)
                    .param("password", "clave1234")
                    .param("nombre", "Doc")
                    .param("consentimiento", "true"))
            .andExpect(status().isCreated())
            .andReturn();
    long id = json.readTree(creado.getResponse().getContentAsString()).get("id").asLong();
    var vendedor = usuarios.findById(id).orElseThrow();
    // El pendiente no autentica (filtro exige activo): se aprueba para probar descarga del dueño.
    vendedor.setActivo(true);
    usuarios.save(vendedor);
    String tokenDueno =
        "Bearer " + jwt.generar(id, "COMERCIANTE", vendedor.getTokenVersion());
    var admin =
        usuarios.save(
            new co.edu.uniquindio.trina.usuario.Usuario(
                "admin-doc@trina.co", claves.encode("clave1234"), "Admin", "ADMINISTRADOR"));
    String tokenAdmin = "Bearer " + jwt.generar(admin.getId(), "ADMINISTRADOR", admin.getTokenVersion());
    var otro =
        usuarios.save(
            new co.edu.uniquindio.trina.usuario.Usuario(
                "otro@trina.co", claves.encode("clave1234"), "Otro", "CLIENTE"));
    String tokenOtro = "Bearer " + jwt.generar(otro.getId(), "CLIENTE", otro.getTokenVersion());

    mvc.perform(
            get("/api/v1/vendedores/" + id + "/documentos/rut").header("Authorization", tokenDueno))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Type", "application/pdf"));

    mvc.perform(
            get("/api/v1/vendedores/" + id + "/documentos/cedula")
                .header("Authorization", tokenAdmin))
        .andExpect(status().isOk());

    mvc.perform(
            get("/api/v1/vendedores/" + id + "/documentos/rut").header("Authorization", tokenOtro))
        .andExpect(status().isForbidden());

    mvc.perform(get("/api/v1/vendedores/" + id + "/documentos/rut"))
        .andExpect(status().isUnauthorized());
  }

  private static byte[] imagen(String formato, int ancho) throws Exception {
    var img = new BufferedImage(ancho, Math.max(1, ancho / 2), BufferedImage.TYPE_INT_RGB);
    Graphics2D g = img.createGraphics();
    g.setColor(new Color(27, 107, 71));
    g.fillRect(0, 0, ancho, img.getHeight());
    g.dispose();
    var out = new ByteArrayOutputStream();
    ImageIO.write(img, formato, out);
    return out.toByteArray();
  }
}
