export interface Client {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string;
  edad?: number;
  direccion?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  plan?: string;
  estado: 'activo' | 'inactivo';
  fechaIngreso: string;
  observaciones?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  mes: string;
  anio: number;
  modalidadPago: 'Efectivo' | 'Transferencia' | 'Debito' | 'Credito';
  monto: number;
  fechaPago: string;
  plan: string;
  observaciones?: string;
}

export interface CierreMensual {
  id: string;
  mes: number;
  anio: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
  fechaCierre: string;
}

export interface CashFlowEntry {
  id: string;
  fecha: string;
  detalle: string;
  ingreso: number;
  egreso: number;
  tipo: 'ingreso_cliente' | 'ingreso_otro' | 'egreso' | 'adelanto' | 'aporte';
  observaciones?: string;
}

export interface Notification {
  id: string;
  type: 'cuota_por_vencer' | 'cuota_vencida' | 'cumpleanos';
  clientId: string;
  clientName: string;
  message: string;
  date: string;
  read: boolean;
  clienteTelefono?: string;
}

export interface Settings {
  gymName: string;
  direccion: string;
  telefono: string;
  precioPaseLibre: number;
  precio3xSemana: number;
  precio2xSemana: number;
  precio1Dia: number;
  diasAlerta: number;
  diasInactividad: number;
  mesActivoMes: number;
  mesActivoAnio: number;
  mensajeCumpleanosAntes: string;
  mensajeCumpleanosDespues: string;
  waCumpleanosHabilitado: boolean;
  mensajeCuotaAntes: string;
  mensajeCuotaDespues: string;
  waCuotaHabilitado: boolean;
}

export function planPrice(plan: string | undefined, s: Settings): number {
  switch (plan) {
    case 'Pase libre': return s.precioPaseLibre;
    case '3 x s': return s.precio3xSemana;
    case '2 x s': return s.precio2xSemana;
    case '1 dia': return s.precio1Dia;
    default: return s.precioPaseLibre;
  }
}

