package webui

import (
	"io/fs"
	"net/http"
	"strings"
)

// Handler serves the built React app from root.
// Paths that match an existing file (JS, CSS, favicon, ...) are served
// as-is; everything else falls back to index.html so SPA routes like
// /admin work on direct access and reload.
// root is an fs.FS so the local dist directory can later be swapped
// for an embed.FS without touching this handler.
func Handler(root fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(root))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path != "" {
			if info, err := fs.Stat(root, path); err == nil && !info.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}
		}
		http.ServeFileFS(w, r, root, "index.html")
	})
}
