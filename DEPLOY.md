# Deploying to Vercel

The site is a stock Next.js App Router project with no database and no external
services, so deployment is the default Vercel flow plus two environment
variables.

## 1. Import the repository

1. Go to [vercel.com/new](https://vercel.com/new).
2. Under **Import Git Repository**, find `lettucewalktogether/umkc`.
   If it is not listed, choose **Adjust GitHub App Permissions** and grant
   Vercel access to that repository, then come back.
3. Click **Import**.

## 2. Domains

This project deploys to **`publicinnovation.vercel.app`**, so the class site
lives at:

```
https://publicinnovation.vercel.app/umkc/govtacctclass
```

The path is internal to the app and does not depend on the hostname, so the
site works unchanged under any domain you attach.

Two things worth knowing about the `.vercel.app` namespace:

- Project *names* are unique per account, but `.vercel.app` *subdomains* are
  unique across all of Vercel. Naming a project `innovation` therefore does not
  give you `innovation.vercel.app`; that subdomain is already known to Vercel's
  router, returning `NOT_FOUND` rather than the `DEPLOYMENT_NOT_FOUND` an
  unclaimed name returns.
- Vercel's automatic per-branch preview alias is
  `<project>-git-<branch>-<team>.vercel.app`. A DNS label caps at 63
  characters, so with a long team slug like `lettucewalktogethers-projects`,
  branch names need to stay short or the preview URL will not resolve. This is
  why the default branch is `main`.

To add another domain, or one you own, use **Settings → Domains**. A subdomain
such as `innovation.example.org` needs a `CNAME` pointing at
`cname.vercel-dns.com`; Vercel issues the certificate once DNS resolves.

## 3. Framework and build settings

Leave everything at the detected defaults:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js (auto-detected) |
| Root Directory | `./` |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

No `vercel.json` is needed.

## 4. Environment variables

Add these under **Environment Variables** *before* the first deploy, applied to
Production, Preview, and Development:

| Name | Required | Value |
| --- | --- | --- |
| `INSTRUCTOR_PASSCODE` | Yes, for the dashboard | The shared instructor passcode. Choose something long; treat it as a shared secret. |
| `NEXT_PUBLIC_CLASS_CODE` | No | Class identifier stamped on every export, e.g. `UMKC-GOVTACCT-2026FA-MH`. Defaults to `UMKC-GOVTACCT-HUBER`. |

If you forget `INSTRUCTOR_PASSCODE`, the site still deploys and every public
page works; only the dashboard is unreachable, and its sign-in page says the
passcode is not configured rather than failing obscurely.

**Changing either variable later requires a redeploy.** Vercel injects
environment variables at deploy time, so editing the value in project settings
does nothing until you redeploy (Deployments → ⋯ → Redeploy).

## 5. Deploy

Click **Deploy**. The first build takes roughly a minute.

The repository's default branch is `main`, so Vercel treats it as the
Production branch. Confirm this under **Settings → Git → Production Branch** if
the project was connected before the branch was renamed. Every later push to
`main` redeploys production; pushes to any other branch get their own preview
URL.

## 6. Verify

Against `https://publicinnovation.vercel.app`:

- `/` — landing page
- `/umkc/govtacctclass` — class overview
- `/umkc/govtacctclass/eval` — score a team, then export a CSV
- `/umkc/govtacctclass/assessment` — fill in a few items, then export a CSV
- `/umkc/govtacctclass/dashboard` — should redirect to a sign-in page; sign in
  with the passcode and load the two CSVs you just exported

## 7. Optional: a custom domain

To serve this from a domain you own — including any hostname starting with
`innovation` — go to **Settings → Domains**, add the domain, and create the DNS
record Vercel shows you. A subdomain such as `innovation.example.org` needs a
`CNAME` pointing at `cname.vercel-dns.com`. Vercel issues the TLS certificate
automatically once DNS resolves.

## Troubleshooting

**`DEPLOYMENT_NOT_FOUND` on a domain you added.** The domain is attached to the
project but no build sits behind it. Adding a domain reserves where a build
will be served; it does not build anything. Check **Deployments** — if it is
empty, connect the Git repository under **Settings → Git**, which triggers the
first build.

**`NOT_FOUND` (without `DEPLOYMENT_`) on a `.vercel.app` name.** The hostname is
known to Vercel's router but is not yours. Pick a different name or attach a
domain you own.

**A preview URL that does not resolve at all.** Check the length of
`<project>-git-<branch>-<team>`; over 63 characters it exceeds the DNS label
limit and cannot resolve. Shorten the branch name.

**The dashboard rejects the right passcode, or says none is configured.**
Environment variables are injected at deploy time, so a changed value does
nothing until you redeploy: **Deployments → ⋯ → Redeploy**.

## Renaming the project later

**Settings → General → Project Name.** The `.vercel.app` domain follows the new
name; the old one stops working, so update any links you have handed out.
