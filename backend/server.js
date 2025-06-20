const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Sample API routes
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.post('/api/data', (req, res) => {
  const { data } = req.body;
  res.json({ received: data, status: 'Data received successfully!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});