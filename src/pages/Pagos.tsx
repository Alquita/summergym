import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CreditCard, UserPlus, Search, Check, X, CalendarDays, DollarSign, CheckCircle2 } from "lucide-react";
import { getPayments, savePayment, getClients, getSettings } from "../lib/store";
import { Payment } from "../lib/types";

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const metodos: Payment['modalidadPago'][] = ['Efectivo', 'Transferencia', 'Debito', 'Credito'];

export default function Pagos() {
  const [payments, setPayments] = useState(getPayments);
  const clients = useMemo(() => getClients(), []);
  const settings = useMemo(() => getSettings(), []);
  const [clientSearch, setClientSearch] = useState('');
  const [form, setForm] = useState({
    clientId: '',
    mes: meses[new Date().getMonth()],
    anio: new Date().getFullYear(),
    modalidadPago: 'Efectivo' as Payment['modalidadPago'],
    monto: String(settings.cuotaMensual || ''),
    fechaPago: new Date().toISOString().split('T')[0],
    plan: 'Pase libre',
  });


  const selectedClient = clients.find(c => c.id === form.clientId);
  const clientResults = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return [];
    return clients
      .filter(c => `${c.nombre} ${c.apellido}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clientSearch, clients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !form.monto) return;
    savePayment({
      ...form,
      monto: Number(form.monto),
      clientName: `${selectedClient.apellido} ${selectedClient.nombre}`,
    });
    setPayments(getPayments());
    setForm(f => ({ ...f, clientId: '', monto: '' }));
    setClientSearch('');
  };

  const recent = [...payments].sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()).slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2">
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-t-xl bg-primary/15 border border-primary/40 border-b-0 text-primary font-medium text-sm">
          <CreditCard className="w-4 h-4" /> Registrar Pago
        </button>
        <Link to="/clientes"
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-t-xl bg-secondary/40 border border-border border-b-0 text-muted-foreground font-medium text-sm hover:text-foreground transition-colors">
          <UserPlus className="w-4 h-4" /> Nuevo Usuario
        </Link>
      </div>

      {/* Main Card */}
      <div className="glass-card p-6 sm:p-8 -mt-6 rounded-tl-none">
        <div className="flex items-start gap-4 pb-5 border-b border-border/50">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Registrar Pago</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buscá el alumno y registrá su cuota mensual</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          {/* Step 1 */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              1. Seleccionar Alumno
            </p>
            {selectedClient ? (
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary/10 border border-primary/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedClient.apellido} {selectedClient.nombre}</p>
                    <p className="text-xs text-muted-foreground">Plan: {selectedClient.plan}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setForm(p => ({ ...p, clientId: '' })); setClientSearch(''); }}
                  className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                  placeholder="Buscar por nombre o apellido..."
                  className="w-full pl-11 pr-4 py-3 bg-input/60 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
                {clientSearch && (
                  <div className="absolute z-20 left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {clientResults.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">Sin resultados</p>
                    ) : clientResults.map(c => (
                      <button key={c.id} type="button"
                        onClick={() => { setForm(p => ({ ...p, clientId: c.id, plan: c.plan || p.plan })); setClientSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center justify-between border-b border-border/30 last:border-0">
                        <span className="font-medium">{c.apellido} {c.nombre}</span>
                        <span className="text-xs text-muted-foreground">{c.plan}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              2. Datos del Pago
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Fecha de Pago *</label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input type="date" value={form.fechaPago} onChange={e => setForm(p => ({ ...p, fechaPago: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Monto *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="number" value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} required
                    placeholder="35000"
                    className="w-full pl-10 pr-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Mes</label>
                <select value={form.mes} onChange={e => setForm(p => ({ ...p, mes: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {meses.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Año</label>
                <input type="number" value={form.anio} onChange={e => setForm(p => ({ ...p, anio: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Método de Pago *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {metodos.map(m => {
                  const active = form.modalidadPago === m;
                  return (
                    <button key={m} type="button" onClick={() => setForm(p => ({ ...p, modalidadPago: m }))}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        active
                          ? 'bg-primary/15 border-primary/50 text-primary shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]'
                          : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                      }`}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button type="submit" disabled={!selectedClient || !form.monto}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3.5 rounded-xl font-heading font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_25px_-5px_hsl(var(--primary)/0.5)]">
            <CheckCircle2 className="w-5 h-5" /> Registrar Pago
          </button>
        </form>
      </div>

      {/* Recent payments */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold">Pagos Recientes</h2>
          <span className="text-xs text-muted-foreground">{payments.length} en total</span>
        </div>
        {recent.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Aún no hay pagos registrados</p>
        ) : (
          <div className="space-y-2">
            {recent.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-secondary/30 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.clientName}</p>
                  <p className="text-xs text-muted-foreground">{p.mes} {p.anio} · {p.modalidadPago}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-heading font-semibold text-success">${p.monto.toLocaleString('es-AR')}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(p.fechaPago + 'T12:00:00').toLocaleDateString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
