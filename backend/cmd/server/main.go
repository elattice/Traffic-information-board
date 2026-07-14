package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"open-campus-board/backend/internal/db"
	"open-campus-board/backend/internal/timetable"
	"open-campus-board/backend/internal/webui"
)

const dbPath = "data/timetable.db"

func main() {
	conn, err := db.Open(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	timetableHandler := timetable.NewHandler(timetable.NewService(conn))

	r := chi.NewRouter()

	r.Get("/api/health", handleHealth)
	r.Get("/api/departures", timetableHandler.GetDepartures)
	r.Get("/api/departures/upcoming", timetableHandler.GetUpcomingDepartures)
	r.Post("/api/import/csv", timetableHandler.ImportCSV)

	r.Handle("/*", frontendHandler())

	log.Println("server started: http://localhost:8080")

	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal(err)
	}
}

// frontendHandler serves the built React app. Unknown /api paths are
// kept as 404 instead of falling back to index.html.
func frontendHandler() http.Handler {
	spa := webui.Handler()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		spa.ServeHTTP(w, r)
	})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}
