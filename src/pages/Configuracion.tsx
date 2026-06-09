import { useEffect, useRef, useState } from "react";
import { Settings as SettingsIcon, BarChart3, Building2, DollarSign, Upload, Download, Save, Users, TrendingUp, Bell, Lightbulb } from "lucide-react";
import { getSettings, saveSettings, getClients, getPayments, exportAllData, importAllData } from "../lib/store";
import { Settings, planPrice } from "../lib/types";
import { toast } from "sonner";

const DEFAULTS: Settings = { gymName: 'Summer Gym', direccion: '', telefono: '', precioPaseLibre: 35000, precio3xSemana: 30000, precio2xSemana: 25000, precio1Dia: 10000, diasAlerta: 5, diasInactividad: 35 };

export default function Configuracion() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [stats, setStats] = useState({ total: 0, activos: 0, ingresosMes: 0, estimado: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getSettings().then(setSettings); }, []);

  useEffect(() => {
    (async () => {
      const [clients, payments] = await Promise.all([getClients(), getPayments()]);
      const clientesActivos = clients.filter(c => c.estado === 'activo');
      const ingresosMes = payments
        .filter(p => new Date(p.fechaPago).getFullYear() === new Date().getFullYear() && new Date(p.fechaPago).getMonth() === new Date().getMonth())
        .reduce((s, p) => s + p.monto, 0);
      const estimado = clientesActivos.reduce((sum, c) => sum + planPrice(c.plan, settings), 0);
      setStats({ total: clients.length, activos: clientesActivos.length, ingresosMes, estimado });
    })();
  }, [settings.precioPaseLibre, settings.precio3xSemana, settings.precio2xSemana, settings.precio1Dia]);

  const handleSave = async () => {
    await saveSettings(settings);
    toast.success("Configuración guardada");
  };

  const handleExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.gymName.replace(/\s+/g, '_').toLowerCase()}_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Datos exportados");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Esto reemplazará todos los datos actuales. ¿Continuar?')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        await importAllData(ev.target?.result as string);
        toast.success("Datos importados. Recargando...");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        toast.error("Archivo inválido");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">Personalizá cómo funciona tu gimnasio</p>
        </div>
      </div>

      {/* Quick Stats */}
      <Section icon={<BarChart3 className="w-4 h-4" />} title="Estadísticas Rápidas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Usuarios" value={stats.total.toString()} sub={`${stats.activos} activos`} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Ingresos Estimados" value={`$${stats.estimado.toLocaleString('es-AR')}`} sub={`Real este mes: $${stats.ingresosMes.toLocaleString('es-AR')}`} />
        </div>
      </Section>

      {/* Gym Info */}
      <Section icon={<Building2 className="w-4 h-4" />} title="Datos del Gimnasio">
        <Field label="Nombre del Gimnasio" value={settings.gymName} onChange={v => setSettings(s => ({ ...s, gymName: v }))} placeholder="SUMMER GYM" />
        <Field label="Dirección" value={settings.direccion} onChange={v => setSettings(s => ({ ...s, direccion: v }))} placeholder="Calle 123, Ciudad" />
        <Field label="Teléfono" value={settings.telefono} onChange={v => setSettings(s => ({ ...s, telefono: v }))} placeholder="351 123 4567" />
      </Section>

      {/* Payment Config */}
      <Section icon={<DollarSign className="w-4 h-4" />} title="Configuración de Pagos">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Precios por Plan</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pase libre ($)" type="number" value={String(settings.precioPaseLibre)} onChange={v => setSettings(s => ({ ...s, precioPaseLibre: Number(v) || 0 }))} />
          <Field label="3 x semana ($)" type="number" value={String(settings.precio3xSemana)} onChange={v => setSettings(s => ({ ...s, precio3xSemana: Number(v) || 0 }))} />
          <Field label="2 x semana ($)" type="number" value={String(settings.precio2xSemana)} onChange={v => setSettings(s => ({ ...s, precio2xSemana: Number(v) || 0 }))} />
          <Field label="1 día ($)" type="number" value={String(settings.precio1Dia)} onChange={v => setSettings(s => ({ ...s, precio1Dia: Number(v) || 0 }))} />
        </div>
        <Field label="Días de Alerta (antes del vencimiento)" type="number" value={String(settings.diasAlerta)} onChange={v => setSettings(s => ({ ...s, diasAlerta: Number(v) || 0 }))} />
        <p className="text-xs text-muted-foreground -mt-1 flex items-center gap-1.5">
          <Bell className="w-3 h-3" /> Se enviará una alerta {settings.diasAlerta} días antes del vencimiento
        </p>
        <Field label="Días hasta marcar Inactivo" type="number" value={String(settings.diasInactividad)} onChange={v => setSettings(s => ({ ...s, diasInactividad: Number(v) || 0 }))} />
        <p className="text-xs text-muted-foreground -mt-1">Los clientes que pasen {settings.diasInactividad} días sin pagar se marcan inactivos automáticamente.</p>
      </Section>

      {/* Data Management */}
      <Section icon={<Upload className="w-4 h-4" />} title="Gestión de Datos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-success/15 hover:bg-success/25 text-success border border-success/30 py-3 rounded-xl font-medium text-sm transition-colors">
            <Download className="w-4 h-4" /> Exportar Datos
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 py-3 rounded-xl font-medium text-sm transition-colors">
            <Upload className="w-4 h-4" /> Importar Datos
          </button>
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
        </div>
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-warning/10 border-l-2 border-warning text-xs">
          <Lightbulb className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
          <span>Exportá tus datos regularmente como respaldo.</span>
        </div>
      </Section>

      {/* Save */}
      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
        <Save className="w-5 h-5" /> Guardar Configuración
      </button>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-heading font-semibold">
        <span className="text-primary">{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
      <div className="flex items-start gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-heading font-bold mt-2">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
