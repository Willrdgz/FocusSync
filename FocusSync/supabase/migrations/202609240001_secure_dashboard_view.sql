-- Ensure the dashboard view evaluates table policies as the authenticated user.
-- Apply this migration to the shared Supabase project before production use.
alter view if exists public.dashboard_summary set (security_invoker = true);

revoke all on public.dashboard_summary from anon;
grant select on public.dashboard_summary to authenticated;
