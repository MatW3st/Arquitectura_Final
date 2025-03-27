import './globals.css';
import Head from 'next/head';

// Definir metadatos para SEO y accesibilidad
export const metadata = {
  title: 'Planeación de Producción',
  description: 'Aplicación para la planeación de producción de tu empresa.',
  keywords: 'planeación, producción, sucursales, gestión, industria',
  author: 'Tu Nombre o Empresa',
  openGraph: {
    title: 'Planeación de Producción',
    description: 'Aplicación para la planeación de producción de tu empresa.',
    url: 'https://prueba-moleculer.vercel.app', // Reemplaza con tu dominio de producción
    siteName: 'Planeación de Producción',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planeación de Producción',
    description: 'Aplicación para la planeación de producción de tu empresa.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <Head>
        {/* Metadatos básicos */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Cargar Bootstrap CSS localmente con precarga */}
        <link
          rel="preload"
          href="/css/bootstrap.min.css"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link rel="stylesheet" href="/css/bootstrap.min.css" />
        </noscript>

        {/* Cargar Bootstrap JS localmente con defer */}
        <script defer src="/js/bootstrap.bundle.min.js" />
      </Head>
      <body>{children}</body>
    </html>
  );
}