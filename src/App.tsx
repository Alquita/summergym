import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useCallback } from "react";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";
import FlujoCaja from "./pages/FlujoCaja";
import Configuracion from "./pages/Configuracion";

import NotFound from "./pages/NotFound";
import { syncClientStatuses, seedIfEmpty, getSettings, dismissNotificationKey, dismissAllNotificationKeys, restoreAllNotifications } from "./lib/store";
import { Notification, Client } from "./lib/types";
const queryClient = new QueryClient();

const App = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);

  const reSync = useCallback(async () => {
    const { updatedClients, notifications: notifs } = await syncClientStatuses();
    setClients(updatedClients);
    setNotifications(notifs);
  }, []);

  const handleDismiss = useCallback(async (key: string) => {
    await dismissNotificationKey(key);
    await reSync();
  }, [reSync]);

  const handleDismissAll = useCallback(async (keys: string[]) => {
    await dismissAllNotificationKeys(keys);
    await reSync();
  }, [reSync]);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      await getSettings();
      await reSync();
      setReady(true);
    })();
  }, [reSync]);

  const handleRestoreNotifications = useCallback(async () => {
    await restoreAllNotifications();
    await reSync();
  }, [reSync]);

  // SW update detection — recarga automática cuando hay nueva versión
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const checkUpdate = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      reg?.update();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar notifications={notifications} onDismiss={handleDismiss} onDismissAll={handleDismissAll} />
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
              {!ready ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">Cargando datos...</div>
              ) : (
                <Routes>
                  <Route path="/" element={<Dashboard clients={clients} notifications={notifications} onRestoreNotifications={handleRestoreNotifications} />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/pagos" element={<Pagos />} />
                  <Route path="/caja" element={<FlujoCaja />} />
                  <Route path="/configuracion" element={<Configuracion onSettingsSaved={reSync} />} />
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
