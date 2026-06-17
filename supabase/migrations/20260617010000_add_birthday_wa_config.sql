ALTER TABLE public.configuracion
  ADD COLUMN mensaje_cumpleanos_antes text NOT NULL DEFAULT '¡Feliz cumpleaños ',
  ADD COLUMN mensaje_cumpleanos_despues text NOT NULL DEFAULT '! 🎂 Que tengas un excelente día. 🎉',
  ADD COLUMN wa_cumpleanos_habilitado boolean NOT NULL DEFAULT false;
