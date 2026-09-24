-- Dedicated private state. No changes to PianoParty/Auth tables or policies.
create table if not exists public.werewolf_state (
  key text primary key check (key ~ '^(rooms/[A-Z0-9]{4,8}|creators/[a-f0-9]{64}|limits/[a-f0-9]{64})$'),
  value jsonb not null,
  version uuid not null default gen_random_uuid(),
  expires_at timestamptz not null
);
create index if not exists werewolf_state_expiry on public.werewolf_state(expires_at);
alter table public.werewolf_state enable row level security;
revoke all on public.werewolf_state from public, anon, authenticated;
grant all on public.werewolf_state to service_role;

create or replace function public.werewolf_read(p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  delete from public.werewolf_state where key=p_key and expires_at<=clock_timestamp();
  select jsonb_build_object('value', value, 'version', version) into result
    from public.werewolf_state where key=p_key and expires_at>clock_timestamp();
  return result;
end; $$;

create or replace function public.werewolf_cas(p_key text, p_value jsonb, p_version uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare expiry timestamptz; affected integer;
begin
  -- All durable records, including rate limits and allocation receipts, expire.
  expiry := case when p_key like 'rooms/%' then
    to_timestamp(coalesce((p_value->>'_expiresAt')::double precision,
      (p_value->>'_lastActive')::double precision+86400000)/1000)
    else clock_timestamp()+interval '24 hours' end;
  if expiry is null or expiry<=clock_timestamp() then return false; end if;
  if p_version is null then
    insert into public.werewolf_state(key,value,expires_at) values(p_key,p_value,expiry)
      on conflict (key) do nothing;
  else
    update public.werewolf_state set value=p_value, version=gen_random_uuid(), expires_at=expiry
      where key=p_key and version=p_version and expires_at>clock_timestamp();
  end if;
  get diagnostics affected = row_count;
  return affected=1;
end; $$;
revoke all on function public.werewolf_read(text) from public, anon, authenticated;
revoke all on function public.werewolf_cas(text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.werewolf_read(text) to service_role;
grant execute on function public.werewolf_cas(text,jsonb,uuid) to service_role;

create extension if not exists pg_cron;
-- SQL-only cleanup works with zero game traffic. It never touches other apps.
select cron.schedule('werewolf-expired-rooms','* * * * *',
  $$delete from public.werewolf_state where expires_at<=now();$$);
