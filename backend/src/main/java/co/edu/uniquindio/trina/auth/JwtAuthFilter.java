package co.edu.uniquindio.trina.auth;

import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filtro JWT (RF-04): valida firma, vencimiento y reclamo ver contra usuario.token_version. Sin token
 * válido deja seguir la cadena; la regla de autorización decide (401/403).
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwt;
  private final UsuarioRepository usuarios;

  public JwtAuthFilter(JwtService jwt, UsuarioRepository usuarios) {
    this.jwt = jwt;
    this.usuarios = usuarios;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String cabeza = req.getHeader("Authorization");
    if (cabeza != null && cabeza.startsWith("Bearer ")) {
      String token = cabeza.substring(7);
      try {
        // Primera pasada sin versión para extraer el id; segunda con la versión vigente.
        var sinVer = jwt.validarSinVersion(token);
        var u = usuarios.findById(sinVer.usuarioId()).orElse(null);
        if (u != null && u.isActivo()) {
          var sesion = jwt.validar(token, u.getTokenVersion());
          var auth =
              new UsernamePasswordAuthenticationToken(
                  u.getId(), null, List.of(new SimpleGrantedAuthority("ROLE_" + sesion.rol())));
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      } catch (SecurityException e) {
        SecurityContextHolder.clearContext();
      }
    }
    chain.doFilter(req, res);
  }
}
