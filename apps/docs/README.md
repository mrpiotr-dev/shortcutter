# shortcutter.dev

Astro + Starlight site, served as static assets by a Cloudflare Worker.

```sh
pnpm --filter docs run dev      # http://localhost:4321/
pnpm --filter docs run build    # → dist/
pnpm --filter docs run preview  # serves dist/ with wrangler, like production
```

## URLs

- Canonical host is `https://www.shortcutter.dev/` (`site` in `astro.config.mjs`).
- Every URL ends with `/`: Astro `trailingSlash: 'always'`, and Cloudflare redirects `/docs` → `/docs/` (`html_handling: "force-trailing-slash"`).

## Telemetry

- Astro: `ASTRO_TELEMETRY_DISABLED=1` in the package scripts. Astro has no config option for it, so set the same variable in Workers Builds.
- Wrangler: `"send_metrics": false` in `wrangler.jsonc`.

## Cloudflare setup (one time, in the dashboard)

1. **Workers & Pages → Create → Import a repository**: pick this repo.
   - Root directory: `/`
   - Build command: `pnpm install && pnpm run build`
   - Deploy command: `pnpm --filter docs exec wrangler deploy`
   - Non-production branch deploy command: `pnpm --filter docs exec wrangler versions upload` (preview URLs per branch)
   - Production branch: `main`
   - Build variables: `ASTRO_TELEMETRY_DISABLED=1`
2. The first deploy attaches `www.shortcutter.dev` and `shortcutter.dev` as custom domains (DNS records and certificates are created automatically).
3. **shortcutter.dev → Rules → Redirect Rules → Create rule** ("Redirect from root to WWW" template):
   - When hostname equals `shortcutter.dev`
   - Dynamic redirect to `concat("https://www.shortcutter.dev", http.request.uri.path)`, status 301, preserve query string.

`wrangler.jsonc` holds no account ID or secrets; Workers Builds deploys with the connected account.
