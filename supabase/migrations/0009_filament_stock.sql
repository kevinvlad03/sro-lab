-- ====================================================================
-- SRO Lab — filament stock inventory
-- ====================================================================
--
-- One row per spool of filament. Everyone signed in can browse the
-- stock so they know what's actually available before they submit;
-- only admins can add, edit, or remove spools.
--
-- Idempotent: safe to re-run.

create table if not exists public.filament_stock (
  id uuid primary key default gen_random_uuid(),
  material text not null,
  color_name text not null,
  color_hex text not null,
  brand text,
  grams_total int not null default 1000 check (grams_total > 0),
  grams_remaining int not null default 1000 check (grams_remaining >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_grams_in_range check (grams_remaining <= grams_total),
  constraint stock_color_hex_format check (color_hex ~ '^#[0-9a-fA-F]{6}$')
);

create index if not exists filament_stock_material_idx
  on public.filament_stock(material);

alter table public.filament_stock enable row level security;

drop policy if exists "stock_read_all" on public.filament_stock;
create policy "stock_read_all"
  on public.filament_stock for select
  to authenticated
  using (true);

drop policy if exists "stock_admin_write" on public.filament_stock;
create policy "stock_admin_write"
  on public.filament_stock for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
