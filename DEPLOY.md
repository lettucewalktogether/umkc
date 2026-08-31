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

## 2. Choose the project name — this becomes the URL

Vercel derives the production domain from the project name:

```
<project-name>.vercel.app
```

The name must be unique across all of Vercel, not just your account, and
Vercel tells you at this step whether the one you typed is available. If it is
taken you are given a suffixed domain instead, which still works fine.

Note that `innovation.vercel.app` is not claimable — it returns Vercel's
`NOT_FOUND` rather than the `DEPLOYMENT_NOT_FOUND` an unused name returns,
meaning the hostname is already known to Vercel's router.

Whatever name you pick, the class site lives at:

```
https://<project-name>.vercel.app/umkc/govtacctclass
```

The path is internal to the app, so it does not depend on the hostname.

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

The repository's default branch is `claude/umkc-govt-acct-class-je3a65`, so
Vercel automatically treats it as the Production branch — no branch
configuration is needed. Every later push to that branch redeploys production;
pushes to any other branch get their own preview URL.

## 6. Verify

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

## Renaming the project later

**Settings → General → Project Name.** The `.vercel.app` domain follows the new
name; the old one stops working, so update any links you have handed out.
