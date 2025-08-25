const express = require('express');
const cors = require('cors');
const { BigQuery } = require('@google-cloud/bigquery');

const app = express();

// =================================================================
// Middleware & Config
// =================================================================
app.use(cors());
app.use(express.json());

// =================================================================
// Health check
// =================================================================
app.get('/', (req, res) => {
  res.send("Server is running");
});

// =================================================================
// Initialize BigQuery client
// =================================================================
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

// =================================================================
// Insert into Sensor_Data_Table
// =================================================================
app.post('/insert', async (req, res) => {
  try {
    const {
      unique_id,
      frontend_timestamp,
      sensor_record,
      log_entry,
    } = req.body;

    const datasetId = 'Sensor_Data';
    const tableId = 'Sensor_Data_Table';
    const backend_timestamp = new Date();
    const rows = [
      {
        unique_id,
        frontend_timestamp,
        backend_timestamp,
        sensor_record: typeof sensor_record === 'object'
          ? JSON.stringify(sensor_record)
          : sensor_record,
        log_entry,
      },
    ];

    await bigquery.dataset(datasetId).table(tableId).insert(rows);
    res.status(200).send('Row inserted successfully');
  } catch (error) {
    console.error('Failed to insert data into BigQuery:', error);
    if (error.response) {
      console.error('BigQuery API response error:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).send('An error occurred while processing your request.');
  }
});

// =================================================================
// Insert into Sensor_Data_Table_schema_2
// =================================================================
app.post('/insert-table2', async (req, res) => {
  try {
    const {
      unique_id,
      frontend_time_stamp,
      heart_rate_sensor,
      battery_level,
      humidity,
      pressure,
      temperature,
      log_entry,
    } = req.body;

    const datasetId = 'Sensor_Data';
    const tableId = 'Sensor_Data_Table_schema_2';
    const backend_time_stamp = new Date();

    const rows = [
      {
        unique_id,
        frontend_time_stamp,
        backend_time_stamp,
        heart_rate_sensor,
        battery_level,
        humidity,
        pressure,
        temperature,
        log_entry,
      },
    ];

    await bigquery.dataset(datasetId).table(tableId).insert(rows);
    res.status(200).send('Row inserted successfully');
  } catch (error) {
    console.error('Failed to insert data into BigQuery:', error);
    if (error.response) {
      console.error('BigQuery API response error:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).send('An error occurred while processing your request.');
  }
});

// =================================================================
// Start server
// =================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
