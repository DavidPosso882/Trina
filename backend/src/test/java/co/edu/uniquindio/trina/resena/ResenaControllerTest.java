package co.edu.uniquindio.trina.resena;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.pedido.Pedido;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import co.edu.uniquindio.trina.reserva.Reserva;
import co.edu.uniquindio.trina.reserva.ReservaRepository;
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
 * RED→GREEN: reseñas P3 (RF-38/RF-39, D-09/RN-08). Una reseña por cliente y negocio con insignia
 * "Compra verificada" si hay pedido o reserva COMPLETADA; el promedio se calcula solo con las
 * visibles. Los códigos siguen §5.9: 422 regla, 409 conflicto, 403 ajeno/rol, 401 sin sesión,
 * 404 inexistente o negocio no aprobado.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResenaControllerTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired CatalogoItemRepository items;
  @Autowired PedidoRepository pedidos;
  @Autowired ReservaRepository reservas;
  @Autowired ResenaRepository resenas;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private Usuario cliente;
  private Usuario otroCliente;
  private Usuario comerciante;
  private Negocio aprobado;
  private Negocio borrador;
  private CatalogoItem item;
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
    borrador = negocios.save(Negocio.borrador(duenoBorrador, rubro, "Cocina Oculta"));
    item =
        items.save(
            CatalogoItem.crear(aprobado, null, "producto", "Bandeja paisa", null, 100_000, null));

    tokenCliente = bearer(cliente);
    tokenOtroCliente = bearer(otroCliente);
    tokenComerciante = bearer(comerciante);
    tokenComercianteAjeno = bearer(comercianteAjeno);
    tokenAdmin = bearer(admin);
  }

  @AfterEach
  void limpiar() {
    // La reseña referencia negocio y cliente; el pedido y la reserva también: se borran primero.
    resenas.deleteAll();
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

  private ResultActions publicar(String token, long negocioId, int calificacion, String comentario)
      throws Exception {
    return mvc.perform(
        post("/api/v1/negocios/" + negocioId + "/resenas")
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                json.writeValueAsString(
                    Map.of("calificacion", calificacion, "comentario", comentario))));
  }

  private ResultActions editar(String token, long resenaId, int calificacion, String comentario)
      throws Exception {
    return mvc.perform(
        put("/api/v1/resenas/" + resenaId)
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                json.writeValueAsString(
                    Map.of("calificacion", calificacion, "comentario", comentario))));
  }

  private ResultActions reportar(String token, long resenaId, String motivo) throws Exception {
    var cuerpo = new HashMap<String, Object>();
    if (motivo != null) {
      cuerpo.put("motivo", motivo);
    }
    return mvc.perform(
        post("/api/v1/resenas/" + resenaId + "/reportar")
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(cuerpo)));
  }

  private ResultActions moderar(String token, long resenaId, boolean visible) throws Exception {
    return mvc.perform(
        patch("/api/v1/admin/resenas/" + resenaId + "/visibilidad")
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("visible", visible))));
  }

  private long idDe(ResultActions respuesta) throws Exception {
    return json
        .readTree(respuesta.andReturn().getResponse().getContentAsString())
        .get("id")
        .asLong();
  }

  private long publicarYDevolverId(String token, int calificacion, String comentario)
      throws Exception {
    return idDe(publicar(token, aprobado.getId(), calificacion, comentario)
        .andExpect(status().isCreated()));
  }

  /** D-09: pedido EN_LOCAL llevado hasta COMPLETADO en el negocio. */
  private void pedidoCompletado(Usuario dueno) {
    var pedido =
        Pedido.crear(dueno, aprobado, "EN_LOCAL", null, List.of(new Pedido.Linea(item, 1)));
    pedido.aceptar();
    pedido.marcarListo();
    pedido.completar();
    pedidos.save(pedido);
  }

  /** D-09: reserva confirmada y luego COMPLETADA en el negocio. */
  private void reservaCompletada(Usuario dueno) {
    var inicio = Instant.now().plus(1, ChronoUnit.DAYS);
    var reserva =
        Reserva.crear(dueno, aprobado, inicio, inicio.plus(1, ChronoUnit.HOURS), 2, null);
    reserva.confirmar();
    reserva.completar();
    reservas.save(reserva);
  }

  // ---- RF-38: publicación y promedio ----

  @Test
  void unNegocioSinResenasTieneListadoVacioYPromedioNulo() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/resenas"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cantidad").value(0))
        .andExpect(jsonPath("$.promedio").value(nullValue()))
        .andExpect(jsonPath("$.resenas.length()").value(0));
  }

  @Test
  void conPedidoCompletadoLaResenaSePublicaVerificada() throws Exception {
    pedidoCompletado(cliente);

    publicar(tokenCliente, aprobado.getId(), 5, "Espectacular la bandeja.")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.calificacion").value(5))
        .andExpect(jsonPath("$.verificada").value(true))
        .andExpect(jsonPath("$.visible").value(true))
        .andExpect(jsonPath("$.reportada").value(false))
        .andExpect(jsonPath("$.clienteId").value(cliente.getId()));

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/resenas"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cantidad").value(1))
        .andExpect(jsonPath("$.promedio").value(5.0))
        .andExpect(jsonPath("$.resenas[0].verificada").value(true))
        .andExpect(jsonPath("$.resenas[0].comentario").value("Espectacular la bandeja."));
  }

  @Test
  void conReservaCompletadaTambienSePublicaVerificada() throws Exception {
    reservaCompletada(otroCliente);

    publicar(tokenOtroCliente, aprobado.getId(), 4, "Muy buena atención.")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.verificada").value(true));
  }

  @Test
  void sinComprasLaResenaSePublicaSinInsignia() throws Exception {
    publicar(tokenCliente, aprobado.getId(), 4, "Rica la comida.")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.verificada").value(false));
  }

  @Test
  void laSegundaResenaDelMismoClienteDa409EInvitaAEditar() throws Exception {
    publicar(tokenCliente, aprobado.getId(), 5, "Primera.").andExpect(status().isCreated());

    publicar(tokenCliente, aprobado.getId(), 3, "Segunda.")
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"))
        .andExpect(jsonPath("$.mensaje", containsString("Ya reseñaste")));
  }

  @Test
  void elAutorEditaSuResenaConPutYCambiaElPromedio() throws Exception {
    long resenaId = publicarYDevolverId(tokenCliente, 5, "Muy buena.");
    publicar(tokenOtroCliente, aprobado.getId(), 1, "No me gustó.")
        .andExpect(status().isCreated());

    editar(tokenCliente, resenaId, 3, "Mejoró con el tiempo.")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.calificacion").value(3))
        .andExpect(jsonPath("$.comentario").value("Mejoró con el tiempo."));

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/resenas"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cantidad").value(2))
        .andExpect(jsonPath("$.promedio").value(2.0));
  }

  // ---- RF-39: moderación ----

  @Test
  void reportarConMotivoLoDejaEnLaColaDelAdminYOcultarLoSacaDelPromedio() throws Exception {
    long reportada = publicarYDevolverId(tokenCliente, 5, "Excelente.");
    publicar(tokenOtroCliente, aprobado.getId(), 1, "Mala experiencia.")
        .andExpect(status().isCreated());

    reportar(tokenComerciante, reportada, "Lenguaje ofensivo.")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.reportada").value(true));

    mvc.perform(
            get("/api/v1/admin/resenas")
                .param("reportadas", "true")
                .header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(reportada))
        .andExpect(jsonPath("$[0].motivoReporte").value("Lenguaje ofensivo."));

    moderar(tokenAdmin, reportada, false)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.visible").value(false));

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/resenas"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cantidad").value(1))
        .andExpect(jsonPath("$.promedio").value(1.0))
        .andExpect(jsonPath("$.resenas[0].comentario").value("Mala experiencia."));

    // La reseña oculta sigue visible para el Administrador (permite volver a mostrarla).
    mvc.perform(get("/api/v1/admin/resenas").header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  void soloElComercianteDuenoPuedeReportar() throws Exception {
    long resenaId = publicarYDevolverId(tokenCliente, 5, "Mía.");

    reportar(tokenComercianteAjeno, resenaId, "No me consta.")
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  @Test
  void reportarSinMotivoDa422() throws Exception {
    long resenaId = publicarYDevolverId(tokenCliente, 5, "Mía.");

    reportar(tokenComerciante, resenaId, null)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
  }

  @Test
  void editarLaResenaDeOtroClienteDa403() throws Exception {
    long resenaId = publicarYDevolverId(tokenCliente, 5, "Mía.");

    editar(tokenOtroCliente, resenaId, 1, "Ajena.")
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  // ---- §5.9: códigos y visibilidad ----

  @Test
  void elListadoEsPublicoPeroPublicarExigeCliente() throws Exception {
    publicar(tokenCliente, aprobado.getId(), 5, "Pública.").andExpect(status().isCreated());

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/resenas"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cantidad").value(1));

    mvc.perform(
            post("/api/v1/negocios/" + aprobado.getId() + "/resenas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("calificacion", 5, "comentario", "Sin sesión."))))
        .andExpect(status().isUnauthorized());

    publicar(tokenComerciante, aprobado.getId(), 5, "No debería.")
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  @Test
  void moderarExigeAdministrador() throws Exception {
    long resenaId = publicarYDevolverId(tokenCliente, 5, "Mía.");

    moderar(tokenComerciante, resenaId, false)
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));

    mvc.perform(get("/api/v1/admin/resenas").header("Authorization", tokenComerciante))
        .andExpect(status().isForbidden());
  }

  @Test
  void editarUnaResenaInexistenteDa404() throws Exception {
    editar(tokenCliente, 999_999L, 5, "Fantasma.").andExpect(status().isNotFound());
  }

  @Test
  void unNegocioNoAprobadoDa404AlListarYAlPublicar() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + borrador.getId() + "/resenas"))
        .andExpect(status().isNotFound());

    publicar(tokenCliente, borrador.getId(), 5, "No publicado.")
        .andExpect(status().isNotFound());
  }
}
