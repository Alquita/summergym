import { useEffect, useState, useMemo } from "react";
import { Plus, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getCashFlow, saveCashFlowEntry } from "../lib/store";
import { CashFlowEntry } from "../lib/types";

export default function FlujoCaja() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], detalle: '', ingreso: '', egreso: '', tipo: 'ingreso_cliente' as const, observaciones: '' });

  const refresh = async () => setEntries(await getCashFlow());
  useEffect(() => { refresh(); }, []);

  const totals = useMemo(() => {
    const ingresos = entries.reduce((s, e) => s + e.ingreso, 0);
    const egresos = entries.reduce((s, e) => s + e.egreso, 0);
    return { ingresos, egresos, disponible: ingresos - egresos };
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCashFlowEntry({ ...form, ingreso: Number(form.ingreso) || 0, egreso: Number(form.egreso) || 0, tipo: form.tipo as any });
    await refresh();
    setShowForm(false);
    setForm({ fecha: new Date().toISOString().split('T')[0], detalle: '', ingreso: '', egreso: '', tipo: 'ingreso_cliente', observaciones: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Flujo de Caja</h1>
          <p className="text-muted-foreground mt-1">Control de ingresos y egresos</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nuevo Movimiento
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpRight className="w-4 h-4 text-success" /> Ingresos</div>
          <p className="text-2xl font-heading font-bold text-success mt-1">${totals.ingresos.toLocaleString('es-AR')}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowDownRight className="w-4 h-4 text-destructive" /> Egresos</div>
          <p className="text-2xl font-heading font-bold text-destructive mt-1">${totals.egresos.toLocaleString('es-AR')}</p>
        </div>
        <div className="glass-card p-5 stat-glow">
          <p className="text-sm text-muted-foreground">Disponible en Caja</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${totals.disponible >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${totals.disponible.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Detalle</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Ingreso</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Egreso</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                <td className="p-3 text-muted-foreground">{new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                <td className="p-3 font-medium">{e.detalle}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground capitalize">
                    {e.tipo.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-3 text-right font-heading font-semibold text-success">{e.ingreso ? `$${e.ingreso.toLocaleString('es-AR')}` : '-'}</td>
                <td className="p-3 text-right font-heading font-semibold text-destructive">{e.egreso ? `$${e.egreso.toLocaleString('es-AR')}` : '-'}</td>
                <td className="p-3 text-muted-foreground text-xs">{e.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-center text-muted-foreground py-8">No hay movimientos registrados</p>}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">Nuevo Movimiento</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Detalle</label>
                <input value={form.detalle} onChange={e => setForm(p => ({ ...p, detalle: e.target.value }))} required
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Tipo</label>
                <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="ingreso_cliente">Ingreso Cliente</option>
                  <option value="ingreso_otro">Otro Ingreso</option>
                  <option value="egreso">Egreso</option>
                  <option value="adelanto">Adelanto</option>
                  <option value="aporte">Aporte</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Ingreso ($)</label>
                  <input type="number" value={form.ingreso} onChange={e => setForm(p => ({ ...p, ingreso: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Egreso ($)</label>
                  <input type="number" value={form.egreso} onChange={e => setForm(p => ({ ...p, egreso: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" rows={2} />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity mt-2">
                Registrar Movimiento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
