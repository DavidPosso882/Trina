package co.edu.uniquindio.trina.negocio;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
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
 * RED: horarios de atención y estado "abierto ahora" (RF-13, parte de RF-23) — franjas por día en
 * America/Bogota, dos franjas con hueco, cruce de medianoche, reemplazo total, validación de
 * formato/rango y exigencia de horarios al enviar a revisión (RF-06).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HorarioControllerTest {

  private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository categorias;
  @Autowired NegocioRepository negocios;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired ImagenNegocioRepository imagenes;
  @Autowired HorarioService servicio;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private CategoriaNegocio cat;
  private Usuario dueno;
  private Usuario otro;
  private String tokenDueno;
  private String tokenOtro;

  @BeforeEach
  void sembrar() {
    imagenes.deleteAll();
    horarios.deleteAll();
    negocios.deleteAll();
    categorias.deleteAll();
    usuarios.deleteAll();
    cat = categorias.save(new CategoriaNegocio("Restaurantes"));
    dueno = usuarios.save(new Usuario("dueno@trina.co", claves.encode("clave1234"), "Dueño", "COMERCIANTE"));
    otro = usuarios.save(new Usuario("otro@trina.co", claves.encode("clave1234"), "Otro", "COMERCIANTE"));
    tokenDueno = "Bearer " + jwt.generar(dueno.getId(), "COMERCIANTE", dueno.getTokenVersion());
    tokenOtro = "Bearer " + jwt.generar(otro.getId(), "COMERCIANTE", otro.getTokenVersion());
  }

  @AfterEach
  void limpiar() {
    imagenes.deleteAll();
    horarios.deleteAll();
  }

  // ---- Apoyo ----

  private static Map<String, Object> franja(int dia, String abre, String cierra) {
    return Map.of("diaSemana", dia, "abre", abre, "cierra", cierra);
  }

  private Negocio borrador() {
    return negocios.save(Negocio.borrador(dueno, cat, "Panadería"));
  }

  /** Borrador con todos los datos exigidos, todavía sin horarios. */
  private Negocio completo() {
    var n = Negocio.borrador(dueno, cat, "Panadería");
    n.actualizar(
        "Panadería",
        "Pan casero",
        "Calle 5 # 10-20",
        new BigDecimal("4.5"),
        new BigDecimal("-75.7"),
        "3001112233",
        null);
    return negocios.save(n);
  }

  private ResultActions putHorarios(Long negocioId, String token, List<Map<String, Object>> franjas)
      throws Exception {
    var req =
        put("/api/v1/negocios/" + negocioId + "/horarios")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(franjas));
    if (token != null) {
      req.header("Authorization", token);
    }
    return mvc.perform(req);
  }

  private static Instant enBogota(int anio, int mes, int dia, int hora, int minuto) {
    return LocalDateTime.of(anio, mes, dia, hora, minuto).atZone(BOGOTA).toInstant();
  }

  // ---- Endpoints ----

  @Test
  void semanaLunesASabadoConDomingoCerrado() throws Exception {
    var n = borrador();
    var semana = new ArrayList<Map<String, Object>>();
    for (int dia = 1; dia <= 6; dia++) {
      semana.add(franja(dia, "08:00", "18:00"));
    }

    putHorarios(n.getId(), tokenDueno, semana)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(6))
        .andExpect(jsonPath("$[0].diaSemana").value(1))
        .andExpect(jsonPath("$[0].abre").value("08:00"))
        .andExpect(jsonPath("$[5].diaSemana").value(6));

    mvc.perform(
            get("/api/v1/negocios/" + n.getId() + "/horarios").header("Authorization", tokenDueno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(6));
  }

  @Test
  void dosFranjasConHuecoAlMediodiaCerrado() throws Exception {
    var n = borrador();
    putHorarios(
            n.getId(),
            tokenDueno,
            List.of(franja(3, "08:00", "12:00"), franja(3, "14:00", "18:00")))
        .andExpect(status().isOk());

    // Miércoles 2024-01-03: 13:00 cae en el hueco, 15:00 dentro de la segunda franja.
    assertFalse(servicio.abiertoAhora(n.getId(), enBogota(2024, 1, 3, 13, 0)));
    assertTrue(servicio.abiertoAhora(n.getId(), enBogota(2024, 1, 3, 15, 0)));
  }

  @Test
  void cierreDespuesDeMedianocheSigueAbiertoAlaUna() throws Exception {
    var n = borrador();
    putHorarios(n.getId(), tokenDueno, List.of(franja(3, "18:00", "02:00")))
        .andExpect(status().isOk());

    // Miércoles 23:00 abierto, jueves 01:00 sigue abierto y jueves 03:00 ya cerró.
    assertTrue(servicio.abiertoAhora(n.getId(), enBogota(2024, 1, 3, 23, 0)));
    assertTrue(servicio.abiertoAhora(n.getId(), enBogota(2024, 1, 4, 1, 0)));
    assertFalse(servicio.abiertoAhora(n.getId(), enBogota(2024, 1, 4, 3, 0)));
  }

  @Test
  void reemplazoValidaAbreFormatoYRango() throws Exception {
    var n = borrador();

    putHorarios(n.getId(), tokenDueno, List.of(Map.of("diaSemana", 1, "cierra", "18:00")))
        .andExpect(status().isBadRequest());
    putHorarios(n.getId(), tokenDueno, List.of(franja(8, "08:00", "18:00")))
        .andExpect(status().isBadRequest());
    putHorarios(n.getId(), tokenDueno, List.of(franja(1, "25:00", "18:00")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void reemplazoBorraLasFranjasAnterioresYSinSesionDa401() throws Exception {
    var n = borrador();
    putHorarios(
            n.getId(),
            tokenDueno,
            List.of(franja(1, "08:00", "12:00"), franja(1, "14:00", "18:00")))
        .andExpect(status().isOk());
    putHorarios(n.getId(), tokenDueno, List.of(franja(2, "09:00", "17:00")))
        .andExpect(status().isOk());

    mvc.perform(
            get("/api/v1/negocios/" + n.getId() + "/horarios").header("Authorization", tokenDueno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].diaSemana").value(2));

    putHorarios(n.getId(), null, List.of(franja(2, "09:00", "17:00")))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void ajenoDa403YNoVeElBorrador() throws Exception {
    var n = borrador();

    putHorarios(n.getId(), tokenOtro, List.of(franja(1, "08:00", "18:00")))
        .andExpect(status().isForbidden());

    mvc.perform(
            get("/api/v1/negocios/" + n.getId() + "/horarios").header("Authorization", tokenOtro))
        .andExpect(status().isNotFound());
  }

  // ---- RF-06: envío a revisión exige horarios ----

  @Test
  void enviarSinHorariosDa422YConHorariosPasaAPendiente() throws Exception {
    var n = completo();

    mvc.perform(
            post("/api/v1/negocios/" + n.getId() + "/enviar-revision")
                .header("Authorization", tokenDueno))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(
            jsonPath("$.mensaje")
                .value("Falta un paso para publicar: configurá tus horarios"));

    putHorarios(n.getId(), tokenDueno, List.of(franja(1, "08:00", "18:00")))
        .andExpect(status().isOk());

    // RF-12: además de horarios, publicar exige al menos una foto.
    imagenes.save(
        ImagenNegocio.nueva(
            n, "negocios/" + n.getId() + "/p.jpg", "negocios/" + n.getId() + "/p_m.jpg", true, 0));

    mvc.perform(
            post("/api/v1/negocios/" + n.getId() + "/enviar-revision")
                .header("Authorization", tokenDueno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("PENDIENTE"));
  }

  // ---- RF-23: "abierto ahora" en ficha y directorio ----

  @Test
  void fichaYDirectorioMuestranAbiertoAhora() throws Exception {
    var abierto = negocios.save(Negocio.publicado(dueno, cat, "Café abierto"));
    var cerrado = negocios.save(Negocio.publicado(otro, cat, "Café cerrado"));
    var todas = new ArrayList<Map<String, Object>>();
    for (int dia = 1; dia <= 7; dia++) {
      todas.add(franja(dia, "00:00", "00:00"));
    }
    putHorarios(abierto.getId(), tokenDueno, todas).andExpect(status().isOk());

    mvc.perform(get("/api/v1/negocios/" + abierto.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.abiertoAhora").value(true));
    mvc.perform(get("/api/v1/negocios/" + cerrado.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.abiertoAhora").value(false));

    mvc.perform(get("/api/v1/negocios"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido[0].nombre").value("Café abierto"))
        .andExpect(jsonPath("$.contenido[0].abiertoAhora").value(true))
        .andExpect(jsonPath("$.contenido[1].abiertoAhora").value(false));

    // El perfil aprobado es público: horarios visibles sin sesión.
    mvc.perform(get("/api/v1/negocios/" + abierto.getId() + "/horarios"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(7));
  }
}
