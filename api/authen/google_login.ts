import express from "express";
import admin from "firebase-admin";
import dotenv from 'dotenv';

dotenv.config();

// if (!process.env.SERVICE_ACCOUNT_KEY) {
//   console.error('SERVICE_ACCOUNT_KEY is not set in the environment variables.');
//   process.exit(1);
// }

// const serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT_KEY as string);


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccountKey),
// });

export const router = express.Router();

  router.post('/verify-token', async (req, res) => {
    const { token } = req.body;
  
    try {
      const user = await admin.auth().verifyIdToken(token);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  });