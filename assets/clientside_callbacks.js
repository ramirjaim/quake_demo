const observer = new MutationObserver(function() {
    const fetchButton = document.getElementById("fetch-data-button");
    const summaryButton = document.getElementById("show-summary-button");
    const originalButton = document.getElementById("show-original-button");
    const clearButton = document.getElementById("clear-db-button"); // Added for clearing IndexedDB

    if (fetchButton && summaryButton && originalButton && clearButton) {
        observer.disconnect();  // Stop observing once the buttons are found

        // Add event listener to fetch data button
        fetchButton.addEventListener("click", async function() {
            try {
                const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson");
                const data = await response.json();

                // Store data in IndexedDB
                const dbRequest = indexedDB.open("EarthquakeData", 1);

                dbRequest.onupgradeneeded = function() {
                    const db = dbRequest.result;
                    if (!db.objectStoreNames.contains("earthquakes")) {
                        db.createObjectStore("earthquakes", { keyPath: "id" });
                    }
                };

                dbRequest.onsuccess = function() {
                    const db = dbRequest.result;
                    const transaction = db.transaction("earthquakes", "readwrite");
                    const store = transaction.objectStore("earthquakes");
                    data.features.forEach(earthquake => {
                        store.put(earthquake);
                    });

                    // Display fetched data in a table
                    displayFetchedData(data.features);

                    alert("Data fetched and stored in IndexedDB.");
                };
            } catch (error) {
                console.error("Error fetching earthquake data:", error);
            }
        });

        // Add event listener to show summary table button
        summaryButton.addEventListener("click", function() {
            const dbRequest = indexedDB.open("EarthquakeData", 1);

            dbRequest.onsuccess = function() {
                const db = dbRequest.result;
                const transaction = db.transaction("earthquakes", "readonly");
                const store = transaction.objectStore("earthquakes");
                const request = store.getAll();

                request.onsuccess = function() {
                    const earthquakes = request.result;
                    const magTypes = {};

                    earthquakes.forEach(function(earthquake) {
                        const magType = earthquake.properties.magType;
                        magTypes[magType] = (magTypes[magType] || 0) + 1;
                    });

                    // Generate the summary table with active cell
                    let table = `
                        <table id="summary-table">
                            <tr><th>magType</th><th>Count</th></tr>
                    `;

                    Object.keys(magTypes).forEach(function(magType) {
                        table += `<tr><td>${magType}</td><td>${magTypes[magType]}</td></tr>`;
                    });

                    table += "</table>";

                    // Display the summary table
                    document.getElementById("data-container").innerHTML = table;

                    // Attach click event to rows to handle active_cell
                    const summaryRows = document.querySelectorAll("#summary-table tr");
                    summaryRows.forEach(function(row) {
                        row.addEventListener("click", function(e) {
                            const selectedMagType = e.target.parentElement.cells[0].innerText;
                            showEarthquakesByMagType(selectedMagType);
                        });
                    });
                };
            };
        });

        // Add event listener to show original data button
        originalButton.addEventListener("click", function() {
            const dbRequest = indexedDB.open("EarthquakeData", 1);

            dbRequest.onsuccess = function() {
                const db = dbRequest.result;
                const transaction = db.transaction("earthquakes", "readonly");
                const store = transaction.objectStore("earthquakes");
                const request = store.getAll();

                request.onsuccess = function() {
                    const earthquakes = request.result;
                    let table = "<table><tr><th>ID</th><th>Location</th><th>Magnitude</th><th>magType</th><th>Time</th></tr>";

                    earthquakes.forEach(function(earthquake) {
                        const time = new Date(earthquake.properties.time); // Convert Unix timestamp to Date object
                        const formattedTime = time.toLocaleString(); // Format as a readable string

                        table += `<tr><td>${earthquake.id}</td><td>${earthquake.properties.place}</td><td>${earthquake.properties.mag}</td><td>${earthquake.properties.magType}</td><td>${formattedTime}</td></tr>`;
                    });
                    table += "</table>";

                    // Display the original data table
                    document.getElementById("data-container").innerHTML = table;
                };
            };
        });

        // Add event listener to clear IndexedDB button
        clearButton.addEventListener("click", function() {
            const dbRequest = indexedDB.open("EarthquakeData", 1);

            dbRequest.onsuccess = function() {
                const db = dbRequest.result;
                const transaction = db.transaction("earthquakes", "readwrite");
                const store = transaction.objectStore("earthquakes");

                const clearRequest = store.clear();  // Clears all data in the object store

                clearRequest.onsuccess = function() {
                    alert("IndexedDB has been cleared.");
                    document.getElementById("data-container").innerHTML = "";  // Clear the data container
                };

                clearRequest.onerror = function() {
                    alert("Error clearing IndexedDB.");
                };
            };
        });
    }
});

// Function to show earthquakes by magType
function showEarthquakesByMagType(magType) {
    const dbRequest = indexedDB.open("EarthquakeData", 1);

    dbRequest.onsuccess = function() {
        const db = dbRequest.result;
        const transaction = db.transaction("earthquakes", "readonly");
        const store = transaction.objectStore("earthquakes");
        const request = store.getAll();

        request.onsuccess = function() {
            const earthquakes = request.result;
            const filteredEarthquakes = earthquakes.filter(function(earthquake) {
                return earthquake.properties.magType === magType;
            });

            let table = "<table><tr><th>ID</th><th>Location</th><th>Magnitude</th><th>magType</th><th>Time</th></tr>";

            filteredEarthquakes.forEach(function(earthquake) {
                const time = new Date(earthquake.properties.time); // Convert Unix timestamp to Date object
                const formattedTime = time.toLocaleString(); // Format as a readable string

                table += `<tr><td>${earthquake.id}</td><td>${earthquake.properties.place}</td><td>${earthquake.properties.mag}</td><td>${earthquake.properties.magType}</td><td>${formattedTime}</td></tr>`;
            });
            table += "</table>";

            // Display the filtered earthquakes
            document.getElementById("data-container").innerHTML = table;
        };
    };
}

// Function to display the fetched data as a table
function displayFetchedData(fetchedData) {
    let table = "<table><tr><th>ID</th><th>Location</th><th>Magnitude</th><th>magType</th><th>Time</th></tr>";

    fetchedData.forEach(function(earthquake) {
        const time = new Date(earthquake.properties.time); // Convert Unix timestamp to Date object
        const formattedTime = time.toLocaleString(); // Format as a readable string

        table += `<tr><td>${earthquake.id}</td><td>${earthquake.properties.place}</td><td>${earthquake.properties.mag}</td><td>${earthquake.properties.magType}</td><td>${formattedTime}</td></tr>`;
    });

    table += "</table>";

    // Display the fetched data table
    document.getElementById("data-container").innerHTML = table;
}

// Start observing the body for changes in the DOM
observer.observe(document.body, {
    childList: true,
    subtree: true
});
