#!/usr/bin/env bash

set -euo pipefail

output_path="${1:-site/404.html}"

cat <<'EOF' > "$output_path"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting...</title>
    <script>
      (function () {
        var appBases = ["/bank", "/car-rental", "/wine-shop"];
        var pathname = window.location.pathname;
        var search = window.location.search;
        var hash = window.location.hash;

        var matchedBase = "";
        for (var i = 0; i < appBases.length; i++) {
          var base = appBases[i];
          if (pathname === base || pathname.indexOf(base + "/") === 0) {
            matchedBase = base;
            break;
          }
        }

        var appPath = pathname;
        if (matchedBase) {
          appPath = pathname.slice(matchedBase.length) || "/";
        }

        var target =
          (matchedBase || "") +
          "/?__gh_path=" +
          encodeURIComponent(appPath) +
          "&__gh_search=" +
          encodeURIComponent(search) +
          "&__gh_hash=" +
          encodeURIComponent(hash);

        window.location.replace(target);
      })();
    </script>
  </head>
  <body></body>
</html>
EOF
