const browserIdDisplay = document.getElementById('browserIdDisplay');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const intervalSelect = document.getElementById('intervalSelect');
const dataTableBody = document.querySelector('#data-table tbody');
const noDataRow = document.getElementById('no-data-row');

let sensorInterval = null;
const BROWSER_INSTANCE_ID = getOrCreateUniqueId();
browserIdDisplay.textContent = BROWSER_INSTANCE_ID;

// Generates or retrieves a unique ID for the browser instance
function getOrCreateUniqueId() {
    let uniqueId = localStorage.getItem('browserInstanceId');
    if (!uniqueId) {
        // A simple UUID-like string. For production, consider a robust UUID library.
        uniqueId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem('browserInstanceId', uniqueId);
    }
    return uniqueId;
}

// Generates random, mock sensor data
function generateRandomSensorData() {
    // Generate random latitude and longitude
    const latitude = (Math.random() * 180) - 90; // Latitude ranges from -90 to +90
    const longitude = (Math.random() * 360) - 180; // Longitude ranges from -180 to +180

    // Generate random ambient light illuminance
    const illuminance = Math.random() * 1000; // Random illuminance from 0 to 1000 lux

    return {
        timestamp: new Date().toISOString(),
        browserInstanceId: BROWSER_INSTANCE_ID,
        geolocation: {
            latitude: latitude,
            longitude: longitude,
            accuracy: Math.random() * 100, // Random accuracy value
            error: "Using mock geolocation data."
        },
        ambientLight: {
            illuminance: illuminance.toFixed(2),
            error: "Using mock ambient light data."
        }
    };
}

// Collects sensor data using Web APIs, or falls back to random data
async function collectSensorData() {
    // Check if the browser supports the Web APIs. If not, use mock data.
    if (!navigator.geolocation && !('AmbientLightSensor' in window)) {
        console.warn("Geolocation and Ambient Light Sensor not supported. Generating random data.");
        return generateRandomSensorData();
    }

    const data = {
        timestamp: new Date().getTime(), // Changed to milliseconds (UTC)
        browserInstanceId: BROWSER_INSTANCE_ID,
        geolocation: {
            latitude: 0.0,    // Default value
            longitude: 0.0,   // Default value
            accuracy: 0.0     // Default value
        },
        ambientLight: {
            illuminance: 0.0  // Default value
        }
    };

    // --- Geolocation Data Collection ---
    if (navigator.geolocation) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 4000,
                    maximumAge: 0
                });
            });
            data.geolocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
            };
        } catch (error) {
            // Geolocation failed or denied, defaults (0.0) remain
            console.warn("Geolocation error:", error.message);
        }
    } else {

        data.geolocation = {
            error: "Geolocation not supported. Using mock data."
        };
        console.warn("Geolocation not supported. Generating mock data.");
        const mockData = generateRandomSensorData().geolocation;
        data.geolocation = mockData;

    }

    // --- Ambient Light Sensor Data Collection ---
    if ('AmbientLightSensor' in window) {
        try {
            const ambientSensor = new AmbientLightSensor();
            const lightReading = await new Promise((resolve, reject) => {
                ambientSensor.onreading = () => {
                    resolve(ambientSensor.illuminance);
                    ambientSensor.stop();
                };
                ambientSensor.onerror = (event) => {
                    reject(event.error.name + ': ' + event.error.message);
                };
                ambientSensor.start();

                setTimeout(() => {
                    if (ambientSensor.state === 'activated') {
                        ambientSensor.stop();
                        reject("Ambient Light sensor timeout or no reading received.");
                    }
                }, 1000);
            });
            data.ambientLight = {

                illuminance: lightReading.toFixed(2),
                error: null

            };
        } catch (error) {
            // Ambient Light Sensor failed or denied, default (0.0) remains
            console.warn("Ambient Light Sensor error:", error.message);
        }
    } else {

        data.ambientLight = {
            error: "Ambient Light Sensor not supported. Using mock data."
        };
        console.warn("Ambient Light Sensor not supported. Generating mock data.");
        const mockData = generateRandomSensorData().ambientLight;
        data.ambientLight = mockData;
    }

    return data;
}

// Displays the collected data in the HTML table
function displayData(data) {
    if (noDataRow && dataTableBody.contains(noDataRow)) {
        noDataRow.remove();
    }
    const row = dataTableBody.insertRow(0); // Insert new row at the top

    const timestampCell = row.insertCell();
    // Display timestamp in a human-readable format, even though it's stored as milliseconds
    timestampCell.textContent = new Date(data.timestamp).toLocaleTimeString();

    const latCell = row.insertCell();
    latCell.textContent = data.geolocation.latitude.toFixed(6);

    const lonCell = row.insertCell();
    lonCell.textContent = data.geolocation.longitude.toFixed(6);

    const accuracyCell = row.insertCell();
    accuracyCell.textContent = data.geolocation.accuracy.toFixed(2);

    const ambientLightCell = row.insertCell();
    ambientLightCell.textContent = data.ambientLight.illuminance; // Display as is (already formatted in collectSensorData)
}

// Sends the collected data to a backend endpoint
async function sendDataToBackend(data) {
    const backendUrl = 'http://localhost:3000/api/sensor-data'; // *** IMPORTANT: Replace with your actual backend endpoint ***
    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // Check if the response body is not empty before parsing as JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const result = await response.json();
                console.log("Data sent successfully:", result);
            } else {
                console.log("Data sent successfully, but no JSON response was received.");
            }
            
            const messageRow = dataTableBody.insertRow(0);
            const messageCell = messageRow.insertCell();
            messageCell.colSpan = 5;
            messageCell.className = 'success-message';
            messageCell.textContent = `Data sent to backend successfully at ${new Date(data.timestamp).toLocaleTimeString()}.`;
            setTimeout(() => messageRow.remove(), 3000);
        } else {
            console.error("Failed to send data:", response.status, response.statusText);
            const errorRow = dataTableBody.insertRow(0);
            const errorCell = errorRow.insertCell();
            errorCell.colSpan = 5;
            errorCell.className = 'error-message';
            errorCell.textContent = `Failed to send data to backend at ${new Date(data.timestamp).toLocaleTimeString()}: ${response.statusText}`;
            setTimeout(() => errorRow.remove(), 5000);
        }
    } catch (error) {
        console.error("Error sending data to backend:", error);
        const errorRow = dataTableBody.insertRow(0);
        const errorCell = errorRow.insertCell();
        errorCell.colSpan = 5;
        errorCell.className = 'error-message';
        errorCell.textContent = `Network error sending data at ${new Date(data.timestamp).toLocaleTimeString()}: ${error.message}`;
        setTimeout(() => errorRow.remove(), 5000);
    }
}

// Event listener for the Start button
startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    stopButton.disabled = false;
    intervalSelect.disabled = true;

    if (noDataRow && dataTableBody.contains(noDataRow)) {
        noDataRow.remove();
    }

    const selectedInterval = parseInt(intervalSelect.value) * 1000;

    const collectAndSendData = async () => {
        const data = await collectSensorData();
        displayData(data);
        if (sensorInterval !== null) {
            sendDataToBackend(data);
        }
    };

    await collectAndSendData();

    sensorInterval = setInterval(collectAndSendData, selectedInterval);
});

// Event listener for the Stop button
stopButton.addEventListener('click', () => {
    startButton.disabled = false;
    stopButton.disabled = true;
    intervalSelect.disabled = false;
    clearInterval(sensorInterval);
    sensorInterval = null;

    const stopMessageRow = dataTableBody.insertRow(0);
    const stopMessageCell = stopMessageRow.insertCell();
    stopMessageCell.colSpan = 5;
    stopMessageCell.style.textAlign = 'center';
    stopMessageCell.style.fontStyle = 'italic';
    stopMessageCell.style.color = '#777';
    stopMessageCell.textContent = `Data collection stopped at ${new Date().toLocaleTimeString()}.`;
});

// Initial display of the unique browser ID when the page loads
browserIdDisplay.textContent = BROWSER_INSTANCE_ID;
