-- 1. Pin search_path on set_updated_at (linter WARN 1)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Revoke public/auth EXECUTE on SECURITY DEFINER functions (linter WARN 2-5).
--    handle_new_user is only invoked by the auth trigger.
--    has_completed_booking is only invoked from RLS policy expressions
--    (which run regardless of EXECUTE grants).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_completed_booking(uuid) from public, anon, authenticated;