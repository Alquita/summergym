import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";
import FlujoCaja from "./pages/FlujoCaja";
import Configuracion from "./pages/Configuracion";

import NotFound from "./pages/NotFound";
import { syncClientStatuses, seedIfEmpty, getSettings } from "./lib/store";
import { Notification, Client } from "./lib/types";

const queryClient = new QueryClient();

const App = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      await getSettings();
      const { updatedClients, notifications: notifs } = await syncClientStatuses();
      setClients(updatedClients);
      setNotifications(notifs);
      setReady(true);
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar notifications={notifications} />
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
              {!ready ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">Cargando datos...</div>
              ) : (
                <Routes>
                  <Route path="/" element={<Dashboard clients={clients} notifications={notifications} />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/pagos" element={<Pagos />} />
                  <Route path="/caja" element={<FlujoCaja />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              )}
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
