const express = require('express');
const cors = require('cors');
const path = require('path');
const { BigQuery } = require('@google-cloud/bigquery');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Render EJS frontend
// app.get('/', (req, res) => {
//   res.render('index');
// });


app.get('/',(req,res)=>{
  res.send("Server Is Running")
});

// Receive sensor data
app.post('/api/sensor-data', (req, res) => {
  console.log("--------------------------");
  console.log('Received data:', req.body);
  console.log(`T0 Time Stamp = ${new Date(req.body.timestamp).toISOString()}`);
  console.log(`T1 Timestamp = ${new Date().toISOString()}`);
  const t2 = new Date().getTime() - new Date(req.body.timestamp);
  console.log(`T2 = Total time taken to receive (T1 - T0) = ${t2} ms`);
  console.log("--------------------------");
  console.log('Data processing complete.');
  console.log(`browserid: ${req.body.browserInstanceId}, type: ${typeof req.body.browserInstanceId}`);
  console.log(`geolocation-latitude: ${req.body.geolocation.latitude}, type: ${typeof req.body.geolocation.latitude}`);
  console.log(`geolocation-longitude: ${req.body.geolocation.longitude}, type: ${typeof req.body.geolocation.longitude}`);
  console.log(`geolocation-accuracy: ${req.body.geolocation.accuracy}, type: ${typeof req.body.geolocation.accuracy}`);
  console.log(`ambient-light: ${req.body.ambientLight.illuminance}, type: ${typeof req.body.ambientLight.illuminance}`);
  res.status(200).json({ status: 'success', receivedAt: new Date().toISOString() });
});

// Initialize BigQuery client using Cloud Run's default credentials
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

// Insert into BigQuery
app.post('/insert', async (req, res) => {
  try {
    const {
      unique_id,
      frontend_timestamp,
      backend_timestamp,
      sensor_record,
      log_entry
    } = req.body;

    // It's a good practice to define these in a configuration file or as environment variables.
    const datasetId = 'Sensor_Data';
    const tableId = 'Sensor_Data_Table';

    // The structure of this object must match your BigQuery table schema.
    // If 'sensor_record' and 'log_entry' columns in BigQuery are of type
    // STRING or JSON, you must stringify the JavaScript objects.
    // If they are of type RECORD (STRUCT), you should pass the objects directly.
  const rows = [
      {
        unique_id,
        frontend_timestamp,
        backend_timestamp,
        sensor_record: typeof sensor_record === 'object'
          ? JSON.stringify(sensor_record)
          : sensor_record,
        log_entry
      }
    ];

    await bigquery.dataset(datasetId).table(tableId).insert(rows);

    res.status(200).send('Row inserted successfully');
  } catch (error) {
    console.error('Failed to insert data into BigQuery:', error);
    // The `error` object from the BigQuery client may contain more details.
    if (error.response) {
      console.error('BigQuery API response error:', JSON.stringify(error.response.data, null, 2));
    }
    // It's better to send a generic error message to the client
    // to avoid leaking implementation details.
    res.status(500).send('An error occurred while processing your request.',JSON.stringify(error.response.data, null, 2));
  }
});



app.post('/insert-table2',async(req,res)=>{
try{
  const{
    unique_id,
    frontend_time_stamp,
    backend_time_stamp,
    heart_rate_sensor,
    battery_level,
    humidity,
    pressure,
    temperature,
    log_entry,
  }=req.body;
    const datasetId = 'Sensor_Data';
    const tableId = 'Sensor_Data_Table_schema_2';
  const rows=[
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
    }
  ];
   await bigquery.dataset(datasetId).table(tableId).insert(rows);
   res.status(200).send('Row inserted successfully');
}catch (error) {
    console.error('Failed to insert data into BigQuery:', error);
    // The `error` object from the BigQuery client may contain more details.
    if (error.response) {
      console.error('BigQuery API response error:', JSON.stringify(error.response.data, null, 2));
    }
    // It's better to send a generic error message to the client
    // to avoid leaking implementation details.
    res.status(500).send('An error occurred while processing your request.');
  }
});

app.post('/insert-batch', async (req, res) => {
  try {
    // The request body is now expected to be an array of records.
    const records = req.body;

    // Validate that the body is a non-empty array
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).send({ error: 'Request body must be a non-empty array of records.' });
    }

    const datasetId = 'Sensor_Data';
    const tableId = 'Sensor_Data_Table';

    // Map the array of incoming records to the format BigQuery expects.
    // This is more efficient than creating a new array and pushing to it.
    const rows = records.map(record => {
      // Basic validation for each record in the batch
      if (!record.unique_id || !record.frontend_time_stamp || !record.sensor_record) {
        // In a real app, you might want more robust error handling,
        // like collecting all invalid records and reporting them back.
        throw new Error('One or more records in the batch are missing required fields.');
      }

      return {
        unique_id: record.unique_id,
        frontend_timestamp: record.frontend_time_stamp,
        backend_timestamp: record.backend_time_stamp,
        sensor_record: record.sensor_record,
        log_entry: typeof record.log_entry === 'object' && record.log_entry !== null
          ? JSON.stringify(record.log_entry)
          : record.log_entry,
      };
    });

    // Insert all rows in a single API call
    await bigquery.dataset(datasetId).table(tableId).insert(rows);

    res.status(200).send({ message: `${rows.length} rows inserted successfully into Table 1` });

  } catch (error) {
    console.error('Failed to insert batch data into BigQuery (Table 1):');
    if (error && error.errors) {
      console.error('BigQuery Insert Errors:', JSON.stringify(error.errors, null, 2));
    } else {
      console.error('Full Error Object:', error);
    }
    // Send back a more informative error message
    res.status(500).send({
      error: 'An error occurred while processing your batch request for Table 1.',
      details: error.message
    });
  }
});


// Use PORT provided by Cloud Run
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
