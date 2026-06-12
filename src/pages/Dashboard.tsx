import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, UserX, TrendingUp, DollarSign, UserPlus, AlertTriangle, Clock } from "lucide-react";
import StatCard from "../components/StatCard";
import { Notification, Client, Payment, CashFlowEntry, Settings } from "../lib/types";
import { getPayments, getCashFlow, getSettings, getSettingsSync } from "../lib/store";
import gymLogo from "@/assets/summergym.jpg";

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface DashboardProps {
  clients: Client[];
  notifications: Notification[];
  onRestoreNotifications?: () => void;
}

export default function Dashboard({ clients, notifications, onRestoreNotifications }: DashboardProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashflow, setCashflow] = useState<CashFlowEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(getSettingsSync());

  useEffect(() => {
    Promise.all([getPayments(), getCashFlow(), getSettings()]).then(
      ([p, c, s]) => {
        setPayments(p);
        setCashflow(c);
        setSettings(s);
      }
    );
  }, []);

  const activeMonth = { mes: settings.mesActivoMes, anio: settings.mesActivoAnio };

  const activos = clients.filter(c => c.estado === 'activo').length;
  const inactivos = clients.filter(c => c.estado === 'inactivo').length;

  const DISTRIBUCION_TIPOS = ['CORTE DE CAJA', 'DIV. INGRESO C.C.', 'DIV. INGRESO J. I.'];

  const cashflowDelMesActivo = useMemo(() =>
    cashflow.filter(e => {
      if (!e.fecha) return false;
      const d = new Date(e.fecha + 'T12:00:00');
      return d.getMonth() + 1 === activeMonth.mes && d.getFullYear() === activeMonth.anio;
    }),
  [cashflow, activeMonth]);

  const operativos = cashflowDelMesActivo.filter(e => !DISTRIBUCION_TIPOS.includes(e.tipo));
  const ingresosActivo = operativos.reduce((s, e) => s + (Number(e.ingreso) || 0), 0);
  const egresosActivo = operativos.reduce((s, e) => s + (Number(e.egreso) || 0), 0);
  const disponibleActivo = ingresosActivo - egresosActivo;

  const altasMesActivo = clients.filter(c => {
    if (!c.fechaIngreso) return false;
    const d = new Date(c.fechaIngreso + 'T12:00:00');
    return d.getMonth() + 1 === activeMonth.mes && d.getFullYear() === activeMonth.anio;
  }).length;

  const recentPayments = useMemo(() =>
    [...payments].sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()).slice(0, 6),
    [payments]
  );

  const inactivosList = clients.filter(c => c.estado === 'inactivo');

  const porVencerList = useMemo(() => {
    const limite = settings.diasInactividad;
    const alerta = settings.diasAlerta;
    const now = new Date();
    return clients.filter(c => {
      if (c.estado !== 'activo') return false;
      const ps = payments.filter(p => p.clientId === c.id).sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
      if (ps.length === 0) return false;
      const daysSince = Math.floor((now.getTime() - new Date(ps[0].fechaPago).getTime()) / 86400000);
      return daysSince >= limite - alerta;
    });
  }, [clients, payments, settings]);

  const totalAlertas = inactivosList.length + porVencerList.length;

  const monthLabel = `${MONTHS[activeMonth.mes - 1]} ${activeMonth.anio}`;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Mostrando mes activo: <span className="text-foreground font-semibold">{monthLabel}</span>
            </p>
          </div>
          <div className="hidden sm:block w-16 h-16 rounded-xl overflow-hidden">
            <img src={gymLogo} alt="Summer Gym" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          <StatCard key="t" title="Total Clientes" value={clients.length} icon={<Users className="w-5 h-5" />} variant="primary" />,
          <StatCard key="a" title="Activos" value={activos} icon={<UserCheck className="w-5 h-5" />} variant="success" subtitle="Al día con sus pagos" />,
          <StatCard key="i" title="Inactivos" value={inactivos} icon={<UserX className="w-5 h-5" />} variant="destructive" subtitle="Cuota vencida" />,
          <StatCard key="ingresos" title={`Ingresos · ${monthLabel}`} value={`$${ingresosActivo.toLocaleString('es-AR')}`} icon={<TrendingUp className="w-5 h-5" />} variant="electric" />,
        ].map((card, i) => (
          <div key={i}>{card}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title={`Disponible · ${monthLabel}`} value={`$${disponibleActivo.toLocaleString('es-AR')}`} icon={<DollarSign className="w-5 h-5" />} variant={disponibleActivo >= 0 ? "success" : "destructive"} />
        <StatCard title={`Altas · ${monthLabel}`} value={altasMesActivo} icon={<UserPlus className="w-5 h-5" />} variant="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="font-heading font-semibold flex items-center gap-2 text-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              Alertas de Cuotas
            </h2>
            {totalAlertas > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">{totalAlertas}</span>}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-custom">
            {totalAlertas === 0 && (
              <p className="text-muted-foreground text-xs py-4 text-center">Todos los clientes están al día</p>
            )}
            {inactivosList.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold mb-1 flex items-center gap-1">
                  <UserX className="w-3 h-3" /> Inactivos ({inactivosList.length})
                </p>
                <div className="space-y-1">
                  {inactivosList.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-xs truncate">{c.nombre} {c.apellido}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium shrink-0 ml-1.5">Inactivo</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {porVencerList.length > 0 && (
              <div>
                {inactivosList.length > 0 && <hr className="border-border/40 my-2" />}
                <p className="text-[10px] uppercase tracking-wider text-warning font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Por vencer ({porVencerList.length})
                </p>
                <div className="space-y-1">
                  {porVencerList.map(c => {
                    const ps = payments.filter(p => p.clientId === c.id).sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
                    const daysSince = Math.floor((Date.now() - new Date(ps[0]?.fechaPago || '').getTime()) / 86400000);
                    const restan = settings.diasInactividad - daysSince;
                    return (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/20">
                        <div className="min-w-0">
                          <p className="text-xs truncate">{c.nombre} {c.apellido}</p>
                          <p className="text-[10px] text-muted-foreground">Vence en {restan} día{restan !== 1 ? 's' : ''}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium shrink-0 ml-1.5">{restan}d</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button onClick={onRestoreNotifications}
            className="mt-2 shrink-0 text-[10px] text-muted-foreground hover:text-primary transition-colors text-center">
            Restaurar notificaciones descartadas
          </button>
        </div>

        {/* Últimos pagos */}
        <div className="glass-card p-6">
          <h2 className="font-heading font-semibold mb-4">Últimos Pagos</h2>
          <div className="space-y-1">
            {recentPayments.length === 0 && (
              <p className="text-muted-foreground text-sm py-6 text-center">No hay pagos registrados</p>
            )}
            {recentPayments.map((p) => (
              <div key={p.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {p.clientName.split(' ').map(s => s[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{p.clientName}</p>
                    <p className="text-xs text-muted-foreground">{p.mes} {p.anio} · {p.modalidadPago}</p>
                  </div>
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
