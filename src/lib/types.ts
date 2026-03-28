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
  modalidadPago: 'Efectivo' | 'Transferencia';
  monto: number;
  fechaPago: string;
  plan: string;
  observaciones?: string;
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
