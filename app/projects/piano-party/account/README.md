# Piano Party accounts

Routes: `/projects/piano-party/login/` and `/projects/piano-party/profile/`.

The static site uses the official Supabase browser SDK. Email/password signup collects a display name; accounts can edit their name and optional contact phone, sign out, and set/reset a password. Phone/password signup, SMS verification/recovery and social OAuth are supported when enabled on the project. Login identifiers are verified email/phone identities, not display names.

## Data and permissions

Supabase Auth stores identities and password hashes. `full_name` and `contact_phone` are saved in the authenticated user's `user_metadata`; no public profile table or SQL migration is required. Contact phone is unverified and is not a login identity. Metadata is user-editable and must never be used to grant authorization or admin privileges. Future application tables require RLS policies keyed to `auth.uid()`. This change does not sync lesson progress or upload media.

Only the supplied public project URL and publishable key are committed. Override with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at build time for another environment. Never add secret/service-role keys. Auth persists using the SDK's browser storage; private profile data is loaded at runtime and never generated into the static export.

## Dashboard setup status (2026-09-21)

- Email enabled; email confirmation remains enabled.
- Site URL: `https://davidw0311.github.io/projects/piano-party/login/`.
- Exact redirect allowlist includes login/ and profile/ on that origin and `http://localhost:3000`.
- Custom SMTP is disabled. Public confirmation/reset emails require an SMTP provider; Supabase default SMTP only sends to project-team addresses and has tight rate limits.
- Phone and social providers are disabled. UI reads `/auth/v1/settings` so supported social buttons and phone fields become available after configuration, without rebuilding.

## Enable public email signup

In Authentication → Emails → SMTP Settings, configure a verified sender, SMTP host, port, username, and password from your email service. Keep email confirmations enabled. Configure secrets directly in the provider dashboard, not in source files or chat. Then verify signup, confirmation link, login, password reset, and logout with a mailbox you control.

https://supabase.com/docs/guides/auth/auth-smtp

## Enable Google (recommended first social option)

Create a Web application OAuth client in Google Cloud with the appropriate consent screen. Set the authorized redirect URI to:

`https://vxbhzddlhopsgbwmjzdm.supabase.co/auth/v1/callback`

Enter its client ID and secret in Supabase Authentication → Sign In / Providers → Google and enable the provider. Configure the Google app's publishing/test-user access as appropriate. The login page will show Continue with Google. Facebook, Apple, GitHub, Discord, Spotify, X, and LinkedIn are also recognized when enabled and require their own provider setup.

https://supabase.com/docs/guides/auth/social-login/auth-google

## Enable phone login

Configure Phone with an SMS provider in Authentication → Sign In / Providers, keeping phone verification enabled. Use international E.164 numbers. Signup verifies the SMS code; forgotten passwords use SMS sign-in followed by setting a new password in the profile. Review SMS rates/limits before enabling public use.

https://supabase.com/docs/guides/auth/phone-login

## Verification

Run `npm run typecheck`, targeted ESLint, `npm test`, and `npx next build`. The latter checks the export without overwriting branch-hosting artifacts in the repository root. CI builds and uploads `out/` using the existing GitHub Pages workflow.

A complete live-account test requires a verified mailbox/SMS or configured OAuth provider; do not disable confirmation for testing. Check guest profile behavior, signup validation, provider availability, error handling, confirmation callbacks, profile persistence, recovery, and signout.
