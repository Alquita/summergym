import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { AlertTriangle, Clock, Cake, X, MessageCircle } from "lucide-react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";
import FlujoCaja from "./pages/FlujoCaja";
import Configuracion from "./pages/Configuracion";

import NotFound from "./pages/NotFound";
import { syncClientStatuses, seedIfEmpty, getSettings, dismissNotificationKey, dismissAllNotificationKeys, getSettingsSync } from "./lib/store";
import { Notification, Client } from "./lib/types";
const queryClient = new QueryClient();

const App = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);

  const whatsappUrl = (telefono: string | undefined, nombre: string): string | null => {
    if (!telefono) return null;
    const cleaned = telefono.replace(/[\s\-()]/g, '');
    const full = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned.startsWith('54') ? cleaned : `549${cleaned}`;
    const settings = getSettingsSync();
    const msg = encodeURIComponent(settings.mensajeCumpleanosAntes + nombre + settings.mensajeCumpleanosDespues);
    return `https://wa.me/${full}?text=${msg}`;
  };

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

  useEffect(() => {
    if (!ready) return;
    notifications.forEach((n, i) => {
      setTimeout(() => {
        toast.custom(
          (t) => {
            let config: { icon: typeof AlertTriangle; color: string; bg: string; border: string };
            if (n.type === 'cuota_vencida') config = { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' };
            else if (n.type === 'cuota_por_vencer') config = { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' };
            else config = { icon: Cake, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' };
            const Icon = config.icon;
            return (
              <div className={`flex items-start gap-3 p-3 w-full rounded-lg border ${config.bg} ${config.border}`}>
                <Icon className={`w-5 h-5 ${config.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{n.clientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    {n.type === 'cumpleanos' && n.message.includes('Hoy') && getSettingsSync().waCumpleanosHabilitado && (() => {
                      const url = whatsappUrl(n.clienteTelefono, n.clientName);
                      if (!url) return null;
                      return (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-[#25D366] hover:text-[#1da851] font-medium transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" /> Enviar saludo por WhatsApp
                        </a>
                      );
                    })()}
                  </div>
                  <button onClick={() => toast.dismiss(t)} className="text-muted-foreground hover:text-foreground shrink-0 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
              </div>
            );
          },
          { duration: 10000 }
        );
      }, (i + 1) * 1200);
    });
  }, [ready]);

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
                  <Route path="/" element={<Dashboard clients={clients} notifications={notifications} />} />
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
