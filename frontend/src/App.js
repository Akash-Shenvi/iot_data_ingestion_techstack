import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const SensorReader = () => {
  const [uniqueID] = useState(() => {
    // Persist uniqueID across sessions
    const storedID = localStorage.getItem("browser-uuid");
    if (storedID) return storedID;
    const newID = uuidv4();
    localStorage.setItem("browser-uuid", newID);
    return newID;
  });

  const [backendURL, setBackendURL] = useState("");
  const [intervalMs, setIntervalMs] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [sensorData, setSensorData] = useState({});
  const intervalRef = useRef(null);

  const readSensorData = () => {
    // You can extend this using more browser APIs
    return {
      alpha: sensorData.alpha || null,
      beta: sensorData.beta || null,
      gamma: sensorData.gamma || null,
    };
  };

  const sendDataToBackend = () => {
    const payload = {
      uniqueID,
      t0: new Date().toISOString(),
      sensorData: readSensorData(),
    };

    axios
      .post(backendURL, payload)
      .then(() => console.log("Data sent:", payload))
      .catch((err) => console.error("Send failed:", err.message));
  };

  const start = () => {
    if (!backendURL) return alert("Please enter the backend URL");
    window.addEventListener("deviceorientation", handleOrientation);
    intervalRef.current = setInterval(sendDataToBackend, intervalMs);
    setIsRunning(true);
  };

  const stop = () => {
    window.removeEventListener("deviceorientation", handleOrientation);
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const handleOrientation = (event) => {
    setSensorData({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <div className="container">
      <h2>🛰️ Browser Sensor Data Logger</h2>

      <p><strong>Unique Browser ID:</strong><br /><code>{uniqueID}</code></p>

      <label>
        Backend API URL:
        <input
          type="text"
          placeholder="https://your-backend-url/api/sensor"
          value={backendURL}
          onChange={(e) => setBackendURL(e.target.value)}
        />
      </label>

      <label>
        Sensor Read Interval (ms):
        <input
          type="number"
          value={intervalMs}
          onChange={(e) => setIntervalMs(Number(e.target.value))}
        />
      </label>

      <div className="button-group">
        <button
          onClick={start}
          className="start"
          disabled={isRunning}
        >
          Start Logging
        </button>
        <button
          onClick={stop}
          className="stop"
          disabled={!isRunning}
        >
          Stop Logging
        </button>
      </div>
    </div>
  );
};

export default SensorReader;
