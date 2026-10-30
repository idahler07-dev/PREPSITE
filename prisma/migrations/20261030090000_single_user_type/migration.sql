-- One kind of user. Content managers are now the owners listed in OWNER_EMAILS
-- (with a verified email), so the role column and its enum go. No user rows or
-- related data are touched.

-- Google verifies the addresses it returns, but Auth.js never recorded that.
-- Mark those emails verified so owners who sign in with Google keep access.
UPDATE "User" u
SET "emailVerified" = NOW()
WHERE u."emailVerified" IS NULL
  AND u."email" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "Account" a WHERE a."userId" = u."id" AND a."provider" = 'google');

ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";
