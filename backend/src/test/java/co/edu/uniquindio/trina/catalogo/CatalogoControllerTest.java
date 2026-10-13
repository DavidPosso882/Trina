package co.edu.uniquindio.trina.catalogo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.edu.uniquindio.trina.auth.JwtService;
import co.edu.uniquindio.trina.negocio.CategoriaNegocio;
import co.edu.uniquindio.trina.negocio.CategoriaNegocioRepository;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * RED: catálogo digital RF-15/RF-16/RF-17/RF-18 — crear ítem, editar, disponibilidad, baja lógica,
 * catálogo público agrupado y categorías internas. La propiedad del negocio se verifica en el
 * servicio (403 ajeno) y un ítem de otro negocio da 409.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogoControllerTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository rubros;
  @Autowired NegocioRepository negocios;
  @Autowired CatalogoCategoriaRepository categorias;
  @Autowired CatalogoItemRepository items;
  @Autowired PasswordEncoder claves;
  @Autowired JwtService jwt;

  private Negocio aprobado;
  private Negocio borrador;
  private String tokenDueno;
  private String tokenAjeno;

  @BeforeEach
  void sembrar() {
    limpiar();
    var rubro = rubros.save(new CategoriaNegocio("Restaurantes"));
    var dueno =
        usuarios.save(
            new Usuario("dueno@trina.co", claves.encode("clave1234"), "Dueño", "COMERCIANTE"));
    var ajeno =
        usuarios.save(
            new Usuario("ajeno@trina.co", claves.encode("clave1234"), "Ajeno", "COMERCIANTE"));
    aprobado = negocios.save(Negocio.publicado(dueno, rubro, "Sabor Trina"));
    borrador = negocios.save(Negocio.borrador(ajeno, rubro, "Cocina Oculta"));
    tokenDueno = "Bearer " + jwt.generar(dueno.getId(), "COMERCIANTE", dueno.getTokenVersion());
    tokenAjeno = "Bearer " + jwt.generar(ajeno.getId(), "COMERCIANTE", ajeno.getTokenVersion());
  }

  @AfterEach
  void limpiar() {
    items.deleteAll();
    categorias.deleteAll();
    negocios.deleteAll();
    rubros.deleteAll();
    usuarios.deleteAll();
  }

  @Test
  void crearItemValidoDevuelve201() throws Exception {
    mvc.perform(
            post("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items")
                .header("Authorization", tokenDueno)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "nombre", "Bandeja paisa",
                            "precioCop", 25000,
                            "tipo", "producto",
                            "descripcion", "Con frijoles y arepa"))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.nombre").value("Bandeja paisa"))
        .andExpect(jsonPath("$.precioCop").value(25000))
        .andExpect(jsonPath("$.disponible").value(true))
        .andExpect(jsonPath("$.activo").value(true));
  }

  @Test
  void precioCeroONegativoDa400() throws Exception {
    for (int precio : new int[] {0, -1500}) {
      mvc.perform(
              post("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items")
                  .header("Authorization", tokenDueno)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      json.writeValueAsString(Map.of("nombre", "Regalo", "precioCop", precio))))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.codigo").value("VALIDACION"));
    }
  }

  @Test
  void tipoInvalidoDa400() throws Exception {
    mvc.perform(
            post("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items")
                .header("Authorization", tokenDueno)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("nombre", "Raro", "precioCop", 1000, "tipo", "digital"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.codigo").value("VALIDACION"));
  }

  @Test
  void editarItemPropioDevuelve200() throws Exception {
    var item = items.save(CatalogoItem.crear(aprobado, null, "producto", "Viejo", null, 5000, null));
    mvc.perform(
            put("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items/" + item.getId())
                .header("Authorization", tokenDueno)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        Map.of("nombre", "Nuevo", "precioCop", 7000, "tipo", "servicio"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value("Nuevo"))
        .andExpect(jsonPath("$.precioCop").value(7000))
        .andExpect(jsonPath("$.tipo").value("servicio"));
  }

  @Test
  void marcarNoDisponibleSigueListado() throws Exception {
    var item = items.save(CatalogoItem.crear(aprobado, null, "producto", "Café", null, 4500, null));
    mvc.perform(
            patch(
                    "/api/v1/negocios/"
                        + aprobado.getId()
                        + "/catalogo/items/"
                        + item.getId()
                        + "/disponibilidad")
                .header("Authorization", tokenDueno)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("disponible", false))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.disponible").value(false));

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/catalogo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sinCategoria[0].nombre").value("Café"))
        .andExpect(jsonPath("$.sinCategoria[0].disponible").value(false));
  }

  @Test
  void eliminarDaBajaLogicaYDesapareceDelPublico() throws Exception {
    var item =
        items.save(CatalogoItem.crear(aprobado, null, "producto", "Limonada", null, 6000, null));
    mvc.perform(
            delete("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items/" + item.getId())
                .header("Authorization", tokenDueno))
        .andExpect(status().isNoContent());

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/catalogo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sinCategoria").isEmpty());

    // Baja lógica: el ítem sigue en la base, inactivo, para que el comerciante lo vea.
    assertThat(items.findById(item.getId()).orElseThrow().isActivo()).isFalse();

    // Volver a eliminarlo es una transición inválida.
    mvc.perform(
            delete("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items/" + item.getId())
                .header("Authorization", tokenDueno))
        .andExpect(status().isConflict());
  }

  @Test
  void categoriasAgrupanItemsEnElCatalogoPublico() throws Exception {
    var creada =
        mvc.perform(
                post("/api/v1/negocios/" + aprobado.getId() + "/catalogo/categorias")
                    .header("Authorization", tokenDueno)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("nombre", "Platos", "orden", 1))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.nombre").value("Platos"))
            .andReturn();
    long catId = json.readTree(creada.getResponse().getContentAsString()).get("id").asLong();

    items.save(
        CatalogoItem.crear(
            aprobado, categorias.findById(catId).orElseThrow(), "producto", "Mote de queso", null,
            18000, null));
    items.save(CatalogoItem.crear(aprobado, null, "servicio", "Domicilio", null, 3000, null));

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/catalogo/categorias"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].nombre").value("Platos"));

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/catalogo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.negocio").value("Sabor Trina"))
        .andExpect(jsonPath("$.categorias[0].categoria.nombre").value("Platos"))
        .andExpect(jsonPath("$.categorias[0].items[0].nombre").value("Mote de queso"))
        .andExpect(jsonPath("$.sinCategoria[0].nombre").value("Domicilio"));
  }

  @Test
  void editarCategoriaPropiaDevuelve200() throws Exception {
    var cat = categorias.save(new CatalogoCategoria(aprobado, "Bebidas", 1));
    mvc.perform(
            put("/api/v1/negocios/" + aprobado.getId() + "/catalogo/categorias/" + cat.getId())
                .header("Authorization", tokenDueno)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("nombre", "Bebidas frías", "orden", 3))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value("Bebidas frías"))
        .andExpect(jsonPath("$.orden").value(3));
  }

  @Test
  void eliminarCategoriaDejaSusItemsSinCategoria() throws Exception {
    var cat = categorias.save(new CatalogoCategoria(aprobado, "Postres", 2));
    items.save(CatalogoItem.crear(aprobado, cat, "producto", "Flan", null, 8000, null));

    mvc.perform(
            delete("/api/v1/negocios/" + aprobado.getId() + "/catalogo/categorias/" + cat.getId())
                .header("Authorization", tokenDueno))
        .andExpect(status().isNoContent());

    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/catalogo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.categorias").isEmpty())
        .andExpect(jsonPath("$.sinCategoria[0].nombre").value("Flan"));
  }

  @Test
  void negocioNoAprobadoDa404EnElCatalogoPublico() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + borrador.getId() + "/catalogo"))
        .andExpect(status().isNotFound());
  }

  @Test
  void comercianteAjenoDa403() throws Exception {
    mvc.perform(
            post("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items")
                .header("Authorization", tokenAjeno)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("nombre", "Intruso", "precioCop", 1000))))
        .andExpect(status().isForbidden());
  }

  @Test
  void sinSesionDa401() throws Exception {
    mvc.perform(
            post("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("nombre", "Anónimo", "precioCop", 1000))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void editarItemDeOtroNegocioDa409() throws Exception {
    var item = items.save(CatalogoItem.crear(borrador, null, "producto", "De otro", null, 9000, null));
    mvc.perform(
            put("/api/v1/negocios/" + aprobado.getId() + "/catalogo/items/" + item.getId())
                .header("Authorization", tokenDueno)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(Map.of("nombre", "Robado", "precioCop", 5000))))
        .andExpect(status().isConflict());
  }

  // ---- Brecha 2: catálogo propio con bajas y no disponibles (panel del comerciante) ----

  @Test
  void propioDelDuenoIncluyeBajasYNoDisponiblesAunqueElNegocioNoEsteAprobado() throws Exception {
    // El catálogo propio es para pre-aprobación: un borrador debe poder gestionarse.
    items.save(CatalogoItem.crear(borrador, null, "producto", "Activo", null, 9000, null));
    var pausado =
        items.save(CatalogoItem.crear(borrador, null, "producto", "Pausado", null, 7000, null));
    pausado.cambiarDisponibilidad(false);
    items.save(pausado);
    var deBaja =
        items.save(CatalogoItem.crear(borrador, null, "servicio", "Viejo", null, 5000, null));
    deBaja.darDeBaja();
    items.save(deBaja);

    mvc.perform(
            get("/api/v1/negocios/" + borrador.getId() + "/catalogo/propio")
                .header("Authorization", tokenAjeno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.negocioId").value(borrador.getId()))
        .andExpect(jsonPath("$.negocio").value("Cocina Oculta"))
        .andExpect(jsonPath("$.sinCategoria.length()").value(3))
        .andExpect(jsonPath("$.sinCategoria[0].nombre").value("Activo"))
        .andExpect(jsonPath("$.sinCategoria[0].activo").value(true))
        .andExpect(jsonPath("$.sinCategoria[0].disponible").value(true))
        .andExpect(jsonPath("$.sinCategoria[1].nombre").value("Pausado"))
        .andExpect(jsonPath("$.sinCategoria[1].disponible").value(false))
        .andExpect(jsonPath("$.sinCategoria[2].nombre").value("Viejo"))
        .andExpect(jsonPath("$.sinCategoria[2].activo").value(false));

    // El público sigue sin exponer un negocio no aprobado.
    mvc.perform(get("/api/v1/negocios/" + borrador.getId() + "/catalogo"))
        .andExpect(status().isNotFound());
  }

  @Test
  void propioDeUnNegocioAjenoDa403() throws Exception {
    mvc.perform(
            get("/api/v1/negocios/" + borrador.getId() + "/catalogo/propio")
                .header("Authorization", tokenDueno))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.codigo").value("AUTORIZACION"));
  }

  @Test
  void propioSinSesionDa401() throws Exception {
    mvc.perform(get("/api/v1/negocios/" + aprobado.getId() + "/catalogo/propio"))
        .andExpect(status().isUnauthorized());
  }
}
