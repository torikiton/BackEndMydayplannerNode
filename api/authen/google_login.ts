import express from "express";
import admin from "firebase-admin";
import dotenv from 'dotenv';
import axios from 'axios';
import { db } from './../../firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, } from 'firebase/firestore';

export const router = express.Router();


router.post('/verify-token', async (req, res) => {
  const { tokenID } = req.body;

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenID}`);

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const user = await response.json();

    res.status(200).json(user);
  } catch (error) {

    res.status(400).json({ error: 'Invalid token' });
  }
});

router.post('/api/login_google', async (req, res) => {
  const { tokenID } = req.body;

  try {
    const responseToken = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenID}`);

    if (!responseToken.ok) {
      throw new Error('Invalid token');
    }
    const dataToken = await responseToken.json();
    // console.log(dataToken);
    

    if (!responseToken.ok) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return
    }

    const response = await fetch('https://node-myday-planner.onrender.com/user/api/get_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: dataToken.email })
    });
    const data = await response.json();

    if (response.status === 404) {
      const bodygoogle = {
        name: dataToken.name,
        email: dataToken.email,
        profile: dataToken.picture,
      };

      const createAccountResponse = await fetch('https://node-myday-planner.onrender.com/user/api/create_acc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodygoogle),
      });

      if (!createAccountResponse.ok) {
        const createErrorText = await createAccountResponse.text();
        console.error('Error creating account:', createErrorText);
        res.status(500).json({ success: false, message: 'Account creation failed' });
        return;
      }

      const createData = await createAccountResponse.json();
      // console.log(createData.user_id);
      
      //ดึงข้อมูลของcreateDataไปgetเอาuserแล้วมาใส่ข้างล่าง
      const docRef = doc(db, 'usersLogin', dataToken.name);
      await setDoc(docRef, {
        name: dataToken.name,
        email: dataToken.email,
        active: 1,//แก้
        verify: 0,//แก้
        login: 1,
        role: 'user',//แก้
      }, { merge: true });

      res.status(200).json({
        success: true,
        message: 'Account created successfully',
        role: 'user',
      });
    } else if (data) {
      if (!data.name) {
        res.status(400).json({ success: false, message: 'User data is invalid' });
        return;
      }

      const docRef = doc(db, 'usersLogin', data.name);
      await setDoc(docRef, {
        name: data.name,
        email: data.email,
        active: data.is_active,
        verify: data.is_verify,
        login: 1,
        role: data.role,
      }, { merge: true });

      res.status(200).json({
        success: true,
        message: 'Data is available in the database, Login successful',
        role: data.role,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: 'Invalid data' });
  }
});