package timetable

import (
	"encoding/json"
	"log"
	"net/http"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetUpcomingDepartures(w http.ResponseWriter, r *http.Request) {
	response, err := h.service.UpcomingDepartures()
	if err != nil {
		log.Printf("get upcoming departures: %v", err)
		http.Error(w, "failed to load departures", http.StatusInternalServerError)
		return
	}
	writeJSON(w, response)
}

func (h *Handler) GetDepartures(w http.ResponseWriter, r *http.Request) {
	departures, err := h.service.AllDepartures()
	if err != nil {
		log.Printf("get departures: %v", err)
		http.Error(w, "failed to load departures", http.StatusInternalServerError)
		return
	}
	writeJSON(w, DeparturesResponse{Departures: departures})
}

const maxCSVUploadBytes = 5 << 20 // 5MB

func (h *Handler) ImportCSV(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxCSVUploadBytes)

	file, _, err := r.FormFile("file")
	if err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error": "file フィールドにCSVファイルを添付してください",
		})
		return
	}
	defer file.Close()

	departures, validationErrs := ParseCSV(file)
	if len(validationErrs) > 0 {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "CSVのバリデーションに失敗しました",
			"details": validationErrs,
		})
		return
	}

	count, err := h.service.ReplaceDepartures(departures)
	if err != nil {
		log.Printf("import csv: %v", err)
		http.Error(w, "failed to import departures", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"imported": count})
}

func writeJSONStatus(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}
