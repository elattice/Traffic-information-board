package timetable

type Departure struct {
	ID            int    `json:"id"`
	Kind          string `json:"kind"`
	RouteName     string `json:"routeName"`
	Origin        string `json:"origin"`
	Destination   string `json:"destination"`
	DepartureTime string `json:"departureTime"`
	ArrivalTime   string `json:"arrivalTime,omitempty"`
	Platform      string `json:"platform,omitempty"`
	Note          string `json:"note,omitempty"`
}

type DeparturesResponse struct {
	Departures []Departure `json:"departures"`
}

type UpcomingDeparturesResponse struct {
	Bus       []Departure `json:"bus"`
	Train     []Departure `json:"train"`
	UpdatedAt string      `json:"updatedAt"`
}
