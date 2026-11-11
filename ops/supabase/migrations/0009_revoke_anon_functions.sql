-- Supabase grants EXECUTE on new functions to anon explicitly (not only via PUBLIC).
-- Lock down the trip functions and make "no anon execute" the default for future functions.
revoke execute on function public.start_trip(double precision, double precision) from anon;
revoke execute on function public.set_trip_route(uuid, jsonb, text, integer) from anon;
revoke execute on function public.record_proof(uuid, uuid, public.proof_outcome, uuid, text, text, double precision, double precision, real, timestamptz) from anon;
revoke execute on function public.end_trip(text) from anon;
revoke execute on function public.haversine_m(double precision, double precision, double precision, double precision) from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
