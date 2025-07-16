async function sendSensorData() {
    let data = {
        battery: null,
        location: null
    };

    // Battery Info
    if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        data.battery = {
            charging: battery.charging,
            level: battery.level
        };
    }

    // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            data.location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            // Send to backend
            fetch('/submit-sensor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(res => {
                document.getElementById('status').innerText = "Data sent: " + JSON.stringify(res.received);
            });
        }, err => {
            alert("Location error: " + err.message);
        });
    } else {
        alert("Geolocation not supported.");
    }
}
