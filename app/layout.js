import './globals.css';

export const metadata = {
  title: 'Tu Aplicación',
  description: 'Planeación de Producción',
};

// Usamos un componente dinámico para obtener el nonce desde el encabezado
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Cargar Bootstrap desde un archivo externo */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        />
        {/* Inyectar el nonce como una variable global para que los scripts del cliente lo usen */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__nonce__ = "${typeof window !== 'undefined' ? document.currentScript?.nonce || '' : ''}";
            `,
          }}
        />
      </head>
      <body>
        {children}
        {/* Cargar el script de Bootstrap con el nonce */}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          nonce={typeof window !== 'undefined' ? window.__nonce__ : undefined}
        />
      </body>
    </html>
  );
}