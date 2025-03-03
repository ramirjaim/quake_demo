window.dash_clientside = window.dash_clientside || {};

window.dash_clientside.clientside = {
    refreshEarthquakeData: function(n_clicks) {
        if (n_clicks > 0) {
            return fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")
                .then(response => response.json())
                .then(data => {
                    return data.features.map(quake => ({
                        "Magnitude": quake.properties.mag,
                        "Location": quake.properties.place,
                        "Time": new Date(quake.properties.time).toLocaleString(),
                        "More Info": `[Link](${quake.properties.url})`
                    }));
                })
                .catch(error => {
                    console.error("Error fetching earthquake data:", error);
                    return [];
                });
        }
        return window.dash_clientside.no_update;
    }
};
