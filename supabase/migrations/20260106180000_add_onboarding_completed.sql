alter table "public"."profiles"
add column "onboarding_completed" boolean default false;

-- Auto-complete for existing profiles that already have a display name to avoid forcing them back
update "public"."profiles"
set "onboarding_completed" = true
where "display_name" is not null and "display_name" != '';
