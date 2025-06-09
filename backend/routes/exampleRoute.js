// backend/routes/exampleRoute.js
import express from 'express';
import { addNumbers } from '../controllers/exampleController.js';

const router = express.Router();

router.get('/add', addNumbers);

export default router;