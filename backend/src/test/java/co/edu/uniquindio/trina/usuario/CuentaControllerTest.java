package co.edu.uniquindio.trina.usuario;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.catalogo.CatalogoCategoriaRepository;
import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.estadistica.VistaItemDiariaRepository;
import co.edu.uniquindio.trina.estadistica.VistaPerfilDiariaRepository;
import co.edu.uniquindio.trina.membresia.MembresiaSuscripcionRepository;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.HorarioAtencionRepository;
import co.edu.uniquindio.trina.negocio.ImagenNegocioRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.notificacion.NotificacionRepository;
import co.edu.uniquindio.trina.pago.PagoRepository;
import co.edu.uniquindio.trina.pedido.Pedido;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import co.edu.uniquindio.trina.reserva.Reserva;
import co.edu.uniquindio.trina.reserva.ReservaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RED→GREEN: cuenta propia y privacidad del titular (RF-48/RF-49) y recuperación de clave real
 * (RF-03). Códigos §5.9: 422 regla ({@link IllegalArgumentException}), 409 conflicto
 * ({@link IllegalStateException}), 403 ajeno, 401 sin sesión, 404 inexistente.
 *
 * <p>El token de recuperación solo se conoce por el enlace que el servicio deja en el log
 * (MailPort futuro), así que se extrae de {@link CapturedOutput}. El hash guardado se verifica
 * contra el SHA-256 calculado acá: el test no importa el helper de producción.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ExtendWith(OutputCaptureExtension.class)
class CuentaControllerTest {

  private static final String CLAVE = "clave1234";
  private static final String CLAVE_NUEVA = "nueva12345";

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired JdbcTemplate jdbc;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired CatalogoItemRepository items;
  @Autowired CatalogoCategoriaRepository catalogos;
  @Autowired PedidoRepository pedidos;
  @Autowired ReservaRepository reservas;
  @Autowired PagoRepository pagos;
  @Autowired NotificacionRepository notificaciones;
  @Autowired MembresiaSuscripcionRepository suscripciones;
  @Autowired ImagenNegocioRepository imagenes;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired VistaPerfilDiariaRepository vistasPerfil;
  @Autowired VistaItemDiariaRepository vistasItem;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private CategoriaNegocio rubro;
  private Usuario cliente;
  private Usuario comerciante;
  private Negocio negocio;
  private CatalogoItem item;
  private String tokenCliente;
  private String tokenComerciante;

  @BeforeEach
  void sembrar() {
    limpiar();
    rubro = rubros.save(new CategoriaNegocio("Restaurantes"));
    cliente =
        usuarios.save(new Usuario("cliente@trina.co", claves.encode(CLAVE), "Cliente", "CLIENTE"));
    comerciante =
        usuarios.save(
            new Usuario("comercio@trina.co", claves.encode(CLAVE), "Comercio", "COMERCIANTE"));
    negocio = negocios.save(Negocio.publicado(comerciante, rubro, "Sabor Trina"));
    item =
        items.save(
            CatalogoItem.crear(negocio, null, "producto", "Bandeja paisa", null, 25000, null));
    tokenCliente = bearer(cliente);
    tokenComerciante = bearer(comerciante);
  }

  @AfterEach
  void limpiar() {
    limpiarTokens();
    vistasItem.deleteAll();
    vistasPerfil.deleteAll();
    notificaciones.deleteAll();
    pagos.deleteAll();
    pedidos.deleteAll();
    reservas.deleteAll();
    suscripciones.deleteAll();
    imagenes.deleteAll();
    horarios.deleteAll();
    items.deleteAll();
    catalogos.deleteAll();
    negocios.deleteAll();
    rubros.deleteAll();
    usuarios.deleteAll();
  }

  // ---- RF-49: edición de la cuenta ----

  @Test
  void patchMeEditaNombreYTelefono() throws Exception {
    mvc.perform(
            patch("/api/v1/me")
                .header("Authorization", tokenCliente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("nombre", "Juan Pérez", "telefono", "3001234567"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value("Juan Pérez"))
        .andExpect(jsonPath("$.telefono").value("3001234567"));

    var guardado = usuarios.findById(cliente.getId()).orElseThrow();
    assertEquals("Juan Pérez", guardado.getNombre());
    assertEquals(
        "3001234567",
        jdbc.queryForObject(
            "select telefono from usuario where id = ?", String.class, cliente.getId()));
  }

  @Test
  void patchMeSoloTelefonoConservaElNombre() throws Exception {
    mvc.perform(
            patch("/api/v1/me")
                .header("Authorization", tokenCliente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("telefono", "3009998888"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value("Cliente"))
        .andExpect(jsonPath("$.telefono").value("3009998888"));
  }

  @Test
  void patchMeConNombreVacioDa422() throws Exception {
    mvc.perform(
            patch("/api/v1/me")
                .header("Authorization", tokenCliente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("nombre", "   "))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
  }

  // ---- RF-49: cambio de contraseña ----

  @Test
  void cambiarClaveInvalidaTokenViejoYElNuevoFunciona() throws Exception {
    mvc.perform(
            post("/api/v1/me/cambiar-clave")
                .header("Authorization", tokenCliente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("actual", CLAVE, "nueva", CLAVE_NUEVA))))
        .andExpect(status().isOk());

    // El JWT emitido antes del cambio queda invalidado (token_version rotada).
    mvc.perform(get("/api/v1/auth/me").header("Authorization", tokenCliente))
        .andExpect(status().isUnauthorized());

    var login =
        mvc.perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of("email", "cliente@trina.co", "password", CLAVE_NUEVA))))
            .andExpect(status().isOk())
            .andReturn();
    String nuevoToken =
        json.readTree(login.getResponse().getContentAsString()).get("token").asText();
    mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + nuevoToken))
        .andExpect(status().isOk());
  }

  @Test
  void cambiarClaveConActualIncorrectaDa422() throws Exception {
    mvc.perform(
            post("/api/v1/me/cambiar-clave")
                .header("Authorization", tokenCliente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("actual", "otra1234", "nueva", CLAVE_NUEVA))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(content().string(containsString("actual no coincide")));
  }

  // ---- RF-48 E1: exportación de datos ----

  @Test
  void datosExportaEmailActividadYNegocio() throws Exception {
    pedidos.save(
        Pedido.crear(cliente, negocio, Pedido.EN_LOCAL, null, List.of(new Pedido.Linea(item, 2))));
    reservas.save(
        Reserva.crear(
            cliente,
            negocio,
            Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200),
            2,
            null));

    mvc.perform(get("/api/v1/me/datos").header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("cliente@trina.co"))
        .andExpect(jsonPath("$.nombre").value("Cliente"))
        .andExpect(jsonPath("$.pedidos.length()").value(1))
        .andExpect(jsonPath("$.pedidos[0].negocio").value("Sabor Trina"))
        .andExpect(jsonPath("$.pedidos[0].totalCop").value(50000))
        .andExpect(jsonPath("$.reservas.length()").value(1))
        .andExpect(jsonPath("$.negocio").value(nullValue()));
  }

  // ---- RF-48 E2/E3: eliminación y anonimización ----

  @Test
  void eliminarCuentaAnonimizaYSuspendeElNegocio() throws Exception {
    long idComerciante = comerciante.getId();

    mvc.perform(delete("/api/v1/me").header("Authorization", tokenComerciante))
        .andExpect(status().isNoContent());

    var fila =
        jdbc.queryForMap(
            "select email, nombre, telefono, password_hash, activo, eliminado_en"
                + " from usuario where id = ?",
            idComerciante);
    assertEquals("eliminado_" + idComerciante + "@trina.local", fila.get("email"));
    assertEquals("Usuario eliminado", fila.get("nombre"));
    assertNull(fila.get("telefono"));
    assertFalse((Boolean) fila.get("activo"));
    assertNotNull(fila.get("eliminado_en"));
    assertFalse(claves.matches(CLAVE, (String) fila.get("password_hash")));

    var suspendido = negocios.findById(negocio.getId()).orElseThrow();
    assertEquals("SUSPENDIDO", suspendido.getEstado());
    assertNotNull(suspendido.getMotivoRevision());

    // El token emitido antes de eliminar ya no sirve.
    mvc.perform(get("/api/v1/auth/me").header("Authorization", tokenComerciante))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("email", "comercio@trina.co", "password", CLAVE))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void eliminarComercianteSuspendeTambienUnNegocioNoPublicado() throws Exception {
    var otro =
        usuarios.save(
            new Usuario("otro@trina.co", claves.encode(CLAVE), "Otro", "COMERCIANTE"));
    var borrador = negocios.save(Negocio.borrador(otro, rubro, "Cocina Oculta"));

    mvc.perform(delete("/api/v1/me").header("Authorization", bearer(otro)))
        .andExpect(status().isNoContent());

    assertEquals(
        "SUSPENDIDO", negocios.findById(borrador.getId()).orElseThrow().getEstado());
  }

  // ---- RF-48: política de privacidad ----

  @Test
  void politicaPrivacidadEsPublica() throws Exception {
    mvc.perform(get("/api/v1/politica-privacidad"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value("v1"))
        .andExpect(jsonPath("$.texto").isNotEmpty());
  }

  // ---- RF-03: recuperación de contraseña ----

  @Test
  void recuperarClaveRespondeIgualExistaONoYGuardaUnToken() throws Exception {
    var conCuenta =
        mvc.perform(
                post("/api/v1/auth/recuperar-clave")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("email", "cliente@trina.co"))))
            .andExpect(status().isAccepted())
            .andReturn();
    var sinCuenta =
        mvc.perform(
                post("/api/v1/auth/recuperar-clave")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("email", "nadie@trina.co"))))
            .andExpect(status().isAccepted())
            .andReturn();

    assertEquals(
        conCuenta.getResponse().getContentAsString(),
        sinCuenta.getResponse().getContentAsString());
    assertEquals(
        1,
        (int) jdbc.queryForObject("select count(*) from recuperacion_clave", Integer.class));
  }

  @Test
  void recuperarClaveGuardaHashSha256YVenceEn30Minutos(CapturedOutput salida) throws Exception {
    mvc.perform(
            post("/api/v1/auth/recuperar-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "cliente@trina.co"))))
        .andExpect(status().isAccepted());

    String token = tokenDelLog(salida.getOut());
    var fila = jdbc.queryForMap("select token_hash, expira_en, usado_en from recuperacion_clave");
    assertNotEquals(token, fila.get("token_hash"));
    assertEquals(sha256Hex(token), fila.get("token_hash"));

    Instant expira = comoInstant(fila.get("expira_en"));
    Instant ahora = Instant.now();
    assertTrue(expira.isAfter(ahora.plusSeconds(29 * 60)), "vence en 30 min");
    assertTrue(expira.isBefore(ahora.plusSeconds(31 * 60)), "vence en 30 min");
    assertNull(fila.get("usado_en"));
  }

  @Test
  void restablecerConTokenValidoCambiaClaveEInvalidaSesiones(CapturedOutput salida)
      throws Exception {
    mvc.perform(
            post("/api/v1/auth/recuperar-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "cliente@trina.co"))))
        .andExpect(status().isAccepted());
    String token = tokenDelLog(salida.getOut());

    mvc.perform(
            post("/api/v1/auth/restablecer-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("token", token, "nuevaClave", CLAVE_NUEVA))))
        .andExpect(status().isOk());

    // Sesiones previas invalidadas.
    mvc.perform(get("/api/v1/auth/me").header("Authorization", tokenCliente))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("email", "cliente@trina.co", "password", CLAVE))))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("email", "cliente@trina.co", "password", CLAVE_NUEVA))))
        .andExpect(status().isOk());

    assertNotNull(
        jdbc.queryForMap("select usado_en from recuperacion_clave").get("usado_en"));
  }

  @Test
  void reusarElTokenDa422(CapturedOutput salida) throws Exception {
    mvc.perform(
            post("/api/v1/auth/recuperar-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "cliente@trina.co"))))
        .andExpect(status().isAccepted());
    String token = tokenDelLog(salida.getOut());
    mvc.perform(
            post("/api/v1/auth/restablecer-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("token", token, "nuevaClave", CLAVE_NUEVA))))
        .andExpect(status().isOk());

    mvc.perform(
            post("/api/v1/auth/restablecer-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("token", token, "nuevaClave", "otra12345"))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(content().string(containsString("Ped")));
  }

  @Test
  void tokenVencidoDa422(CapturedOutput salida) throws Exception {
    mvc.perform(
            post("/api/v1/auth/recuperar-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "cliente@trina.co"))))
        .andExpect(status().isAccepted());
    String token = tokenDelLog(salida.getOut());
    jdbc.update(
        "update recuperacion_clave set expira_en = ?",
        Timestamp.from(Instant.now().minusSeconds(60)));

    mvc.perform(
            post("/api/v1/auth/restablecer-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("token", token, "nuevaClave", CLAVE_NUEVA))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(content().string(containsString("Ped")));
  }

  @Test
  void tokenInexistenteDa422() throws Exception {
    mvc.perform(
            post("/api/v1/auth/restablecer-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("token", "token-inventado", "nuevaClave", CLAVE_NUEVA))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
  }

  // ---- §5.9: sin sesión ----

  @Test
  void sinSesionDa401() throws Exception {
    mvc.perform(
            patch("/api/v1/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("nombre", "Nadie"))))
        .andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/me/datos")).andExpect(status().isUnauthorized());
    mvc.perform(delete("/api/v1/me")).andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/v1/me/cambiar-clave")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("actual", CLAVE, "nueva", CLAVE_NUEVA))))
        .andExpect(status().isUnauthorized());
  }

  // ---- Apoyo ----

  private String bearer(Usuario u) {
    return "Bearer " + jwt.generar(u.getId(), u.getRol(), u.getTokenVersion());
  }

  /**
   * Borra los tokens de recuperación. Durante la fase RED la tabla todavía no existe (la crea la
   * entidad/V11 con la implementación), por eso se tolera el error de SQL solo acá.
   */
  private void limpiarTokens() {
    try {
      jdbc.update("DELETE FROM recuperacion_clave");
    } catch (DataAccessException aunNoExiste) {
      // Intencional en RED: sin entidad no hay tabla en H2.
    }
  }

  private static String tokenDelLog(String salida) {
    var matcher = Pattern.compile("restablecer-clave\\?token=([A-Za-z0-9_-]+)").matcher(salida);
    String token = null;
    while (matcher.find()) {
      token = matcher.group(1);
    }
    assertNotNull(token, "el servicio debe dejar el enlace de recuperación en el log");
    return token;
  }

  private static String sha256Hex(String texto) throws Exception {
    var bytes = MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
    var hex = new StringBuilder();
    for (byte b : bytes) {
      hex.append(String.format("%02x", b));
    }
    return hex.toString();
  }

  private static Instant comoInstant(Object valor) {
    if (valor instanceof OffsetDateTime od) {
      return od.toInstant();
    }
    if (valor instanceof Timestamp ts) {
      return ts.toInstant();
    }
    return (Instant) valor;
  }
}
