import { useState, useMemo } from "react";
import { Plus, Search, Phone, MapPin, Edit2, Trash2, X } from "lucide-react";
import { getClients, saveClient, updateClient, deleteClient } from "../lib/store";
import { Client } from "../lib/types";

const emptyForm = { nombre: '', apellido: '', fechaNacimiento: '', direccion: '', telefono: '', telefonoEmergencia: '', plan: 'Pase libre', observaciones: '' };

export default function Clientes() {
  const [clients, setClients] = useState(getClients);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() =>
    clients.filter(c => {
      const matchSearch = `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'todos' || c.estado === filter;
      return matchSearch && matchFilter;
    }),
    [clients, search, filter]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const client: Client = { ...form, id: editingId, estado: 'activo' as const, fechaIngreso: clients.find(c => c.id === editingId)!.fechaIngreso, edad: form.fechaNacimiento ? Math.floor((Date.now() - new Date(form.fechaNacimiento).getTime()) / 31557600000) : undefined };
      updateClient(client);
    } else {
      const edad = form.fechaNacimiento ? Math.floor((Date.now() - new Date(form.fechaNacimiento).getTime()) / 31557600000) : undefined;
      saveClient({ ...form, estado: 'activo', fechaIngreso: new Date().toISOString().split('T')[0], edad });
    }
    setClients(getClients());
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (c: Client) => {
    setForm({ nombre: c.nombre, apellido: c.apellido, fechaNacimiento: c.fechaNacimiento || '', direccion: c.direccion || '', telefono: c.telefono || '', telefonoEmergencia: c.telefonoEmergencia || '', plan: c.plan || 'Pase libre', observaciones: c.observaciones || '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteClient(id);
      setClients(getClients());
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">{clients.length} alumnos registrados</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nuevo Alumno
        </button>
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
          <div key={c.id} className="glass-card p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-semibold">{c.nombre} {c.apellido}</h3>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${c.estado === 'activo' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                  {c.estado}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(c)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {c.plan && <p className="font-medium text-foreground/80">Plan: {c.plan}</p>}
              {c.telefono && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.telefono}</p>}
              {c.direccion && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{c.direccion}</p>}
              {c.fechaNacimiento && <p>🎂 {new Date(c.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-AR')}{c.edad ? ` (${c.edad} años)` : ''}</p>}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No se encontraron clientes</p>}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'nombre', label: 'Nombre', required: true },
                { key: 'apellido', label: 'Apellido', required: true },
                { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', type: 'date' },
                { key: 'direccion', label: 'Dirección' },
                { key: 'telefono', label: 'Teléfono' },
                { key: 'telefonoEmergencia', label: 'Teléfono Emergencia (opcional)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground font-medium">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    type={f.type || 'text'} required={f.required}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
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
              <div>
                <label className="text-xs text-muted-foreground font-medium">Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" rows={2} />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity mt-2">
                {editingId ? 'Guardar Cambios' : 'Registrar Alumno'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
