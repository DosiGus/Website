-- Backfill flow output_config for existing flows that don't have it.
-- Reservation flows are detected by presence of both date + time collects.
-- Required fields default to collected reservation fields; guestCount defaults to 1.

with flow_collects as (
  select
    f.id,
    array_remove(array_agg(distinct (n->'data'->>'collects')), null) as collects
  from public.flows f
  left join lateral jsonb_array_elements(f.nodes) n on true
  where (f.metadata->'output_config') is null
  group by f.id
),
reservation_flows as (
  select
    id,
    collects,
    array_remove(
      array[
        case when array_position(collects, 'name') is not null then 'name' end,
        case when array_position(collects, 'date') is not null then 'date' end,
        case when array_position(collects, 'time') is not null then 'time' end,
        case when array_position(collects, 'guestCount') is not null then 'guestCount' end
      ],
      null
    ) as required_fields
  from flow_collects
  where array_position(collects, 'date') is not null
    and array_position(collects, 'time') is not null
),
custom_flows as (
  select id
  from flow_collects
  where id not in (select id from reservation_flows)
)
update public.flows f
set metadata = jsonb_set(
  f.metadata,
  '{output_config}',
  jsonb_build_object(
    'type', 'reservation',
    'requiredFields', to_jsonb(r.required_fields),
    'defaults', jsonb_build_object('guestCount', 1)
  ),
  true
)
from reservation_flows r
where f.id = r.id;

update public.flows f
set metadata = jsonb_set(
  f.metadata,
  '{output_config}',
  jsonb_build_object('type', 'custom'),
  true
)
where f.id in (
  with flow_collects as (
    select
      f.id,
      array_remove(array_agg(distinct (n->'data'->>'collects')), null) as collects
    from public.flows f
    left join lateral jsonb_array_elements(f.nodes) n on true
    where (f.metadata->'output_config') is null
    group by f.id
  )
  select id
  from flow_collects
  where array_position(collects, 'date') is null
     or array_position(collects, 'time') is null
);
