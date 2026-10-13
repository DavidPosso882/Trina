import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Icono } from '../Icono';

type Comunes = {
  etiqueta: string;
  /** Línea de ayuda con ejemplo (§1.8 del diseño UI). */
  ayuda?: string;
  /** Mensaje que explica cómo arreglar el error; va con role=alert. */
  error?: string;
  registro: UseFormRegisterReturn;
};

function descritos(id: string, ayuda?: string, error?: string): string | undefined {
  const ids = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

function Pie({ id, ayuda, error }: { id: string; ayuda?: string; error?: string }) {
  return (
    <>
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-sm text-texto-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 flex items-start gap-2 font-semibold text-error">
          <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-1" />
          <span>{error}</span>
        </p>
      )}
    </>
  );
}

/** Campo de texto con etiqueta visible, ayuda y error anunciado (RNF-07). */
export function CampoTexto({
  etiqueta,
  ayuda,
  error,
  registro,
  ...resto
}: Comunes & Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'id'>) {
  const id = registro.name;
  return (
    <div>
      <label htmlFor={id} className="font-semibold">
        {etiqueta}
      </label>
      <input
        id={id}
        className="campo mt-1"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descritos(id, ayuda, error)}
        {...registro}
        {...resto}
      />
      <Pie id={id} ayuda={ayuda} error={error} />
    </div>
  );
}

/** Área de texto multilínea con el mismo contrato de accesibilidad. */
export function CampoArea({
  etiqueta,
  ayuda,
  error,
  registro,
  ...resto
}: Comunes & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'id'>) {
  const id = registro.name;
  return (
    <div>
      <label htmlFor={id} className="font-semibold">
        {etiqueta}
      </label>
      <textarea
        id={id}
        rows={3}
        className="campo mt-1"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descritos(id, ayuda, error)}
        {...registro}
        {...resto}
      />
      <Pie id={id} ayuda={ayuda} error={error} />
    </div>
  );
}

/** Selector con etiqueta visible; recibe las opciones como children. */
export function CampoSelect({
  etiqueta,
  ayuda,
  error,
  registro,
  children,
  ...resto
}: Comunes & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'id'> & { children: ReactNode }) {
  const id = registro.name;
  return (
    <div>
      <label htmlFor={id} className="font-semibold">
        {etiqueta}
      </label>
      <select
        id={id}
        className="campo mt-1"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descritos(id, ayuda, error)}
        {...registro}
        {...resto}
      >
        {children}
      </select>
      <Pie id={id} ayuda={ayuda} error={error} />
    </div>
  );
}
