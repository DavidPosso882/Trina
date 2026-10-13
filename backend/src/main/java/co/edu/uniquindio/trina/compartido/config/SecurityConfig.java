package co.edu.uniquindio.trina.compartido.config;

import co.edu.uniquindio.trina.auth.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/** Seguridad RF-04: JWT con reclamo ver + verificación de propiedad en cada servicio. */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwt) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsSource()))
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(
                "/actuator/health",
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/api/v1/auth/registro",
                "/api/v1/auth/login",
                "/api/v1/auth/recuperar-clave",
                "/api/v1/auth/restablecer-clave",
                "/api/v1/categorias",
                "/api/v1/membresias/planes",
                "/api/v1/politica-privacidad")
            .permitAll()
            .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/negocios/**")
            .permitAll()
            .anyRequest()
            .authenticated())
        .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                    (req, res, ex) -> {
                      res.setStatus(401);
                      res.setContentType("application/json");
                      res.getWriter()
                          .write(
                              "{\"codigo\":\"AUTENTICACION\",\"mensaje\":\"Iniciá sesión\",\"campos\":[]}");
                    }));
    return http.build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /** CORS restringido al dominio de la app (RNF-03). Orígenes por env. */
  @Bean
  CorsConfigurationSource corsSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    String origins = System.getenv().getOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:5173");
    cfg.setAllowedOrigins(List.of(origins.split(",")));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
    cfg.setAllowCredentials(false);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
