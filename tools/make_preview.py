#!/usr/bin/env python3
"""Create a fully self-contained HTML preview. No third-party packages needed.

Usage: python tools/make_preview.py ../Sutras-preview.html
The normal GitHub Pages website does not require this script or a build step.
"""
from pathlib import Path
import base64
import mimetypes
import re
import sys

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else root.parent / 'Sutras-preview.html'
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?">', '<style>\n' + css + '\n</style>', html, count=1)

# Inline classic scripts must run after the DOM; `defer` is ignored on an inline
# classic script. Move the two scripts to the end of the document in order.
script_contents = []
for file in ('scripts/catalog.js', 'scripts/app.js'):
    html = re.sub(r'<script src="' + re.escape(file) + r'(?:\?[^"]*)?" defer></script>', '', html)
    source = (root / file).read_text(encoding='utf-8').replace('</script>', '<\\/script>')
    script_contents.append('<script>\n' + source + '\n</script>')
html = html.replace('</body>', '\n'.join(script_contents) + '\n</body>')

# Embed every local image and font referenced in the page, stylesheet or catalog.
for file in [root / 'favicon.svg', *sorted((root / 'assets').rglob('*'))]:
    if not file.is_file() or file.suffix not in {'.woff2', '.webp', '.jpg', '.png', '.svg'}:
        continue
    relative = file.relative_to(root).as_posix()
    mime = {'woff2': 'font/woff2', 'webp': 'image/webp', 'svg': 'image/svg+xml'}.get(file.suffix[1:]) or mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
    uri = 'data:' + mime + ';base64,' + base64.b64encode(file.read_bytes()).decode('ascii')
    # Only quoted local paths, not the absolute production Open Graph image URL.
    for quote in ('"', "'"):
        html = html.replace(quote + relative + quote, quote + uri + quote)

html = html.replace('<meta name="theme-color"', '<meta name="robots" content="noindex, nofollow">\n  <meta name="theme-color"', 1)
html = html.replace('<!doctype html>', '<!doctype html>\n<!-- Self-contained design preview. Edit the structured website files instead. -->', 1)
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(html, encoding='utf-8')
print(f'Created {destination} ({destination.stat().st_size / 1024:.0f} KB)')
