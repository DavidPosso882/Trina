/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta SVG Explorador (escritorio/móvil): oliva + lima + crema.
        // Se conservan los nombres viejos como alias para no romper pantallas pre-T2.
        'blanco-mercado': '#FFFFFF',
        'tinta-cafe': '#2B2118',
        bosque: '#1B6B47',
        'bosque-profundo': '#0E3B28',
        terracota: '#B3472A',
        'oro-cosecha': '#E9A13B',
        oliva: '#1B2117',
        lima: '#94B839',
        'lima-oscura': '#5A8A0A',
        crema: '#F8F9FA',
        dorado: '#D4C04D',
        marron: '#3D1A11',
        // Alias semánticos: apuntan a la paleta SVG desde T1.
        primario: '#1B2117',
        'primario-claro': '#DCE6D2',
        acento: '#94B839',
        fondo: '#F8F9FA',
        superficie: '#FFFFFF',
        texto: '#1B2117',
        'texto-suave': '#6A6259',
        exito: '#5A8A0A',
        advertencia: '#92400E',
        error: '#E05252',
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
        tarjeta: '16px',
        campo: '8px',
        pastilla: '9999px'
      },
      minHeight: {
        boton: '48px'
      }
    }
  },
  plugins: []
};
