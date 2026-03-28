import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";
import FlujoCaja from "./pages/FlujoCaja";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="/caja" element={<FlujoCaja />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
