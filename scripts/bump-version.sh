#!/usr/bin/env bash
# Stamps a cache-busting ?v= on our own CSS and JS (index.html links and the
# ES module imports between js/ files). Vendor files and fonts are left alone.
# Usage: scripts/bump-version.sh [version]   (default: current date-time, UTC)
set -euo pipefail

v="${1:-$(date -u +%Y%m%d%H%M)}"
site="$(cd "$(dirname "$0")/../site" && pwd)"

# index.html: href="css/….css" and src="js/….js"
sed -E -i "s#((href|src)=\"(css|js)/[^\"?]+\.(css|js))(\?v=[^\"]*)?\"#\1?v=$v\"#g" "$site/index.html"

# js/*.js: import … from './….js' (same ?v= so each module loads once)
sed -E -i "s#(from '\./[^'?]+\.js)(\?v=[^']*)?'#\1?v=$v'#g" "$site"/js/*.js

echo "Version set to $v"
grep -Eo "(css|js)/[^\"?]+\.(css|js)\?v=[^\"]*" "$site/index.html"
grep -Eo "from '\./[^']+'" "$site"/js/*.js
