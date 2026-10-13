-- Seller data lockdown: sellers_db and the seller_docs (KYC) bucket.
--
-- Before this, the public anon key embedded in the website could read every
-- seller's phone, email, address, GST number and KYC document list, and could
-- write to the table. After it, only the service-role key can (used server-side
-- by api/sellers.js, which the admin portal calls with its GitHub token).
--
-- ORDER MATTERS: deploy the site first (so the admin portal already talks to
-- /api/sellers), make sure SUPABASE_SERVICE_ROLE_KEY is set in Vercel, THEN
-- run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- The website itself does not read sellers_db, so shoppers see no change.

-- 1. sellers_db: RLS on, every existing policy dropped, no grants for the
--    public roles. The service role bypasses RLS, so the API keeps working.
alter table public.sellers_db enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'sellers_db' loop
    execute format('drop policy %I on public.sellers_db', p.policyname);
  end loop;
end $$;

revoke all on table public.sellers_db from anon, authenticated;

-- 2. seller_docs bucket: private (no public URLs), and drop any storage policy
--    that mentions it, so the anon key cannot list, read, sign or upload.
update storage.buckets set public = false where id = 'seller_docs';

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%seller_docs%' or coalesce(with_check, '') ilike '%seller_docs%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- 3. Check. Expect: rls_enabled = true, no rows for sellers_db policies,
--    seller_docs public = false. The last query lists any storage policy left
--    that is NOT tied to a bucket; if one of those allows anon access to all
--    buckets, it would still expose seller_docs and needs narrowing.
select relrowsecurity as rls_enabled from pg_class where oid = 'public.sellers_db'::regclass;
select policyname, cmd, roles from pg_policies where schemaname = 'public' and tablename = 'sellers_db';
select id, public from storage.buckets where id = 'seller_docs';
select policyname, cmd, roles, qual, with_check from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and coalesce(qual, '') not ilike '%bucket_id%' and coalesce(with_check, '') not ilike '%bucket_id%';
