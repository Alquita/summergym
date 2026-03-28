import { useMemo } from "react";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import { getClients, getPayments } from "../lib/store";

export default function Dashboard() {
  const clients = useMemo(() => getClients(), []);
  const payments = useMemo(() => getPayments(), []);

  const activos = clients.filter(c => c.estado === 'activo').length;
  const inactivos = clients.filter(c => c.estado === 'inactivo').length;
  const totalIngresos = payments.reduce((sum, p) => sum + p.monto, 0);

  const recentPayments = useMemo(() =>
    [...payments].sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()).slice(0, 8),
    [payments]
  );

  const birthdaysThisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    return clients.filter(c => {
      if (!c.fechaNacimiento) return false;
      return new Date(c.fechaNacimiento).getMonth() === month;
    });
  }, [clients]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Resumen general de Summer Gym</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Alumnos" value={clients.length} icon={<Users className="w-5 h-5" />} variant="primary" />
        <StatCard title="Activos" value={activos} icon={<UserCheck className="w-5 h-5" />} variant="success" subtitle="Al día con sus pagos" />
        <StatCard title="Inactivos" value={inactivos} icon={<UserX className="w-5 h-5" />} variant="destructive" subtitle="Sin pago en +2 meses" />
        <StatCard title="Ingresos Totales" value={`$${totalIngresos.toLocaleString('es-AR')}`} icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="glass-card p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Últimos Pagos</h2>
          <div className="space-y-3">
            {recentPayments.length === 0 && <p className="text-muted-foreground text-sm">No hay pagos registrados</p>}
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="font-medium text-sm">{p.clientName}</p>
                  <p className="text-xs text-muted-foreground">{p.mes} {p.anio} · {p.modalidadPago}</p>
                </div>
                <span className="font-heading font-semibold text-success">${p.monto.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Birthdays */}
        <div className="glass-card p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">🎂 Cumpleaños este mes</h2>
          <div className="space-y-3">
            {birthdaysThisMonth.length === 0 && <p className="text-muted-foreground text-sm">No hay cumpleaños este mes</p>}
            {birthdaysThisMonth.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="font-medium text-sm">{c.nombre} {c.apellido}</p>
                  <p className="text-xs text-muted-foreground">{c.fechaNacimiento && new Date(c.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p>
                </div>
                {c.telefono && (
                  <a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-success/15 text-success px-3 py-1 rounded-full font-medium hover:bg-success/25 transition-colors">
                    WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
