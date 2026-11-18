# Regalos 4to grado – La Escuelita

Aplicación web inicial para consultar el valor de referencia del regalo y, en una segunda etapa, organizar cumpleaños y asignaciones.

## Configuración local

1. Instalar Node.js LTS.
2. Copiar `.env.example` a `.env`.
3. Completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los datos del proyecto Supabase.
4. En Supabase > SQL Editor, ejecutar `supabase-schema.sql`.
5. Ejecutar `npm install` y `npm run dev`.

## Crear usuario administrador

1. En Supabase > Authentication > Users, crear un usuario con el email y contraseña del administrador.
2. Copiar su User UID.
3. En SQL Editor ejecutar, reemplazando el UUID:

```sql
insert into public.admin_users (user_id)
values ('PEGAR-ACA-EL-USER-UID');
```

4. El administrador podrá iniciar sesión desde el botón de acceso de la página y cargar actualizaciones IPC.

## Publicar gratis en Vercel

1. Subir esta carpeta a un repositorio GitHub.
2. En Vercel, importar el repositorio.
3. En Environment Variables agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

La página permite lectura pública de los valores y de los datos que se agreguen al calendario. No cargar nombres de menores hasta que se acuerde y configure el alcance de acceso familiar. La gestión de cumpleaños y regalos todavía requiere completar el módulo de edición del administrador.

## Regla de actualización

El administrador carga el mes del IPC publicado, el mes desde el que rige el nuevo importe y la variación mensual. El sistema aplica la variación al último valor de referencia y guarda el historial. Para la base inicial se establece $90.000 desde marzo de 2027.
