import { useEffect, useState, useMemo } from "react";
import { Plus, X, ArrowUpRight, ArrowDownRight, DollarSign, FileText, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "../components/ui/date-picker";
import { toDate, fromDate } from "../lib/date-utils";
import { getCashFlow, saveCashFlowEntry, updateCashFlowEntry, deleteCashFlowEntry } from "../lib/store";
import { CashFlowEntry } from "../lib/types";

function parseMoney(v: string): number {
  return Number(v.replace(/\./g, '').replace(',', '.')) || 0;
}

export default function FlujoCaja() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], detalle: '', ingreso: '', egreso: '', tipo: 'ingreso_cliente' as const, observaciones: '' });

  const refresh = async () => {
    const data = await getCashFlow();
    setEntries(Array.isArray(data) ? data : []);
  };
  useEffect(() => { refresh(); }, []);

  const totals = useMemo(() => {
    const list = Array.isArray(entries) ? entries : [];
    const ingresos = list.reduce((s, e) => s + (Number(e.ingreso) || 0), 0);
    const egresos = list.reduce((s, e) => s + (Number(e.egreso) || 0), 0);
    return { ingresos, egresos, disponible: ingresos - egresos };
  }, [entries]);

  const openNew = () => {
    setEditingId(null);
    setForm({ fecha: new Date().toISOString().split('T')[0], detalle: '', ingreso: '', egreso: '', tipo: 'ingreso_cliente', observaciones: '' });
    setShowForm(true);
  };

  const openEdit = (e: CashFlowEntry) => {
    setEditingId(e.id);
    setForm({ fecha: e.fecha, detalle: e.detalle, ingreso: e.ingreso ? String(e.ingreso) : '', egreso: e.egreso ? String(e.egreso) : '', tipo: e.tipo as any, observaciones: e.observaciones || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try {
      await deleteCashFlowEntry(id);
      await refresh();
      toast.success("Movimiento eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, ingreso: parseMoney(form.ingreso), egreso: parseMoney(form.egreso), tipo: form.tipo as any };
      if (editingId) {
        await updateCashFlowEntry({ ...data, id: editingId } as CashFlowEntry);
        toast.success("Movimiento actualizado");
      } else {
        await saveCashFlowEntry(data);
        toast.success("Movimiento registrado");
      }
      await refresh();
      setShowForm(false);
      setEditingId(null);
      setForm({ fecha: new Date().toISOString().split('T')[0], detalle: '', ingreso: '', egreso: '', tipo: 'ingreso_cliente', observaciones: '' });
    } catch {
      toast.error("Error al guardar el movimiento");
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Flujo de Caja</h1>
          <p className="text-muted-foreground mt-1">Control de ingresos y egresos</p>
        </div>
        <button onClick={openNew}
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
        <div className="glass-card p-5">
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
              <th className="text-right p-3 text-muted-foreground font-medium w-20">Acciones</th>
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
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-center text-muted-foreground py-8">No hay movimientos registrados</p>}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={closeForm}>
          <div className="glass-card w-full max-w-lg max-h-[92vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="relative p-4 sm:p-6 pb-4 sm:pb-5 border-b border-border/40">
              <button onClick={closeForm} className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 pr-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">{editingId ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{editingId ? 'Actualizá los datos del movimiento' : 'Registrá un ingreso o egreso en la caja'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Details */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <span className="h-px flex-1 bg-border/40" />Detalles<span className="h-px flex-1 bg-border/40" />
                </p>
                <div>
                  <label className="text-xs text-muted-foreground font-medium ml-1">Fecha</label>
                  <div className="mt-1.5">
                    <DatePicker date={toDate(form.fecha)} onDateChange={d => setForm(p => ({ ...p, fecha: fromDate(d) }))} placeholder="Seleccionar fecha" />
                  </div>
                </div>
                <FormInput icon={<FileText className="w-4 h-4" />} label="Detalle" required value={form.detalle} onChange={v => setForm(p => ({ ...p, detalle: v }))} placeholder="Ej: Cuota mensual, compra de equipamiento..." />
              </div>

              {/* Type */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <span className="h-px flex-1 bg-border/40" />Tipo<span className="h-px flex-1 bg-border/40" />
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {[
                    { value: 'ingreso_cliente', label: 'Ingreso Cliente' },
                    { value: 'ingreso_otro', label: 'Otro Ingreso' },
                    { value: 'egreso', label: 'Egreso' },
                    { value: 'adelanto', label: 'Adelanto' },
                    { value: 'aporte', label: 'Aporte' },
                  ].map(t => {
                    const active = form.tipo === t.value;
                    const isEgreso = t.value === 'egreso';
                    return (
                      <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, tipo: t.value as any, ingreso: isEgreso ? '' : p.ingreso, egreso: isEgreso ? p.egreso : '' }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          active
                            ? (isEgreso ? 'bg-destructive/15 border-destructive/30 text-destructive' : 'bg-success/15 border-success/30 text-success')
                            : 'bg-input border-border text-muted-foreground hover:text-foreground'
                        }`}>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <span className="h-px flex-1 bg-border/40" />Monto<span className="h-px flex-1 bg-border/40" />
                </p>
                {['ingreso_cliente', 'ingreso_otro', 'adelanto', 'aporte'].includes(form.tipo) && (
                  <FormInput icon={<ArrowUpRight className="w-4 h-4 text-success" />} label="Ingreso ($)" value={form.ingreso} onChange={v => setForm(p => ({ ...p, ingreso: v }))} placeholder="0" />
                )}
                {form.tipo === 'egreso' && (
                  <FormInput icon={<ArrowDownRight className="w-4 h-4 text-destructive" />} label="Egreso ($)" value={form.egreso} onChange={v => setForm(p => ({ ...p, egreso: v }))} placeholder="0" />
                )}
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <span className="h-px flex-1 bg-border/40" />Notas<span className="h-px flex-1 bg-border/40" />
                </p>
                <div>
                  <label className="text-xs text-muted-foreground font-medium ml-1">Observaciones</label>
                  <textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                    placeholder="Detalles adicionales..."
                    className="w-full mt-1.5 px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none" rows={3} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeForm}
                  className="px-4 py-2.5 rounded-lg font-medium text-sm bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Guardar Cambios' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormInput({ icon, label, value, onChange, type = 'text', required, placeholder }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground font-medium ml-1">{label}{required && <span className="text-primary ml-0.5">*</span>}</label>
      <div className="relative mt-1.5 group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">{icon}</span>
        <input value={value} onChange={e => onChange(e.target.value)} type={type} required={required} placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
      </div>
    </div>
  );
}
