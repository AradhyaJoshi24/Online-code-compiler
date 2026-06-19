const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const accountServiceUrl = process.env.ACCOUNT_SERVICE_URL || 'http://localhost:3001';
const transactionServiceUrl = process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ service: 'gateway-service', status: 'ok' });
});

app.get('/accounts', async (req, res) => {
  const response = await axios.get(`${accountServiceUrl}/accounts`);
  res.json(response.data);
});

app.get('/accounts/:id', async (req, res) => {
  const response = await axios.get(`${accountServiceUrl}/accounts/${req.params.id}`);
  res.json(response.data);
});

app.post('/accounts', async (req, res) => {
  const response = await axios.post(`${accountServiceUrl}/accounts`, req.body);
  res.status(response.status).json(response.data);
});

app.post('/transactions/transfer', async (req, res) => {
  const response = await axios.post(`${transactionServiceUrl}/transactions/transfer`, req.body);
  res.status(response.status).json(response.data);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found. Use /accounts or /transactions/transfer.' });
});

app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
  console.log(`Open http://localhost:${port} to use the banking demo UI.`);
});
