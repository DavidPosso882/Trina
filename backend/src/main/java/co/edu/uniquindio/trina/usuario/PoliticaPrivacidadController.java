package co.edu.uniquindio.trina.usuario;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** RF-48: política de tratamiento de datos, visible sin sesión (versión vigente v2, Ley 1581). */
@RestController
public class PoliticaPrivacidadController {

  static final String VERSION = "v2";

  private static final String TEXTO =
      "En TRINA tratamos tus datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377"
          + " de 2013. Responsable: proyecto TRINA, Universidad del Quindío. Recolectamos nombre,"
          + " correo, teléfono opcional y datos de residencia opcionales, solo para operar la"
          + " plataforma: identificar tu cuenta, gestionar pedidos, reservas, pagos y avisarte"
          + " sobre tu actividad. No vendemos tus datos ni los compartimos con terceros ajenos al"
          + " servicio. Como titular tienes derecho a conocer, actualizar, rectificar y suprimir"
          + " tus datos, y a revocar la autorización; puedes ejercerlos desde Mi cuenta, donde"
          + " también puedes descargar o eliminar tus datos. La eliminación anonimiza tus datos"
          + " personales y conserva los registros transaccionales sin identificarte. Conservamos"
          + " tus datos mientras uses la plataforma y por el tiempo que exija la ley. Los datos"
          + " de menores se tratan con autorización de sus representantes. Esta política rige"
          + " desde la versión v2 y avisaremos en la plataforma si cambia.";

  @GetMapping("/api/v1/politica-privacidad")
  public CuentaDto.PoliticaResponse ver() {
    return new CuentaDto.PoliticaResponse(VERSION, TEXTO);
  }
}
