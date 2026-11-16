package co.edu.uniquindio.trina.compartido;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envío de correos best-effort adaptado de proyecto_final_avanzada_backend EmailServicioImpl.
 * Nunca rompe el flujo principal: si el SMTP falla se registra y se continúa.
 * En dev usa maildev (sin auth); en prod Gmail con MAIL_USERNAME/MAIL_PASSWORD.
 */
@Service
public class CorreoService {

  private static final Logger log = LoggerFactory.getLogger(CorreoService.class);

  private final JavaMailSender correos;

  @Value("${app.correo.remitente:monedero.virtual20251@gmail.com}")
  private String remitente;

  public CorreoService(JavaMailSender correos) {
    this.correos = correos;
  }

  public void enviar(String destinatario, String asunto, String cuerpo) {
    try {
      var mensaje = new SimpleMailMessage();
      mensaje.setFrom(remitente);
      mensaje.setTo(destinatario);
      mensaje.setSubject(asunto);
      mensaje.setText(cuerpo);
      correos.send(mensaje);
      log.info("Correo enviado a {}", destinatario);
    } catch (Exception e) {
      log.warn("No se pudo enviar correo a {}: {}", destinatario, e.getMessage());
    }
  }
}
