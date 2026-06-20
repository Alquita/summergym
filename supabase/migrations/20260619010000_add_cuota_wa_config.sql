ALTER TABLE public.configuracion
  ADD COLUMN mensaje_cuota_antes text NOT NULL DEFAULT '¡Hola ',
  ADD COLUMN mensaje_cuota_despues text NOT NULL DEFAULT '! Te recordamos que tu cuota está vencida. Por favor, acercate a pagar. 🙏',
  ADD COLUMN wa_cuota_habilitado boolean NOT NULL DEFAULT false;
