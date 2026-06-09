import { supabase } from "@/integrations/supabase/client";
import { Client, Payment, CashFlowEntry, Notification, Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  gymName: 'Summer Gym',
  direccion: '',
  telefono: '',
  precioPaseLibre: 35000,
  precio3xSemana: 30000,
  precio2xSemana: 25000,
  precio1Dia: 10000,
  diasAlerta: 5,
  diasInactividad: 35,
};

// ============ Mappers ============
function clientFromRow(r: any): Client {
  return {
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    fechaNacimiento: r.fecha_nacimiento ?? undefined,
    edad: r.edad ?? undefined,
    direccion: r.direccion ?? undefined,
    telefono: r.telefono ?? undefined,
    telefonoEmergencia: r.telefono_emergencia ?? undefined,
    plan: r.plan ?? undefined,
    estado: r.estado,
    fechaIngreso: r.fecha_ingreso,
    observaciones: r.observaciones ?? undefined,
  };
}
function clientToRow(c: Partial<Client>) {
  return {
    nombre: c.nombre,
    apellido: c.apellido,
    fecha_nacimiento: c.fechaNacimiento || null,
    edad: c.edad ?? null,
    direccion: c.direccion || null,
    telefono: c.telefono || null,
    telefono_emergencia: c.telefonoEmergencia || null,
    plan: c.plan || null,
    estado: c.estado,
    fecha_ingreso: c.fechaIngreso,
    observaciones: c.observaciones || null,
  };
}
function paymentFromRow(r: any): Payment {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    mes: r.mes,
    anio: r.anio,
    modalidadPago: r.modalidad_pago,
    monto: Number(r.monto),
    fechaPago: r.fecha_pago,
    plan: r.plan ?? '',
    observaciones: r.observaciones ?? undefined,
  };
}
function paymentToRow(p: Omit<Payment, 'id'>) {
  return {
    client_id: p.clientId,
    client_name: p.clientName,
    mes: p.mes,
    anio: p.anio,
    modalidad_pago: p.modalidadPago,
    monto: p.monto,
    fecha_pago: p.fechaPago,
    plan: p.plan || null,
    observaciones: p.observaciones || null,
  };
}
function cashFromRow(r: any): CashFlowEntry {
  return {
    id: r.id,
    fecha: r.fecha,
    detalle: r.detalle,
    ingreso: Number(r.ingreso),
    egreso: Number(r.egreso),
    tipo: r.tipo,
    observaciones: r.observaciones ?? undefined,
  };
}
function cashToRow(e: Omit<CashFlowEntry, 'id'>) {
  return {
    fecha: e.fecha,
    detalle: e.detalle,
    ingreso: e.ingreso,
    egreso: e.egreso,
    tipo: e.tipo,
    observaciones: e.observaciones || null,
  };
}

// ============ Settings ============
let cachedSettings: Settings = DEFAULT_SETTINGS;

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return cachedSettings;
  cachedSettings = {
    gymName: data.gym_name,
    direccion: data.direccion,
    telefono: data.telefono,
    precioPaseLibre: Number(data.precio_pase_libre),
    precio3xSemana: Number(data.precio_3x_semana),
    precio2xSemana: Number(data.precio_2x_semana),
    precio1Dia: Number(data.precio_1_dia),
    diasAlerta: data.dias_alerta,
    diasInactividad: data.dias_inactividad,
  };
  return cachedSettings;
}
export function getSettingsSync(): Settings {
  return cachedSettings;
}
export async function saveSettings(s: Settings): Promise<void> {
  cachedSettings = s;
  await supabase.from('configuracion').upsert({
    id: 1,
    gym_name: s.gymName,
    direccion: s.direccion,
    telefono: s.telefono,
    precio_pase_libre: s.precioPaseLibre,
    precio_3x_semana: s.precio3xSemana,
    precio_2x_semana: s.precio2xSemana,
    precio_1_dia: s.precio1Dia,
    dias_alerta: s.diasAlerta,
    dias_inactividad: s.diasInactividad,
    updated_at: new Date().toISOString(),
  });
}

// ============ Clients ============
export async function getClients(): Promise<Client[]> {
  const { data } = await supabase.from('clientes').select('*').order('apellido');
  return (data || []).map(clientFromRow);
}
export async function saveClient(c: Omit<Client, 'id'>): Promise<Client> {
  const { data, error } = await supabase.from('clientes').insert(clientToRow(c)).select().single();
  if (error || !data) throw error;
  return clientFromRow(data);
}
export async function updateClient(c: Client): Promise<void> {
  await supabase.from('clientes').update(clientToRow(c)).eq('id', c.id);
}
export async function deleteClient(id: string): Promise<void> {
  await supabase.from('clientes').delete().eq('id', id);
}

// ============ Payments ============
export async function getPayments(): Promise<Payment[]> {
  const { data } = await supabase.from('pagos').select('*').order('fecha_pago', { ascending: false });
  return (data || []).map(paymentFromRow);
}
export async function savePayment(p: Omit<Payment, 'id'>): Promise<Payment> {
  const { data, error } = await supabase.from('pagos').insert(paymentToRow(p)).select().single();
  if (error || !data) throw error;
  // Registrar automáticamente en flujo de caja
  await saveCashFlowEntry({
    fecha: p.fechaPago,
    detalle: `Cuota ${p.mes} ${p.anio} - ${p.clientName}`,
    ingreso: p.monto,
    egreso: 0,
    tipo: 'ingreso_cliente',
    observaciones: `Pago ${p.modalidadPago} - ${p.plan}`,
  });
  return paymentFromRow(data);
}
export async function deletePayment(id: string): Promise<void> {
  await supabase.from('pagos').delete().eq('id', id);
}

// ============ Cash Flow ============
export async function getCashFlow(): Promise<CashFlowEntry[]> {
  const { data } = await supabase.from('flujo_caja').select('*').order('fecha', { ascending: false });
  return (data || []).map(cashFromRow);
}
export async function saveCashFlowEntry(e: Omit<CashFlowEntry, 'id'>): Promise<CashFlowEntry> {
  const { data, error } = await supabase.from('flujo_caja').insert(cashToRow(e)).select().single();
  if (error || !data) throw error;
  return cashFromRow(data);
}
export async function deleteCashFlowEntry(id: string): Promise<void> {
  await supabase.from('flujo_caja').delete().eq('id', id);
}

// ============ Sync statuses & notifications ============
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export async function syncClientStatuses(): Promise<{ updatedClients: Client[]; notifications: Notification[] }> {
  const [clients, payments, settings] = await Promise.all([getClients(), getPayments(), getSettings()]);
  const notifications: Notification[] = [];
  const now = new Date();
  const limite = settings.diasInactividad;
  const alerta = settings.diasAlerta;
  const updates: Promise<any>[] = [];

  clients.forEach(client => {
    const clientPayments = payments
      .filter(p => p.clientId === client.id)
      .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

    if (clientPayments.length > 0) {
      const lastPayment = new Date(clientPayments[0].fechaPago);
      const daysSince = Math.floor((now.getTime() - lastPayment.getTime()) / 86400000);

      if (daysSince > limite) {
        if (client.estado === 'activo') {
          client.estado = 'inactivo';
          updates.push(updateClient(client));
        }
        notifications.push({
          id: generateId(), type: 'cuota_vencida', clientId: client.id,
          clientName: `${client.nombre} ${client.apellido}`,
          message: `Cuota vencida hace ${daysSince - (limite - 5)} días. Último pago: ${lastPayment.toLocaleDateString('es-AR')}`,
          date: now.toISOString(), read: false,
        });
      } else if (daysSince >= limite - alerta) {
        notifications.push({
          id: generateId(), type: 'cuota_por_vencer', clientId: client.id,
          clientName: `${client.nombre} ${client.apellido}`,
          message: `La cuota vence en ${limite - daysSince} días. Último pago: ${lastPayment.toLocaleDateString('es-AR')}`,
          date: now.toISOString(), read: false,
        });
      }
    }

    if (client.fechaNacimiento) {
      const bday = new Date(client.fechaNacimiento + 'T12:00:00');
      const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      const daysUntil = Math.floor((thisYearBday.getTime() - now.getTime()) / 86400000);
      if (daysUntil >= 0 && daysUntil <= 7) {
        notifications.push({
          id: generateId(), type: 'cumpleanos', clientId: client.id,
          clientName: `${client.nombre} ${client.apellido}`,
          message: daysUntil === 0
            ? `¡Hoy es su cumpleaños! 🎂`
            : `Cumpleaños en ${daysUntil} día${daysUntil > 1 ? 's' : ''} (${thisYearBday.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })})`,
          date: now.toISOString(), read: false,
        });
      }
    }
  });

  await Promise.all(updates);
  return { updatedClients: clients, notifications };
}

// ============ Export / Import ============
export async function exportAllData(): Promise<string> {
  const [clients, payments, cashflow, settings] = await Promise.all([
    getClients(), getPayments(), getCashFlow(), getSettings()
  ]);
  return JSON.stringify({ clients, payments, cashflow, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  // Wipe and reinsert
  await Promise.all([
    supabase.from('flujo_caja').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('pagos').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);
  if (data.clients?.length) {
    await supabase.from('clientes').insert(data.clients.map((c: Client) => ({ ...clientToRow(c), id: c.id })));
  }
  if (data.payments?.length) {
    await supabase.from('pagos').insert(data.payments.map((p: Payment) => ({ ...paymentToRow(p), id: p.id })));
  }
  if (data.cashflow?.length) {
    await supabase.from('flujo_caja').insert(data.cashflow.map((e: CashFlowEntry) => ({ ...cashToRow(e), id: e.id })));
  }
  if (data.settings) await saveSettings(data.settings);
}

// ============ Initial seed (from previous localStorage / hardcoded list) ============
const LEGACY_LOCALSTORAGE_KEYS = ['summer_gym_clients', 'summer_gym_payments_v2', 'summer_gym_cashflow_v2', 'summer_gym_settings'];

export async function seedIfEmpty(): Promise<void> {
  const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
  if ((count ?? 0) > 0) return;

  // Try to migrate from localStorage first
  try {
    const lsClients = localStorage.getItem('summer_gym_clients');
    const lsPayments = localStorage.getItem('summer_gym_payments_v2');
    const lsCash = localStorage.getItem('summer_gym_cashflow_v2');
    const lsSettings = localStorage.getItem('summer_gym_settings');

    if (lsClients) {
      const clients: Client[] = JSON.parse(lsClients);
      if (clients.length) {
        const inserted = await supabase.from('clientes').insert(clients.map(c => clientToRow(c))).select();
        const idMap = new Map<string, string>();
        (inserted.data || []).forEach((row, i) => idMap.set(clients[i].id, row.id));

        if (lsPayments) {
          const payments: Payment[] = JSON.parse(lsPayments);
          if (payments.length) {
            await supabase.from('pagos').insert(payments.map(p => ({
              ...paymentToRow(p),
              client_id: idMap.get(p.clientId) || p.clientId,
            })));
          }
        }
        if (lsCash) {
          const cash: CashFlowEntry[] = JSON.parse(lsCash);
          if (cash.length) await supabase.from('flujo_caja').insert(cash.map(e => cashToRow(e)));
        }
      }
    } else {
      // Fallback: seed with hardcoded clients
      const initial = getInitialClients();
      await supabase.from('clientes').insert(initial.map(c => clientToRow(c)));
    }

    if (lsSettings) {
      const s = JSON.parse(lsSettings);
      await saveSettings({ ...DEFAULT_SETTINGS, ...s });
    }

    // Clean up localStorage so we don't re-import
    LEGACY_LOCALSTORAGE_KEYS.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.error('Seed error:', e);
  }
}

function getInitialClients(): Omit<Client, 'id'>[] {
  // Keep the hardcoded gym client list as fallback
  const list = [
    { nombre: 'Sandra', apellido: 'Arguello', fechaNacimiento: '1979-03-11', edad: 45, direccion: 'Alcalde Acosta 1192', telefono: '3584208159', telefonoEmergencia: '3582430438', plan: 'Pase libre', fechaIngreso: '2025-05-07' },
    { nombre: 'Cristian', apellido: 'Ayala', fechaNacimiento: '1978-12-10', edad: 46, direccion: 'Marcos Llovera 1167', telefono: '3584253631', telefonoEmergencia: '3586547210', plan: '3 x s', fechaIngreso: '2025-05-26' },
    { nombre: 'Graciela', apellido: 'Cavana', fechaNacimiento: '1980-08-30', edad: 44, telefono: '3585415490', telefonoEmergencia: '3586202520', plan: 'Pase libre', fechaIngreso: '2025-05-19' },
    { nombre: 'Rodrigo', apellido: 'Saavedra', fechaNacimiento: '1999-04-12', edad: 26, direccion: 'Consejal Oviedo 1254', telefono: '3584187745', telefonoEmergencia: '3585040927', plan: 'Pase libre', fechaIngreso: '2025-05-19' },
    { nombre: 'Virginia', apellido: 'Tarico', fechaNacimiento: '1995-05-08', edad: 28, plan: 'Pase libre', fechaIngreso: '2025-05-05' },
    { nombre: 'Franco', apellido: 'Ambrogio', fechaNacimiento: '1993-09-30', edad: 31, plan: 'Pase libre', fechaIngreso: '2025-05-05' },
    { nombre: 'Cristina', apellido: 'Arguello', fechaNacimiento: '1970-06-14', edad: 54, direccion: 'Alcalde Acosta 1192', telefono: '3584175421', telefonoEmergencia: '3582430438', plan: 'Pase libre', fechaIngreso: '2025-05-07' },
    { nombre: 'Eva', apellido: 'Arguello', fechaNacimiento: '2001-02-26', edad: 24, direccion: 'Alcalde Acosta 1192', telefono: '3582430471', telefonoEmergencia: '3584175421', plan: 'Pase libre', fechaIngreso: '2025-05-09' },
    { nombre: 'Jonathan', apellido: 'Arguello', edad: 30, plan: 'Pase libre', fechaIngreso: '2025-05-09' },
    { nombre: 'Alan', apellido: 'Benitez', fechaNacimiento: '1993-08-06', edad: 30, plan: 'Pase libre', fechaIngreso: '2025-05-09' },
    { nombre: 'Emiliano', apellido: 'Bernal', fechaNacimiento: '2004-01-11', edad: 21, direccion: 'Blas Parera 1275', telefono: '3584196046', telefonoEmergencia: '3584372998', plan: '3 x s', fechaIngreso: '2025-05-15' },
    { nombre: 'Karen', apellido: 'Carrizo', fechaNacimiento: '1992-06-05', edad: 32, direccion: 'Int. Daguerre N°1228', telefono: '3584222905', telefonoEmergencia: '3584387465', plan: 'Pase libre', fechaIngreso: '2025-05-06' },
    { nombre: 'Evan', apellido: 'Cristelli', fechaNacimiento: '1999-06-08', edad: 26, direccion: 'Marcos Llovera 1175', telefono: '3586012518', telefonoEmergencia: '3586202520', plan: 'Pase libre', fechaIngreso: '2025-05-19' },
    { nombre: 'Eugenia', apellido: 'Cuheito', fechaNacimiento: '1993-11-26', edad: 31, direccion: 'Agente Duarte 1040', telefono: '3586543933', telefonoEmergencia: '3584120806', plan: 'Pase libre', fechaIngreso: '2025-05-12' },
    { nombre: 'Angel', apellido: 'Flores', fechaNacimiento: '2009-01-07', edad: 16, direccion: 'Arturo M Bas 1993', telefono: '3584564677', telefonoEmergencia: '3584846154', plan: 'Pase libre', fechaIngreso: '2025-05-26' },
    { nombre: 'Lucas', apellido: 'Fos', fechaNacimiento: '1994-04-28', edad: 31, direccion: 'Ayacucho 2087', telefono: '3585100844', telefonoEmergencia: '3584352670', plan: 'Pase libre', fechaIngreso: '2025-05-05' },
    { nombre: 'Sandra', apellido: 'Garro', fechaNacimiento: '1968-12-06', edad: 56, direccion: 'Pasaje Cafeto N°2694', telefono: '3584387645', telefonoEmergencia: '3584193429', plan: '1 dia', fechaIngreso: '2025-05-09' },
    { nombre: 'Valentina', apellido: 'Geracci', fechaNacimiento: '2004-05-20', edad: 21, direccion: 'Juan de Garay 1147', telefono: '3586547141', plan: 'Pase libre', fechaIngreso: '2025-05-20' },
    { nombre: 'Alam', apellido: 'Leontes', fechaNacimiento: '2003-11-03', edad: 21, direccion: 'Trejo y Sanabria 1124', telefono: '3585014444', telefonoEmergencia: '3585174932', plan: 'Pase libre', fechaIngreso: '2025-05-05' },
    { nombre: 'Martina', apellido: 'Ramos', fechaNacimiento: '2009-07-10', edad: 15, direccion: 'Arturo M Bas N°2050', telefono: '3584360101', telefonoEmergencia: '3585107151', plan: 'Pase libre', fechaIngreso: '2025-05-05' },
    { nombre: 'Matias', apellido: 'Aguirre', fechaNacimiento: '1993-12-30', edad: 31, direccion: 'Ayacucho 1995', telefono: '3584872621', plan: 'Pase libre', fechaIngreso: '2025-05-19' },
    { nombre: 'Emiliano', apellido: 'Nievas', fechaNacimiento: '2008-10-08', edad: 13, direccion: 'Pje Mercedario 1243', telefono: '3584313539', plan: '3 x s', fechaIngreso: '2025-05-09' },
    { nombre: 'Valentina', apellido: 'Nievas', fechaNacimiento: '2003-05-20', edad: 21, direccion: 'Consejal Oviedo 1254', telefono: '3584313785', telefonoEmergencia: '3584313539', plan: '3 x s', fechaIngreso: '2025-05-29' },
    { nombre: 'Agustin', apellido: 'Pettenatti', fechaNacimiento: '1993-08-10', edad: 31, direccion: 'Bolivar 280 4A', telefono: '3584129920', telefonoEmergencia: '3585484404', plan: 'Pase libre', fechaIngreso: '2025-05-19' },
    { nombre: 'Franco', apellido: 'Sanchez', fechaNacimiento: '1985-11-28', edad: 39, direccion: 'Arturo M Bas 1858', telefono: '3585061295', plan: 'Pase libre', fechaIngreso: '2025-05-19' },
    { nombre: 'Ricardo', apellido: 'Minudri', fechaNacimiento: '1973-04-05', edad: 52, direccion: 'Saint Remy 27', telefono: '3585069183', telefonoEmergencia: '3584396796', plan: 'Pase libre', fechaIngreso: '2025-06-02' },
    { nombre: 'Natanael', apellido: 'Fredes', fechaNacimiento: '2007-01-11', edad: 18, direccion: 'Concejal Oviedo 1120', telefono: '3584373566', telefonoEmergencia: '3585482583', plan: '3 x s', fechaIngreso: '2025-06-06' },
    { nombre: 'Julio', apellido: 'Frede', fechaNacimiento: '1987-06-06', edad: 38, direccion: 'Concejal Oviedo 1120', telefono: '3584194863', telefonoEmergencia: '3585482583', plan: '3 x s', fechaIngreso: '2025-06-06' },
    { nombre: 'Milagros', apellido: 'Pizzi', fechaNacimiento: '1999-04-19', edad: 26, direccion: 'Pje Esperanza 2074', telefono: '3584829836', plan: 'Pase libre', fechaIngreso: '2025-06-10' },
    { nombre: 'Constanza', apellido: 'Quintero', fechaNacimiento: '1999-03-11', edad: 26, direccion: 'Pje Esperanza 2079', telefono: '3585180572', plan: 'Pase libre', fechaIngreso: '2025-06-10' },
    { nombre: 'Mario', apellido: 'Lazarte', fechaNacimiento: '1978-07-25', edad: 46, direccion: 'Arturo M Bas 2464', telefono: '3584846167', telefonoEmergencia: '3584120274', plan: '3 x s', fechaIngreso: '2025-06-09' },
    { nombre: 'Paola', apellido: 'Flores', fechaNacimiento: '1978-09-22', edad: 46, direccion: 'Arturo M Bas 2464', telefono: '3584120274', telefonoEmergencia: '3584846167', plan: '3 x s', fechaIngreso: '2025-06-09' },
    { nombre: 'Rocio', apellido: 'Lazarte', fechaNacimiento: '2005-08-14', edad: 19, direccion: 'Arturo M Bas 2474', telefono: '3585180423', telefonoEmergencia: '3584120274', plan: '3 x s', fechaIngreso: '2025-06-09' },
    { nombre: 'Maria', apellido: 'Baigorria', fechaNacimiento: '1974-12-21', edad: 50, direccion: 'Arturo M Bas y Bach', telefono: '358', plan: 'Pase libre', fechaIngreso: '2025-06-09' },
    { nombre: 'Gabriela', apellido: 'Perez', fechaNacimiento: '1962-09-23', edad: 62, direccion: 'Concejal Oviedo 1259', telefono: '3584841539', plan: '3 x s', fechaIngreso: '2025-06-10' },
    { nombre: 'Monica', apellido: 'Rivero', fechaNacimiento: '1964-09-07', edad: 60, direccion: 'Concejal Oviedo 1268', telefono: '3584231406', plan: '3 x s', fechaIngreso: '2025-06-10' },
    { nombre: 'Lara', apellido: 'Molina', fechaNacimiento: '1994-05-10', edad: 31, direccion: 'Remedio de Escalada', plan: '3 x s', fechaIngreso: '2025-06-11' },
    { nombre: 'Diego', apellido: 'Flores', fechaNacimiento: '1991-07-05', edad: 33, direccion: 'Arturo M Bas 2066', telefono: '3584314493', telefonoEmergencia: '3584125582', plan: 'Pase libre', fechaIngreso: '2025-06-02' },
    { nombre: 'Sergio', apellido: 'Limonti', fechaNacimiento: '1993-03-20', edad: 32, direccion: 'Santiago del Estero 777 1A', telefono: '3586545530', telefonoEmergencia: '3584254644', plan: 'Pase libre', fechaIngreso: '2025-06-09' },
    { nombre: 'Julian', apellido: 'Barchiesi', fechaNacimiento: '2013-02-18', edad: 12, direccion: 'Trejo y Sanabria 1223', telefonoEmergencia: '3586021223', plan: 'Pase libre', fechaIngreso: '2025-06-13' },
    { nombre: 'Nicolas', apellido: 'Bustos', fechaNacimiento: '2001-05-10', edad: 24, direccion: 'Pje Acevedo 2542', telefono: '3585147585', plan: 'Pase libre', fechaIngreso: '2025-06-16' },
    { nombre: 'Esteban', apellido: 'Acosta', fechaNacimiento: '1975-12-23', edad: 49, direccion: 'Blas Parera 1265', telefono: '3584113406', telefonoEmergencia: '3512466438', plan: '2 x s', fechaIngreso: '2025-06-03' },
    { nombre: 'Mariana', apellido: 'Santillan', fechaNacimiento: '1973-12-19', edad: 51, direccion: 'Blas Parera 1265', telefono: '3512466438', telefonoEmergencia: '3584113406', plan: '2 x s', fechaIngreso: '2025-06-04' },
    { nombre: 'Sonia', apellido: 'Lujan', fechaNacimiento: '1966-05-24', direccion: 'Pje Gazcon 2460', telefono: '3586019610', plan: '2 x s', fechaIngreso: '2025-06-03' },
    { nombre: 'Celeste', apellido: 'Guzman', fechaNacimiento: '1994-08-24', edad: 30, direccion: 'Goudard 396', telefono: '3584022158', plan: '2 x s', fechaIngreso: '2025-06-27' },
    { nombre: 'Antonella', apellido: 'Saquetto', fechaNacimiento: '1994-05-09', edad: 31, direccion: 'Arturo M Bas 1029', telefono: '3584014724', telefonoEmergencia: '3586020821', plan: '2 x s', fechaIngreso: '2025-06-27' },
    { nombre: 'Lara', apellido: 'Rodriguez', fechaNacimiento: '2002-07-29', edad: 22, direccion: 'Alcalde Acosta 1192', telefono: '3584302725', telefonoEmergencia: '3584208159', plan: 'Pase libre', fechaIngreso: '2025-05-16' },
    { nombre: 'Gian', apellido: 'Perez', plan: 'Pase libre', fechaIngreso: '2025-05-06' },
    { nombre: 'Luis', apellido: 'Lupano', fechaNacimiento: '1967-12-13', direccion: 'Arturo M Bas 1948', telefono: '3584394042', plan: '3 x s', fechaIngreso: '2025-06-03' },
    { nombre: 'Alan', apellido: 'Vega', fechaNacimiento: '2001-08-24', edad: 23, telefono: '3584208003', plan: 'Pase libre', fechaIngreso: '2025-06-01' },
    { nombre: 'Florencia', apellido: 'Perez', fechaNacimiento: '2000-01-19', edad: 25, telefono: '3585480918', plan: 'Pase libre', fechaIngreso: '2025-06-01' },
    { nombre: 'Marcos', apellido: 'Mercau', fechaNacimiento: '2005-09-22', edad: 19, direccion: 'Perez Bulnes 2071', telefono: '3584208155', plan: '3 x s', fechaIngreso: '2025-06-16' },
    { nombre: 'Aixa', apellido: 'Aguirre', fechaNacimiento: '2002-01-26', edad: 23, direccion: 'Trejo y Sanabria 1145', telefono: '3585098547', plan: '3 x s', fechaIngreso: '2025-06-11' },
    { nombre: 'Lorena', apellido: 'Arballo', fechaNacimiento: '1980-09-15', edad: 44, direccion: 'Trejo y Sanabria 1145', telefono: '3584235921', plan: '3 x s', fechaIngreso: '2025-06-11' },
    { nombre: 'German', apellido: 'Aguirre', fechaNacimiento: '1980-07-11', edad: 44, direccion: 'Trejo y Sanabria 1145', telefono: '3585066883', telefonoEmergencia: '3584235921', plan: '3 x s', fechaIngreso: '2025-06-11' },
    { nombre: 'Fernanda', apellido: 'Alfonso', fechaNacimiento: '1988-12-08', edad: 36, direccion: 'Roque Saenz Peña 1625', telefono: '3585134835', plan: 'Pase libre', fechaIngreso: '2025-06-20' },
    { nombre: 'Clara', apellido: 'Diaz', fechaNacimiento: '1995-07-30', edad: 29, direccion: 'Fotheringam 736', telefono: '3584315790', telefonoEmergencia: '3586023298', plan: '2 x s', fechaIngreso: '2025-06-27' },
    { nombre: 'Camila', apellido: 'Aguirre', fechaNacimiento: '2004-10-27', edad: 20, direccion: 'Trejo y Sanabria 1145', telefono: '3585623352', plan: 'Pase libre', fechaIngreso: '2025-06-30' },
    { nombre: 'Ezequiel', apellido: 'Velasquez', fechaNacimiento: '1997-03-18', edad: 28, direccion: 'Blas Parera 1321', telefono: '3585167755', plan: 'Pase libre', fechaIngreso: '2025-06-30' },
    { nombre: 'Belen', apellido: 'Alfonso', fechaNacimiento: '1980-06-15', edad: 45, direccion: 'Trejo y Sanabria 1242', telefono: '3584909102', plan: 'Pase libre', fechaIngreso: '2025-06-30' },
  ];
  return list.map(c => ({ ...c, estado: 'activo' as const }));
}
