import { useState, useMemo } from "react";
import { Plus, X, Search, Check } from "lucide-react";
import { getPayments, savePayment, getClients } from "../lib/store";

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Pagos() {
  const [payments, setPayments] = useState(getPayments);
  const clients = useMemo(() => getClients(), []);
  const [showForm, setShowForm] = useState(false);
  const [filterMes, setFilterMes] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [form, setForm] = useState({ clientId: '', mes: meses[new Date().getMonth()], anio: new Date().getFullYear(), modalidadPago: 'Efectivo' as const, monto: '', fechaPago: new Date().toISOString().split('T')[0], plan: 'Pase libre' });

  const selectedClient = clients.find(c => c.id === form.clientId);
  const clientResults = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return [];
    return clients
      .filter(c => `${c.nombre} ${c.apellido} ${c.apellido} ${c.nombre}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clientSearch, clients]);

  const filtered = useMemo(() =>
    filterMes ? payments.filter(p => p.mes === filterMes) : payments,
    [payments, filterMes]
  );

  const totalMes = filtered.reduce((s, p) => s + p.monto, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === form.clientId);
    if (!client) return;
    savePayment({ ...form, monto: Number(form.monto), clientName: `${client.apellido} ${client.nombre}`, modalidadPago: form.modalidadPago as 'Efectivo' | 'Transferencia' });
    setPayments(getPayments());
    setShowForm(false);
    setClientSearch('');
    setForm(f => ({ ...f, clientId: '', monto: '' }));
  };

  const openForm = () => {
    setClientSearch('');
    setForm(f => ({ ...f, clientId: '', monto: '' }));
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Pagos</h1>
          <p className="text-muted-foreground mt-1">{payments.length} pagos registrados</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Registrar Pago
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterMes('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterMes ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          Todos
        </button>
        {meses.map(m => (
          <button key={m} onClick={() => setFilterMes(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMes === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="glass-card p-4">
        <p className="text-sm text-muted-foreground">Total {filterMes || 'general'}:</p>
        <p className="text-2xl font-heading font-bold text-success">${totalMes.toLocaleString('es-AR')}</p>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-muted-foreground font-medium">Alumno</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Mes</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Monto</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Forma</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Plan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium">{p.clientName}</td>
                <td className="p-3 text-muted-foreground">{p.mes} {p.anio}</td>
                <td className="p-3 font-heading font-semibold text-success">${p.monto.toLocaleString('es-AR')}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.modalidadPago === 'Efectivo' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'}`}>
                    {p.modalidadPago}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(p.fechaPago + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                <td className="p-3 text-muted-foreground">{p.plan}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No hay pagos para este período</p>}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">Registrar Pago</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Alumno</label>
                <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} required
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Seleccionar alumno</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.apellido} {c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Mes</label>
                  <select value={form.mes} onChange={e => setForm(p => ({ ...p, mes: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {meses.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Año</label>
                  <input type="number" value={form.anio} onChange={e => setForm(p => ({ ...p, anio: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Monto ($)</label>
                <input type="number" value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} required
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Forma de Pago</label>
                <select value={form.modalidadPago} onChange={e => setForm(p => ({ ...p, modalidadPago: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option>Efectivo</option>
                  <option>Transferencia</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Fecha de Pago</label>
                <input type="date" value={form.fechaPago} onChange={e => setForm(p => ({ ...p, fechaPago: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Plan</label>
                <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option>Pase libre</option>
                  <option>3 x s</option>
                  <option>2 x s</option>
                  <option>2 dias</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity mt-2">
                Registrar Pago
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
