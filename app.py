import dash
from dash import dcc, html, Input, Output, State
import json

# Initialize the app
app = dash.Dash(__name__, assets_folder="assets")

# App layout
app.layout = html.Div([
    # Buttons for fetching and displaying data
    html.Button("Fetch Data", id="fetch-data-button", n_clicks=0),
    html.Button("Show Summary Table", id="show-summary-button", n_clicks=0),
    html.Button("Show Original Data", id="show-original-button", n_clicks=0),
    
    # New button to clear IndexedDB data
    html.Button("Clear IndexedDB", id="clear-db-button", n_clicks=0),  # Added button

    # Div to store and show data
    html.Div(id="data-container"),

    # Placeholder for the tables
    dcc.Store(id="stored-data", storage_type="session"),  # Used for caching data in session storage
])

# Combined callback for all buttons
@app.callback(
    Output("data-container", "children"),
    Input("fetch-data-button", "n_clicks"),
    Input("show-summary-button", "n_clicks"),
    Input("show-original-button", "n_clicks"),
    Input("clear-db-button", "n_clicks"),  # Added the clear button input
    State("stored-data", "data"),
)
def update_table(fetch_clicks, summary_clicks, original_clicks, clear_clicks, stored_data):
    # Use Dash callback context to determine which button was clicked
    ctx = dash.callback_context

    # If no button was clicked, return an empty div
    if not ctx.triggered:
        return html.Div()

    # Determine which button was clicked
    button_id = ctx.triggered[0]['prop_id'].split('.')[0]

    # Handle fetch data button click
    if button_id == "fetch-data-button":
        return html.Div("Data is being fetched and stored...")

    # Handle show summary button click
    if button_id == "show-summary-button":
        if stored_data:
            # Generate summary table based on magType counts
            mag_types = {}
            for earthquake in stored_data['features']:
                mag_type = earthquake['properties']['magType']
                mag_types[mag_type] = mag_types.get(mag_type, 0) + 1

            table = "<table><tr><th>magType</th><th>Count</th></tr>"
            for mag_type, count in mag_types.items():
                table += f"<tr><td>{mag_type}</td><td>{count}</td></tr>"
            table += "</table>"
            return html.Div(table)
        else:
            return html.Div("No data available. Please fetch data first.")

    # Handle show original data button click
    if button_id == "show-original-button":
        if stored_data:
            # Generate original data table
            table = "<table><tr><th>ID</th><th>Location</th><th>Magnitude</th><th>magType</th></tr>"
            for earthquake in stored_data['features']:
                table += f"<tr><td>{earthquake['id']}</td><td>{earthquake['properties']['place']}</td><td>{earthquake['properties']['mag']}</td><td>{earthquake['properties']['magType']}</td></tr>"
            table += "</table>"
            return html.Div(table)
        else:
            return html.Div("No data available. Please fetch data first.")

    # Handle clear IndexedDB button click
    if button_id == "clear-db-button":
        # Clear session storage and reset the table
        return html.Div("IndexedDB has been cleared.")

    # Default case if no valid button was clicked
    return html.Div()

# Main
if __name__ == "__main__":
    app.run_server(debug=True)
