🏋️ Summer Gym — Sistema de Gestión

Sistema de gestión integral para gimnasios, desarrollado a medida para Summer Gym. Actualmente en producción, gestionando 285 socios reales.

📋 Descripción

Summer Gym reemplaza las planillas de Excel y el control manual por un sistema completo donde el dueño del gimnasio puede administrar socios, pagos, vencimientos y caja desde un solo lugar, con alertas automáticas y reportes en tiempo real.

✨ Funcionalidades
Dashboard — Métricas en tiempo real: total de socios, activos, inactivos, ingresos del mes, altas recientes
Gestión de clientes — Alta, edición, búsqueda y filtrado (activo/inactivo) de socios, con planes personalizados (pase libre, 3x semana, 2x semana, etc.)
Registro de pagos — Registro rápido de cuotas con múltiples métodos de pago (efectivo, transferencia, débito, crédito)
Flujo de caja — Control de ingresos y egresos por mes, con cierre mensual que bloquea y consolida el período, distribuciones y saldo disponible
Notificaciones automáticas — Alertas de cuotas por vencer y vencidas, calculadas automáticamente según la fecha del último pago
Marcado automático de inactivos — Los socios que superan los días configurados sin pagar pasan a inactivo sin intervención manual
Mensajes automáticos por WhatsApp — Plantillas configurables para saludos de cumpleaños y recordatorios de cuota vencida
Panel de configuración — Datos del gimnasio, precios por plan, días de alerta, y reglas de negocio editables sin tocar código
Exportar / Importar datos — Respaldo completo del sistema en formato JSON
🛠️ Stack técnico
Frontend: React + Vite
Backend / Base de datos: Supabase (PostgreSQL)
Seguridad: Row Level Security (RLS) a nivel de tabla
Deploy: Vercel
Notificaciones: Integración con WhatsApp Web
🗄️ Modelo de datos

El sistema maneja varias tablas relacionadas entre sí:

alumnos — Datos de socios (nombre, contacto, plan, estado, fecha de nacimiento)
pagos — Historial de pagos por socio (fecha, monto, método)
movimientos_caja — Ingresos y egresos del flujo de caja, con tipo (ingreso cliente, egreso, distribución, etc.)
configuracion — Parámetros del gimnasio (precios, días de alerta, textos de notificación)

La lógica de vencimientos, marcado de inactivos y cierre de caja mensual está resuelta mediante consultas y reglas de negocio sobre estas tablas, sin backend intermedio propio.

📝 Nota sobre el origen del proyecto

El proyecto arrancó a partir de un scaffold generado con Lovable (por eso el historial incluye un commit inicial de plantilla y aparece como colaborador). A partir de ahí, todo el desarrollo real —modelo de datos, lógica de negocio, pantallas y funcionalidades— fue construido de forma incremental, como puede verse en el historial de commits.

👤 Autor

Valentino Alcaraz Sgarlatta Desarrollador Full Stack freelance — Río Cuarto, Córdoba LinkedIn · GitHub

Sistema desarrollado a medida para un cliente real. Los datos de producción no son públicos por privacidad.
