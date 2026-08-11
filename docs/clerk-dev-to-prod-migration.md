# Clerk Dev To Prod Migration

Clerk does not support directly promoting a Development instance to Production.
For this app, use Clerk's export/import flow, then remap stored Supabase user IDs
from dev Clerk IDs to prod Clerk IDs.

## Why The Supabase Remap Is Required

The app stores Clerk user IDs in these columns:

- `public.projects.owner_user_id`
- `public.project_votes.voter_id`
- `public.project_comments.author_user_id`
- `public.project_comment_votes.voter_id`

Imported production users receive new Clerk IDs. Without the remap, project edit
access, vote state, comment authorship references, and comment vote state will no
longer line up with signed-in production users.

## Runbook

1. Rotate any Clerk secret keys that were shared outside a secret manager.
2. Configure the production Clerk instance to match development sign-in methods,
   OAuth providers, and account-linking behavior.
3. Export all users from the development Clerk Dashboard.
4. Import users into production using Clerk's migration tool.
5. Save the migration logs. Each successful row should include the original dev
   user ID and the new production Clerk user ID.
6. Build a mapping in this shape:

```sql
insert into clerk_user_id_map (dev_user_id, prod_user_id) values
  ('user_dev_1', 'user_prod_1'),
  ('user_dev_2', 'user_prod_2');
```

7. Copy `scripts/remap-clerk-user-ids.sql` into the Supabase SQL editor for the
   production database.
8. Replace the sample mapping row with the real mapping.
9. Run the script as-is first. It ends with `rollback;`, so no changes persist.
10. Confirm every `remaining_*` count is `0` in the verification output.
11. Change the final `rollback;` to `commit;` and run it again.
12. Verify a migrated user can sign in and edit their existing project.

## Notes

- The SQL helper deletes duplicate vote rows before updating IDs. This handles
  cases where both the dev ID and prod ID already voted for the same project or
  comment.
- Do not add this SQL file to the normal Supabase migration chain. It is a
  one-off production data migration.
- OAuth connections cannot be migrated directly. Users may need to consent again,
  and Clerk account linking should be configured before launch.
