import { useMemo } from "react";
import { Users, UserCheck, UserX, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import StatCard from "../components/StatCard";
import { Notification } from "../lib/types";
import { getPayments } from "../lib/store";

interface DashboardProps {
  clients: ReturnType<typeof import('../lib/store').getClients>;
  notifications: Notification[];
}

export default function Dashboard({ clients, notifications }: DashboardProps) {
  const payments = useMemo(() => getPayments(), []);

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
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Resumen general de Summer Gym</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Alumnos" value={clients.length} icon={<Users className="w-5 h-5" />} variant="primary" />
        <StatCard title="Activos" value={activos} icon={<UserCheck className="w-5 h-5" />} variant="success" subtitle="Al día con sus pagos" />
        <StatCard title="Inactivos" value={inactivos} icon={<UserX className="w-5 h-5" />} variant="destructive" subtitle="Cuota vencida" />
        <StatCard title="Ingresos Totales" value={`$${totalIngresos.toLocaleString('es-AR')}`} icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de cuotas */}
        <div className="glass-card p-6">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" /> Alertas de Cuotas
          </h2>
          <div className="space-y-2">
            {alertas.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">Todos los alumnos están al día 🎉</p>}
            {alertas.slice(0, 8).map(a => (
              <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg ${a.type === 'cuota_vencida' ? 'bg-destructive/5 border border-destructive/15' : 'bg-warning/5 border border-warning/15'}`}>
                <div className="flex items-center gap-3">
                  {a.type === 'cuota_vencida' ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0" /> : <Clock className="w-4 h-4 text-warning shrink-0" />}
                  <div>
                    <p className="font-medium text-sm">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">{a.message}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${a.type === 'cuota_vencida' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
                  {a.type === 'cuota_vencida' ? 'Vencida' : 'Por vencer'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos pagos */}
        <div className="glass-card p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Últimos Pagos</h2>
          <div className="space-y-1">
            {recentPayments.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No hay pagos registrados</p>}
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{p.clientName}</p>
                  <p className="text-xs text-muted-foreground">{p.mes} {p.anio} · {p.modalidadPago}</p>
                </div>
                <span className="font-heading font-semibold text-success">${p.monto.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
