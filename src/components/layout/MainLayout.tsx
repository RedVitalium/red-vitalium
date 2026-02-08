import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-secondary text-secondary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-70">© 2025 Red Vitalium. Todos los derechos reservados.</p>
          <p className="text-xs mt-2 opacity-50">Longevidad y Bienestar Basado en Datos</p>
        </div>
      </footer>
    </div>
  );
}
