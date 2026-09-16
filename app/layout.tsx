import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Valencia Basket - Calendario y Asistencia',
  description: 'Gestor colaborativo de partidos del Valencia Basket',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black text-white flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}