const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Required for allowing frontend to access backend
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure views directory is correctly set
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); // Enable CORS for frontend requests
app.use(bodyParser.json());

// Render EJS frontend
app.get('/', (req, res) => {
  res.render('index');
});

// Receive sensor data
app.post('/api/sensor-data', (req, res) => {
  console.log("--------------------------");
  console.log('Received data:', req.body);
  console.log(`T0 Time Stamp = ${new Date(req.body.timestamp).toISOString()}`);
  console.log(`T1 Timestamp = ${new Date().toISOString()}`);
  const t2 = new Date() - new Date(req.body.timestamp);
  console.log(`T2 = Total time taken to receive (T1 - T0) = ${t2} ms`);
  console.log("--------------------------");

  res.status(200).json({ status: 'success', receivedAt: new Date().toISOString() });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
