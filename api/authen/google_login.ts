import express from "express";
import admin from "firebase-admin";
import dotenv from 'dotenv';
import axios from 'axios';
import { db } from './../../firebase';
import { doc, setDoc, } from 'firebase/firestore';

export const router = express.Router();


router.post('/api/login_google', async (req, res) => {
  const { email, name, profile } = req.body;

  try {
    // Fetch user data from the server
    const response = await fetch('https://backendmydayplannernode.onrender.com/user/api/get_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();

      // User exists in the database
      if (data && data.email) {
        const docRef = doc(db, 'usersLogin', data.email);
        await setDoc(
          docRef,
          {
            email: data.email,
            active: data.is_active,
            verify: data.is_verify,
            login: 1,
            role: data.role,
          },
          { merge: true }
        );

        res.status(200).json({
          success: true,
          message: 'Login successful, data retrieved from database.',
          role: data.role,
        });
        return
      } else {
        res.status(400).json({
          success: false,
          message: 'User data is invalid.',
        });
        return
      }
    } else if (response.status === 404) {
      const newUser = { name, email, profile };
      const createAccountResponse = await fetch(
        'https://backendmydayplannernode.onrender.com/user/api/create_acc',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUser),
        }
      );

      if (!createAccountResponse.ok) {
        const createErrorText = await createAccountResponse.text();
        console.error('Error creating account:', createErrorText);
        res.status(500).json({
          success: false,
          message: 'Account creation failed.',
        });
        return
      }

      const docRef = doc(db, 'usersLogin', email);
      await setDoc(
        docRef,
        {
          email,
          active: "1",
          verify: 0,
          login: 0,
          role: 'user',
        },
        { merge: true }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        role: 'user',
      });
      return
    } else {
      // Handle other unexpected response statuses
      const errorText = await response.text();
      console.error('Unexpected response:', errorText);
      res.status(response.status).json({
        success: false,
        message: 'Unexpected response from server.',
      });
      return
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
    });
    return
  }
});
