package co.edu.uniquindio.trina.estadistica;

import static org.hamcrest.Matchers.closeTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import co.edu.uniquindio.trina.pago.Pago;
import co.edu.uniquindio.trina.pago.PagoRepository;
import co.edu.uniquindio.trina.pedido.Pedido;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import co.edu.uniquindio.trina.reserva.Reserva;
import co.edu.uniquindio.trina.reserva.ReservaRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RED→GREEN: estadísticas RF-40 (resumen del Comerciante), RF-41 (panel del Administrador) y
 * RF-42 (ranking de productos más vistos). Los códigos siguen §5.9: 403 rol/aislamiento, 401 sin
 * sesión, 422 periodo inválido. Las vistas diarias se incrementan al abrir el perfil (RF-10) y el
 * catálogo público (RF-17); el ranking top se siembra llamando al servicio para controlar conteos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EstadisticaControllerTest {

  @Autowired MockMvc mvc;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired CatalogoItemRepository items;
  @Autowired PedidoRepository pedidos;
  @Autowired ReservaRepository reservas;
  @Autowired PagoRepository pagos;
  @Autowired MembresiaPlanRepository planes;
  @Autowired MembresiaSuscripcionRepository suscripciones;
  @Autowired VistaPerfilDiariaRepository vistasPerfil;
  @Autowired VistaItemDiariaRepository vistasItem;
  @Autowired EstadisticaService estadisticas;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;
  @Autowired JdbcTemplate jdbc;

  private Usuario cliente;
  private Negocio negocioPropio;
  private Negocio negocioAjeno;
  private CatalogoItem bandeja;
  private CatalogoItem jugo;
  private String tokenPropio;
  private String tokenAjeno;
  private String tokenCliente;
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
    var comercianteBorrador =
        usuarios.save(
            new Usuario("borrador@trina.co", claves.encode("clave1234"), "Borrador", "COMERCIANTE"));
    cliente =
        usuarios.save(
            new Usuario("cliente@trina.co", claves.encode("clave1234"), "Cliente", "CLIENTE"));
    var admin =
        usuarios.save(
            new Usuario("admin@trina.co", claves.encode("clave1234"), "Admin", "ADMINISTRADOR"));
    admin.setEsResidente(false);
    usuarios.save(admin);

    negocioPropio = negocios.save(Negocio.publicado(comerciante, rubro, "Sabor Trina"));
    negocioAjeno = negocios.save(Negocio.publicado(comercianteAjeno, rubro, "Café Ajeno"));
    negocios.save(Negocio.borrador(comercianteBorrador, rubro, "Cocina Oculta"));

    bandeja =
        items.save(
            CatalogoItem.crear(negocioPropio, null, "producto", "Bandeja paisa", null, 20000, null));
    jugo =
        items.save(
            CatalogoItem.crear(negocioPropio, null, "producto", "Jugo de lulo", null, 5000, null));
    items.save(
        CatalogoItem.crear(negocioAjeno, null, "producto", "Tinto", null, 4000, null));

    // Sin setter público de aceptaReservas: se configura por SQL (mismo criterio que ReservaControllerTest).
    jdbc.update("UPDATE negocio SET acepta_reservas = true WHERE id = ?", negocioPropio.getId());

    tokenPropio = bearer(comerciante);
    tokenAjeno = bearer(comercianteAjeno);
    tokenCliente = bearer(cliente);
    tokenAdmin = bearer(admin);
  }

  @AfterEach
  void limpiar() {
    vistasItem.deleteAll();
    vistasPerfil.deleteAll();
    pagos.deleteAll();
    pedidos.deleteAll();
    reservas.deleteAll();
    suscripciones.deleteAll();
    planes.deleteAll();
    items.deleteAll();
    negocios.deleteAll();
    rubros.deleteAll();
    usuarios.deleteAll();
  }

  // ---- Apoyo ----

  private String bearer(Usuario u) {
    return "Bearer " + jwt.generar(u.getId(), u.getRol(), u.getTokenVersion());
  }

  private Pedido pedido(String estadoFinal) {
    var pedido =
        Pedido.crear(
            cliente, negocioPropio, "EN_LOCAL", null, List.of(new Pedido.Linea(bandeja, 1)));
    switch (estadoFinal) {
      case "COMPLETADO" -> {
        pedido.aceptar();
        pedido.marcarListo();
        pedido.completar();
      }
      case "PENDIENTE" -> {}
      default -> throw new IllegalArgumentException("Estado de prueba no soportado.");
    }
    return pedidos.save(pedido);
  }

  // ---- RF-40: resumen del Comerciante ----

  @Test
  void visitasCuentanAlAbrirPerfil() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + negocioPropio.getId())).andExpect(status().isOk());
    mvc.perform(get("/api/v1/negocios/" + negocioPropio.getId())).andExpect(status().isOk());

    mvc.perform(
            get("/api/v1/mi-negocio/estadisticas")
                .param("dias", "7")
                .header("Authorization", tokenPropio))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dias").value(7))
        .andExpect(jsonPath("$.visitas").value(2))
        .andExpect(jsonPath("$.pedidos").value(0))
        .andExpect(jsonPath("$.reservas").value(0))
        .andExpect(jsonPath("$.ingresosCop").value(0));
  }

  @Test
  void resumenConDatosSembrados() throws Exception {
    pedido("COMPLETADO");
    pedido("PENDIENTE");
    reservas.save(
        Reserva.crear(
            cliente,
            negocioPropio,
            Instant.now().plus(2, ChronoUnit.DAYS),
            Instant.now().plus(2, ChronoUnit.DAYS).plus(1, ChronoUnit.HOURS),
            2,
            null));

    mvc.perform(
            get("/api/v1/mi-negocio/estadisticas")
                .param("dias", "30")
                .header("Authorization", tokenPropio))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dias").value(30))
        .andExpect(jsonPath("$.pedidos").value(2))
        .andExpect(jsonPath("$.reservas").value(1))
        .andExpect(jsonPath("$.ingresosCop").value(20000));
  }

  @Test
  void comercianteAjenoVeCerosEnSuPropioNegocio() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + negocioPropio.getId())).andExpect(status().isOk());
    pedido("COMPLETADO");

    mvc.perform(
            get("/api/v1/mi-negocio/estadisticas")
                .param("dias", "7")
                .header("Authorization", tokenAjeno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.visitas").value(0))
        .andExpect(jsonPath("$.pedidos").value(0));
  }

  @Test
  void periodoInvalidoDa422() throws Exception {
    mvc.perform(
            get("/api/v1/mi-negocio/estadisticas")
                .param("dias", "15")
                .header("Authorization", tokenPropio))
        .andExpect(status().isUnprocessableEntity());
  }

  // ---- RF-42: productos más vistos ----

  @Test
  void rankingTopOrdenaYRespetaElLimite() throws Exception {
    estadisticas.registrarVistaItem(bandeja.getId());
    estadisticas.registrarVistaItem(bandeja.getId());
    estadisticas.registrarVistaItem(bandeja.getId());
    estadisticas.registrarVistaItem(jugo.getId());

    mvc.perform(
            get("/api/v1/mi-negocio/productos-mas-vistos")
                .param("dias", "7")
                .param("limite", "1")
                .header("Authorization", tokenPropio))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].itemId").value(bandeja.getId()))
        .andExpect(jsonPath("$[0].nombre").value("Bandeja paisa"))
        .andExpect(jsonPath("$[0].visitas").value(3));

    mvc.perform(
            get("/api/v1/mi-negocio/productos-mas-vistos")
                .param("dias", "7")
                .param("limite", "5")
                .header("Authorization", tokenPropio))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[1].itemId").value(jugo.getId()))
        .andExpect(jsonPath("$[1].visitas").value(1));
  }

  @Test
  void abrirCatalogoCuentaVistaDeSusItems() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + negocioPropio.getId() + "/catalogo"))
        .andExpect(status().isOk());

    mvc.perform(
            get("/api/v1/mi-negocio/productos-mas-vistos")
                .param("dias", "7")
                .header("Authorization", tokenPropio))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].visitas").value(1))
        .andExpect(jsonPath("$[1].visitas").value(1));
  }

  // ---- RF-41: panel del Administrador ----

  @Test
  void panelAdminConDatosSembrados() throws Exception {
    var pedido = pedido("PENDIENTE");
    var pago = Pago.iniciar(pedido, "4111111111111111", "clave-admin-1");
    pago.aprobar("ref-admin-1", 1000);
    pagos.save(pago);

    var plan = planes.save(new MembresiaPlan("DESTACADA", "Destacada", 19900, 6, true));
    var activa = MembresiaSuscripcion.pendiente(negocioPropio, plan, null, null);
    activa.activar(Instant.now());
    suscripciones.save(activa);
    var vencida = MembresiaSuscripcion.pendiente(negocioAjeno, plan, null, null);
    vencida.activar(Instant.now());
    vencida.vencer();
    suscripciones.save(vencida);

    mvc.perform(get("/api/v1/admin/estadisticas").header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.negociosPorEstado.length()").value(2))
        .andExpect(jsonPath("$.negociosPorEstado[0].estado").value("BORRADOR"))
        .andExpect(jsonPath("$.negociosPorEstado[0].cantidad").value(1))
        .andExpect(jsonPath("$.negociosPorEstado[1].estado").value("APROBADO"))
        .andExpect(jsonPath("$.negociosPorEstado[1].cantidad").value(2))
        .andExpect(jsonPath("$.usuariosPorRol.length()").value(3))
        .andExpect(jsonPath("$.usuariosPorRol[0].rol").value("CLIENTE"))
        .andExpect(jsonPath("$.usuariosPorRol[0].cantidad").value(1))
        .andExpect(jsonPath("$.usuariosPorRol[1].rol").value("COMERCIANTE"))
        .andExpect(jsonPath("$.usuariosPorRol[1].cantidad").value(3))
        .andExpect(jsonPath("$.usuariosPorRol[2].rol").value("ADMINISTRADOR"))
        .andExpect(jsonPath("$.usuariosPorRol[2].cantidad").value(1))
        .andExpect(jsonPath("$.usuariosTotales").value(5))
        .andExpect(jsonPath("$.pedidosTotales").value(1))
        .andExpect(jsonPath("$.comisionesCop").value(1000))
        .andExpect(jsonPath("$.membresiasActivas").value(1))
        .andExpect(jsonPath("$.usuariosNoResidentes").value(1))
        .andExpect(jsonPath("$.proporcionNoResidentes").value(closeTo(0.2, 0.001)));
  }

  // ---- §5.9: códigos ----

  @Test
  void comercianteNoEntraAlPanelAdminDa403() throws Exception {
    mvc.perform(get("/api/v1/admin/estadisticas").header("Authorization", tokenPropio))
        .andExpect(status().isForbidden());
  }

  @Test
  void clienteNoVeEstadisticasDelComercianteDa403() throws Exception {
    mvc.perform(
            get("/api/v1/mi-negocio/estadisticas").header("Authorization", tokenCliente))
        .andExpect(status().isForbidden());
  }

  @Test
  void sinSesionDa401() throws Exception {
    mvc.perform(get("/api/v1/mi-negocio/estadisticas")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/admin/estadisticas")).andExpect(status().isUnauthorized());
  }
}
