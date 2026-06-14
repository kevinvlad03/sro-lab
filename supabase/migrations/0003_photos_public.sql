-- ====================================================================
-- SRO Lab — make the photos bucket publicly readable
-- ====================================================================
--
-- Why: finished-print photos are displayed in /me, /gallery, and on
-- completed cards. Generating signed URLs server-side for every render
-- gets noisy fast. Bucket paths use random UUIDs, so listing is still
-- impossible without the exact path — practically equivalent privacy
-- for our 10-person tool.
--
-- Idempotent: safe to re-run.

update storage.buckets set public = true where id = 'photos';
