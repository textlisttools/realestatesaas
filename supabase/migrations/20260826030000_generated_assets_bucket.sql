-- Public bucket for rendered flyers/social images, same rationale as the
-- other asset buckets: public read for easy download/sharing, writes only
-- via the service-role client from the render pipeline.
insert into storage.buckets (id, name, public)
values ('generated-assets', 'generated-assets', true)
on conflict (id) do nothing;
