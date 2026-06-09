import { useEffect, useState, useMemo } from "react";
import { CreditCard, UserPlus, Search, Check, X, DollarSign, CheckCircle2, User } from "lucide-react";
import { DatePicker } from "../components/ui/date-picker";
import { toDate, fromDate } from "../lib/date-utils";
import { getPayments, savePayment, getClients, saveClient, updateClient, getSettings, getSettingsSync } from "../lib/store";
import { Payment, Client, Settings, planPrice } from "../lib/types";

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const metodos: Payment['modalidadPago'][] = ['Efectivo', 'Transferencia', 'Debito', 'Credito'];
const planes = ['Pase libre', '3 x s', '2 x s', '1 dia'];

const emptyNewClient = {
  nombre: '', apellido: '', fechaNacimiento: '', direccion: '',
  telefono: '', telefonoEmergencia: '', plan: 'Pase libre', observaciones: '',
};

export default function Pagos() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings>(getSettingsSync());
  const [clientSearch, setClientSearch] = useState('');
  const [tab, setTab] = useState<'pago' | 'nuevo'>('pago');

  const [form, setForm] = useState({
    clientId: '',
    mes: meses[new Date().getMonth()],
    anio: new Date().getFullYear(),
    modalidadPago: 'Efectivo' as Payment['modalidadPago'],
    monto: String(planPrice('Pase libre', getSettingsSync())),
    fechaPago: new Date().toISOString().split('T')[0],
    plan: 'Pase libre',
  });

  const [newClient, setNewClient] = useState(emptyNewClient);
  const [newPago, setNewPago] = useState({
    modalidadPago: 'Efectivo' as Payment['modalidadPago'],
    monto: String(planPrice('Pase libre', getSettingsSync())),
    fechaPago: new Date().toISOString().split('T')[0],
    mes: meses[new Date().getMonth()],
    anio: new Date().getFullYear(),
  });

  const refresh = async () => {
    const [ps, cs, s] = await Promise.all([getPayments(), getClients(), getSettings()]);
    setPayments(ps); setClients(cs); setSettings(s);
  };
  useEffect(() => { refresh(); }, []);

  const selectedClient = clients.find(c => c.id === form.clientId);
  const clientResults = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return [];
    return clients.filter(c => `${c.nombre} ${c.apellido}`.toLowerCase().includes(q)).slice(0, 8);
  }, [clientSearch, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !form.monto) return;
    await savePayment({
      ...form,
      monto: Number(form.monto),
      clientName: `${selectedClient.apellido} ${selectedClient.nombre}`,
    });
    if (selectedClient.plan !== form.plan) {
      await updateClient({ ...selectedClient, plan: form.plan });
    }
    await refresh();
    setForm(f => ({ ...f, clientId: '', monto: String(planPrice(f.plan || 'Pase libre', settings)) }));
    setClientSearch('');
  };

  const handleNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nombre || !newClient.apellido || !newPago.monto) return;
    const edad = newClient.fechaNacimiento
      ? Math.floor((Date.now() - new Date(newClient.fechaNacimiento).getTime()) / 31557600000)
      : undefined;
    const created = await saveClient({
      ...newClient,
      estado: 'activo',
      fechaIngreso: new Date().toISOString().split('T')[0],
      edad,
    });
    await savePayment({
      clientId: created.id,
      clientName: `${created.apellido} ${created.nombre}`,
      plan: created.plan || 'Pase libre',
      modalidadPago: newPago.modalidadPago,
      monto: Number(newPago.monto),
      fechaPago: newPago.fechaPago,
      mes: newPago.mes,
      anio: newPago.anio,
    });
    await refresh();
    setNewClient(emptyNewClient);
    setNewPago({
      modalidadPago: 'Efectivo',
      monto: String(planPrice('Pase libre', settings)),
      fechaPago: new Date().toISOString().split('T')[0],
      mes: meses[new Date().getMonth()],
      anio: new Date().getFullYear(),
    });
    setTab('pago');
  };

  const recent = [...payments].sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()).slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('pago')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-t-xl border border-b-0 font-medium text-sm transition-colors ${
            tab === 'pago' ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
          }`}>
          <CreditCard className="w-4 h-4" /> Registrar Pago
        </button>
        <button onClick={() => setTab('nuevo')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-t-xl border border-b-0 font-medium text-sm transition-colors ${
            tab === 'nuevo' ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
          }`}>
          <UserPlus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {tab === 'pago' && (
      <div className="glass-card p-6 sm:p-8 -mt-6 rounded-tl-none">
        <div className="flex items-start gap-4 pb-5 border-b border-border/50">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Registrar Pago</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Actualizá la cuota mensual de un cliente existente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">1. Seleccionar Cliente</p>
              {selectedClient ? (
              <div>
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary/10 border border-primary/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedClient.apellido} {selectedClient.nombre}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setForm(p => ({ ...p, clientId: '' })); setClientSearch(''); }}
                    className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Plan</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {planes.map(p => {
                      const active = form.plan === p;
                      return (
                        <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, plan: p, monto: String(planPrice(p, settings)) }))}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            active ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-input border-border text-muted-foreground hover:text-foreground'
                          }`}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
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

          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">2. Datos del Pago</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Fecha de Pago *</label>
                <div className="relative">
                  <DatePicker date={toDate(form.fechaPago)} onDateChange={d => setForm(p => ({ ...p, fechaPago: fromDate(d) }))} placeholder="Seleccionar fecha" />
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
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        active ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-input border-border text-muted-foreground hover:text-foreground'
                      }`}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button type="submit" disabled={!selectedClient || !form.monto}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <CheckCircle2 className="w-5 h-5" /> Registrar Pago
          </button>
        </form>
      </div>
      )}

      {tab === 'nuevo' && (
      <div className="glass-card p-6 sm:p-8 -mt-6 rounded-tl-none">
        <div className="flex items-start gap-4 pb-5 border-b border-border/50">
          <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Nuevo Cliente</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Registrá el cliente y su primer pago en un solo paso</p>
          </div>
        </div>

        <form onSubmit={handleNewClient} className="space-y-6 pt-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3 flex items-center gap-2">
              <User className="w-3 h-3" /> 1. Datos del Cliente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'nombre', label: 'Nombre *', required: true },
                { key: 'apellido', label: 'Apellido *', required: true },
                { key: 'telefono', label: 'Teléfono' },
                { key: 'direccion', label: 'Dirección' },
                { key: 'telefonoEmergencia', label: 'Tel. Emergencia' },
              ].map(f => (
                <div key={f.key} className={f.key === 'direccion' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">{f.label}</label>
                   <input type="text" required={f.required}
                    value={(newClient as any)[f.key]}
                    onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Fecha de Nacimiento</label>
                <DatePicker date={toDate(newClient.fechaNacimiento)} onDateChange={d => setNewClient(p => ({ ...p, fechaNacimiento: fromDate(d) }))} placeholder="Seleccionar fecha" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Plan</label>
                <select value={newClient.plan} onChange={e => { const plan = e.target.value; setNewClient(p => ({ ...p, plan })); setNewPago(p => ({ ...p, monto: String(planPrice(plan, settings)) })); }}
                  className="w-full px-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {planes.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Observaciones</label>
                <textarea value={newClient.observaciones} onChange={e => setNewClient(p => ({ ...p, observaciones: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3 flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> 2. Primer Pago
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Fecha de Pago *</label>
                <div className="relative">
                  <DatePicker date={toDate(newPago.fechaPago)} onDateChange={d => setNewPago(p => ({ ...p, fechaPago: fromDate(d) }))} placeholder="Seleccionar fecha" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Monto *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="number" value={newPago.monto} onChange={e => setNewPago(p => ({ ...p, monto: e.target.value }))} required
                    placeholder="35000"
                    className="w-full pl-10 pr-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Mes</label>
                <select value={newPago.mes} onChange={e => setNewPago(p => ({ ...p, mes: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {meses.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Año</label>
                <input type="number" value={newPago.anio} onChange={e => setNewPago(p => ({ ...p, anio: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-input/60 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Método de Pago *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {metodos.map(m => {
                  const active = newPago.modalidadPago === m;
                  return (
                    <button key={m} type="button" onClick={() => setNewPago(p => ({ ...p, modalidadPago: m }))}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        active ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-input border-border text-muted-foreground hover:text-foreground'
                      }`}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
            <CheckCircle2 className="w-5 h-5" /> Registrar Cliente y Pago
          </button>
        </form>
      </div>
      )}

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
