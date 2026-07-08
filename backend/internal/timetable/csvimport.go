package timetable

import (
	"encoding/csv"
	"fmt"
	"io"
	"regexp"
	"strings"
)

var csvHeader = []string{"kind", "route_name", "origin", "destination", "departure_time", "arrival_time", "platform", "note"}

// Zero-padded HH:MM only: upcoming-departure filtering compares these
// values as strings, so "9:15" must be rejected in favor of "09:15".
var timePattern = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)

// ParseCSV reads timetable rows from r and validates them.
// It returns the parsed departures and a list of validation error messages;
// the departures are only usable when the error list is empty.
func ParseCSV(r io.Reader) ([]Departure, []string) {
	reader := csv.NewReader(r)

	header, err := reader.Read()
	if err == io.EOF {
		return nil, []string{"CSVが空です"}
	}
	if err != nil {
		return nil, []string{fmt.Sprintf("CSVを読み込めません: %v", err)}
	}
	for i := range header {
		header[i] = strings.TrimSpace(header[i])
	}
	if strings.Join(header, ",") != strings.Join(csvHeader, ",") {
		return nil, []string{fmt.Sprintf("ヘッダー行が不正です。期待する形式: %s", strings.Join(csvHeader, ","))}
	}

	var departures []Departure
	var errs []string
	line := 1
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		line++
		if err != nil {
			errs = append(errs, fmt.Sprintf("%d行目: %v", line, err))
			continue
		}

		d, rowErrs := parseRow(record)
		if len(rowErrs) > 0 {
			for _, e := range rowErrs {
				errs = append(errs, fmt.Sprintf("%d行目: %s", line, e))
			}
			continue
		}
		departures = append(departures, d)
	}

	if len(errs) == 0 && len(departures) == 0 {
		return nil, []string{"データ行がありません"}
	}
	return departures, errs
}

func parseRow(record []string) (Departure, []string) {
	for i := range record {
		record[i] = strings.TrimSpace(record[i])
	}

	d := Departure{
		Kind:          record[0],
		RouteName:     record[1],
		Origin:        record[2],
		Destination:   record[3],
		DepartureTime: record[4],
		ArrivalTime:   record[5],
		Platform:      record[6],
		Note:          record[7],
	}

	var errs []string
	if d.Kind != "bus" && d.Kind != "train" {
		errs = append(errs, fmt.Sprintf("kind は bus または train を指定してください: %q", d.Kind))
	}
	if d.RouteName == "" {
		errs = append(errs, "route_name が空です")
	}
	if d.Origin == "" {
		errs = append(errs, "origin が空です")
	}
	if d.Destination == "" {
		errs = append(errs, "destination が空です")
	}
	if !timePattern.MatchString(d.DepartureTime) {
		errs = append(errs, fmt.Sprintf("departure_time は HH:MM 形式で指定してください: %q", d.DepartureTime))
	}
	if d.ArrivalTime != "" && !timePattern.MatchString(d.ArrivalTime) {
		errs = append(errs, fmt.Sprintf("arrival_time は HH:MM 形式で指定してください: %q", d.ArrivalTime))
	}
	return d, errs
}
