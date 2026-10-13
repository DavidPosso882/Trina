package co.edu.uniquindio.trina.admin;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RED: administración de plataforma (RF-43 a RF-47) — usuarios, alta asistida, categorías,
 * parámetros y auditoría con autorización ADMINISTRADOR y códigos §5.9.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerTest {

  private static final String CLAVE = "clave1234";

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired JdbcTemplate jdbc;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository categorias;
  @Autowired NegocioRepository negocios;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private final List<Long> usuariosCreados = new ArrayList<>();
  private final List<Long> categoriasCreadas = new ArrayList<>();
  private final List<Long> negociosCreados = new ArrayList<>();

  private Usuario admin;
  private String tokenAdmin;

  @BeforeEach
  void crearAdmin() {
    admin = crearUsuario("ADMINISTRADOR");
    tokenAdmin = bearer(admin);
  }

  @AfterEach
  void limpiar() {
    limpiarDependenciasDeUsuarios();
    negocios.deleteAllById(negociosCreados);
    categorias.deleteAllById(categoriasCreadas);
    usuarios.deleteAllById(usuariosCreados);
    usuariosCreados.clear();
    categoriasCreadas.clear();
    negociosCreados.clear();
  }

  // ---- RF-43: usuarios ----

  @Test
  void listarUsuariosFiltraPorRolActivoYTexto() throws Exception {
    var comerciante = crearUsuario("COMERCIANTE");
    var inactivo = crearUsuario("COMERCIANTE");
    inactivo.desactivar();
    usuarios.save(inactivo);
    var cliente = crearUsuario("CLIENTE");

    mvc.perform(
            get("/api/v1/admin/usuarios")
                .header("Authorization", tokenAdmin)
                .param("rol", "COMERCIANTE")
                .param("q", comerciante.getEmail()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].email").value(comerciante.getEmail()))
        .andExpect(jsonPath("$[0].rol").value("COMERCIANTE"));

    mvc.perform(
            get("/api/v1/admin/usuarios")
                .header("Authorization", tokenAdmin)
                .param("q", inactivo.getEmail())
                .param("activo", "false"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].activo").value(false));

    mvc.perform(
            get("/api/v1/admin/usuarios")
                .header("Authorization", tokenAdmin)
                .param("rol", "CLIENTE")
                .param("q", cliente.getNombre()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].email").value(cliente.getEmail()));
  }

  @Test
  void desactivarUsuarioInvalidaSuToken() throws Exception {
    var comerciante = crearUsuario("COMERCIANTE");
    String tokenComerciante = bearer(comerciante);

    mvc.perform(
            patch("/api/v1/admin/usuarios/" + comerciante.getId() + "/estado")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("activo", false))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activo").value(false));

    mvc.perform(get("/api/v1/auth/me").header("Authorization", tokenComerciante))
        .andExpect(status().isUnauthorized());

    var guardado = usuarios.findById(comerciante.getId()).orElseThrow();
    assertEquals(false, guardado.isActivo());
    assertEquals(1, guardado.getTokenVersion());
  }

  @Test
  void autodesactivacionDa422() throws Exception {
    mvc.perform(
            patch("/api/v1/admin/usuarios/" + admin.getId() + "/estado")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("activo", false))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));

    assertTrue(usuarios.findById(admin.getId()).orElseThrow().isActivo());
  }

  @Test
  void cambiarRolRotaTokenYPermiteAdministrador() throws Exception {
    var usuario = crearUsuario("CLIENTE");
    String tokenViejo = bearer(usuario);

    mvc.perform(
            patch("/api/v1/admin/usuarios/" + usuario.getId() + "/rol")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("rol", "COMERCIANTE"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.rol").value("COMERCIANTE"));

    mvc.perform(get("/api/v1/auth/me").header("Authorization", tokenViejo))
        .andExpect(status().isUnauthorized());

    mvc.perform(
            patch("/api/v1/admin/usuarios/" + usuario.getId() + "/rol")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("rol", "SUPERADMIN"))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));

    var nuevoAdmin = crearUsuario("CLIENTE");
    mvc.perform(
            patch("/api/v1/admin/usuarios/" + nuevoAdmin.getId() + "/rol")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("rol", "ADMINISTRADOR"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.rol").value("ADMINISTRADOR"));
  }

  @Test
  void sinRolDa403YSinSesionDa401() throws Exception {
    var cliente = crearUsuario("CLIENTE");

    mvc.perform(get("/api/v1/admin/usuarios").header("Authorization", bearer(cliente)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));

    mvc.perform(get("/api/v1/admin/usuarios")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/admin/auditoria")).andExpect(status().isUnauthorized());
  }

  // ---- RF-47: alta asistida ----

  @Test
  void altaAsistidaDevuelveClaveTemporalYPrimerLoginPideCambio() throws Exception {
    String email = "temporal-" + sufijo() + "@trina.test";

    var alta =
        mvc.perform(
                post("/api/v1/admin/usuarios/comerciantes")
                    .header("Authorization", tokenAdmin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of(
                                "email", email,
                                "nombre", "Doña Rosa",
                                "telefono", "3001112233"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.rol").value("COMERCIANTE"))
            .andExpect(jsonPath("$.claveTemporal").isNotEmpty())
            .andReturn();
    var cuerpo = json.readTree(alta.getResponse().getContentAsString());
    long id = cuerpo.get("id").asLong();
    usuariosCreados.add(id);
    String temporal = cuerpo.get("claveTemporal").asText();

    assertEquals(
        Boolean.TRUE,
        jdbc.queryForObject(
            "select cambio_clave_obligatorio from usuario where id = ?", Boolean.class, id));

    mvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", temporal))))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("CAMBIO_CLAVE_REQUERIDO"))
        .andExpect(content().string(containsString("temporal")));

    mvc.perform(
            post("/api/v1/admin/usuarios/comerciantes")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("email", email, "nombre", "Otra Vez"))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));
  }

  @Test
  void adminCreaNegocioAprobadoDirectoYRechazaSegundo() throws Exception {
    var comerciante = crearUsuario("COMERCIANTE");
    var categoria = nuevaCategoria("Rubro " + sufijo());
    var cuerpo = new HashMap<String, Object>();
    cuerpo.put("comercianteId", comerciante.getId());
    cuerpo.put("nombre", "Almacén " + sufijo());
    cuerpo.put("categoriaId", categoria.getId());
    cuerpo.put("descripcion", "Todo para el hogar");
    cuerpo.put("direccion", "Calle 10 # 5-20");
    cuerpo.put("latitud", 4.53);
    cuerpo.put("longitud", -75.68);
    cuerpo.put("telefono", "3009998877");
    cuerpo.put("estadoInicial", "APROBADO");

    var alta =
        mvc.perform(
                post("/api/v1/admin/negocios")
                    .header("Authorization", tokenAdmin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(cuerpo)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("APROBADO"))
            .andReturn();
    long id = json.readTree(alta.getResponse().getContentAsString()).get("id").asLong();
    negociosCreados.add(id);

    mvc.perform(get("/api/v1/negocios/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"));

    var repetido = new HashMap<>(cuerpo);
    repetido.put("nombre", "Otro nombre");
    mvc.perform(
            post("/api/v1/admin/negocios")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(repetido)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));
  }

  @Test
  void adminCreaNegocioPendienteYApruebaConAuditoria() throws Exception {
    var comerciante = crearUsuario("COMERCIANTE");
    var categoria = nuevaCategoria("Rubro " + sufijo());
    var alta =
        mvc.perform(
                post("/api/v1/admin/negocios")
                    .header("Authorization", tokenAdmin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of(
                                "comercianteId", comerciante.getId(),
                                "nombre", "Panadería " + sufijo(),
                                "categoriaId", categoria.getId(),
                                "estadoInicial", "PENDIENTE"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estado").value("PENDIENTE"))
            .andReturn();
    long id = json.readTree(alta.getResponse().getContentAsString()).get("id").asLong();
    negociosCreados.add(id);

    mvc.perform(
            patch("/api/v1/admin/negocios/" + id + "/estado")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("accion", "APROBAR"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("APROBADO"));

    mvc.perform(
            get("/api/v1/admin/auditoria")
                .header("Authorization", tokenAdmin)
                .param("usuarioId", admin.getId().toString())
                .param("entidad", "NEGOCIO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido.length()").value(2))
        .andExpect(jsonPath("$.contenido[0].accion").value("APROBAR"))
        .andExpect(jsonPath("$.contenido[0].entidadId").value(id))
        .andExpect(jsonPath("$.contenido[1].accion").value("CREAR_NEGOCIO"))
        .andExpect(jsonPath("$.total").value(2));

    mvc.perform(
            get("/api/v1/admin/auditoria")
                .header("Authorization", tokenAdmin)
                .param("usuarioId", admin.getId().toString())
                .param("page", "0")
                .param("size", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido.length()").value(1))
        .andExpect(jsonPath("$.tamano").value(1))
        .andExpect(jsonPath("$.total").value(2));

    mvc.perform(
            get("/api/v1/admin/auditoria")
                .header("Authorization", tokenAdmin)
                .param("usuarioId", admin.getId().toString())
                .param("fecha", LocalDate.now(ZoneOffset.UTC).toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(2));

    mvc.perform(
            get("/api/v1/admin/auditoria")
                .header("Authorization", tokenAdmin)
                .param("usuarioId", admin.getId().toString())
                .param("desde", "2000-01-01T00:00:00Z")
                .param("hasta", "2999-12-31T23:59:59Z"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(2));
  }

  // ---- RF-44: categorías ----

  @Test
  void categoriasCrudPublicoYDesactivacionConservaNegocios() throws Exception {
    String nombre = "Vinoteca " + sufijo();
    var creada =
        mvc.perform(
                post("/api/v1/admin/categorias")
                    .header("Authorization", tokenAdmin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            Map.of("nombre", nombre, "icono", "🍷", "orden", 9))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.nombre").value(nombre))
            .andExpect(jsonPath("$.activa").value(true))
            .andReturn();
    long id = json.readTree(creada.getResponse().getContentAsString()).get("id").asLong();
    categoriasCreadas.add(id);

    mvc.perform(get("/api/v1/categorias"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].nombre", hasItem(nombre)));

    String editado = nombre + " II";
    mvc.perform(
            put("/api/v1/admin/categorias/" + id)
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("nombre", editado, "icono", "🍇", "orden", 3))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value(editado));

    var comerciante = crearUsuario("COMERCIANTE");
    var negocio =
        negocios.save(
            Negocio.publicado(comerciante, categorias.findById(id).orElseThrow(), "Tienda " + sufijo()));
    negociosCreados.add(negocio.getId());

    mvc.perform(
            patch("/api/v1/admin/categorias/" + id + "/estado")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("activa", false))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activa").value(false));

    mvc.perform(get("/api/v1/categorias"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].nombre", not(hasItem(editado))));

    mvc.perform(get("/api/v1/negocios/" + negocio.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.categoria").value(editado));

    mvc.perform(get("/api/v1/admin/categorias").header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].nombre", hasItem(editado)));

    mvc.perform(
            post("/api/v1/admin/categorias")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("nombre", editado))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.codigo").value("CONFLICTO"));
  }

  // ---- RF-45: parámetros ----

  @Test
  void parametrosActualizaComisionConAuditoria() throws Exception {
    sembrarParametro("comision_pct", "5");

    mvc.perform(get("/api/v1/admin/parametros").header("Authorization", tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].clave").value("comision_pct"))
        .andExpect(jsonPath("$[0].valor").value("5"));

    mvc.perform(
            put("/api/v1/admin/parametros/comision_pct")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("valor", "6"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.valor").value("6"));

    mvc.perform(get("/api/v1/admin/parametros").header("Authorization", tokenAdmin))
        .andExpect(jsonPath("$[0].valor").value("6"));

    mvc.perform(
            get("/api/v1/admin/auditoria")
                .header("Authorization", tokenAdmin)
                .param("usuarioId", admin.getId().toString())
                .param("entidad", "PARAMETRO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.contenido[0].accion").value("ACTUALIZAR_PARAMETRO"))
        .andExpect(jsonPath("$.contenido[0].detalle").value(containsString("5")))
        .andExpect(jsonPath("$.contenido[0].detalle").value(containsString("6")));
  }

  @Test
  void parametrosRechazaComisionFueraDeRango() throws Exception {
    sembrarParametro("comision_pct", "5");

    for (String valor : List.of("-1", "31", "treinta")) {
      mvc.perform(
              put("/api/v1/admin/parametros/comision_pct")
                  .header("Authorization", tokenAdmin)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(json.writeValueAsString(Map.of("valor", valor))))
          .andExpect(status().isUnprocessableEntity())
          .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
    }

    mvc.perform(
            put("/api/v1/admin/parametros/inexistente")
                .header("Authorization", tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("valor", "1"))))
        .andExpect(status().isNotFound());

    assertEquals(
        "5",
        jdbc.queryForObject(
            "select valor from parametro_sistema where clave = 'comision_pct'", String.class));
  }

  // ---- Apoyo ----

  private String sufijo() {
    return UUID.randomUUID().toString().substring(0, 8);
  }

  private Usuario crearUsuario(String rol) {
    String s = sufijo();
    var u =
        usuarios.save(
            new Usuario("u-" + s + "@trina.test", claves.encode(CLAVE), "Usuario " + s, rol));
    usuariosCreados.add(u.getId());
    return u;
  }

  private CategoriaNegocio nuevaCategoria(String nombre) {
    var c = categorias.save(new CategoriaNegocio(nombre));
    categoriasCreadas.add(c.getId());
    return c;
  }

  private String bearer(Usuario u) {
    return "Bearer " + jwt.generar(u.getId(), u.getRol(), u.getTokenVersion());
  }

  private void sembrarParametro(String clave, String valor) {
    jdbc.update("delete from parametro_sistema where clave = ?", clave);
    jdbc.update(
        "insert into parametro_sistema (clave, valor, descripcion) values (?, ?, ?)",
        clave,
        valor,
        "Prueba admin");
  }

  /** Borra notificaciones y auditoría de los usuarios de este test para poder borrarlos. */
  private void limpiarDependenciasDeUsuarios() {
    for (Long id : usuariosCreados) {
      jdbc.update("delete from notificacion where usuario_id = ?", id);
    }
    try {
      for (Long id : usuariosCreados) {
        jdbc.update("delete from auditoria where usuario_id = ?", id);
      }
    } catch (DataAccessException aunNoExiste) {
      // Intencional en RED: sin entidad auditoría no hay tabla en H2.
    }
  }
}
