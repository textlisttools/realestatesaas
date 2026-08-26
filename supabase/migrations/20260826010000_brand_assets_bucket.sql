-- Public bucket for agent logos/headshots. Public read so generated flyer
-- and social templates (rendered server-side by Puppeteer) can load these
-- images directly by URL; writes go through the service-role client only.
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;
