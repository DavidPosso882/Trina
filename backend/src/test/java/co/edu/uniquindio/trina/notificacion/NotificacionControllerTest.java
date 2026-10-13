package co.edu.uniquindio.trina.notificacion;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import co.edu.uniquindio.trina.reserva.ReservaRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * RED→GREEN: notificaciones en plataforma RF-32 (E1 pedido/reserva nueva, E2 cambio de estado,
 * E3 marcar leída). Los códigos siguen §5.9: 403 ajena, 401 sin sesión, 404 inexistente. El correo
 * (E4) es P3 y queda fuera. Se verifica también el cableo de reserva y de revisión de negocio.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificacionControllerTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired CatalogoItemRepository items;
  @Autowired PedidoRepository pedidos;
  @Autowired ReservaRepository reservas;
  @Autowired NotificacionRepository notificaciones;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;
  @Autowired JdbcTemplate jdbc;

  private Usuario cliente;
  private Usuario otroCliente;
  private Usuario comerciante;
  private Negocio negocio;
  private CatalogoItem bandeja;
  private String tokenCliente;
  private String tokenOtroCliente;
  private String tokenComerciante;
  private String tokenAdmin;

  @BeforeEach
  void sembrar() {
    limpiar();
    var rubro = rubros.save(new CategoriaNegocio("Restaurantes"));
    comerciante =
        usuarios.save(
            new Usuario("comercio@trina.co", claves.encode("clave1234"), "Comercio", "COMERCIANTE"));
    cliente =
        usuarios.save(
            new Usuario("cliente@trina.co", claves.encode("clave1234"), "Cliente", "CLIENTE"));
    otroCliente =
        usuarios.save(
            new Usuario("otro@trina.co", claves.encode("clave1234"), "Otro", "CLIENTE"));
    var admin =
        usuarios.save(
            new Usuario("admin@trina.co", claves.encode("clave1234"), "Admin", "ADMINISTRADOR"));

    negocio = negocios.save(Negocio.publicado(comerciante, rubro, "Sabor Trina"));
    bandeja =
        items.save(
            CatalogoItem.crear(negocio, null, "producto", "Bandeja paisa", null, 25000, null));

    tokenCliente = bearer(cliente);
    tokenOtroCliente = bearer(otroCliente);
    tokenComerciante = bearer(comerciante);
    tokenAdmin = bearer(admin);
  }

  @AfterEach
  void limpiar() {
    notificaciones.deleteAll();
    reservas.deleteAll();
    pedidos.deleteAll();
    items.deleteAll();
    negocios.deleteAll();
    rubros.deleteAll();
    usuarios.deleteAll();
  }

  // ---- Apoyo ----

  private String bearer(Usuario u) {
    return "Bearer " + jwt.generar(u.getId(), u.getRol(), u.getTokenVersion());
  }

  private long crearPedido() throws Exception {
    var respuesta =
        mvc.perform(
                post("/api/v1/pedidos")
                    .header("Authorization", tokenCliente)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of(
                                "negocioId", negocio.getId(),
                                "metodoPago", "EN_LOCAL",
                                "items", List.of(Map.of("itemId", bandeja.getId(), "cantidad", 1))))))
            .andExpect(status().isCreated())
            .andReturn();
    return json.readTree(respuesta.getResponse().getContentAsString()).get("id").asLong();
  }

  private void aceptar(long pedidoId) throws Exception {
    mvc.perform(
            patch("/api/v1/pedidos/" + pedidoId + "/estado")
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("accion", "ACEPTAR"))))
        .andExpect(status().isOk());
  }

  private ResultActions listar(String token) throws Exception {
    return mvc.perform(get("/api/v1/notificaciones").header("Authorization", token));
  }

  private long primeraNotificacion(String token) throws Exception {
    var respuesta = listar(token).andExpect(status().isOk()).andReturn();
    return json
        .readTree(respuesta.getResponse().getContentAsString())
        .get(0)
        .get("id")
        .asLong();
  }

  // ---- RF-32 E1: evento nuevo ----

  @Test
  void crearPedidoNotificaAlComercianteYSubeElContador() throws Exception {
    crearPedido();

    mvc.perform(get("/api/v1/notificaciones/contador").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.noLeidas").value(1));

    listar(tokenComerciante)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].tipo").value("PEDIDO_CREADO"))
        .andExpect(jsonPath("$[0].mensaje", containsString("pedido")))
        .andExpect(jsonPath("$[0].entidadTipo").value("PEDIDO"))
        .andExpect(jsonPath("$[0].leida").value(false));
  }

  @Test
  void crearReservaNotificaAlComerciante() throws Exception {
    jdbc.update("UPDATE negocio SET acepta_reservas = true WHERE id = ?", negocio.getId());

    mvc.perform(
            post("/api/v1/reservas")
                .header("Authorization", tokenCliente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "negocioId", negocio.getId(),
                            "inicio", Instant.now().plus(2, ChronoUnit.DAYS).toString(),
                            "personas", 2))))
        .andExpect(status().isCreated());

    listar(tokenComerciante)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].tipo").value("RESERVA_CREADA"))
        .andExpect(jsonPath("$[0].entidadTipo").value("RESERVA"));
  }

  @Test
  void aprobarNegocioNotificaAlComerciante() throws Exception {
    jdbc.update("UPDATE negocio SET estado = 'PENDIENTE' WHERE id = ?", negocio.getId());

    mvc.perform(
            patch("/api/v1/admin/negocios/" + negocio.getId() + "/estado")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("accion", "APROBAR"))))
        .andExpect(status().isOk());

    listar(tokenComerciante)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].tipo").value("NEGOCIO_APROBADO"))
        .andExpect(jsonPath("$[0].entidadTipo").value("NEGOCIO"));
  }

  // ---- RF-32 E2: cambio de estado ----

  @Test
  void aceptarPedidoNotificaAlCliente() throws Exception {
    long pedidoId = crearPedido();
    aceptar(pedidoId);

    mvc.perform(get("/api/v1/notificaciones/contador").header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.noLeidas").value(1));

    listar(tokenCliente)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].tipo").value("PEDIDO_EN_PREPARACION"))
        .andExpect(jsonPath("$[0].leida").value(false));
  }

  @Test
  void confirmarReservaNotificaAlCliente() throws Exception {
    jdbc.update("UPDATE negocio SET acepta_reservas = true WHERE id = ?", negocio.getId());
    var respuesta =
        mvc.perform(
                post("/api/v1/reservas")
                    .header("Authorization", tokenCliente)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of(
                                "negocioId", negocio.getId(),
                                "inicio", Instant.now().plus(2, ChronoUnit.DAYS).toString(),
                                "personas", 2))))
            .andExpect(status().isCreated())
            .andReturn();
    long reservaId =
        json.readTree(respuesta.getResponse().getContentAsString()).get("id").asLong();

    mvc.perform(
            patch("/api/v1/reservas/" + reservaId + "/estado")
                .header("Authorization", tokenComerciante)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("accion", "CONFIRMAR"))))
        .andExpect(status().isOk());

    listar(tokenCliente)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].tipo").value("RESERVA_CONFIRMADA"))
        .andExpect(jsonPath("$[0].entidadTipo").value("RESERVA"));
  }

  // ---- RF-32 E3: marcar leída ----

  @Test
  void marcarLeidaBajaElContadorYLaListaLaConserva() throws Exception {
    long pedidoId = crearPedido();
    aceptar(pedidoId);
    long notificacionId = primeraNotificacion(tokenCliente);

    mvc.perform(
            patch("/api/v1/notificaciones/" + notificacionId + "/leida")
                .header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.leida").value(true));

    mvc.perform(get("/api/v1/notificaciones/contador").header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.noLeidas").value(0));

    listar(tokenCliente)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].leida").value(true));
  }

  @Test
  void soloNoLeidasFiltraLasLeidas() throws Exception {
    long pedidoId = crearPedido();
    aceptar(pedidoId);
    long notificacionId = primeraNotificacion(tokenCliente);
    mvc.perform(
            patch("/api/v1/notificaciones/" + notificacionId + "/leida")
                .header("Authorization", tokenCliente))
        .andExpect(status().isOk());

    mvc.perform(
            get("/api/v1/notificaciones")
                .param("soloNoLeidas", "true")
                .header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void leerTodasMarcaTodoYDejaElContadorEnCero() throws Exception {
    crearPedido();
    crearPedido();
    mvc.perform(get("/api/v1/notificaciones/contador").header("Authorization", tokenComerciante))
        .andExpect(jsonPath("$.noLeidas").value(2));

    mvc.perform(post("/api/v1/notificaciones/leer-todas").header("Authorization", tokenComerciante))
        .andExpect(status().isNoContent());

    mvc.perform(get("/api/v1/notificaciones/contador").header("Authorization", tokenComerciante))
        .andExpect(jsonPath("$.noLeidas").value(0));
    listar(tokenComerciante)
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].leida").value(true))
        .andExpect(jsonPath("$[1].leida").value(true));
  }

  // ---- §5.9: códigos ----

  @Test
  void marcarLeidaAjenaDa403() throws Exception {
    crearPedido();
    long notificacionId = primeraNotificacion(tokenComerciante);

    mvc.perform(
            patch("/api/v1/notificaciones/" + notificacionId + "/leida")
                .header("Authorization", tokenOtroCliente))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  @Test
  void marcarLeidaInexistenteDa404() throws Exception {
    mvc.perform(
            patch("/api/v1/notificaciones/999999/leida").header("Authorization", tokenCliente))
        .andExpect(status().isNotFound());
  }

  @Test
  void sinSesionDa401() throws Exception {
    mvc.perform(get("/api/v1/notificaciones")).andExpect(status().isUnauthorized());
  }
}
