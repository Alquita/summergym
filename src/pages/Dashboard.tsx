import { useMemo } from "react";
import { Users, UserCheck, UserX, TrendingUp, AlertTriangle, Clock, Flame } from "lucide-react";
import StatCard from "../components/StatCard";
import { Notification } from "../lib/types";
import { getPayments, getSettings } from "../lib/store";
import gymLogo from "@/assets/summergym.jpg";

interface DashboardProps {
  clients: ReturnType<typeof import('../lib/store').getClients>;
  notifications: Notification[];
}

export default function Dashboard({ clients, notifications }: DashboardProps) {
  const payments = useMemo(() => getPayments(), []);
  const settings = getSettings();

  const activos = clients.filter(c => c.estado === 'activo').length;
  const inactivos = clients.filter(c => c.estado === 'inactivo').length;
  const totalIngresos = payments.reduce((sum, p) => sum + p.monto, 0);

  const recentPayments = useMemo(() =>
    [...payments].sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()).slice(0, 6),
    [payments]
  );

  const alertas = notifications.filter(n => n.type === 'cuota_vencida' || n.type === 'cuota_por_vencer');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden glass-card p-8 bg-mesh">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-accent/15 blur-3xl animate-float-slow" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Live · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold gradient-text-fire leading-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 max-w-md">Todo lo que pasa en <span className="text-foreground font-semibold">{settings.gymName}</span>, en tiempo real.</p>
          </div>
          <div className="hidden sm:block relative w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-primary/40 animate-float ring-2 ring-primary/30">
            <img src={gymLogo} alt="Summer Gym" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-accent/20" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          <StatCard key="t" title="Total Clientes" value={clients.length} icon={<Users className="w-5 h-5" />} variant="primary" />,
          <StatCard key="a" title="Activos" value={activos} icon={<UserCheck className="w-5 h-5" />} variant="success" subtitle="Al día con sus pagos" />,
          <StatCard key="i" title="Inactivos" value={inactivos} icon={<UserX className="w-5 h-5" />} variant="destructive" subtitle="Cuota vencida" />,
          <StatCard key="$" title="Ingresos Totales" value={`$${totalIngresos.toLocaleString('es-AR')}`} icon={<TrendingUp className="w-5 h-5" />} variant="electric" />,
        ].map((card, i) => (
          <div key={i} style={{ animationDelay: `${i * 80}ms` }} className="animate-slide-up">{card}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="glass-card glass-card-hover p-6 animate-slide-up" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-warning to-accent text-warning-foreground shadow-lg shadow-warning/30">
                <AlertTriangle className="w-4 h-4" />
              </span>
              Alertas de Cuotas
            </h2>
            {alertas.length > 0 && <span className="text-xs px-2.5 py-1 rounded-full bg-destructive/15 text-destructive font-bold">{alertas.length}</span>}
          </div>
          <div className="space-y-2">
            {alertas.length === 0 && (
              <div className="py-8 text-center">
                <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-lime items-center justify-center mb-3 shadow-lg shadow-success/30 animate-pulse-glow">
                  <UserCheck className="w-7 h-7 text-success-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Todos los clientes están al día 🎉</p>
              </div>
            )}
            {alertas.slice(0, 8).map((a, i) => (
              <div key={a.id} style={{ animationDelay: `${i * 50}ms` }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:translate-x-1 animate-slide-up ${a.type === 'cuota_vencida' ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40' : 'bg-warning/5 border-warning/20 hover:border-warning/40'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  {a.type === 'cuota_vencida'
                    ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    : <Clock className="w-4 h-4 text-warning shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-2 ${a.type === 'cuota_vencida' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}`}>
                  {a.type === 'cuota_vencida' ? 'Vencida' : 'Por vencer'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos pagos */}
        <div className="glass-card glass-card-hover p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h2 className="font-heading font-bold text-lg mb-5 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-electric to-violet text-electric-foreground shadow-lg shadow-electric/30">
              <TrendingUp className="w-4 h-4" />
            </span>
            Últimos Pagos
          </h2>
          <div className="space-y-1">
            {recentPayments.length === 0 && (
              <p className="text-muted-foreground text-sm py-8 text-center">No hay pagos registrados</p>
            )}
            {recentPayments.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 50}ms` }}
                className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-secondary/40 transition-all hover:translate-x-1 animate-slide-up">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {p.clientName.split(' ').map(s => s[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.clientName}</p>
                    <p className="text-xs text-muted-foreground">{p.mes} {p.anio} · {p.modalidadPago}</p>
                  </div>
                </div>
                <span className="font-heading font-bold text-success tabular-nums">${p.monto.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
