const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());

// Render EJS frontend
app.get('/', (req, res) => {
  res.render('index');
});

// Receive sensor data
app.post('/api/sensor-data', (req, res) => {
    console.log("--------------------------")
  console.log('Received data:', req.body);
  console.log(`T0 Time Stamp is = ${new Date(req.body.timestamp).toISOString()}`)
  console.log(`T1 Timestamp=${new Date().toISOString()}`);
  console.log("T2=Total time taken to recieve i.e T2=T1-T0")
  t2= new Date() - new Date(req.body.timestamp);
  console.log(`${t2} in ms`);
  console.log("--------------------------")

  res.status(200).send({ status: 'success' });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
