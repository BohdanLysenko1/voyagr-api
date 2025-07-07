import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 4000;
const WEB_ORIGIN = process.env['WEB_ORIGIN'] || 'http://localhost:3000';

app.use(cors({
  origin: WEB_ORIGIN,
  credentials: true,
}));

app.use(express.json());

app.get('/deals', (_req, res) => {
  res.json({
    deals: [
      {
        id: 1,
        title: 'Sample Deal 1',
        description: 'This is a placeholder deal',
        price: 299.99,
        destination: 'Paris',
      },
      {
        id: 2,
        title: 'Sample Deal 2',
        description: 'Another placeholder deal',
        price: 499.99,
        destination: 'Tokyo',
      },
    ],
  });
});

app.post('/ai/plan', (req, res) => {
  res.json({
    message: 'AI planning endpoint - echoing request',
    receivedData: req.body,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origin: ${WEB_ORIGIN}`);
});