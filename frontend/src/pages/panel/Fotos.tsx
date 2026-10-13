import type { Negocio } from '../../lib/api';
import { ConNegocio } from '../../components/negocio/ConNegocio';
import { EditorFotos } from '../../components/negocio/EditorFotos';
import { EncabezadoNegocio } from '../../components/negocio/EncabezadoNegocio';

/** PM-05 Fotos (RF-12): edición directa con el mismo editor del asistente. */
export default function Fotos() {
  return <ConNegocio>{(negocio) => <PantallaFotos negocio={negocio} />}</ConNegocio>;
}

function PantallaFotos({ negocio }: { negocio: Negocio }) {
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <EncabezadoNegocio negocio={negocio} titulo="Fotos" />
      <p className="mt-4 text-texto-suave">
        Subí fotos de tu negocio. La principal es la que se muestra primero en tu perfil.
      </p>
      <div className="mt-4">
        <EditorFotos negocioId={negocio.id} nombreNegocio={negocio.nombre} />
      </div>
    </main>
  );
}
