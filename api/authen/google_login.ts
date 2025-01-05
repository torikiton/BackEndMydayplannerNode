import express from "express";
import admin from "firebase-admin";
import dotenv from 'dotenv';

export const router = express.Router();


router.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  try {
    // Fetch the token info from Google's OAuth2 endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    // Check if the response was successful
    if (!response.ok) {
      throw new Error('Invalid token');
    }

    // Parse the response to get user info
    const user = await response.json();
    
    // Send back the user info as the response
    res.status(200).json(user);
  } catch (error) {
    // Handle any errors that occurred during the fetch or processing
    res.status(400).json({ error: 'Invalid token' });
  }
});