package co.edu.uniquindio.trina.usuario;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** RF-48: política de tratamiento de datos, visible sin sesión (versión vigente v1). */
@RestController
public class PoliticaPrivacidadController {

  static final String VERSION = "v1";

  private static final String TEXTO =
      "En TRINA tratamos tus datos personales solo para operar la plataforma: identificar tu"
          + " cuenta, gestionar pedidos, reservas y pagos, y avisarte sobre tu actividad. No"
          + " vendemos tus datos ni los compartimos con terceros ajenos al servicio. Podés"
          + " consultar, actualizar, exportar y eliminar tu cuenta desde Mi cuenta; la eliminación"
          + " anonimiza tus datos personales y conserva los registros transaccionales sin"
          + " identificarte. Responsable: proyecto TRINA, Universidad del Quindío. Esta política"
          + " rige desde la versión v1 y avisaremos si cambia.";

  @GetMapping("/api/v1/politica-privacidad")
  public CuentaDto.PoliticaResponse ver() {
    return new CuentaDto.PoliticaResponse(VERSION, TEXTO);
  }
}
