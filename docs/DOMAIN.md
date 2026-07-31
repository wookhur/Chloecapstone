# Connecting duesis.com

The site builds and deploys to Netlify already. This points the purchased
domain at it, and then updates the three services that need to know the app has
a real address.

Netlify project: `chloecapstonehomeworkhub`
Domain registrar: Namecheap

---

## 1. Tell Netlify about the domain

Netlify → your site → **Domain management** → **Add a domain** → `duesis.com`.

Netlify will say the domain isn't pointing at it yet. That's expected — step 2
fixes it. Set **duesis.com** (no `www`) as the primary domain; Netlify then
redirects `www.duesis.com` to it automatically, so both work and only one shows
up in the address bar.

## 2. Point the DNS at Netlify

Keep DNS at Namecheap (simpler than moving nameservers, and nothing else you
own has to move with it).

Namecheap → **Domain List** → duesis.com → **Manage** → **Advanced DNS**.

**Delete the parking records first.** A new Namecheap domain ships with a
`CNAME www → parkingpage.namecheap.com` and a URL Redirect on `@`. If they stay,
they win and the site never appears.

Then **Add New Record** twice:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| ALIAS Record | `@` | `apex-loadbalancer.netlify.com` | Automatic |
| CNAME Record | `www` | `chloecapstonehomeworkhub.netlify.app` | Automatic |

> Netlify's Domain management page shows the exact values it wants for your
> site. If they differ from the table above, **use Netlify's** — it is the one
> looking at your actual configuration.
>
> Namecheap's ALIAS record only works on their BasicDNS (the default). If the
> ALIAS option isn't there, use `A` → `@` → `75.2.60.5` instead.

DNS takes anywhere from a few minutes to a couple of hours. Netlify's domain
page goes green when it sees the change, then issues an HTTPS certificate on
its own — nothing to buy. Don't skip ahead: the certificate can't be issued
until DNS resolves, so if HTTPS looks broken 10 minutes in, it usually just
isn't done yet.

## 3. Update the services that trust the URL

Each of these has a list of allowed addresses. Until the new one is on the
list, the feature silently stops working on the real domain while still working
on the Netlify preview URL — which makes it confusing to debug.

**Supabase → Authentication → URL Configuration**
- Site URL: `https://duesis.com`
- Redirect URLs: add `https://duesis.com/**`

Sign-in sends a magic link back to wherever the app is running
(`emailRedirectTo: window.location.origin` in `src/lib/auth.ts`). Supabase
refuses to send it anywhere not on this list, so without this step sign-in
fails on the real domain.

**Google Cloud Console → Credentials → your OAuth client**
- Authorized JavaScript origins: add `https://duesis.com`

Only needed if you're using the real Google Classroom import. The built-in demo
import doesn't touch Google at all.

**Netlify → Site configuration → Environment variables**

If Supabase isn't connected yet, this is where `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` go. Without them the live site runs in demo mode and
everything typed into it disappears on refresh.

## 4. Check it

- `https://duesis.com` loads the dashboard
- `https://www.duesis.com` redirects to it
- `https://duesis.com/calendar` **typed straight into the address bar** loads
  the calendar rather than a 404 — this is what the SPA redirect in
  `netlify.toml` is for, and it's the thing most likely to be quietly broken
- The padlock shows a valid certificate
- The orange "Demo mode" banner is gone (only once step 3's env vars are set)
