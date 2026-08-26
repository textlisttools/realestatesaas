-- Public bucket for listing photos, same rationale as brand-assets: public
-- read so Puppeteer can fetch by URL when rendering templates; writes go
-- through the service-role client only.
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;
