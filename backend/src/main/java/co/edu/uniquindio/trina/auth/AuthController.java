package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Endpoints RF-01, RF-02, RF-05 y sesión actual. Base /api/v1 (convención §5.1). */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService servicio;
  private final UsuarioRepository usuarios;
  private final RecuperacionClaveService recuperaciones;

  public AuthController(
      AuthService servicio, UsuarioRepository usuarios, RecuperacionClaveService recuperaciones) {
    this.servicio = servicio;
    this.usuarios = usuarios;
    this.recuperaciones = recuperaciones;
  }

  @PostMapping("/registro")
  public ResponseEntity<AuthDto.CuentaResponse> registro(@Valid @RequestBody AuthDto.RegistroRequest req) {
    var u = servicio.registrar(req);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(new AuthDto.CuentaResponse(u.getId(), u.getEmail(), u.getNombre(), u.getRol()));
  }

  @PostMapping("/login")
  public AuthDto.AuthResponse login(
      @Valid @RequestBody AuthDto.LoginRequest req, HttpServletRequest http) {
    return servicio.login(req.email(), req.password(), http.getRemoteAddr());
  }

  /** RF-05: con JWT stateless el cliente descarta el token; el servidor solo confirma. */
  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    SecurityContextHolder.clearContext();
    return ResponseEntity.ok().build();
  }

  @GetMapping("/me")
  public AuthDto.CuentaResponse me() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof Long id)) {
      throw new org.springframework.security.authentication.BadCredentialsException("Iniciá sesión");
    }
    var u = usuarios.findById(id).orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Iniciá sesión"));
    return new AuthDto.CuentaResponse(u.getId(), u.getEmail(), u.getNombre(), u.getRol());
  }

  /** RF-03 E1: respuesta idéntica exista o no la cuenta; el envío real entra con el MailPort. */
  @PostMapping("/recuperar-clave")
  public ResponseEntity<Void> recuperar(@Valid @RequestBody AuthDto.RecuperarClaveRequest req) {
    recuperaciones.solicitar(req.email());
    return ResponseEntity.accepted().build();
  }

  /** RF-03 E2/E3: token de un solo uso; al cambiar la clave se invalidan las sesiones previas. */
  @PostMapping("/restablecer-clave")
  public ResponseEntity<Void> restablecer(@Valid @RequestBody AuthDto.RestablecerClaveRequest req) {
    recuperaciones.restablecer(req.token(), req.nuevaClave());
    return ResponseEntity.ok().build();
  }
}
