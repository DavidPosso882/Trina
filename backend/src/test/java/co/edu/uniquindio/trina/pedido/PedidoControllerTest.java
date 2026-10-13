package co.edu.uniquindio.trina.pedido;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.HorarioAtencion;
import co.edu.uniquindio.trina.negocio.HorarioAtencionRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
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
 * RED→GREEN: pedidos para recoger RF-25/RF-27/RF-31. Acá SANDBOX crea en PENDIENTE_PAGO y EN_LOCAL
 * crea en PENDIENTE; el cobro, la comisión, el reembolso y la expiración (RF-28/29) se cubren en
 * {@code co.edu.uniquindio.trina.pago.PagoControllerTest}. Los códigos siguen §5.9: 422 regla
 * incumplida, 409 conflicto, 403 ajeno, 401 sin sesión, 404 inexistente.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PedidoControllerTest {

  private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired CatalogoItemRepository items;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired PedidoRepository pedidos;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private Usuario cliente;
  private Usuario otroCliente;
  private Negocio aprobado;
  private Negocio ajeno;
  private Negocio borrador;
  private CatalogoItem bandeja;
  private CatalogoItem jugo;
  private CatalogoItem agotado;
  private CatalogoItem deOtroNegocio;
  private String tokenCliente;
  private String tokenOtroCliente;
  private String tokenComerciante;
  private String tokenComercianteAjeno;
  private String tokenAdmin;

  @BeforeEach
  void sembrar() {
    limpiar();
    var rubro = rubros.save(new CategoriaNegocio("Restaurantes"));
    var comerciante =
        usuarios.save(
            new Usuario("comercio@trina.co", claves.encode("clave1234"), "Comercio", "COMERCIANTE"));
    var comercianteAjeno =
        usuarios.save(
            new Usuario("ajeno@trina.co", claves.encode("clave1234"), "Ajeno", "COMERCIANTE"));
    var duenoBorrador =
        usuarios.save(
            new Usuario("borrador@trina.co", claves.encode("clave1234"), "Borrador", "COMERCIANTE"));
    cliente =
        usuarios.save(
            new Usuario("cliente@trina.co", claves.encode("clave1234"), "Cliente", "CLIENTE"));
    otroCliente =
        usuarios.save(
            new Usuario("otro@trina.co", claves.encode("clave1234"), "Otro", "CLIENTE"));
    var admin =
        usuarios.save(
            new Usuario("admin@trina.co", claves.encode("clave1234"), "Admin", "ADMINISTRADOR"));

    aprobado = negocios.save(Negocio.publicado(comerciante, rubro, "Sabor Trina"));
    ajeno = negocios.save(Negocio.publicado(comercianteAjeno, rubro, "Café Ajeno"));
    borrador = negocios.save(Negocio.borrador(duenoBorrador, rubro, "Cocina Oculta"));

    bandeja =
        items.save(
            CatalogoItem.crear(aprobado, null, "producto", "Bandeja paisa", null, 25000, null));
    jugo =
        items.save(
            CatalogoItem.crear(aprobado, null, "producto", "Jugo de lulo", null, 8000, null));
    agotado =
        items.save(
            CatalogoItem.crear(aprobado, null, "producto", "Postre agotado", null, 12000, null));
    agotado.cambiarDisponibilidad(false);
    items.save(agotado);
    deOtroNegocio =
        items.save(CatalogoItem.crear(ajeno, null, "producto", "Tinto", null, 4000, null));

    tokenCliente = bearer(cliente);
    tokenOtroCliente = bearer(otroCliente);
    tokenComerciante = bearer(comerciante);
    tokenComercianteAjeno = bearer(comercianteAjeno);
    tokenAdmin = bearer(admin);
  }

  @AfterEach
  void limpiar() {
    // El horario y el pedido referencian al negocio: se borran primero para no romper las FK.
    horarios.deleteAll();
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

  private String cuerpo(Long negocioId, String metodoPago, Object lineas) throws Exception {
    return json.writeValueAsString(
        Map.of("negocioId", negocioId, "metodoPago", metodoPago, "items", lineas));
  }

  private ResultActions crear(String metodoPago, Object lineas) throws Exception {
    return crear(aprobado.getId(), metodoPago, lineas);
  }

  private ResultActions crear(Long negocioId, String metodoPago, Object lineas) throws Exception {
    return mvc.perform(
        post("/api/v1/pedidos")
            .header("Authorization", tokenCliente)
            .contentType(MediaType.APPLICATION_JSON)
            .content(cuerpo(negocioId, metodoPago, lineas)));
  }

  private ResultActions accion(String token, long pedidoId, String accion, String motivo)
      throws Exception {
    var cuerpo = new HashMap<String, Object>();
    cuerpo.put("accion", accion);
    if (motivo != null) {
      cuerpo.put("motivo", motivo);
    }
    return mvc.perform(
        patch("/api/v1/pedidos/" + pedidoId + "/estado")
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(cuerpo)));
  }

  private Pedido sembrarPedido(Usuario dueno, Negocio negocio, CatalogoItem item, String metodoPago) {
    return pedidos.save(
        Pedido.crear(dueno, negocio, metodoPago, null, List.of(new Pedido.Linea(item, 1))));
  }

  private static List<Map<String, Object>> linea(CatalogoItem item, int cantidad) {
    return List.of(Map.of("itemId", item.getId(), "cantidad", cantidad));
  }

  private long idDe(ResultActions respuesta) throws Exception {
    return json
        .readTree(respuesta.andReturn().getResponse().getContentAsString())
        .get("id")
        .asLong();
  }

  // ---- RF-25: crear ----

  @Test
  void crearEnLocalQuedaPendienteConTotalYCopiasDelCatalogo() throws Exception {
    var respuesta =
        crear(
                "EN_LOCAL",
                List.of(
                    Map.of("itemId", bandeja.getId(), "cantidad", 2),
                    Map.of("itemId", jugo.getId(), "cantidad", 1)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("PENDIENTE"))
            .andExpect(jsonPath("$.metodoPago").value("EN_LOCAL"))
            .andExpect(jsonPath("$.totalCop").value(58000))
            .andExpect(jsonPath("$.items[0].nombre").value("Bandeja paisa"))
            .andExpect(jsonPath("$.items[0].precioUnitarioCop").value(25000))
            .andExpect(jsonPath("$.items[0].cantidad").value(2))
            .andExpect(jsonPath("$.items[1].nombre").value("Jugo de lulo"));

    // RN-03: la copia congela nombre y precio aunque el catálogo cambie después.
    long id = idDe(respuesta);
    bandeja.actualizar(null, "producto", "Bandeja nueva", null, 99000, null);
    items.save(bandeja);

    mvc.perform(get("/api/v1/pedidos/" + id).header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalCop").value(58000))
        .andExpect(jsonPath("$.items[0].nombre").value("Bandeja paisa"))
        .andExpect(jsonPath("$.items[0].precioUnitarioCop").value(25000));
  }

  @Test
  void crearSandboxQuedaPendientePagoSinCobrar() throws Exception {
    crear("SANDBOX", linea(bandeja, 1))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
        .andExpect(jsonPath("$.metodoPago").value("SANDBOX"))
        .andExpect(jsonPath("$.totalCop").value(25000));
  }

  @Test
  void itemNoDisponibleDa422IndicandoCual() throws Exception {
    crear("EN_LOCAL", linea(agotado, 1))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(jsonPath("$.mensaje", containsString("Postre agotado")));
  }

  @Test
  void itemsDeDosNegociosDa422() throws Exception {
    crear(
            "EN_LOCAL",
            List.of(
                Map.of("itemId", bandeja.getId(), "cantidad", 1),
                Map.of("itemId", deOtroNegocio.getId(), "cantidad", 1)))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(jsonPath("$.mensaje", containsString("Tinto")));
  }

  @Test
  void itemInexistenteDa404() throws Exception {
    crear("EN_LOCAL", List.of(Map.of("itemId", 999999, "cantidad", 1)))
        .andExpect(status().isNotFound());
  }

  @Test
  void negocioNoAprobadoDa404() throws Exception {
    crear(borrador.getId(), "EN_LOCAL", linea(bandeja, 1)).andExpect(status().isNotFound());
  }

  // ---- RF-25 E3: solo se exige horario cuando el negocio configuró franjas ----

  @Test
  void pedidoConNegocioCerradoDa422() throws Exception {
    // Una franja para mañana deja el negocio con horario configurado y cerrado ahora.
    int manana = LocalDate.now(BOGOTA).getDayOfWeek().getValue() % 7 + 1;
    horarios.save(new HorarioAtencion(aprobado, manana, LocalTime.MIDNIGHT, LocalTime.of(23, 59, 59)));

    crear("EN_LOCAL", linea(bandeja, 1))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(jsonPath("$.mensaje", containsString("Este negocio está cerrado ahora")));
  }

  @Test
  void pedidoConNegocioAbiertoSeCrea() throws Exception {
    int hoy = LocalDate.now(BOGOTA).getDayOfWeek().getValue();
    horarios.save(new HorarioAtencion(aprobado, hoy, LocalTime.MIDNIGHT, LocalTime.of(23, 59, 59)));

    crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated());
  }

  @Test
  void negocioSinFranjasNoSeBloquea() throws Exception {
    // Compatibilidad con negocios viejos: sin horarios configurados el pedido se crea igual.
    crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated());
  }

  @Test
  void carritoVacioDa400() throws Exception {
    crear("EN_LOCAL", List.of())
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"));
  }

  @Test
  void sinSesionDa401() throws Exception {
    mvc.perform(
            post("/api/v1/pedidos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo(aprobado.getId(), "EN_LOCAL", linea(bandeja, 1))))
        .andExpect(status().isUnauthorized());
  }

  // ---- RF-27: gestión del comerciante ----

  @Test
  void flujoAceptarMarcarListoYCompletar() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));

    accion(tokenComerciante, id, "ACEPTAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("EN_PREPARACION"));
    accion(tokenComerciante, id, "MARCAR_LISTO", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("LISTO"));
    accion(tokenComerciante, id, "COMPLETAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("COMPLETADO"));
  }

  @Test
  void transicionInvalidaDa409() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));
    accion(tokenComerciante, id, "ACEPTAR", null).andExpect(status().isOk());
    accion(tokenComerciante, id, "MARCAR_LISTO", null).andExpect(status().isOk());
    accion(tokenComerciante, id, "COMPLETAR", null).andExpect(status().isOk());

    accion(tokenComerciante, id, "ACEPTAR", null)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));
  }

  @Test
  void rechazarSinMotivoDa422YConMotivoQuedaRechazado() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));

    accion(tokenComerciante, id, "RECHAZAR", null)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));

    accion(tokenComerciante, id, "RECHAZAR", "Se acabó la bandeja")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADO"))
        .andExpect(jsonPath("$.motivo").value("Se acabó la bandeja"));
  }

  @Test
  void comercianteCancelaEnPreparacionConMotivoObligatorio() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));
    accion(tokenComerciante, id, "ACEPTAR", null).andExpect(status().isOk());

    accion(tokenComerciante, id, "CANCELAR", null)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));

    accion(tokenComerciante, id, "CANCELAR", "No alcanzamos a prepararlo")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADO"))
        .andExpect(jsonPath("$.motivo").value("No alcanzamos a prepararlo"));
  }

  @Test
  void comercianteAjenoNoPuedeGestionarElPedido() throws Exception {
    long pedidoId = sembrarPedido(cliente, aprobado, bandeja, "EN_LOCAL").getId();

    accion(tokenComercianteAjeno, pedidoId, "ACEPTAR", null)
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  @Test
  void clienteNoPuedeAceptarDa403() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));
    accion(tokenCliente, id, "ACEPTAR", null).andExpect(status().isForbidden());
  }

  @Test
  void clienteCancelaSuPedidoPendiente() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));
    accion(tokenCliente, id, "CANCELAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADO"));
  }

  @Test
  void clienteNoCancelaUnPedidoYaAceptadoDa409() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));
    accion(tokenComerciante, id, "ACEPTAR", null).andExpect(status().isOk());

    accion(tokenCliente, id, "CANCELAR", null).andExpect(status().isConflict());
  }

  @Test
  void clienteAjenoNoVeElPedido() throws Exception {
    long id = idDe(crear("EN_LOCAL", linea(bandeja, 1)).andExpect(status().isCreated()));
    mvc.perform(get("/api/v1/pedidos/" + id).header("Authorization", tokenOtroCliente))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  // ---- RF-31: historial ----

  @Test
  void historialFiltraPorEstado() throws Exception {
    var pendiente = sembrarPedido(cliente, aprobado, bandeja, "EN_LOCAL");
    var completado = sembrarPedido(cliente, aprobado, bandeja, "EN_LOCAL");
    completado.aceptar();
    completado.marcarListo();
    completado.completar();
    pedidos.save(completado);
    var rechazado = sembrarPedido(cliente, aprobado, bandeja, "EN_LOCAL");
    rechazado.rechazar("Sin stock");
    pedidos.save(rechazado);

    mvc.perform(get("/api/v1/pedidos").header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3));

    mvc.perform(
            get("/api/v1/pedidos").param("estado", "COMPLETADO")
                .header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].estado").value("COMPLETADO"))
        .andExpect(jsonPath("$[0].id").value(completado.getId()));

    mvc.perform(
            get("/api/v1/pedidos").param("estado", "PENDIENTE")
                .header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(pendiente.getId()));
  }

  @Test
  void comercianteVeSoloLosPedidosDeSuNegocio() throws Exception {
    sembrarPedido(cliente, aprobado, bandeja, "EN_LOCAL");
    sembrarPedido(otroCliente, ajeno, deOtroNegocio, "EN_LOCAL");

    mvc.perform(get("/api/v1/pedidos").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].negocioId").value(aprobado.getId()));

    mvc.perform(get("/api/v1/pedidos").header("Authorization", tokenComercianteAjeno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].negocioId").value(ajeno.getId()));
  }

  @Test
  void administradorVeTodosLosPedidos() throws Exception {
    sembrarPedido(cliente, aprobado, bandeja, "EN_LOCAL");
    var ajenoPedido = sembrarPedido(otroCliente, ajeno, deOtroNegocio, "EN_LOCAL");

    mvc.perform(get("/api/v1/pedidos").header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2));

    mvc.perform(get("/api/v1/pedidos/" + ajenoPedido.getId()).header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.negocioId").value(ajeno.getId()));
  }
}
