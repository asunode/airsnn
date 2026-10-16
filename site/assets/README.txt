The concierge portrait is set in data/site.json, "portrait":

  "portrait": { "src": "img/concierge", "widths": [600, 900, 1086], "width": 1086, "height": 1448 }

This points at img/concierge-600.avif / .webp, -900, -1086 (AVIF + WebP copies of
the AI-generated source portrait). A plain file path ("assets/photo.webp") also works.
Set it to null to bring back the silhouette placeholder.

index.html also preloads img/concierge-*.avif so the portrait appears fast; if the
portrait files change, update that one <link rel="preload"> line too.
