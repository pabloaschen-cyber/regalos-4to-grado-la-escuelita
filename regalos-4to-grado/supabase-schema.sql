-- Regalos 4to grado – La Escuelita
-- Ejecutar completo en Supabase > SQL Editor > New query.

create table if not exists public.app_settings (
  id integer primary key check (id = 1),
  base_value numeric(12,2) not null default 90000,
  base_month date not null default date '2027-03-01',
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id, base_value, base_month)
values (1, 90000, date '2027-03-01')
on conflict (id) do nothing;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;

create table if not exists public.ipc_updates (
  id bigint generated always as identity primary key,
  ipc_month date not null,
  effective_month date not null,
  variation_pct numeric(8,3) not null,
  value_after numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (effective_month)
);

create table if not exists public.birthdays (
  id bigint generated always as identity primary key,
  child_name text not null,
  birthday_month integer not null check (birthday_month between 1 and 12),
  birthday_day integer not null check (birthday_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table if not exists public.gift_assignments (
  id bigint generated always as identity primary key,
  child_name text not null,
  birthday_month integer not null check (birthday_month between 1 and 12),
  birthday_day integer not null check (birthday_day between 1 and 31),
  giver_family text,
  gift_description text,
  status text not null default 'Pendiente' check (status in ('Pendiente','Comprado','Entregado')),
  created_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
alter table public.admin_users enable row level security;
alter table public.ipc_updates enable row level security;
alter table public.birthdays enable row level security;
alter table public.gift_assignments enable row level security;

-- Lectura pública para que las familias puedan consultar la página.
drop policy if exists "public can read app settings" on public.app_settings;
create policy "public can read app settings" on public.app_settings for select to anon, authenticated using (true);
drop policy if exists "public can read ipc updates" on public.ipc_updates;
create policy "public can read ipc updates" on public.ipc_updates for select to anon, authenticated using (true);
drop policy if exists "public can read birthdays" on public.birthdays;
create policy "public can read birthdays" on public.birthdays for select to anon, authenticated using (true);
drop policy if exists "public can read assignments" on public.gift_assignments;
create policy "public can read assignments" on public.gift_assignments for select to anon, authenticated using (true);
drop policy if exists "admins can read own admin record" on public.admin_users;
create policy "admins can read own admin record" on public.admin_users for select to authenticated using (user_id = auth.uid());

-- Solo usuarios cargados en admin_users pueden modificar información.
drop policy if exists "admins manage app settings" on public.app_settings;
create policy "admins manage app settings" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage ipc updates" on public.ipc_updates;
create policy "admins manage ipc updates" on public.ipc_updates for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage birthdays" on public.birthdays;
create policy "admins manage birthdays" on public.birthdays for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage assignments" on public.gift_assignments;
create policy "admins manage assignments" on public.gift_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.app_settings, public.ipc_updates, public.birthdays, public.gift_assignments to anon, authenticated;
grant all on public.app_settings, public.ipc_updates, public.birthdays, public.gift_assignments to authenticated;
grant select on public.admin_users to authenticated;
