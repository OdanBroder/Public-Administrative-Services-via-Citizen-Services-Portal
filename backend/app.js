// backend/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import exampleRoute from './routes/exampleRoute.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/example', exampleRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});