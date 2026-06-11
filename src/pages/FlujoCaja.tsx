import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, X, ArrowUpRight, ArrowDownRight, DollarSign, FileText, CheckCircle2, Edit2, Trash2, ChevronLeft, ChevronRight, Lock, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "../components/ui/date-picker";
import { toDate, fromDate } from "../lib/date-utils";
import { getCashFlow, saveCashFlowEntry, updateCashFlowEntry, deleteCashFlowEntry, getCierresMensuales, saveCierreMensual, getSettings, saveSettings, getSettingsSync, backfillCashFlowFromPayments } from "../lib/store";
import { CashFlowEntry, CierreMensual } from "../lib/types";

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function parseMoney(v: string): number {
  return Number(v.replace(/\./g, '').replace(',', '.')) || 0;
}

export default function FlujoCaja() {
  const settingsInit = getSettingsSync();
  const [selectedMonth, setSelectedMonth] = useState(settingsInit.mesActivoMes);
  const [selectedYear, setSelectedYear] = useState(settingsInit.mesActivoAnio);
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [cierres, setCierres] = useState<CierreMensual[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], detalle: '', ingreso: '', egreso: '', tipo: 'ingreso_cliente' as const, observaciones: '' });

  const refresh = async () => {
    const [data, cierresData] = await Promise.all([getCashFlow(), getCierresMensuales()]);
    setEntries(Array.isArray(data) ? data : []);
    setCierres(Array.isArray(cierresData) ? cierresData : []);
  };
  useEffect(() => {
    backfillCashFlowFromPayments();
    refresh();
  }, []);

  const cierreDelMes = useMemo(() =>
    cierres.find(c => c.mes === selectedMonth && c.anio === selectedYear),
  [cierres, selectedMonth, selectedYear]);

  const isClosed = !!cierreDelMes;

  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.fecha + 'T12:00:00');
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [entries, selectedMonth, selectedYear]);

  const DISTRIBUCION_TIPOS = ['CORTE DE CAJA', 'DIV. INGRESO C.C.', 'DIV. INGRESO J.I.'];

  const totals = useMemo(() => {
    const dist = monthEntries.filter(e => DISTRIBUCION_TIPOS.includes(e.tipo));
    const ops = monthEntries.filter(e => !DISTRIBUCION_TIPOS.includes(e.tipo));

    const ingresos = ops.reduce((s, e) => s + (Number(e.ingreso) || 0), 0);
    const egresos = ops.reduce((s, e) => s + (Number(e.egreso) || 0), 0);
    const distribuciones = dist.reduce((s, e) => s + (Number(e.ingreso) || 0) - (Number(e.egreso) || 0), 0);

    return { ingresos, egresos, disponible: ingresos - egresos, distribuciones, cantidad: monthEntries.length };
  }, [monthEntries]);

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ fecha: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, detalle: '', ingreso: '', egreso: '', tipo: 'ingreso_cliente', observaciones: '' });
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

  const handleCerrarMes = async () => {
    try {
      const label = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
      const yaCerrado = cierres.some(c => c.mes === selectedMonth && c.anio === selectedYear);

      if (yaCerrado) {
        toast.info(`${label} ya estaba cerrado. Avanzando al siguiente.`);
      } else {
        await saveCierreMensual({
          mes: selectedMonth,
          anio: selectedYear,
          totalIngresos: totals.ingresos,
          totalEgresos: totals.egresos,
          saldoFinal: totals.disponible,
        });
        await saveCashFlowEntry({
          fecha: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`,
          detalle: `Cierre mensual - ${label}`,
          ingreso: totals.disponible > 0 ? totals.disponible : 0,
          egreso: totals.disponible < 0 ? Math.abs(totals.disponible) : 0,
          tipo: 'ingreso_otro',
          observaciones: `Cierre de caja ${label}. Ingresos: $${totals.ingresos.toLocaleString('es-AR')} | Egresos: $${totals.egresos.toLocaleString('es-AR')} | Saldo: $${totals.disponible.toLocaleString('es-AR')}`,
        });
        toast.success(`Mes ${label} cerrado correctamente`);
      }

      await refresh();
      setShowCierreModal(false);
      const nextM = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const nextY = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const s = await getSettings();
      await saveSettings({ ...s, mesActivoMes: nextM, mesActivoAnio: nextY });
      goToNextMonth();
    } catch (err: any) {
      toast.error("Error al cerrar el mes");
    }
  };

  const cierresAnteriores = useMemo(() =>
    cierres.filter(c => c.anio < selectedYear || (c.anio === selectedYear && c.mes < selectedMonth)),
  [cierres, selectedMonth, selectedYear]);

  const goToCierre = useCallback((c: CierreMensual) => {
    setSelectedMonth(c.mes);
    setSelectedYear(c.anio);
  }, []);

  const unclosedMonths = useMemo(() => {
    const result: { mes: number; anio: number }[] = [];
    if (entries.length === 0) return result;

    let earliest = { mes: selectedMonth, anio: selectedYear };
    for (const e of entries) {
      const d = new Date(e.fecha + 'T12:00:00');
      const em = d.getMonth() + 1;
      const ey = d.getFullYear();
      if (ey < earliest.anio || (ey === earliest.anio && em < earliest.mes)) {
        earliest = { mes: em, anio: ey };
      }
    }

    const cursor = { ...earliest };
    const limit = { mes: selectedMonth, anio: selectedYear };

    while (cursor.anio < limit.anio || (cursor.anio === limit.anio && cursor.mes <= limit.mes)) {
      const isCurrent = cursor.mes === selectedMonth && cursor.anio === selectedYear;
      const hasCierre = cierres.some(c => c.mes === cursor.mes && c.anio === cursor.anio);
      if (!isCurrent && !hasCierre) {
        result.push({ ...cursor });
      }
      cursor.mes++;
      if (cursor.mes > 12) { cursor.mes = 1; cursor.anio++; }
    }

    return result;
  }, [entries, cierres, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Flujo de Caja</h1>
          <p className="text-muted-foreground mt-1">Control de ingresos y egresos</p>
        </div>
        {!isClosed && (
          <div className="flex items-center gap-2">
            <button onClick={openNew}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Nuevo Movimiento
            </button>
          </div>
        )}
      </div>

      {/* Warning banner */}
      {unclosedMonths.length > 0 && (
        <div className="rounded-xl bg-warning/5 border border-warning/30 p-3 sm:p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>Meses sin cerrar</span>
          </div>
          <div className="space-y-1">
            {unclosedMonths.map(m => (
              <div key={`${m.mes}-${m.anio}`} className="flex items-center justify-between gap-3 pl-6">
                <span className="text-sm text-muted-foreground">{MONTHS[m.mes - 1]} {m.anio}</span>
                <button onClick={() => { setSelectedMonth(m.mes); setSelectedYear(m.anio); setShowCierreModal(true); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-warning/10 text-warning font-medium hover:bg-warning/20 transition-colors shrink-0">
                  Cerrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month Navigation */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goToCurrentMonth} className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-lg hover:bg-secondary/50 transition-colors min-w-[180px] justify-center">
              <Calendar className="w-5 h-5 text-primary" />
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </button>
            <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isClosed ? (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-success/15 text-success border border-success/30">
                <Lock className="w-3.5 h-3.5" /> Cerrado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/30">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Abierto
              </span>
            )}
            {!isClosed && (
              <button onClick={() => setShowCierreModal(true)}
                className="flex items-center gap-2 bg-warning text-warning-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                <Lock className="w-4 h-4" /> Cerrar Mes
              </button>
            )}
          </div>
        </div>

        {/* Previous closings quick access */}
        {cierresAnteriores.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-1 self-center">Cierres:</span>
            {cierresAnteriores.slice(0, 6).map(c => (
              <button key={c.id} onClick={() => goToCierre(c)}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                  c.mes === selectedMonth && c.anio === selectedYear
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}>
                {MONTHS[c.mes - 1].slice(0, 3)} {c.anio}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpRight className="w-4 h-4 text-success" /> Ingresos</div>
          <p className="text-2xl font-heading font-bold text-success mt-1">${totals.ingresos.toLocaleString('es-AR')}</p>
          {isClosed && cierreDelMes && (
            <p className="text-[10px] text-muted-foreground mt-1">Cerrado: ${cierreDelMes.totalIngresos.toLocaleString('es-AR')}</p>
          )}
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowDownRight className="w-4 h-4 text-destructive" /> Egresos Operativos</div>
          <p className="text-2xl font-heading font-bold text-destructive mt-1">${totals.egresos.toLocaleString('es-AR')}</p>
          {isClosed && cierreDelMes && (
            <p className="text-[10px] text-muted-foreground mt-1">Cerrado: ${cierreDelMes.totalEgresos.toLocaleString('es-AR')}</p>
          )}
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowDownRight className="w-4 h-4 text-warning" /> Distribuciones</div>
          <p className="text-2xl font-heading font-bold text-warning mt-1">${Math.abs(totals.distribuciones).toLocaleString('es-AR')}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">Disponible en Caja</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${totals.disponible >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${totals.disponible.toLocaleString('es-AR')}
          </p>
          {isClosed && cierreDelMes && (
            <p className="text-[10px] text-muted-foreground mt-1">Cerrado: ${cierreDelMes.saldoFinal.toLocaleString('es-AR')}</p>
          )}
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
            {monthEntries.map(e => (
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
                    {!isClosed ? (
                      <>
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Cerrado</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {monthEntries.length === 0 && <p className="text-center text-muted-foreground py-8">No hay movimientos en {MONTHS[selectedMonth - 1]} {selectedYear}</p>}
      </div>

      {/* New/Edit Movement Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={closeForm}>
          <div className="glass-card w-full max-w-lg max-h-[92vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
            <div className="relative p-4 sm:p-6 pb-4 sm:pb-5 border-b border-border/40">
              <button onClick={closeForm} className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 pr-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">{editingId ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{editingId ? 'Actualizá los datos del movimiento' : `Registrá un ingreso o egreso en ${MONTHS[selectedMonth - 1]} ${selectedYear}`}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
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

      {/* Close Month Confirmation Modal */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={() => setShowCierreModal(false)}>
          <div className="glass-card w-full max-w-md overflow-y-auto relative" onClick={e => e.stopPropagation()}>
            <div className="relative p-4 sm:p-6 pb-4 sm:pb-5 border-b border-border/40">
              <button onClick={() => setShowCierreModal(false)} className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 pr-10">
                <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center text-warning shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">Cerrar Mes</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Estás por cerrar {MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Mini movements table */}
              {monthEntries.length > 0 && (
                <div className="bg-secondary/20 rounded-xl max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-secondary/80">
                      <tr className="border-b border-border/20">
                        <th className="text-left p-2 text-muted-foreground font-medium">Fecha</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Detalle</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Ingreso</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Egreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...monthEntries].sort((a, b) => a.fecha.localeCompare(b.fecha)).map(e => (
                        <tr key={e.id} className="border-b border-border/10">
                          <td className="p-2 text-muted-foreground whitespace-nowrap">{new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</td>
                          <td className="p-2 text-muted-foreground truncate max-w-[180px]">{e.detalle}</td>
                          <td className="p-2 text-right font-medium text-success">{e.ingreso ? `$${e.ingreso.toLocaleString('es-AR')}` : '-'}</td>
                          <td className="p-2 text-right font-medium text-destructive">{e.egreso ? `$${e.egreso.toLocaleString('es-AR')}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Movimientos</span>
                  <span className="font-semibold">{totals.cantidad}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5 text-success" /> Ingresos</span>
                  <span className="font-semibold text-success">${totals.ingresos.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5"><ArrowDownRight className="w-3.5 h-3.5 text-destructive" /> Egresos</span>
                  <span className="font-semibold text-destructive">${totals.egresos.toLocaleString('es-AR')}</span>
                </div>
                <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                  <span className="text-sm font-medium">Saldo Final</span>
                  <span className={`font-heading font-bold text-lg ${totals.disponible >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${totals.disponible.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Al cerrar el mes se registrará un movimiento de cierre y <strong>no se podrán modificar</strong> los movimientos de {MONTHS[selectedMonth - 1]} {selectedYear}.
              </p>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCierreModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleCerrarMes}
                  className="flex-1 bg-warning text-warning-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> Confirmar Cierre
                </button>
              </div>
            </div>
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
