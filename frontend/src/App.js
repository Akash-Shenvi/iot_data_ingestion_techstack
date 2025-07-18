import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const SensorReader = () => {
  const [uniqueID] = useState(uuidv4());
  const [intervalTime, setIntervalTime] = useState(1000); // default 1 sec
  const [backendURL, setBackendURL] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const [sensorData, setSensorData] = useState({});

  // Read browser sensor data (example: Device Orientation)
  const handleOrientation = (event) => {
    setSensorData({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  };

  const sendSensorData = () => {
    const timestamp = new Date().toISOString();
    const data = {
      uniqueID,
      timestamp,
      sensorData,
    };
    if (backendURL) {
      axios
        .post(backendURL, data)
        .then(() => console.log("Sent:", data))
        .catch((err) => console.error("Error:", err));
    }
  };

  const startReading = () => {
    if (!backendURL) return alert("Set backend URL!");
    window.addEventListener("deviceorientation", handleOrientation);
    intervalRef.current = setInterval(sendSensorData, intervalTime);
    setIsRunning(true);
  };

  const stopReading = () => {
    clearInterval(intervalRef.current);
    window.removeEventListener("deviceorientation", handleOrientation);
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      stopReading();
    };
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-semibold">Browser Sensor Reader</h2>
      <p>Unique ID: <code className="text-sm">{uniqueID}</code></p>

      <label className="block">
        Backend URL:
        <input
          type="text"
          value={backendURL}
          onChange={(e) => setBackendURL(e.target.value)}
          className="mt-1 block w-full p-2 border rounded"
        />
      </label>

      <label className="block">
        Read Interval (ms):
        <input
          type="number"
          value={intervalTime}
          onChange={(e) => setIntervalTime(Number(e.target.value))}
          className="mt-1 block w-full p-2 border rounded"
        />
      </label>

      <div className="flex space-x-4">
        {!isRunning ? (
          <button
            onClick={startReading}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Start
          </button>
        ) : (
          <button
            onClick={stopReading}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
};

export default SensorReader;
