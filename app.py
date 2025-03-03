import dash
from dash import dcc, html, dash_table, Input, Output, ClientsideFunction
import requests
import os
import json

# Create cache directory
CACHE_DIR = "cache"
CACHE_FILE = os.path.join(CACHE_DIR, "earthquakes.json")

if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Function to fetch and cache earthquake data
def fetch_earthquake_data():
    url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    try:
        response = requests.get(url)
        data = response.json()

        # Cache the data
        with open(CACHE_FILE, "w") as f:
            json.dump(data, f)
    except Exception as e:
        print("Error fetching data:", e)

# Load cached data if available
def load_cached_data():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {"features": []}

# Fetch and cache data
fetch_earthquake_data()
earthquake_data = load_cached_data()

# Extract relevant earthquake details
def extract_earthquake_data(data):
    features = data.get("features", [])
    table_data = []
    for quake in features:
        props = quake.get("properties", {})
        table_data.append({
            "Magnitude": props.get("mag", "N/A"),
            "Location": props.get("place", "Unknown"),
            "Time": props.get("time", "N/A"),
            "More Info": props.get("url", "N/A")
        })
    return table_data

table_data = extract_earthquake_data(earthquake_data)

# Dash app setup
app = dash.Dash(__name__, external_scripts=["/assets/callbacks.js"])

app.layout = html.Div([
    html.H1("Live Earthquake Data"),
    
    html.Button("Refresh Data", id="refresh-button", n_clicks=0),
    
    dash_table.DataTable(
        id="earthquake-table",
        columns=[
            {"name": "Magnitude", "id": "Magnitude"},
            {"name": "Location", "id": "Location"},
            {"name": "Time", "id": "Time"},
            {"name": "More Info", "id": "More Info", "presentation": "markdown"},
        ],
        data=table_data,
        style_table={"overflowX": "auto"},
    ),
    
    dcc.Store(id="earthquake-data", data=table_data)  # Store data for client-side callback
])

# Clientside Callback (Runs in the browser using JavaScript)
app.clientside_callback(
    ClientsideFunction(namespace="clientside", function_name="refreshEarthquakeData"),
    Output("earthquake-data", "data"),
    Input("refresh-button", "n_clicks")
)

if __name__ == "__main__":
    app.run_server(debug=True)
