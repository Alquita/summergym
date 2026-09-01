import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Phone, MapPin, Edit2, Trash2, X, User, Calendar, AlertCircle, CheckCircle2, Power, Home, PhoneCall } from "lucide-react";
import { DatePicker } from "../components/ui/date-picker";
import { toDate, fromDate } from "../lib/date-utils";
import { getClients, getPayments, saveClient, updateClient, deleteClient } from "../lib/store";
import { Client, Payment } from "../lib/types";

const emptyForm = { nombre: '', apellido: '', fechaNacimiento: '', direccion: '', telefono: '', telefonoEmergencia: '', plan: 'Pase libre', observaciones: '' };

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const refresh = async () => {
    const [cs, ps] = await Promise.all([getClients(), getPayments()]);
    setClients(cs); setPayments(ps);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() =>
    clients.filter(c => {
      const matchSearch = `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'todos' || c.estado === filter;
      return matchSearch && matchFilter;
    }),
    [clients, search, filter]
  );

  const viewingClient = viewingId ? clients.find(c => c.id === viewingId) : null;
  const viewingIndex = viewingClient ? clients.findIndex(c => c.id === viewingClient.id) + 1 : 0;

  const paymentStatus = useMemo(() => {
    if (!viewingClient) return null;
    const ps = payments
      .filter(p => p.clientId === viewingClient.id)
      .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
    if (ps.length === 0) return { kind: 'none' as const };
    const last = new Date(ps[0].fechaPago + 'T12:00:00');
    const days = Math.floor((Date.now() - last.getTime()) / 86400000);
    if (days > 35) return { kind: 'vencido' as const, days: days - 30, last };
    if (days >= 25) return { kind: 'por_vencer' as const, days: 35 - days, last };
    return { kind: 'al_dia' as const, days: 30 - days, last };
  }, [viewingClient, payments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const existing = clients.find(c => c.id === editingId)!;
      const client: Client = { ...form, id: editingId, estado: existing.estado, fechaIngreso: existing.fechaIngreso, edad: form.fechaNacimiento ? Math.floor((Date.now() - new Date(form.fechaNacimiento).getTime()) / 31557600000) : undefined };
      await updateClient(client);
    } else {
      const edad = form.fechaNacimiento ? Math.floor((Date.now() - new Date(form.fechaNacimiento).getTime()) / 31557600000) : undefined;
      await saveClient({ ...form, estado: 'activo', fechaIngreso: new Date().toISOString().split('T')[0], edad });
    }
    await refresh();
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (c: Client) => {
    setForm({ nombre: c.nombre, apellido: c.apellido, fechaNacimiento: c.fechaNacimiento || '', direccion: c.direccion || '', telefono: c.telefono || '', telefonoEmergencia: c.telefonoEmergencia || '', plan: c.plan || 'Pase libre', observaciones: c.observaciones || '' });
    setEditingId(c.id);
    setShowForm(true);
    setViewingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await deleteClient(id);
      await refresh();
      setViewingId(null);
    }
  };

  const toggleEstado = async (c: Client) => {
    await updateClient({ ...c, estado: c.estado === 'activo' ? 'inactivo' : 'activo' });
    await refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">{clients.length} clientes registrados</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex gap-2">
          {(['todos', 'activo', 'inactivo'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <button key={c.id} onClick={() => setViewingId(c.id)}
            className="glass-card p-4 text-left hover:border-primary/40 hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-heading font-semibold truncate">{c.nombre} {c.apellido}</h3>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${c.estado === 'activo' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                  {c.estado}
                </span>
              </div>
              {c.plan && <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md whitespace-nowrap">{c.plan}</span>}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {c.telefono && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.telefono}</p>}
              {c.direccion && <p className="flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3 shrink-0" />{c.direccion}</p>}
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No se encontraron clientes</p>}

      {/* Detail Modal */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={() => setViewingId(null)}>
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="relative p-4 sm:p-6 pb-4 sm:pb-5 border-b border-border/40">
              <button onClick={() => setViewingId(null)} className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
              <div className="flex items-start gap-4 pr-10">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-xl shrink-0">
                  {viewingClient.nombre[0]}{viewingClient.apellido[0]}
                </div>
                <div className="min-w-0">
                  <h2 className="font-heading font-bold text-2xl truncate">{viewingClient.nombre} {viewingClient.apellido}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Cliente #{viewingIndex}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${viewingClient.estado === 'activo' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                      {viewingClient.estado}
                    </span>
                    {viewingClient.plan && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{viewingClient.plan}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Payment Status */}
              {paymentStatus && (
                <div className={`rounded-xl p-4 border flex items-start gap-3 ${
                  paymentStatus.kind === 'vencido' ? 'bg-destructive/10 border-destructive/30' :
                  paymentStatus.kind === 'por_vencer' ? 'bg-warning/10 border-warning/30' :
                  paymentStatus.kind === 'al_dia' ? 'bg-success/10 border-success/30' :
                  'bg-secondary/40 border-border/40'
                }`}>
                  {paymentStatus.kind === 'al_dia'
                    ? <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    : <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${paymentStatus.kind === 'vencido' ? 'text-destructive' : paymentStatus.kind === 'por_vencer' ? 'text-warning' : 'text-muted-foreground'}`} />}
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Estado del pago</p>
                    <p className={`text-sm font-medium mt-0.5 ${
                      paymentStatus.kind === 'vencido' ? 'text-destructive' :
                      paymentStatus.kind === 'por_vencer' ? 'text-warning' :
                      paymentStatus.kind === 'al_dia' ? 'text-success' : 'text-foreground'
                    }`}>
                      {paymentStatus.kind === 'vencido' && `Vencido hace ${paymentStatus.days} días`}
                      {paymentStatus.kind === 'por_vencer' && `Vence en ${paymentStatus.days} días`}
                      {paymentStatus.kind === 'al_dia' && `Al día — próximo en ${paymentStatus.days} días`}
                      {paymentStatus.kind === 'none' && 'Sin pagos registrados'}
                    </p>
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4">Información Personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField icon={<User className="w-4 h-4" />} label="Nombre" value={viewingClient.nombre} />
                  <InfoField icon={<User className="w-4 h-4" />} label="Apellido" value={viewingClient.apellido} />
                  <InfoField icon={<Calendar className="w-4 h-4" />} label="Fecha de Nacimiento" value={viewingClient.fechaNacimiento ? `${new Date(viewingClient.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-AR')}${viewingClient.edad ? ` (${viewingClient.edad} años)` : ''}` : null} />
                  <InfoField icon={<Home className="w-4 h-4" />} label="Dirección" value={viewingClient.direccion} />
                  <InfoField icon={<Phone className="w-4 h-4" />} label="Teléfono" value={viewingClient.telefono} />
                  <InfoField icon={<PhoneCall className="w-4 h-4" />} label="Teléfono de Emergencia" value={viewingClient.telefonoEmergencia} />
                </div>
                {viewingClient.observaciones && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Observaciones</p>
                    <p className="text-sm">{viewingClient.observaciones}</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
                  Ingresó el {new Date(viewingClient.fechaIngreso + 'T12:00:00').toLocaleDateString('es-AR')}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => openEdit(viewingClient)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                  <Edit2 className="w-4 h-4" /> Editar información
                </button>
                <button onClick={() => toggleEstado(viewingClient)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                    viewingClient.estado === 'activo'
                      ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                      : 'bg-success/15 text-success hover:bg-success/25'
                  }`}>
                  <Power className="w-4 h-4" />
                  {viewingClient.estado === 'activo' ? 'Marcar inactivo' : 'Reactivar'}
                </button>
                <button onClick={() => handleDelete(viewingClient.id)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm bg-secondary text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="glass-card w-full max-w-lg max-h-[92vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="relative p-4 sm:p-6 pb-4 sm:pb-5 border-b border-border/40">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 pr-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{editingId ? 'Actualizá la información del cliente' : 'Completá los datos para registrarlo'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Personal */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <span className="h-px flex-1 bg-border/40" />Datos personales<span className="h-px flex-1 bg-border/40" />
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput icon={<User className="w-4 h-4" />} label="Nombre" required value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} />
                  <FormInput icon={<User className="w-4 h-4" />} label="Apellido" required value={form.apellido} onChange={v => setForm(p => ({ ...p, apellido: v }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium ml-1">Fecha de Nacimiento</label>
                  <div className="mt-1.5">
                    <DatePicker date={toDate(form.fechaNacimiento)} onDateChange={d => setForm(p => ({ ...p, fechaNacimiento: fromDate(d) }))} placeholder="Seleccionar fecha" />
                  </div>
                </div>
                <FormInput icon={<Home className="w-4 h-4" />} label="Dirección" value={form.direccion} onChange={v => setForm(p => ({ ...p, direccion: v }))} />
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <span className="h-px flex-1 bg-border/40" />Contacto<span className="h-px flex-1 bg-border/40" />
                </p>
                <FormInput icon={<Phone className="w-4 h-4" />} label="Teléfono" value={form.telefono} onChange={v => setForm(p => ({ ...p, telefono: v }))} />
                <FormInput icon={<PhoneCall className="w-4 h-4" />} label="Teléfono Emergencia (opcional)" value={form.telefonoEmergencia} onChange={v => setForm(p => ({ ...p, telefonoEmergencia: v }))} />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <span className="h-px flex-1 bg-border/40" />Notas<span className="h-px flex-1 bg-border/40" />
                </p>
                <div>
                  <label className="text-xs text-muted-foreground font-medium ml-1">Observaciones</label>
                  <textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                    placeholder="Lesiones, objetivos, preferencias..."
                    className="w-full mt-1.5 px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none" rows={3} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg font-medium text-sm bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                  {editingId ? '✓ Guardar Cambios' : '+ Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{icon}</span>
        <span className={value ? 'text-foreground' : 'text-muted-foreground/60 italic'}>{value || 'No especificado'}</span>
      </div>
    </div>
  );
}

function FormInput({ icon, label, value, onChange, type = 'text', required }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground font-medium ml-1">{label}{required && <span className="text-primary ml-0.5">*</span>}</label>
      <div className="relative mt-1.5 group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">{icon}</span>
        <input value={value} onChange={e => onChange(e.target.value)} type={type} required={required}
          className="w-full pl-10 pr-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
      </div>
    </div>
  );
}
