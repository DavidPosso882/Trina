package co.edu.uniquindio.trina.reserva;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.HorarioAtencion;
import co.edu.uniquindio.trina.negocio.HorarioAtencionRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
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
 * RED→GREEN: reservas con control de capacidad (RF-26/RF-27, RN-07). Sin pago (D-04). Los códigos
 * siguen §5.9: 422 regla incumplida, 409 sin cupo o transición inválida, 403 ajeno, 401 sin sesión,
 * 404 inexistente. Simplificaciones documentadas: no se valida horario de atención (no existe la
 * entidad Horario) y la disponibilidad pública usa una grilla fija de horas 8:00–20:00.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReservaControllerTest {

  private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired ReservaRepository reservas;
  @Autowired ReservaService servicio;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;
  @Autowired JdbcTemplate jdbc;

  private Usuario cliente;
  private Usuario otroCliente;
  private Negocio aprobado;
  private Negocio hotel;
  private Negocio ajeno;
  private Negocio sinReservas;
  private Negocio borrador;
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
    var hotelero =
        usuarios.save(
            new Usuario("hotel@trina.co", claves.encode("clave1234"), "Hotelero", "COMERCIANTE"));
    var comercianteAjeno =
        usuarios.save(
            new Usuario("ajeno@trina.co", claves.encode("clave1234"), "Ajeno", "COMERCIANTE"));
    var duenoSinReservas =
        usuarios.save(
            new Usuario("sinreserva@trina.co", claves.encode("clave1234"), "Cerrado", "COMERCIANTE"));
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
    hotel = negocios.save(Negocio.publicado(hotelero, rubro, "Hotel Trina"));
    ajeno = negocios.save(Negocio.publicado(comercianteAjeno, rubro, "Café Ajeno"));
    sinReservas = negocios.save(Negocio.publicado(duenoSinReservas, rubro, "Solo Pedidos"));
    borrador = negocios.save(Negocio.borrador(duenoBorrador, rubro, "Cocina Oculta"));

    // La entidad expone aceptaReservas sin setter todavía: se configura por SQL para no tocar más
    // que los campos permitidos de Negocio.
    configurar(aprobado, "FRANJA", 10, 60, true);
    configurar(hotel, "ALOJAMIENTO", 5, 60, true);
    configurar(ajeno, "FRANJA", 5, 60, true);
    configurar(sinReservas, "FRANJA", 5, 60, false);
    configurar(borrador, "FRANJA", 5, 60, true);

    tokenCliente = bearer(cliente);
    tokenOtroCliente = bearer(otroCliente);
    tokenComerciante = bearer(comerciante);
    tokenComercianteAjeno = bearer(comercianteAjeno);
    tokenAdmin = bearer(admin);
  }

  @AfterEach
  void limpiar() {
    horarios.deleteAll();
    reservas.deleteAll();
    negocios.deleteAll();
    rubros.deleteAll();
    usuarios.deleteAll();
  }

  // ---- Apoyo ----

  private String bearer(Usuario u) {
    return "Bearer " + jwt.generar(u.getId(), u.getRol(), u.getTokenVersion());
  }

  private void configurar(
      Negocio negocio, String tipo, int capacidad, int duracionMin, boolean acepta) {
    jdbc.update(
        "UPDATE negocio SET tipo_reserva = ?, capacidad_reservas = ?, duracion_reserva_min = ?, "
            + "acepta_reservas = ? WHERE id = ?",
        tipo,
        capacidad,
        duracionMin,
        acepta,
        negocio.getId());
  }

  private static Instant enDosDias() {
    return Instant.now().truncatedTo(ChronoUnit.MILLIS).plus(2, ChronoUnit.DAYS);
  }

  private ResultActions crear(Long negocioId, Instant inicio, Instant fin, int personas)
      throws Exception {
    var cuerpo = new HashMap<String, Object>();
    cuerpo.put("negocioId", negocioId);
    cuerpo.put("inicio", inicio.toString());
    if (fin != null) {
      cuerpo.put("fin", fin.toString());
    }
    cuerpo.put("personas", personas);
    return mvc.perform(
        post("/api/v1/reservas")
            .header("Authorization", tokenCliente)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(cuerpo)));
  }

  private ResultActions accion(String token, long reservaId, String accion, String motivo)
      throws Exception {
    var cuerpo = new HashMap<String, Object>();
    cuerpo.put("accion", accion);
    if (motivo != null) {
      cuerpo.put("motivo", motivo);
    }
    return mvc.perform(
        patch("/api/v1/reservas/" + reservaId + "/estado")
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(cuerpo)));
  }

  private Reserva sembrarReserva(Usuario dueno, Negocio negocio, Instant inicio, Instant fin) {
    return reservas.save(Reserva.crear(dueno, negocio, inicio, fin, 2, null));
  }

  private long idDe(ResultActions respuesta) throws Exception {
    return json
        .readTree(respuesta.andReturn().getResponse().getContentAsString())
        .get("id")
        .asLong();
  }

  private Reserva recargar(long id) {
    return reservas.findById(id).orElseThrow();
  }

  // ---- RF-26: crear ----

  @Test
  void crearFranjaQuedaPendienteYCalculaElFinConLaDuracionDelNegocio() throws Exception {
    configurar(aprobado, "FRANJA", 10, 90, true);
    var inicio = enDosDias();

    var respuesta =
        crear(aprobado.getId(), inicio, null, 4)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("PENDIENTE_CONFIRMACION"))
            .andExpect(jsonPath("$.tipoReserva").value("FRANJA"))
            .andExpect(jsonPath("$.personas").value(4))
            .andExpect(jsonPath("$.negocioId").value(aprobado.getId()))
            .andExpect(jsonPath("$.clienteId").value(cliente.getId()));

    var reserva = recargar(idDe(respuesta));
    assertEquals(inicio, reserva.getInicio());
    assertEquals(inicio.plus(90, ChronoUnit.MINUTES), reserva.getFin());
  }

  @Test
  void crearAlojamientoRespetaEntradaYSalidaDadas() throws Exception {
    var entrada = enDosDias();
    var salida = entrada.plus(5, ChronoUnit.DAYS);

    var respuesta =
        crear(hotel.getId(), entrada, salida, 2)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("PENDIENTE_CONFIRMACION"))
            .andExpect(jsonPath("$.tipoReserva").value("ALOJAMIENTO"));

    var reserva = recargar(idDe(respuesta));
    assertEquals(entrada, reserva.getInicio());
    assertEquals(salida, reserva.getFin());
  }

  @Test
  void alojamientoSinSalidaODesalidaAnteriorDa422() throws Exception {
    var entrada = enDosDias();
    crear(hotel.getId(), entrada, null, 2)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));

    crear(hotel.getId(), entrada, entrada.minus(1, ChronoUnit.DAYS), 2)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
  }

  @Test
  void fechaPasadaDa422() throws Exception {
    crear(aprobado.getId(), Instant.now().minus(1, ChronoUnit.HOURS), null, 2)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
  }

  @Test
  void negocioQueNoAceptaReservasDa422() throws Exception {
    crear(sinReservas.getId(), enDosDias(), null, 2)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(jsonPath("$.mensaje", containsString("reservas")));
  }

  // ---- RF-26 E2: la franja tiene que caer dentro del horario de atención ----

  @Test
  void reservaFranjaFueraDelHorarioDa422() throws Exception {
    var inicio = enDosDias();
    // Franja para otro día: el negocio tiene horario configurado pero no atiende esa hora.
    int otroDia = inicio.atZone(BOGOTA).getDayOfWeek().getValue() % 7 + 1;
    horarios.save(
        new HorarioAtencion(aprobado, otroDia, LocalTime.MIDNIGHT, LocalTime.of(23, 59, 59)));

    crear(aprobado.getId(), inicio, null, 2)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"))
        .andExpect(jsonPath("$.mensaje", containsString("horario")));
  }

  @Test
  void reservaFranjaDentroDelHorarioSeCrea() throws Exception {
    var inicio = enDosDias();
    int dia = inicio.atZone(BOGOTA).getDayOfWeek().getValue();
    horarios.save(
        new HorarioAtencion(aprobado, dia, LocalTime.MIDNIGHT, LocalTime.of(23, 59, 59)));

    crear(aprobado.getId(), inicio, null, 2).andExpect(status().isCreated());
  }

  @Test
  void reservaDeAlojamientoNoExigeHorarioDeAtencion() throws Exception {
    var entrada = enDosDias();
    int otroDia = entrada.atZone(BOGOTA).getDayOfWeek().getValue() % 7 + 1;
    horarios.save(
        new HorarioAtencion(hotel, otroDia, LocalTime.MIDNIGHT, LocalTime.of(23, 59, 59)));

    crear(hotel.getId(), entrada, entrada.plus(5, ChronoUnit.DAYS), 2)
        .andExpect(status().isCreated());
  }

  @Test
  void negocioSinFranjasNoSeBloquea() throws Exception {
    // Compatibilidad: sin horarios configurados la reserva se crea igual.
    crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated());
  }

  @Test
  void negocioInexistenteONoAprobadoDa404() throws Exception {
    crear(999999L, enDosDias(), null, 2).andExpect(status().isNotFound());
    crear(borrador.getId(), enDosDias(), null, 2).andExpect(status().isNotFound());
  }

  @Test
  void sinSesionDa401() throws Exception {
    mvc.perform(
            post("/api/v1/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"negocioId\":1,\"inicio\":\"2030-01-01T10:00:00Z\",\"personas\":2}"))
        .andExpect(status().isUnauthorized());
  }

  // ---- RN-07: capacidad ----

  @Test
  void agotarLaCapacidadDa409ALaSegundaReservaSuperpuesta() throws Exception {
    configurar(aprobado, "FRANJA", 1, 60, true);
    var inicio = enDosDias();
    crear(aprobado.getId(), inicio, null, 2).andExpect(status().isCreated());

    crear(aprobado.getId(), inicio.plus(30, ChronoUnit.MINUTES), null, 2)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"))
        .andExpect(jsonPath("$.mensaje", containsString("cupo")));
  }

  @Test
  void unaFranjaQueNoSeSuperponeNoConsumeCupoYAceptaLaReserva() throws Exception {
    configurar(aprobado, "FRANJA", 1, 60, true);
    var inicio = enDosDias();
    crear(aprobado.getId(), inicio, null, 2).andExpect(status().isCreated());

    crear(aprobado.getId(), inicio.plus(60, ChronoUnit.MINUTES), null, 2)
        .andExpect(status().isCreated());
  }

  @Test
  void cancelarLaReservaLiberaElCupo() throws Exception {
    configurar(aprobado, "FRANJA", 1, 60, true);
    var inicio = enDosDias();
    long primera = idDe(crear(aprobado.getId(), inicio, null, 2).andExpect(status().isCreated()));

    accion(tokenCliente, primera, "CANCELAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADA"));

    crear(aprobado.getId(), inicio, null, 2).andExpect(status().isCreated());
  }

  // ---- RF-27 / §5.1: transiciones ----

  @Test
  void confirmarYCompletarQuedaCompletada() throws Exception {
    long id = idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));

    accion(tokenComerciante, id, "CONFIRMAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CONFIRMADA"));

    accion(tokenComerciante, id, "COMPLETAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("COMPLETADA"));
  }

  @Test
  void rechazarSinMotivoDa422YConMotivoQuedaRechazada() throws Exception {
    long id = idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));

    accion(tokenComerciante, id, "RECHAZAR", null)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));

    accion(tokenComerciante, id, "RECHAZAR", "Ese día está completo")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADA"))
        .andExpect(jsonPath("$.motivo").value("Ese día está completo"));
  }

  @Test
  void comercianteCancelaConMotivoObligatorio() throws Exception {
    long id = idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));
    accion(tokenComerciante, id, "CONFIRMAR", null).andExpect(status().isOk());

    accion(tokenComerciante, id, "CANCELAR", null)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));

    accion(tokenComerciante, id, "CANCELAR", "Cerraremos por mantenimiento")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADA"))
        .andExpect(jsonPath("$.motivo").value("Cerraremos por mantenimiento"));
  }

  @Test
  void clienteCancelaSuReservaPendienteSinMotivo() throws Exception {
    long id = idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));

    accion(tokenCliente, id, "CANCELAR", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CANCELADA"));
  }

  @Test
  void transicionInvalidaDa409() throws Exception {
    long id = idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));

    accion(tokenComerciante, id, "COMPLETAR", null)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));

    accion(tokenComerciante, id, "CONFIRMAR", null).andExpect(status().isOk());
    accion(tokenComerciante, id, "CONFIRMAR", null).andExpect(status().isConflict());
  }

  @Test
  void comercianteAjenoNoPuedeGestionarLaReserva() throws Exception {
    long id = idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));

    accion(tokenComercianteAjeno, id, "CONFIRMAR", null)
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  @Test
  void clienteAjenoNoVeLaReserva() throws Exception {
    long id = idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));

    mvc.perform(get("/api/v1/reservas/" + id).header("Authorization", tokenOtroCliente))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  // ---- RF-26 E5: vencimiento sin respuesta ----

  @Test
  void reservaPendienteDeMasDe24HorasSeCancelaSola() throws Exception {
    long vieja =
        idDe(crear(aprobado.getId(), enDosDias(), null, 2).andExpect(status().isCreated()));
    var reservaVieja = recargar(vieja);
    reservaVieja.ajustarCreadoEn(Instant.now().minus(25, ChronoUnit.HOURS));
    reservas.save(reservaVieja);
    long fresca =
        idDe(crear(aprobado.getId(), enDosDias().plus(3, ChronoUnit.HOURS), null, 2)
            .andExpect(status().isCreated()));

    servicio.cancelarPendientesVencidas();

    assertEquals(Reserva.CANCELADA, recargar(vieja).getEstado());
    assertEquals(Reserva.PENDIENTE_CONFIRMACION, recargar(fresca).getEstado());
  }

  // ---- RF-31: historial según rol ----

  @Test
  void listadoYFiltroRespetanElAlcancePorRol() throws Exception {
    var mia = sembrarReserva(cliente, aprobado, enDosDias(), enDosDias().plus(1, ChronoUnit.HOURS));
    sembrarReserva(otroCliente, ajeno, enDosDias(), enDosDias().plus(1, ChronoUnit.HOURS));

    mvc.perform(get("/api/v1/reservas").header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(mia.getId()));

    mvc.perform(get("/api/v1/reservas").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].negocioId").value(aprobado.getId()));

    mvc.perform(get("/api/v1/reservas").header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2));

    mia.confirmar();
    reservas.save(mia);
    mvc.perform(
            get("/api/v1/reservas").param("estado", "CONFIRMADA")
                .header("Authorization", tokenCliente))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].estado").value("CONFIRMADA"));
  }

  // ---- Disponibilidad pública (simplificada) ----

  @Test
  void disponibilidadMarcaOcupadasLasFranjasSinCupo() throws Exception {
    configurar(aprobado, "FRANJA", 1, 60, true);
    var dia = LocalDate.now(BOGOTA).plusDays(1);
    var diez = dia.atTime(10, 0).atZone(BOGOTA).toInstant();
    sembrarReserva(cliente, aprobado, diez, diez.plus(1, ChronoUnit.HOURS));

    mvc.perform(
            get("/api/v1/negocios/" + aprobado.getId() + "/disponibilidad")
                .param("fecha", dia.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.franjas.length()").value(12))
        .andExpect(jsonPath("$.franjas[2].hora").value("10:00"))
        .andExpect(jsonPath("$.franjas[2].ocupadas").value(1))
        .andExpect(jsonPath("$.franjas[2].disponible").value(false))
        .andExpect(jsonPath("$.franjas[3].hora").value("11:00"))
        .andExpect(jsonPath("$.franjas[3].ocupadas").value(0))
        .andExpect(jsonPath("$.franjas[3].disponible").value(true));
  }

  @Test
  void disponibilidadDeNegocioNoAprobadoDa404() throws Exception {
    mvc.perform(
            get("/api/v1/negocios/" + borrador.getId() + "/disponibilidad")
                .param("fecha", LocalDate.now(BOGOTA).plusDays(1).toString()))
        .andExpect(status().isNotFound());
  }
}
