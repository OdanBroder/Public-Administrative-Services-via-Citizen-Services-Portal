import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new Error();
      }

      req.user = decoded;
      req.token = token;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export default auth; 