package co.edu.uniquindio.trina.negocio;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.lessThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.edu.uniquindio.trina.catalogo.CatalogoItem;
import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.membresia.MembresiaPlan;
import co.edu.uniquindio.trina.membresia.MembresiaPlanRepository;
import co.edu.uniquindio.trina.membresia.MembresiaSuscripcion;
import co.edu.uniquindio.trina.membresia.MembresiaSuscripcionRepository;
import co.edu.uniquindio.trina.usuario.Usuario;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RED→GREEN: búsqueda avanzada del directorio (RF-20/RF-22/RF-23/RF-24/RF-37) — texto sobre ítems
 * activos y categoría, abierto ahora, nivel de precio, cercanía con Haversine en memoria, orden y
 * mapa. §5.9: 400 para validación de parámetros, 422 para reglas de negocio.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NegocioBusquedaTest {

  @Autowired MockMvc mvc;
  @Autowired UsuarioRepository usuarios;
  @Autowired CategoriaNegocioRepository categorias;
  @Autowired NegocioRepository negocios;
  @Autowired HorarioAtencionRepository horarios;
  @Autowired ImagenNegocioRepository imagenes;
  @Autowired CatalogoItemRepository items;
  @Autowired MembresiaPlanRepository planes;
  @Autowired MembresiaSuscripcionRepository suscripciones;
  @Autowired PasswordEncoder claves;

  private final AtomicInteger secuencia = new AtomicInteger();
  private CategoriaNegocio cat;

  @BeforeEach
  void sembrar() {
    limpiar();
    cat = categorias.save(new CategoriaNegocio("Restaurantes"));
  }

  @AfterEach
  void limpiar() {
    suscripciones.deleteAll();
    planes.deleteAll();
    items.deleteAll();
    horarios.deleteAll();
    imagenes.deleteAll();
    negocios.deleteAll();
    categorias.deleteAll();
    usuarios.deleteAll();
  }

  // ---- Apoyo ----

  private Negocio negocio(String nombre) {
    return negocio(nombre, cat);
  }

  private Negocio negocio(String nombre, CategoriaNegocio rubro) {
    var dueno =
        usuarios.save(
            new Usuario(
                "dueno" + secuencia.incrementAndGet() + "@trina.co",
                claves.encode("clave1234"),
                "Dueño",
                "COMERCIANTE"));
    return negocios.save(Negocio.publicado(dueno, rubro, nombre));
  }

  private Negocio conNivel(Negocio n, int nivel) {
    n.setNivelPrecio(nivel);
    return negocios.save(n);
  }

  private Negocio conUbicacion(Negocio n, String lat, String lng) {
    n.actualizar(null, null, null, new BigDecimal(lat), new BigDecimal(lng), null, null);
    return negocios.save(n);
  }

  /** Franjas 00:00–00:00 en los siete días: cruzan medianoche y quedan siempre abiertas. */
  private void abiertoSiempre(Negocio n) {
    for (int dia = 1; dia <= 7; dia++) {
      horarios.save(new HorarioAtencion(n, dia, LocalTime.MIDNIGHT, LocalTime.MIDNIGHT));
    }
  }

  private void destacar(Negocio n) {
    var plan = planes.save(new MembresiaPlan("DESTACADA", "Destacada", 19_900, 6, true));
    var suscripcion = MembresiaSuscripcion.pendiente(n, plan, null, null);
    suscripcion.activar(Instant.now());
    suscripciones.save(suscripcion);
  }

  // ---- RF-20: texto sobre ítems activos y categoría ----

  @Test
  void buscaTambienPorNombreDeItemActivo() throws Exception {
    var conItem = negocio("Sabor Trina");
    items.save(CatalogoItem.crear(conItem, null, "producto", "Bandeja paisa", null, 25_000, null));

    var dadoDeBaja = negocio("Cocina Oculta");
    var viejo =
        CatalogoItem.crear(dadoDeBaja, null, "producto", "Bandeja paisa", null, 25_000, null);
    viejo.darDeBaja();
    items.save(viejo);

    mvc.perform(get("/api/v1/negocios").param("q", "bandeja"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.contenido[0].nombre").value("Sabor Trina"));
  }

  @Test
  void buscaTambienPorCategoria() throws Exception {
    negocio("Sabor Trina");
    var cafes = categorias.save(new CategoriaNegocio("Cafés"));
    negocio("Tinto Cercano", cafes);

    mvc.perform(get("/api/v1/negocios").param("q", "cafes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.contenido[0].nombre").value("Tinto Cercano"));
  }

  // ---- RF-23: abierto ahora y nivel de precio ----

  @Test
  void abiertoAhoraFiltraSoloLosAbiertos() throws Exception {
    var abierto = negocio("Café abierto");
    negocio("Café cerrado");
    abiertoSiempre(abierto);

    mvc.perform(get("/api/v1/negocios").param("abiertoAhora", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.contenido[0].nombre").value("Café abierto"));
  }

  @Test
  void nivelPrecioFiltraSoloEseNivel() throws Exception {
    conNivel(negocio("Económico"), 1);
    conNivel(negocio("Intermedio"), 2);
    negocio("Sin declarar");

    mvc.perform(get("/api/v1/negocios").param("nivelPrecio", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.contenido[0].nombre").value("Económico"));
  }

  // ---- RF-22/RF-37: cercanía y orden ----

  @Test
  void cercaniaOrdenaPorDistanciaYTraeDistanciaKm() throws Exception {
    conUbicacion(negocio("Cerca"), "4.500000", "-75.700000");
    conUbicacion(negocio("Lejos"), "4.700000", "-75.700000");
    negocio("Sin ubicación");

    mvc.perform(
            get("/api/v1/negocios")
                .param("lat", "4.500000")
                .param("lng", "-75.700000")
                .param("orden", "cercania"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(2))
        .andExpect(jsonPath("$.contenido[0].nombre").value("Cerca"))
        .andExpect(jsonPath("$.contenido[0].distanciaKm").value(lessThan(1.0)))
        .andExpect(jsonPath("$.contenido[1].nombre").value("Lejos"))
        .andExpect(jsonPath("$.contenido[1].distanciaKm").value(greaterThan(20.0)));
  }

  @Test
  void radioKmRecortaLosLejanos() throws Exception {
    conUbicacion(negocio("Cerca"), "4.500000", "-75.700000");
    conUbicacion(negocio("Lejos"), "5.500000", "-75.700000");

    mvc.perform(
            get("/api/v1/negocios")
                .param("lat", "4.500000")
                .param("lng", "-75.700000")
                .param("radioKm", "50")
                .param("orden", "cercania"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.contenido[0].nombre").value("Cerca"));
  }

  @Test
  void ordenCercaniaIgnoraElDestacadoPeroConservaLaInsignia() throws Exception {
    conUbicacion(negocio("Básico cerca"), "4.500000", "-75.700000");
    var destacadoLejos = conUbicacion(negocio("Destacado lejos"), "4.700000", "-75.700000");
    destacar(destacadoLejos);

    // RF-37 E2: con el orden por defecto el destacado va primero aunque esté más lejos.
    mvc.perform(get("/api/v1/negocios"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido[0].nombre").value("Destacado lejos"))
        .andExpect(jsonPath("$.contenido[0].destacado").value(true));

    // RF-37 E3: con orden=cercania manda la distancia y la insignia se conserva.
    mvc.perform(
            get("/api/v1/negocios")
                .param("lat", "4.500000")
                .param("lng", "-75.700000")
                .param("orden", "cercania"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido[0].nombre").value("Básico cerca"))
        .andExpect(jsonPath("$.contenido[0].destacado").value(false))
        .andExpect(jsonPath("$.contenido[1].nombre").value("Destacado lejos"))
        .andExpect(jsonPath("$.contenido[1].destacado").value(true))
        .andExpect(jsonPath("$.contenido[1].insignia").value("Destacado"));
  }

  @Test
  void ordenNombreEsAlfabeticoAunqueHayaDestacados() throws Exception {
    destacar(negocio("Zeta destacado"));
    negocio("Alfa básico");

    mvc.perform(get("/api/v1/negocios").param("orden", "nombre"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contenido[0].nombre").value("Alfa básico"))
        .andExpect(jsonPath("$.contenido[1].nombre").value("Zeta destacado"));
  }

  // ---- RF-24: mapa ----

  @Test
  void mapaOmiteSinCoordenadasYAplicaLosMismosFiltros() throws Exception {
    var conPunto = conUbicacion(conNivel(negocio("Con punto"), 1), "4.500000", "-75.700000");
    conUbicacion(conNivel(negocio("Otro punto"), 2), "4.700000", "-75.700000");
    negocio("Sin punto");

    mvc.perform(get("/api/v1/negocios/mapa"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2));

    mvc.perform(get("/api/v1/negocios/mapa").param("nivelPrecio", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(conPunto.getId()))
        .andExpect(jsonPath("$[0].nombre").value("Con punto"))
        .andExpect(jsonPath("$[0].categoria").value("Restaurantes"))
        .andExpect(jsonPath("$[0].latitud").value(4.5))
        .andExpect(jsonPath("$[0].longitud").value(-75.7))
        .andExpect(jsonPath("$[0].abiertoAhora").value(false))
        .andExpect(jsonPath("$[0].destacado").value(false));
  }

  // ---- §5.9: validación de parámetros (400) ----

  @Test
  void nivelPrecioFueraDeRangoDa400() throws Exception {
    mvc.perform(get("/api/v1/negocios").param("nivelPrecio", "5"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void latitudSinLongitudDa400() throws Exception {
    mvc.perform(get("/api/v1/negocios").param("lat", "4.5"))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/negocios").param("lng", "-75.7"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void ordenCercaniaSinCoordenadasDa400() throws Exception {
    mvc.perform(get("/api/v1/negocios").param("orden", "cercania"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void ordenDesconocidoDa400() throws Exception {
    mvc.perform(get("/api/v1/negocios").param("orden", "lejania"))
        .andExpect(status().isBadRequest());
  }
}
