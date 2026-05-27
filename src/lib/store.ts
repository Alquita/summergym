import { Client, Payment, CashFlowEntry, Notification } from './types';

const CLIENTS_KEY = 'summer_gym_clients';
const PAYMENTS_KEY = 'summer_gym_payments_v2';
const CASHFLOW_KEY = 'summer_gym_cashflow_v2';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Clients
export function getClients(): Client[] {
  const data = localStorage.getItem(CLIENTS_KEY);
  if (!data) {
    const initial = getInitialClients();
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

export function saveClient(client: Omit<Client, 'id'>): Client {
  const clients = getClients();
  const newClient = { ...client, id: generateId() };
  clients.push(newClient);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  return newClient;
}

export function updateClient(client: Client): void {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === client.id);
  if (idx !== -1) { clients[idx] = client; localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)); }
}

export function deleteClient(id: string): void {
  const clients = getClients().filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

// Payments
export function getPayments(): Payment[] {
  const data = localStorage.getItem(PAYMENTS_KEY);
  if (!data) {
    const initial = getInitialPayments();
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

export function savePayment(payment: Omit<Payment, 'id'>): Payment {
  const payments = getPayments();
  const newPayment = { ...payment, id: generateId() };
  payments.push(newPayment);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));

  // Registrar automáticamente en flujo de caja
  saveCashFlowEntry({
    fecha: newPayment.fechaPago,
    detalle: `Cuota ${newPayment.mes} ${newPayment.anio} - ${newPayment.clientName}`,
    ingreso: newPayment.monto,
    egreso: 0,
    tipo: 'ingreso_cliente',
    observaciones: `Pago ${newPayment.modalidadPago} - ${newPayment.plan}`,
  });

  return newPayment;
}

export function deletePayment(id: string): void {
  const payments = getPayments().filter(p => p.id !== id);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

// Cash Flow
export function getCashFlow(): CashFlowEntry[] {
  const data = localStorage.getItem(CASHFLOW_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveCashFlowEntry(entry: Omit<CashFlowEntry, 'id'>): CashFlowEntry {
  const entries = getCashFlow();
  const newEntry = { ...entry, id: generateId() };
  entries.push(newEntry);
  localStorage.setItem(CASHFLOW_KEY, JSON.stringify(entries));
  return newEntry;
}

export function deleteCashFlowEntry(id: string): void {
  const entries = getCashFlow().filter(e => e.id !== id);
  localStorage.setItem(CASHFLOW_KEY, JSON.stringify(entries));
}

// Auto-update statuses & generate notifications
export function syncClientStatuses(): { updatedClients: Client[]; notifications: Notification[] } {
  const clients = getClients();
  const payments = getPayments();
  const notifications: Notification[] = [];
  const now = new Date();
  let changed = false;

  clients.forEach(client => {
    const clientPayments = payments
      .filter(p => p.clientId === client.id)
      .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

    if (clientPayments.length > 0) {
      const lastPayment = new Date(clientPayments[0].fechaPago);
      const daysSince = Math.floor((now.getTime() - lastPayment.getTime()) / 86400000);

      // Vencida: más de 35 días → inactivo
      if (daysSince > 35) {
        if (client.estado === 'activo') {
          client.estado = 'inactivo';
          changed = true;
        }
        notifications.push({
          id: generateId(),
          type: 'cuota_vencida',
          clientId: client.id,
          clientName: `${client.nombre} ${client.apellido}`,
          message: `Cuota vencida hace ${daysSince - 30} días. Último pago: ${lastPayment.toLocaleDateString('es-AR')}`,
          date: now.toISOString(),
          read: false,
        });
      }
      // Por vencer: entre 25 y 35 días
      else if (daysSince >= 25) {
        notifications.push({
          id: generateId(),
          type: 'cuota_por_vencer',
          clientId: client.id,
          clientName: `${client.nombre} ${client.apellido}`,
          message: `La cuota vence en ${35 - daysSince} días. Último pago: ${lastPayment.toLocaleDateString('es-AR')}`,
          date: now.toISOString(),
          read: false,
        });
      }
    }

    // Cumpleaños
    if (client.fechaNacimiento) {
      const bday = new Date(client.fechaNacimiento + 'T12:00:00');
      const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      const daysUntil = Math.floor((thisYearBday.getTime() - now.getTime()) / 86400000);

      if (daysUntil >= 0 && daysUntil <= 7) {
        notifications.push({
          id: generateId(),
          type: 'cumpleanos',
          clientId: client.id,
          clientName: `${client.nombre} ${client.apellido}`,
          message: daysUntil === 0
            ? `¡Hoy es su cumpleaños! 🎂`
            : `Cumpleaños en ${daysUntil} día${daysUntil > 1 ? 's' : ''} (${thisYearBday.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })})`,
          date: now.toISOString(),
          read: false,
        });
      }
    }
  });

  if (changed) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }

  return { updatedClients: clients, notifications };
}

function getInitialClients(): Client[] {
  return [
    { id: '1', nombre: 'Sandra', apellido: 'Arguello', fechaNacimiento: '1979-03-11', edad: 45, direccion: 'Alcalde Acosta 1192', telefono: '3584208159', telefonoEmergencia: '3582430438', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-07' },
    { id: '2', nombre: 'Cristian', apellido: 'Ayala', fechaNacimiento: '1978-12-10', edad: 46, direccion: 'Marcos Llovera 1167', telefono: '3584253631', telefonoEmergencia: '3586547210', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-05-26' },
    { id: '3', nombre: 'Graciela', apellido: 'Cavana', fechaNacimiento: '1980-08-30', edad: 44, telefono: '3585415490', telefonoEmergencia: '3586202520', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-19' },
    { id: '4', nombre: 'Rodrigo', apellido: 'Saavedra', fechaNacimiento: '1999-04-12', edad: 26, direccion: 'Consejal Oviedo 1254', telefono: '3584187745', telefonoEmergencia: '3585040927', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-19' },
    { id: '5', nombre: 'Virginia', apellido: 'Tarico', fechaNacimiento: '1995-05-08', edad: 28, plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-05' },
    { id: '6', nombre: 'Franco', apellido: 'Ambrogio', fechaNacimiento: '1993-09-30', edad: 31, plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-05' },
    { id: '7', nombre: 'Cristina', apellido: 'Arguello', fechaNacimiento: '1970-06-14', edad: 54, direccion: 'Alcalde Acosta 1192', telefono: '3584175421', telefonoEmergencia: '3582430438', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-07' },
    { id: '8', nombre: 'Eva', apellido: 'Arguello', fechaNacimiento: '2001-02-26', edad: 24, direccion: 'Alcalde Acosta 1192', telefono: '3582430471', telefonoEmergencia: '3584175421', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-09' },
    { id: '9', nombre: 'Jonathan', apellido: 'Arguello', edad: 30, plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-09' },
    { id: '10', nombre: 'Alan', apellido: 'Benitez', fechaNacimiento: '1993-08-06', edad: 30, plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-09' },
    { id: '11', nombre: 'Emiliano', apellido: 'Bernal', fechaNacimiento: '2004-01-11', edad: 21, direccion: 'Blas Parera 1275', telefono: '3584196046', telefonoEmergencia: '3584372998', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-05-15' },
    { id: '12', nombre: 'Karen', apellido: 'Carrizo', fechaNacimiento: '1992-06-05', edad: 32, direccion: 'Int. Daguerre N°1228', telefono: '3584222905', telefonoEmergencia: '3584387465', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-06' },
    { id: '13', nombre: 'Evan', apellido: 'Cristelli', fechaNacimiento: '1999-06-08', edad: 26, direccion: 'Marcos Llovera 1175', telefono: '3586012518', telefonoEmergencia: '3586202520', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-19' },
    { id: '14', nombre: 'Eugenia', apellido: 'Cuheito', fechaNacimiento: '1993-11-26', edad: 31, direccion: 'Agente Duarte 1040', telefono: '3586543933', telefonoEmergencia: '3584120806', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-12' },
    { id: '15', nombre: 'Angel', apellido: 'Flores', fechaNacimiento: '2009-01-07', edad: 16, direccion: 'Arturo M Bas 1993', telefono: '3584564677', telefonoEmergencia: '3584846154', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-26' },
    { id: '16', nombre: 'Lucas', apellido: 'Fos', fechaNacimiento: '1994-04-28', edad: 31, direccion: 'Ayacucho 2087', telefono: '3585100844', telefonoEmergencia: '3584352670', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-05' },
    { id: '17', nombre: 'Sandra', apellido: 'Garro', fechaNacimiento: '1968-12-06', edad: 56, direccion: 'Pasaje Cafeto N°2694', telefono: '3584387645', telefonoEmergencia: '3584193429', plan: '2 dias', estado: 'activo', fechaIngreso: '2025-05-09' },
    { id: '18', nombre: 'Valentina', apellido: 'Geracci', fechaNacimiento: '2004-05-20', edad: 21, direccion: 'Juan de Garay 1147', telefono: '3586547141', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-20' },
    { id: '19', nombre: 'Alam', apellido: 'Leontes', fechaNacimiento: '2003-11-03', edad: 21, direccion: 'Trejo y Sanabria 1124', telefono: '3585014444', telefonoEmergencia: '3585174932', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-05' },
    { id: '20', nombre: 'Martina', apellido: 'Ramos', fechaNacimiento: '2009-07-10', edad: 15, direccion: 'Arturo M Bas N°2050', telefono: '3584360101', telefonoEmergencia: '3585107151', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-05' },
    { id: '21', nombre: 'Matias', apellido: 'Aguirre', fechaNacimiento: '1993-12-30', edad: 31, direccion: 'Ayacucho 1995', telefono: '3584872621', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-19' },
    { id: '22', nombre: 'Emiliano', apellido: 'Nievas', fechaNacimiento: '2008-10-08', edad: 13, direccion: 'Pje Mercedario 1243', telefono: '3584313539', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-05-09' },
    { id: '23', nombre: 'Valentina', apellido: 'Nievas', fechaNacimiento: '2003-05-20', edad: 21, direccion: 'Consejal Oviedo 1254', telefono: '3584313785', telefonoEmergencia: '3584313539', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-05-29' },
    { id: '24', nombre: 'Agustin', apellido: 'Pettenatti', fechaNacimiento: '1993-08-10', edad: 31, direccion: 'Bolivar 280 4A', telefono: '3584129920', telefonoEmergencia: '3585484404', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-19' },
    { id: '25', nombre: 'Franco', apellido: 'Sanchez', fechaNacimiento: '1985-11-28', edad: 39, direccion: 'Arturo M Bas 1858', telefono: '3585061295', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-19' },
    { id: '26', nombre: 'Ricardo', apellido: 'Minudri', fechaNacimiento: '1973-04-05', edad: 52, direccion: 'Saint Remy 27', telefono: '3585069183', telefonoEmergencia: '3584396796', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-02' },
    { id: '27', nombre: 'Natanael', apellido: 'Fredes', fechaNacimiento: '2007-01-11', edad: 18, direccion: 'Concejal Oviedo 1120', telefono: '3584373566', telefonoEmergencia: '3585482583', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-06' },
    { id: '28', nombre: 'Julio', apellido: 'Frede', fechaNacimiento: '1987-06-06', edad: 38, direccion: 'Concejal Oviedo 1120', telefono: '3584194863', telefonoEmergencia: '3585482583', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-06' },
    { id: '29', nombre: 'Milagros', apellido: 'Pizzi', fechaNacimiento: '1999-04-19', edad: 26, direccion: 'Pje Esperanza 2074', telefono: '3584829836', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-10' },
    { id: '30', nombre: 'Constanza', apellido: 'Quintero', fechaNacimiento: '1999-03-11', edad: 26, direccion: 'Pje Esperanza 2079', telefono: '3585180572', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-10' },
    { id: '31', nombre: 'Mario', apellido: 'Lazarte', fechaNacimiento: '1978-07-25', edad: 46, direccion: 'Arturo M Bas 2464', telefono: '3584846167', telefonoEmergencia: '3584120274', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-09' },
    { id: '32', nombre: 'Paola', apellido: 'Flores', fechaNacimiento: '1978-09-22', edad: 46, direccion: 'Arturo M Bas 2464', telefono: '3584120274', telefonoEmergencia: '3584846167', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-09' },
    { id: '33', nombre: 'Rocio', apellido: 'Lazarte', fechaNacimiento: '2005-08-14', edad: 19, direccion: 'Arturo M Bas 2474', telefono: '3585180423', telefonoEmergencia: '3584120274', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-09' },
    { id: '34', nombre: 'Maria', apellido: 'Baigorria', fechaNacimiento: '1974-12-21', edad: 50, direccion: 'Arturo M Bas y Bach', telefono: '358', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-09' },
    { id: '35', nombre: 'Gabriela', apellido: 'Perez', fechaNacimiento: '1962-09-23', edad: 62, direccion: 'Concejal Oviedo 1259', telefono: '3584841539', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-10' },
    { id: '36', nombre: 'Monica', apellido: 'Rivero', fechaNacimiento: '1964-09-07', edad: 60, direccion: 'Concejal Oviedo 1268', telefono: '3584231406', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-10' },
    { id: '37', nombre: 'Lara', apellido: 'Molina', fechaNacimiento: '1994-05-10', edad: 31, direccion: 'Remedio de Escalada', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-11' },
    { id: '38', nombre: 'Diego', apellido: 'Flores', fechaNacimiento: '1991-07-05', edad: 33, direccion: 'Arturo M Bas 2066', telefono: '3584314493', telefonoEmergencia: '3584125582', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-02' },
    { id: '39', nombre: 'Sergio', apellido: 'Limonti', fechaNacimiento: '1993-03-20', edad: 32, direccion: 'Santiago del Estero 777 1A', telefono: '3586545530', telefonoEmergencia: '3584254644', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-09' },
    { id: '40', nombre: 'Julian', apellido: 'Barchiesi', fechaNacimiento: '2013-02-18', edad: 12, direccion: 'Trejo y Sanabria 1223', telefonoEmergencia: '3586021223', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-13' },
    { id: '41', nombre: 'Nicolas', apellido: 'Bustos', fechaNacimiento: '2001-05-10', edad: 24, direccion: 'Pje Acevedo 2542', telefono: '3585147585', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-16' },
    { id: '42', nombre: 'Esteban', apellido: 'Acosta', fechaNacimiento: '1975-12-23', edad: 49, direccion: 'Blas Parera 1265', telefono: '3584113406', telefonoEmergencia: '3512466438', plan: '2 x s', estado: 'activo', fechaIngreso: '2025-06-03' },
    { id: '43', nombre: 'Mariana', apellido: 'Santillan', fechaNacimiento: '1973-12-19', edad: 51, direccion: 'Blas Parera 1265', telefono: '3512466438', telefonoEmergencia: '3584113406', plan: '2 x s', estado: 'activo', fechaIngreso: '2025-06-04' },
    { id: '44', nombre: 'Sonia', apellido: 'Lujan', fechaNacimiento: '1966-05-24', direccion: 'Pje Gazcon 2460', telefono: '3586019610', plan: '2 x s', estado: 'activo', fechaIngreso: '2025-06-03' },
    { id: '45', nombre: 'Celeste', apellido: 'Guzman', fechaNacimiento: '1994-08-24', edad: 30, direccion: 'Goudard 396', telefono: '3584022158', plan: '2 x s', estado: 'activo', fechaIngreso: '2025-06-27' },
    { id: '46', nombre: 'Antonella', apellido: 'Saquetto', fechaNacimiento: '1994-05-09', edad: 31, direccion: 'Arturo M Bas 1029', telefono: '3584014724', telefonoEmergencia: '3586020821', plan: '2 x s', estado: 'activo', fechaIngreso: '2025-06-27' },
    { id: '47', nombre: 'Lara', apellido: 'Rodriguez', fechaNacimiento: '2002-07-29', edad: 22, direccion: 'Alcalde Acosta 1192', telefono: '3584302725', telefonoEmergencia: '3584208159', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-16' },
    { id: '48', nombre: 'Gian', apellido: 'Perez', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-05-06' },
    { id: '49', nombre: 'Luis', apellido: 'Lupano', fechaNacimiento: '1967-12-13', direccion: 'Arturo M Bas 1948', telefono: '3584394042', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-03' },
    { id: '50', nombre: 'Alan', apellido: 'Vega', fechaNacimiento: '2001-08-24', edad: 23, telefono: '3584208003', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-01' },
    { id: '51', nombre: 'Florencia', apellido: 'Perez', fechaNacimiento: '2000-01-19', edad: 25, telefono: '3585480918', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-01' },
    { id: '52', nombre: 'Marcos', apellido: 'Mercau', fechaNacimiento: '2005-09-22', edad: 19, direccion: 'Perez Bulnes 2071', telefono: '3584208155', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-16' },
    { id: '53', nombre: 'Aixa', apellido: 'Aguirre', fechaNacimiento: '2002-01-26', edad: 23, direccion: 'Trejo y Sanabria 1145', telefono: '3585098547', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-11' },
    { id: '54', nombre: 'Lorena', apellido: 'Arballo', fechaNacimiento: '1980-09-15', edad: 44, direccion: 'Trejo y Sanabria 1145', telefono: '3584235921', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-11' },
    { id: '55', nombre: 'German', apellido: 'Aguirre', fechaNacimiento: '1980-07-11', edad: 44, direccion: 'Trejo y Sanabria 1145', telefono: '3585066883', telefonoEmergencia: '3584235921', plan: '3 x s', estado: 'activo', fechaIngreso: '2025-06-11' },
    { id: '56', nombre: 'Fernanda', apellido: 'Alfonso', fechaNacimiento: '1988-12-08', edad: 36, direccion: 'Roque Saenz Peña 1625', telefono: '3585134835', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-20' },
    { id: '57', nombre: 'Clara', apellido: 'Diaz', fechaNacimiento: '1995-07-30', edad: 29, direccion: 'Fotheringam 736', telefono: '3584315790', telefonoEmergencia: '3586023298', plan: '2 x s', estado: 'activo', fechaIngreso: '2025-06-27' },
    { id: '58', nombre: 'Camila', apellido: 'Aguirre', fechaNacimiento: '2004-10-27', edad: 20, direccion: 'Trejo y Sanabria 1145', telefono: '3585623352', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-30' },
    { id: '59', nombre: 'Ezequiel', apellido: 'Velasquez', fechaNacimiento: '1997-03-18', edad: 28, direccion: 'Blas Parera 1321', telefono: '3585167755', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-30' },
    { id: '60', nombre: 'Belen', apellido: 'Alfonso', fechaNacimiento: '1980-06-15', edad: 45, direccion: 'Trejo y Sanabria 1242', telefono: '3584909102', plan: 'Pase libre', estado: 'activo', fechaIngreso: '2025-06-30' },
  ];
}

function getInitialPayments(): Payment[] {
  return [];
}

