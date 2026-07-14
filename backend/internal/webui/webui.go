package webui

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

// frontendFiles contains the production build emitted by Vite.
//
//go:embed dist
var frontendFiles embed.FS

// Handler serves the embedded React app.
// Paths that match an existing file (JS, CSS, favicon, ...) are served
// as-is; everything else falls back to index.html so SPA routes like
// /admin work on direct access and reload.
func Handler() http.Handler {
	root, err := fs.Sub(frontendFiles, "dist")
	if err != nil {
		panic("open embedded frontend: " + err.Error())
	}

	fileServer := http.FileServer(http.FS(root))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path != "" {
			if info, err := fs.Stat(root, path); err == nil && !info.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}
			if strings.HasPrefix(path, "assets/") {
				http.NotFound(w, r)
				return
			}
		}
		http.ServeFileFS(w, r, root, "index.html")
	})
}
