const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());

// Serve form
app.get('/', (req, res) => {
    res.render('index');
});

// Receive sensor data
app.post('/submit-sensor', (req, res) => {
    console.log('Sensor data received:', req.body);
    res.json({ status: 'OK', received: req.body });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
