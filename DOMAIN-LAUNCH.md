# Custom-domain launch notes

The current production base is `https://sutras-wear.github.io/Sutras-by-S3/`. V25 deliberately does **not** include a `CNAME` file because the custom domain has not been chosen yet.

When the owner buys the domain:

1. Add the custom domain in **GitHub repository → Settings → Pages → Custom domain**.
2. Configure the DNS records exactly as GitHub Pages instructs for that domain / registrar.
3. Let GitHub create or update the `CNAME` file, or add it only after the exact domain is confirmed.
4. Replace the GitHub Pages base URL in:
   - `index.html` canonical URL
   - Open Graph `og:url` and `og:image`
   - Twitter image URL
   - JSON-LD IDs / URLs
   - `sitemap.xml`
   - `robots.txt`
5. Wait for the certificate, enable **Enforce HTTPS**, and then run the full live-domain test.

Do not guess DNS records or commit a placeholder domain. Registrar-specific values should be checked at launch time.
