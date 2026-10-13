package co.edu.uniquindio.trina.negocio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.almacenamiento.StubAlmacenamientoConfig;
import co.edu.uniquindio.trina.almacenamiento.StubAlmacenamientoConfig.StubAlmacenamiento;
import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * RED: fotografías del negocio (RF-12/RNF-05) — subida con miniatura, validación de tipo/tamaño,
 * límite de 10, principal/orden, borrado en storage, lectura pública y foto obligatoria al enviar
 * a revisión.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(StubAlmacenamientoConfig.class)
class ImagenControllerTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository categorias;
  @Autowired NegocioRepository negocios;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired ImagenNegocioRepository imagenes;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;
  @Autowired StubAlmacenamiento almacenamiento;

  private CategoriaNegocio cat;
  private Usuario comerciante;
  private Usuario otro;
  private String tokenComerciante;
  private String tokenOtro;

  @BeforeEach
  void sembrar() {
    imagenes.deleteAll();
    horarios.deleteAll();
    negocios.deleteAll();
    categorias.deleteAll();
    usuarios.deleteAll();
    almacenamiento.claves().forEach(almacenamiento::eliminar);
    cat = categorias.save(new CategoriaNegocio("Restaurantes"));
    comerciante =
        usuarios.save(
            new Usuario("c1@trina.co", claves.encode("clave1234"), "C1", "COMERCIANTE"));
    var otro = usuarios.save(new Usuario("c2@trina.co", claves.encode("clave1234"), "C2", "COMERCIANTE"));
    this.otro = otro;
    tokenComerciante = "Bearer " + jwt.generar(comerciante.getId(), "COMERCIANTE", comerciante.getTokenVersion());
    tokenOtro = "Bearer " + jwt.generar(otro.getId(), "COMERCIANTE", otro.getTokenVersion());
  }

  @AfterEach
  void limpiar() {
    imagenes.deleteAll();
    horarios.deleteAll();
    negocios.deleteAll();
    categorias.deleteAll();
    usuarios.deleteAll();
    almacenamiento.claves().forEach(almacenamiento::eliminar);
  }

  @Test
  void subidaValidaGeneraMiniaturaYUrls() throws Exception {
    long id = negocioCompleto();

    var respuesta =
        subir(id, imagen("jpg", 2000), "image/jpeg")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.principal").value(true))
            .andExpect(jsonPath("$.orden").value(0))
            .andExpect(jsonPath("$.url", matchesPattern("/media/negocios/" + id + "/[0-9a-f-]+\\.jpg")))
            .andExpect(
                jsonPath("$.urlMiniatura", matchesPattern("/media/negocios/" + id + "/[0-9a-f-]+_m\\.jpg")))
            .andReturn();

    String url = json.readTree(respuesta.getResponse().getContentAsString()).get("url").asText();
    String urlMiniatura =
        json.readTree(respuesta.getResponse().getContentAsString()).get("urlMiniatura").asText();

    // El stub guarda original + miniatura; el original se redimensiona a 1200 y la miniatura a 400.
    assertThat(almacenamiento.claves()).hasSize(2);
    assertThat(almacenamiento.bytes(clave(url))).isNotEmpty();
    BufferedImage principal = ImageIO.read(new ByteArrayInputStream(almacenamiento.bytes(clave(url))));
    BufferedImage mini =
        ImageIO.read(new ByteArrayInputStream(almacenamiento.bytes(clave(urlMiniatura))));
    assertThat(principal.getWidth()).isEqualTo(1200);
    assertThat(mini.getWidth()).isEqualTo(400);
  }

  @Test
  void pdfDa400YNoGuardaNada() throws Exception {
    long id = negocioCompleto();
    byte[] pdf = "%PDF-1.4 contenido de prueba".getBytes(StandardCharsets.UTF_8);

    subir(id, pdf, "application/pdf")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"))
        .andExpect(jsonPath("$.mensaje").value("Usá una imagen JPG, PNG o WebP"));
    // Un PDF disfrazado de imagen tampoco pasa: el tipo se valida por contenido real.
    subir(id, pdf, "image/jpeg")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"));

    assertThat(almacenamiento.claves()).isEmpty();
    assertThat(imagenes.count()).isZero();
  }

  @Test
  void fotoMuyGrandeDa400() throws Exception {
    long id = negocioCompleto();
    byte[] grande = new byte[5 * 1024 * 1024 + 1];
    grande[0] = (byte) 0xFF;
    grande[1] = (byte) 0xD8;
    grande[2] = (byte) 0xFF;

    subir(id, grande, "image/jpeg")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"))
        .andExpect(jsonPath("$.mensaje", containsString("5 MB")));
    assertThat(imagenes.count()).isZero();
  }

  @Test
  void decimoprimeraFotoDa422() throws Exception {
    long id = negocioCompleto();
    byte[] foto = imagen("jpg", 20);
    for (int i = 0; i < 10; i++) {
      subir(id, foto, "image/jpeg").andExpect(status().isCreated());
    }

    subir(id, foto, "image/jpeg")
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
    assertThat(imagenes.countByNegocio_Id(id)).isEqualTo(10);
  }

  @Test
  void principalYOrdenSeActualizan() throws Exception {
    long id = negocioCompleto();
    long primera = idDeSubida(subir(id, imagen("jpg", 30), "image/jpeg").andExpect(status().isCreated()));
    long segunda = idDeSubida(subir(id, imagen("jpg", 30), "image/jpeg").andExpect(status().isCreated()));

    mvc.perform(get("/api/v1/negocios/" + id + "/imagenes").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].principal").value(true))
        .andExpect(jsonPath("$[1].principal").value(false));

    mvc.perform(
            patch("/api/v1/negocios/" + id + "/imagenes/" + segunda)
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"principal\":true}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.principal").value(true));

    mvc.perform(
            patch("/api/v1/negocios/" + id + "/imagenes/" + primera)
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orden\":5}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.orden").value(5));

    mvc.perform(get("/api/v1/negocios/" + id + "/imagenes").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(segunda))
        .andExpect(jsonPath("$[0].principal").value(true))
        .andExpect(jsonPath("$[1].id").value(primera))
        .andExpect(jsonPath("$[1].orden").value(5));

    // Sin indicar principal ni orden la petición es inválida.
    mvc.perform(
            patch("/api/v1/negocios/" + id + "/imagenes/" + primera)
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void eliminarBorraDelStorage() throws Exception {
    long id = negocioCompleto();
    long imgId = idDeSubida(subir(id, imagen("jpg", 30), "image/jpeg").andExpect(status().isCreated()));
    Set<String> claves = Set.copyOf(almacenamiento.claves());
    assertThat(claves).hasSize(2);

    mvc.perform(
            delete("/api/v1/negocios/" + id + "/imagenes/" + imgId)
                .header("Authorization", tokenComerciante))
        .andExpect(status().isNoContent());

    assertThat(imagenes.count()).isZero();
    assertThat(almacenamiento.claves()).isEmpty();
    for (String clave : claves) {
      assertThat(almacenamiento.fueEliminada(clave)).isTrue();
    }
    mvc.perform(get("/api/v1/negocios/" + id + "/imagenes").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void enviarSinFotoDa422YConFotoPasa() throws Exception {
    long id = negocioCompleto();

    mvc.perform(
            post("/api/v1/negocios/" + id + "/enviar-revision")
                .header("Authorization", tokenComerciante))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(
            jsonPath("$.mensaje")
                .value("Falta un paso para publicar: agregá al menos una foto"));

    subir(id, imagen("jpg", 40), "image/jpeg").andExpect(status().isCreated());

    mvc.perform(
            post("/api/v1/negocios/" + id + "/enviar-revision")
                .header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("PENDIENTE"));
  }

  @Test
  void sinSesionDa401YAjenoDa403() throws Exception {
    long id = negocioCompleto();
    byte[] foto = imagen("jpg", 40);

    mvc.perform(
            multipart("/api/v1/negocios/" + id + "/imagenes")
                .file(new MockMultipartFile("file", "f.jpg", "image/jpeg", foto)))
        .andExpect(status().isUnauthorized());

    subirCon(tokenOtro, id, foto).andExpect(status().isForbidden());
    mvc.perform(
            patch("/api/v1/negocios/" + id + "/imagenes/1")
                .header("Authorization", tokenOtro)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"principal\":true}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            delete("/api/v1/negocios/" + id + "/imagenes/1").header("Authorization", tokenOtro))
        .andExpect(status().isForbidden());
  }

  @Test
  void lecturaPublicaSiAprobado() throws Exception {
    // Un BORRADOR ajeno no se expone, pero su dueño lo ve.
    long borrador = negocioCompleto();
    mvc.perform(get("/api/v1/negocios/" + borrador + "/imagenes")).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/negocios/" + borrador + "/imagenes").header("Authorization", tokenComerciante))
        .andExpect(status().isOk());

    // El dueño puede subir a un negocio APROBADO y cualquiera leer sus fotos (D-01: un negocio
    // por comerciante, así que el APROBADO es del segundo).
    var negocio = negocios.save(Negocio.publicado(otro, cat, "Publicado"));
    subirCon(tokenOtro, negocio.getId(), imagen("jpg", 40)).andExpect(status().isCreated());

    mvc.perform(get("/api/v1/negocios/" + negocio.getId() + "/imagenes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1));
  }

  // ------------------------------------------------------------------ ayudas

  private String clave(String url) {
    return url.substring("/media/".length());
  }

  private long idDeSubida(ResultActions respuesta) throws Exception {
    return json.readTree(respuesta.andReturn().getResponse().getContentAsString()).get("id").asLong();
  }

  private ResultActions subir(long negocioId, byte[] bytes, String tipo) throws Exception {
    return subirCon(tokenComerciante, negocioId, bytes, tipo);
  }

  private ResultActions subirCon(String token, long negocioId, byte[] bytes) throws Exception {
    return subirCon(token, negocioId, bytes, "image/jpeg");
  }

  private ResultActions subirCon(String token, long negocioId, byte[] bytes, String tipo)
      throws Exception {
    return mvc.perform(
        multipart("/api/v1/negocios/" + negocioId + "/imagenes")
            .file(new MockMultipartFile("file", "foto.jpg", tipo, bytes))
            .header("Authorization", token));
  }

  /** Crea un negocio propio completo (datos + horarios) listo para subir fotos o enviar. */
  private long negocioCompleto() throws Exception {
    var creado =
        mvc.perform(
                post("/api/v1/negocios")
                    .header("Authorization", tokenComerciante)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of("nombre", "Fotos del Parque", "categoriaId", cat.getId()))))
            .andExpect(status().isCreated())
            .andReturn();
    long id = json.readTree(creado.getResponse().getContentAsString()).get("id").asLong();
    mvc.perform(
            put("/api/v1/negocios/" + id)
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "nombre", "Fotos del Parque",
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
    return id;
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
