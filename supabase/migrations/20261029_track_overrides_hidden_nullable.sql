-- "hidden" is tri-state: null = automatic (default rules), true = hidden, false = always shown
alter table public.track_overrides alter column hidden drop not null, alter column hidden drop default;
