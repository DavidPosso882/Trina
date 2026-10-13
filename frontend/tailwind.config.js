/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // S1 — paleta "letrero de plaza": seis colores con nombre.
        'blanco-mercado': '#FFFFFF', // fondo de página; jubila el crema #FFFBF4
        'tinta-cafe': '#2B2118', // texto; reemplaza el slate
        bosque: '#1B6B47', // superficie protagonista
        'bosque-profundo': '#0E3B28',
        terracota: '#B3472A', // solo precio, CTA y destacado
        'oro-cosecha': '#E9A13B', // dosis mínimas: estrellas e insignias
        // Alias semánticos que ya usan las pantallas (T2/T3 conservan esta API).
        primario: '#1B6B47',
        'primario-claro': '#E8F3EC',
        acento: '#B3472A',
        fondo: '#FFFFFF',
        superficie: '#FFFFFF',
        texto: '#2B2118',
        'texto-suave': '#6B645D',
        exito: '#166534',
        advertencia: '#92400E',
        error: '#B42318',
        info: '#1D4ED8'
      },
      fontFamily: {
        // S2 — Inter para cuerpo/UI; Archivo para headlines, precios y cifras.
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Archivo', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif']
      },
      fontSize: {
        // S2 — escala tokenizada de headlines y cifras (reemplaza text-[Npx] en componentes).
        titulo: ['28px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        'titulo-menor': ['22px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        seccion: ['18px', { lineHeight: '1.3', letterSpacing: '-0.005em', fontWeight: '700' }],
        cifra: ['40px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'cifra-menor': ['28px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }]
      },
      borderRadius: {
        tarjeta: '12px',
        campo: '8px'
      },
      minHeight: {
        boton: '48px'
      }
    }
  },
  plugins: []
};
