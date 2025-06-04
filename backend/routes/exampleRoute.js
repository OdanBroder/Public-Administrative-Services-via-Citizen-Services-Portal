// backend/routes/exampleRoute.js
import express from 'express';
import lib from '../ffi/external.js';

const router = express.Router();

router.get('/add', (req, res) => {
  const result = lib.addNumbers(5, 3);
  res.json({ result });
});


export default router;