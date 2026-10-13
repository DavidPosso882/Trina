package co.edu.uniquindio.trina.pago;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.admin.AuditoriaRepository;
import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.membresia.MembresiaPlan;
import co.edu.uniquindio.trina.membresia.MembresiaPlanRepository;
import co.edu.uniquindio.trina.membresia.MembresiaSuscripcion;
import co.edu.uniquindio.trina.membresia.MembresiaSuscripcionRepository;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.pedido.Pedido;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
 * RED→GREEN: pago simulado y comisión (RF-28/RF-29) cerrando los gaps del slice de pedidos
 * (RF-25/RF-27). Los códigos siguen §5.9: 422 regla, 409 conflicto/transición, 403 ajeno, 401 sin
 * sesión, 404 inexistente, 400 falta la clave de idempotencia.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PagoControllerTest {

  private static final String TARJETA_APROBADA = "4111 1111 1111 1111";
  private static final String TARJETA_RECHAZADA = "4000000000000002";

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired CatalogoItemRepository items;
  @Autowired PedidoRepository pedidos;
  @Autowired PagoRepository pagos;
  @Autowired MembresiaPlanRepository planes;
  @Autowired MembresiaSuscripcionRepository suscripciones;
  @Autowired AuditoriaRepository auditorias;
  @Autowired PagoService pagoService;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private Usuario cliente;
  private Usuario otroCliente;
  private Usuario comerciante;
  private Negocio aprobado;
  private CatalogoItem caro;
  private CatalogoItem barato;
  private MembresiaPlan destacada;
  private String tokenCliente;
  private String tokenOtroCliente;
  private String tokenComerciante;
  private String tokenComercianteAjeno;
  private String tokenAdmin;

  @BeforeEach
  void sembrar() {
    limpiar();
    var rubro = rubros.save(new CategoriaNegocio("Restaurantes"));
    comerciante =
        usuarios.save(
            new Usuario("comercio@trina.co", claves.encode("clave1234"), "Comercio", "COMERCIANTE"));
    var comercianteAjeno =
        usuarios.save(
            new Usuario("ajeno@trina.co", claves.encode("clave1234"), "Ajeno", "COMERCIANTE"));
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
    // RF-29 E1: un pedido de $100.000 debe dejar $5.000 de comisión y $95.000 de neto.
    caro =
        items.save(
            CatalogoItem.crear(aprobado, null, "producto", "Bandeja paisa", null, 100_000, null));
    barato =
        items.save(
            CatalogoItem.crear(aprobado, null, "producto", "Jugo de lulo", null, 25_000, null));

    destacada = planes.save(new MembresiaPlan("DESTACADA", "Destacada", 19_900, 6, true));

    tokenCliente = bearer(cliente);
    tokenOtroCliente = bearer(otroCliente);
    tokenComerciante = bearer(comerciante);
    tokenComercianteAjeno = bearer(comercianteAjeno);
    tokenAdmin = bearer(admin);
  }

  @AfterEach
  void limpiar() {
    // El pago referencia al pedido y la suscripción referencia al negocio y al plan: se borran primero.
    pagos.deleteAll();
    pedidos.deleteAll();
    suscripciones.deleteAll();
    planes.deleteAll();
    auditorias.deleteAll();
    items.deleteAll();
    negocios.deleteAll();
    rubros.deleteAll();
    usuarios.deleteAll();
  }

  // ---- Apoyo ----

  private String bearer(Usuario u) {
    return "Bearer " + jwt.generar(u.getId(), u.getRol(), u.getTokenVersion());
  }

  private String cuerpoPago(long pedidoId, String tarjeta) throws Exception {
    return json.writeValueAsString(Map.of("pedidoId", pedidoId, "tarjeta", tarjeta));
  }

  private long crearSandbox(CatalogoItem item, int cantidad) throws Exception {
    var respuesta =
        mvc.perform(
                post("/api/v1/pedidos")
                    .header("Authorization", tokenCliente)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of(
                                "negocioId", aprobado.getId(),
                                "metodoPago", "SANDBOX",
                                "items", List.of(Map.of("itemId", item.getId(), "cantidad", cantidad))))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
            .andReturn();
    return json.readTree(respuesta.getResponse().getContentAsString()).get("id").asLong();
  }

  private ResultActions pagar(long pedidoId, String tarjeta, String clave) throws Exception {
    return mvc.perform(
        post("/api/v1/pagos")
            .header("Authorization", tokenCliente)
            .header("Idempotency-Key", clave)
            .contentType(MediaType.APPLICATION_JSON)
            .content(cuerpoPago(pedidoId, tarjeta)));
  }

  private ResultActions pagarSuscripcion(
      long suscripcionId, String tarjeta, String clave, String token) throws Exception {
    return mvc.perform(
        post("/api/v1/pagos")
            .header("Authorization", token)
            .header("Idempotency-Key", clave)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                json.writeValueAsString(
                    Map.of("suscripcionId", suscripcionId, "tarjeta", tarjeta))));
  }

  /** RF-34: deja una suscripción PENDIENTE_PAGO con la ventana ya planificada por RF-36. */
  private long suscripcionPendiente(Instant inicio, Instant fin) {
    return suscripciones
        .save(MembresiaSuscripcion.pendiente(aprobado, destacada, inicio, fin))
        .getId();
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

  private long idDe(ResultActions respuesta) throws Exception {
    return json
        .readTree(respuesta.andReturn().getResponse().getContentAsString())
        .get("pagoId")
        .asLong();
  }

  private String estadoDelPedido(long pedidoId) {
    return pedidos.findById(pedidoId).orElseThrow().getEstado();
  }

  // ---- RF-28 E1 y RF-29 E1: aprobado ----

  @Test
  void pagoAprobadoPasaElPedidoAPendienteYRegistraLaComision() throws Exception {
    long pedidoId = crearSandbox(caro, 1);

    long pagoId =
        idDe(
            pagar(pedidoId, TARJETA_APROBADA, "clave-aprobado")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("APROBADO"))
                .andExpect(jsonPath("$.montoCop").value(100_000))
                .andExpect(jsonPath("$.comisionCop").value(5_000))
                .andExpect(jsonPath("$.netoCop").value(95_000)));

    assertEquals(Pedido.PENDIENTE, estadoDelPedido(pedidoId));
    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"))
        .andExpect(jsonPath("$.montoCop").value(100_000))
        .andExpect(jsonPath("$.comisionCop").value(5_000))
        .andExpect(jsonPath("$.netoCop").value(95_000))
        .andExpect(jsonPath("$.marcaTarjeta").value("VISA"))
        .andExpect(jsonPath("$.ultimos4").value("1111"));
  }

  // ---- RF-28 E2: rechazado ----

  @Test
  void pagoRechazadoInformaElMotivoYSiguePendientePago() throws Exception {
    long pedidoId = crearSandbox(caro, 1);

    long pagoId =
        idDe(
            pagar(pedidoId, TARJETA_RECHAZADA, "clave-rechazo")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("RECHAZADO"))
                .andExpect(jsonPath("$.motivo", containsString("Fondos")))
                .andExpect(jsonPath("$.comisionCop").value(0)));

    assertEquals(Pedido.PENDIENTE_PAGO, estadoDelPedido(pedidoId));
    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADO"))
        .andExpect(jsonPath("$.comisionCop").value(0))
        .andExpect(jsonPath("$.netoCop").value(100_000));
  }

  @Test
  void reintentarPagoRechazadoConOtraClaveApruebaYDejaComision() throws Exception {
    long pedidoId = crearSandbox(caro, 1);

    pagar(pedidoId, TARJETA_RECHAZADA, "clave-fallida")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADO"));

    pagar(pedidoId, TARJETA_APROBADA, "clave-buena")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"))
        .andExpect(jsonPath("$.comisionCop").value(5_000));

    assertEquals(Pedido.PENDIENTE, estadoDelPedido(pedidoId));
    assertEquals(2, pagos.count());
  }

  // ---- RF-28 E3: idempotencia ----

  @Test
  void dobleEnvioConLaMismaClaveCobraUnaSolaVez() throws Exception {
    long pedidoId = crearSandbox(caro, 1);

    long primerPago =
        idDe(
            pagar(pedidoId, TARJETA_APROBADA, "clave-unica")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("APROBADO")));

    long segundoPago =
        idDe(
            pagar(pedidoId, TARJETA_APROBADA, "clave-unica")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("APROBADO"))
                .andExpect(jsonPath("$.pagoId").value(primerPago)));

    assertEquals(primerPago, segundoPago);
    assertEquals(1, pagos.count());
    assertEquals(Pedido.PENDIENTE, estadoDelPedido(pedidoId));
  }

  @Test
  void unaClaveNuevaSobreUnPedidoYaPagadoDa409() throws Exception {
    long pedidoId = crearSandbox(caro, 1);
    pagar(pedidoId, TARJETA_APROBADA, "clave-uno").andExpect(status().isOk());

    pagar(pedidoId, TARJETA_APROBADA, "clave-dos")
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));
  }

  // ---- RF-27 E2 y §5.1: reembolso simulado ----

  @Test
  void reembolsaElPagoAlRechazarElPedidoPagado() throws Exception {
    long pedidoId = crearSandbox(caro, 1);
    long pagoId = idDe(pagar(pedidoId, TARJETA_APROBADA, "clave-reembolso").andExpect(status().isOk()));

    accion(tokenComerciante, pedidoId, "RECHAZAR", "Se acabó la bandeja")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADO"));

    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("REEMBOLSADO"))
        .andExpect(jsonPath("$.comisionCop").value(0))
        .andExpect(jsonPath("$.netoCop").value(100_000));
  }

  @Test
  void reembolsaElPagoAlCancelarElClienteUnPedidoPagado() throws Exception {
    long pedidoId = crearSandbox(caro, 1);
    long pagoId = idDe(pagar(pedidoId, TARJETA_APROBADA, "clave-cancela").andExpect(status().isOk()));

    accion(tokenCliente, pedidoId, "CANCELAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADO"));

    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("REEMBOLSADO"))
        .andExpect(jsonPath("$.comisionCop").value(0));
  }

  @Test
  void reembolsaElPagoAlCancelarElComerciante() throws Exception {
    long pedidoId = crearSandbox(caro, 1);
    long pagoId = idDe(pagar(pedidoId, TARJETA_APROBADA, "clave-premium").andExpect(status().isOk()));
    accion(tokenComerciante, pedidoId, "ACEPTAR", null).andExpect(status().isOk());

    accion(tokenComerciante, pedidoId, "CANCELAR", "No alcanzamos a prepararlo")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADO"));

    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("REEMBOLSADO"));
  }

  // ---- §5.1: cancelación desde PENDIENTE_PAGO y expiración ----

  @Test
  void clienteCancelaUnPedidoPendientePago() throws Exception {
    long pedidoId = crearSandbox(barato, 1);

    accion(tokenCliente, pedidoId, "CANCELAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADO"));

    assertEquals(Pedido.CANCELADO, estadoDelPedido(pedidoId));
    assertEquals(0, pagos.count());
  }

  @Test
  void pedidoVencidoSeCancelaSoloYElFrescoSigueEsperandoPago() throws Exception {
    long viejo = crearSandbox(caro, 1);
    var pedidoViejo = pedidos.findById(viejo).orElseThrow();
    pedidoViejo.ajustarCreadoEn(Instant.now().minus(31, ChronoUnit.MINUTES));
    pedidos.save(pedidoViejo);
    long fresco = crearSandbox(caro, 1);

    pagoService.cancelarPendientesVencidos();

    assertEquals(Pedido.CANCELADO, estadoDelPedido(viejo));
    assertEquals(Pedido.PENDIENTE_PAGO, estadoDelPedido(fresco));
  }

  // ---- §5.9: validaciones y accesos ----

  @Test
  void sinClaveDeIdempotenciaDa400YNoCobra() throws Exception {
    long pedidoId = crearSandbox(caro, 1);

    mvc.perform(
            post("/api/v1/pagos")
                .header("Authorization", tokenCliente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpoPago(pedidoId, TARJETA_APROBADA)))
        .andExpect(status().isBadRequest());

    assertEquals(Pedido.PENDIENTE_PAGO, estadoDelPedido(pedidoId));
    assertEquals(0, pagos.count());
  }

  @Test
  void noSePuedePagarElPedidoDeOtroCliente() throws Exception {
    long pedidoId = crearSandbox(caro, 1);

    mvc.perform(
            post("/api/v1/pagos")
                .header("Authorization", tokenOtroCliente)
                .header("Idempotency-Key", "clave-ajena")
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpoPago(pedidoId, TARJETA_APROBADA)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));

    assertEquals(0, pagos.count());
  }

  @Test
  void pagarUnPedidoInexistenteDa404() throws Exception {
    mvc.perform(
            post("/api/v1/pagos")
                .header("Authorization", tokenCliente)
                .header("Idempotency-Key", "clave-fantasma")
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpoPago(999_999L, TARJETA_APROBADA)))
        .andExpect(status().isNotFound());
  }

  @Test
  void elPagoLoVenSuClienteSuComercianteYElAdmin() throws Exception {
    long pedidoId = crearSandbox(caro, 1);
    long pagoId = idDe(pagar(pedidoId, TARJETA_APROBADA, "clave-visible").andExpect(status().isOk()));

    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(pagoId));
    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenAdmin))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/pagos/" + pagoId).header("Authorization", tokenOtroCliente))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  // ---- RF-34/RF-36: el cobro de la suscripción Destacada ----

  @Test
  void cobrarLaSuscripcionAprobadaLaActivaConLaVentanaPlanificadaYPlanDestacada() throws Exception {
    Instant inicio = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    Instant fin = inicio.plus(30, ChronoUnit.DAYS);
    long suscripcionId = suscripcionPendiente(inicio, fin);

    pagarSuscripcion(suscripcionId, TARJETA_APROBADA, "clave-suscripcion-ok", tokenComerciante)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"))
        .andExpect(jsonPath("$.montoCop").value(19_900))
        .andExpect(jsonPath("$.comisionCop").value(0))
        .andExpect(jsonPath("$.netoCop").value(19_900))
        .andExpect(jsonPath("$.suscripcionId").value(suscripcionId));

    var activada = suscripciones.findById(suscripcionId).orElseThrow();
    assertEquals("ACTIVA", activada.getEstado());
    assertEquals(fin, activada.getFin(), "RF-36: se respeta la ventana ya planificada");
    assertEquals(1, auditorias.count());

    mvc.perform(
            get("/api/v1/membresias/mi-suscripcion").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("ACTIVA"))
        .andExpect(jsonPath("$.planEfectivo").value("DESTACADA"));
  }

  @Test
  void cobrarLaSuscripcionRechazadaLaDejaPendienteYElPlanSigueBasico() throws Exception {
    Instant inicio = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    long suscripcionId = suscripcionPendiente(inicio, inicio.plus(30, ChronoUnit.DAYS));

    pagarSuscripcion(suscripcionId, TARJETA_RECHAZADA, "clave-suscripcion-mala", tokenComerciante)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADO"));

    assertEquals(
        "PENDIENTE_PAGO", suscripciones.findById(suscripcionId).orElseThrow().getEstado());
    assertEquals(0, auditorias.count());

    mvc.perform(
            get("/api/v1/membresias/mi-suscripcion").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
        .andExpect(jsonPath("$.planEfectivo").value("BASICA"));
  }

  @Test
  void unPagoTardioDeUnaVentanaVencidaArrancaTreintaDiasDesdeAhora() throws Exception {
    Instant ahora = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    long suscripcionId =
        suscripcionPendiente(
            ahora.minus(40, ChronoUnit.DAYS), ahora.minus(10, ChronoUnit.DAYS));

    pagarSuscripcion(suscripcionId, TARJETA_APROBADA, "clave-suscripcion-tarde", tokenComerciante)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"));

    var activada = suscripciones.findById(suscripcionId).orElseThrow();
    assertEquals("ACTIVA", activada.getEstado());
    var fin = activada.getFin();
    assertTrue(fin.isAfter(Instant.now().plus(29, ChronoUnit.DAYS)));
    assertTrue(fin.isBefore(Instant.now().plus(31, ChronoUnit.DAYS)));
  }

  @Test
  void repetirLaClaveDeUnaSuscripcionNoCobraDosVeces() throws Exception {
    long suscripcionId =
        suscripcionPendiente(
            Instant.now().truncatedTo(ChronoUnit.MILLIS),
            Instant.now().truncatedTo(ChronoUnit.MILLIS).plus(30, ChronoUnit.DAYS));

    long primerPago =
        idDe(
            pagarSuscripcion(
                    suscripcionId, TARJETA_APROBADA, "clave-suscripcion-unica", tokenComerciante)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("APROBADO")));

    long segundoPago =
        idDe(
            pagarSuscripcion(
                    suscripcionId, TARJETA_APROBADA, "clave-suscripcion-unica", tokenComerciante)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagoId").value(primerPago)));

    assertEquals(primerPago, segundoPago);
    assertEquals(1, pagos.count());
  }

  @Test
  void noSePuedePagarLaSuscripcionDeOtroComerciante() throws Exception {
    long suscripcionId =
        suscripcionPendiente(
            Instant.now().truncatedTo(ChronoUnit.MILLIS),
            Instant.now().truncatedTo(ChronoUnit.MILLIS).plus(30, ChronoUnit.DAYS));

    pagarSuscripcion(suscripcionId, TARJETA_APROBADA, "clave-suscripcion-ajena", tokenComercianteAjeno)
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));

    assertEquals(0, pagos.count());
  }

  @Test
  void pagarUnaSuscripcionInexistenteDa404() throws Exception {
    pagarSuscripcion(999_999L, TARJETA_APROBADA, "clave-suscripcion-fantasma", tokenComerciante)
        .andExpect(status().isNotFound());
  }

  @Test
  void pagarUnaSuscripcionYaActivaDa409() throws Exception {
    long suscripcionId =
        suscripcionPendiente(
            Instant.now().truncatedTo(ChronoUnit.MILLIS),
            Instant.now().truncatedTo(ChronoUnit.MILLIS).plus(30, ChronoUnit.DAYS));
    var suscripcion = suscripciones.findById(suscripcionId).orElseThrow();
    suscripcion.activar(Instant.now());
    suscripciones.save(suscripcion);

    pagarSuscripcion(suscripcionId, TARJETA_APROBADA, "clave-suscripcion-activa", tokenComerciante)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));
  }

  @Test
  void repetirLaClaveDeUnCobroRechazadoNoActivaLaSuscripcion() throws Exception {
    Instant inicio = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    long suscripcionId = suscripcionPendiente(inicio, inicio.plus(30, ChronoUnit.DAYS));

    long primerPago =
        idDe(
            pagarSuscripcion(
                    suscripcionId, TARJETA_RECHAZADA, "clave-rechazo-unica", tokenComerciante)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("RECHAZADO"))
                .andExpect(jsonPath("$.motivo", containsString("Fondos"))));

    long segundoPago =
        idDe(
            pagarSuscripcion(
                    suscripcionId, TARJETA_RECHAZADA, "clave-rechazo-unica", tokenComerciante)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagoId").value(primerPago))
                .andExpect(jsonPath("$.estado").value("RECHAZADO")));

    assertEquals(primerPago, segundoPago);
    assertEquals(1, pagos.count());
    assertEquals(
        "PENDIENTE_PAGO", suscripciones.findById(suscripcionId).orElseThrow().getEstado());
    assertEquals(0, auditorias.count());
  }

  @Test
  void sinSesionDa401() throws Exception {
    long pedidoId = crearSandbox(caro, 1);

    mvc.perform(
            post("/api/v1/pagos")
                .header("Idempotency-Key", "clave-sin-sesion")
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpoPago(pedidoId, TARJETA_APROBADA)))
        .andExpect(status().isUnauthorized());
  }
}
