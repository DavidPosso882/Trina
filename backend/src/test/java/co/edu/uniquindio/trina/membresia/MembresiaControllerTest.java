package co.edu.uniquindio.trina.membresia;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * RED→GREEN: membresías (RF-33 a RF-37, RN-05). El cobro queda stub: toda suscripción nace
 * PENDIENTE_PAGO y el cableo con pagos (RF-28) llega en el siguiente slice. Los códigos siguen
 * §5.9: 422 regla, 409 conflicto, 403 ajeno/rol, 401 sin sesión, 404 inexistente.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MembresiaControllerTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired MembresiaPlanRepository planes;
  @Autowired MembresiaSuscripcionRepository suscripciones;
  @Autowired MembresiaService servicio;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private MembresiaPlan basica;
  private MembresiaPlan destacada;
  private Usuario comerciante;
  private Negocio negocio;
  private String tokenComerciante;
  private String tokenCliente;

  @BeforeEach
  void sembrar() {
    limpiar();
    basica = planes.save(new MembresiaPlan("BASICA", "Básica", 0, 2, true));
    destacada = planes.save(new MembresiaPlan("DESTACADA", "Destacada", 19_900, 6, true));
    var rubro = rubros.save(new CategoriaNegocio("Restaurantes"));
    comerciante =
        usuarios.save(
            new Usuario("comercio@trina.co", claves.encode("clave1234"), "Comercio", "COMERCIANTE"));
    var cliente =
        usuarios.save(
            new Usuario("cliente@trina.co", claves.encode("clave1234"), "Cliente", "CLIENTE"));
    negocio = negocios.save(Negocio.publicado(comerciante, rubro, "Sabor Trina"));
    tokenComerciante = bearer(comerciante);
    tokenCliente = bearer(cliente);
  }

  @AfterEach
  void limpiar() {
    suscripciones.deleteAll();
    planes.deleteAll();
    negocios.deleteAll();
    rubros.deleteAll();
    usuarios.deleteAll();
  }

  // ---- Apoyo ----

  private String bearer(Usuario u) {
    return "Bearer " + jwt.generar(u.getId(), u.getRol(), u.getTokenVersion());
  }

  private ResultActions solicitar(String token) throws Exception {
    return mvc.perform(
        post("/api/v1/membresias/suscripciones").header("Authorization", token));
  }

  private long idDe(ResultActions respuesta) throws Exception {
    return json
        .readTree(respuesta.andReturn().getResponse().getContentAsString())
        .get("id")
        .asLong();
  }

  /** H2 guarda microsegundos: se trunca a milisegundos para que los Instant comparables coincidan. */
  private static Instant enDias(long dias) {
    return Instant.now().truncatedTo(ChronoUnit.MILLIS).plus(dias, ChronoUnit.DAYS);
  }

  /** RF-34: deja una suscripción ACTIVA cuyo fin cae en {@code fin}. */
  private MembresiaSuscripcion activaConFin(Instant fin) {
    var s = MembresiaSuscripcion.pendiente(negocio, destacada, null, null);
    s.activar(fin.minus(30, ChronoUnit.DAYS));
    return suscripciones.save(s);
  }

  private Negocio segundoNegocio(String dueno, String nombre) {
    var usuario =
        usuarios.save(
            new Usuario(dueno, claves.encode("clave1234"), dueno.split("@")[0], "COMERCIANTE"));
    return negocios.save(Negocio.publicado(usuario, negocio.getCategoria(), nombre));
  }

  // ---- RF-33: planes ----

  @Test
  void losPlanesListanPrecioYBeneficiosSinSesion() throws Exception {
    mvc.perform(get("/api/v1/membresias/planes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].id").value(basica.getId()))
        .andExpect(jsonPath("$[0].codigo").value("BASICA"))
        .andExpect(jsonPath("$[0].precioMensualCop").value(0))
        .andExpect(jsonPath("$[0].maxDestacados").value(2))
        .andExpect(jsonPath("$[1].id").value(destacada.getId()))
        .andExpect(jsonPath("$[1].codigo").value("DESTACADA"))
        .andExpect(jsonPath("$[1].precioMensualCop").value(19_900))
        .andExpect(jsonPath("$[1].maxDestacados").value(6));
  }

  // ---- RF-34: suscripción stub PENDIENTE_PAGO ----

  @Test
  void crearSuscripcionQuedaPendientePagoConVentanaDeTreintaDias() throws Exception {
    var antes = Instant.now();

    var respuesta =
        solicitar(tokenComerciante)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
            .andExpect(jsonPath("$.planCodigo").value("DESTACADA"))
            .andExpect(jsonPath("$.precioMensualCop").value(19_900));

    var s = suscripciones.findById(idDe(respuesta)).orElseThrow();
    assertEquals("PENDIENTE_PAGO", s.getEstado());
    assertFalse(s.getFin().isBefore(antes.plus(30, ChronoUnit.DAYS)));
    assertTrue(s.getInicio().isAfter(antes.minus(1, ChronoUnit.MINUTES)));
  }

  @Test
  void volverASolicitarReutilizaElPendienteEnVezDeAcumular() throws Exception {
    long primero = idDe(solicitar(tokenComerciante).andExpect(status().isCreated()));
    long segundo = idDe(solicitar(tokenComerciante).andExpect(status().isCreated()));

    assertEquals(primero, segundo);
    assertEquals(1, suscripciones.count());
  }

  // ---- RF-35/RN-05: plan efectivo y aviso ----

  @Test
  void sinSuscripcionElPlanEfectivoEsBasica() throws Exception {
    mvc.perform(
            get("/api/v1/membresias/mi-suscripcion").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.planEfectivo").value("BASICA"))
        .andExpect(jsonPath("$.estado").value(nullValue()))
        .andExpect(jsonPath("$.avisoRenovacion").value(false));
  }

  @Test
  void laSuscripcionActivaDaPlanDestacadaSinAvisoLejano() throws Exception {
    activaConFin(enDias(30));

    mvc.perform(
            get("/api/v1/membresias/mi-suscripcion").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.planEfectivo").value("DESTACADA"))
        .andExpect(jsonPath("$.estado").value("ACTIVA"))
        .andExpect(jsonPath("$.avisoRenovacion").value(false));
  }

  @Test
  void avisaCuandoElFinCaeEnSieteDiasOMenos() throws Exception {
    activaConFin(enDias(5));

    mvc.perform(
            get("/api/v1/membresias/mi-suscripcion").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.planEfectivo").value("DESTACADA"))
        .andExpect(jsonPath("$.avisoRenovacion").value(true));
  }

  @Test
  void laSuscripcionVencidaPierdeElBeneficioDestacada() throws Exception {
    activaConFin(enDias(-10));

    // RN-05: el plan efectivo se calcula al consultar, aunque el barrido todavía no corrió.
    mvc.perform(
            get("/api/v1/membresias/mi-suscripcion").header("Authorization", tokenComerciante))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.planEfectivo").value("BASICA"));

    mvc.perform(get("/api/v1/negocios").param("q", "Sabor"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido[0].destacado").value(false));
  }

  @Test
  void elBarridoHorarioMarcaLasActivasVencidas() {
    var s = activaConFin(enDias(-10));

    servicio.marcarVencidas();

    assertEquals("VENCIDA", suscripciones.findById(s.getId()).orElseThrow().getEstado());
  }

  // ---- RF-36: renovación ----

  @Test
  void renovacionAnticipadaExtiendeDesdeElVencimientoActual() throws Exception {
    var vigente = activaConFin(enDias(5));
    Instant finVigente = vigente.getFin();

    var respuesta =
        solicitar(tokenComerciante)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"));

    var pendiente = suscripciones.findById(idDe(respuesta)).orElseThrow();
    assertEquals(finVigente, pendiente.getInicio());
    assertEquals(finVigente.plus(30, ChronoUnit.DAYS), pendiente.getFin());
  }

  @Test
  void renovarSobreUnaActivaExtiendeElFinSinPerderDias() {
    var vigente = activaConFin(enDias(5));
    var finVigente = vigente.getFin();

    vigente.renovar(enDias(0));

    assertEquals("ACTIVA", vigente.getEstado());
    assertEquals(finVigente.plus(30, ChronoUnit.DAYS), vigente.getFin());
  }

  @Test
  void renovarUnaVencidaCuentaDesdeAhora() {
    var vencida = activaConFin(enDias(-10));
    var ahora = enDias(0);

    vencida.renovar(ahora);

    assertEquals("ACTIVA", vencida.getEstado());
    assertEquals(ahora, vencida.getInicio());
    assertEquals(ahora.plus(30, ChronoUnit.DAYS), vencida.getFin());
  }

  @Test
  void renovacionTrasVencerCuentaDesdeAhora() throws Exception {
    var vencida = activaConFin(enDias(-10));
    servicio.marcarVencidas();
    assertEquals("VENCIDA", suscripciones.findById(vencida.getId()).orElseThrow().getEstado());

    var respuesta = solicitar(tokenComerciante).andExpect(status().isCreated());

    var pendiente = suscripciones.findById(idDe(respuesta)).orElseThrow();
    var ahora = Instant.now();
    assertFalse(pendiente.getInicio().isAfter(ahora));
    assertTrue(pendiente.getInicio().isAfter(ahora.minus(1, ChronoUnit.MINUTES)));
    assertEquals(pendiente.getInicio().plus(30, ChronoUnit.DAYS), pendiente.getFin());
  }

  // ---- RF-37: visibilidad ----

  @Test
  void losDestacadosVigentesVanPrimeroYConInsignia() throws Exception {
    segundoNegocio("basico@trina.co", "AAA Básico");
    var zzz = segundoNegocio("destacado@trina.co", "ZZZ Destacado");
    var s = MembresiaSuscripcion.pendiente(zzz, destacada, null, null);
    s.activar(enDias(0));
    suscripciones.save(s);

    mvc.perform(get("/api/v1/negocios"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido[0].nombre").value("ZZZ Destacado"))
        .andExpect(jsonPath("$.contenido[0].destacado").value(true))
        .andExpect(jsonPath("$.contenido[0].insignia").value("Destacado"))
        .andExpect(jsonPath("$.contenido[1].nombre").value("AAA Básico"))
        .andExpect(jsonPath("$.contenido[1].destacado").value(false));
  }

  @Test
  void elPerfilIncluyeLaInsigniaDestacada() throws Exception {
    activaConFin(enDias(10));

    mvc.perform(get("/api/v1/negocios/" + negocio.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.destacado").value(true))
        .andExpect(jsonPath("$.insignia").value("Destacado"));
  }

  // ---- §5.9: códigos ----

  @Test
  void sinSesionDa401YUnClienteDa403() throws Exception {
    mvc.perform(post("/api/v1/membresias/suscripciones")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/membresias/mi-suscripcion"))
        .andExpect(status().isUnauthorized());

    solicitar(tokenCliente)
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  @Test
  void comercianteSinNegocioDa404() throws Exception {
    var sinNegocio =
        usuarios.save(
            new Usuario("sinnegocio@trina.co", claves.encode("clave1234"), "Sin", "COMERCIANTE"));

    mvc.perform(
            get("/api/v1/membresias/mi-suscripcion")
                .header("Authorization", bearer(sinNegocio)))
        .andExpect(status().isNotFound());
    solicitar(bearer(sinNegocio)).andExpect(status().isNotFound());
  }

  @Test
  void losPlanesInactivosNoSeListan() throws Exception {
    planes.save(new MembresiaPlan("LEGACY", "Legacy", 5_000, 4, false));

    mvc.perform(get("/api/v1/membresias/planes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[1].codigo").value("DESTACADA"));
  }
}
