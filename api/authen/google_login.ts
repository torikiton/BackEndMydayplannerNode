import express from "express";
import admin from "firebase-admin";
import dotenv from 'dotenv';
import axios from 'axios';
import { db } from './../../firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, } from 'firebase/firestore'; // ฟังก์ชันที่จำเป็นจาก Firestore SDK

export const router = express.Router();


router.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

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
  const { email, profile, name } = req.body; // รับข้อมูลจาก req.body

  try {
    // ใช้ fetch แทน axios
    const response = await fetch('https://node-myday-planner.onrender.com/user/api/get_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })  // ส่ง email ใน body ของคำขอ
    });
    const data = await response.json(); // แปลงผลตอบกลับจาก JSON

    if (response.status === 404) {
      // ถ้าผู้ใช้ยังไม่มีในระบบ ให้ส่งข้อมูลไปสร้างบัญชีใหม่
      const bodygoogle = {
        name: name,  // ข้อมูลชื่อจาก request ของ Google
        email: email,
        profile: profile,  // ข้อมูลโปรไฟล์จาก request ของ Google
      };

      // ส่งข้อมูลไปที่ API สำหรับการสร้างบัญชีผู้ใช้ใหม่
      const createAccountResponse = await fetch('https://node-myday-planner.onrender.com/user/api/create_acc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodygoogle), // ส่งข้อมูลผู้ใช้
      });

      if (!createAccountResponse.ok) {
        const createErrorText = await createAccountResponse.text();
        console.error('Error creating account:', createErrorText);
        res.status(500).json({ success: false, message: 'Account creation failed' });
        return;
      }

      const createData = await createAccountResponse.json();

      res.status(200).json({
        success: true,
        message: 'Account created successfully',
        role: 'user',
      });
    } else if (data) {
      if (!data.name) {
        // จัดการกรณีที่ data.name หายไปหรือไม่ถูกต้อง
        res.status(400).json({ success: false, message: 'User data is invalid' });
        return;
      }

      // ถ้ามีข้อมูลผู้ใช้ในระบบแล้ว
      const docRef = doc(db, 'usersLogin', data.name); // ใช้ `user.name` เป็น `document ID`
      await setDoc(docRef, {
        name: data.name,
        email: data.email,
        active: data.is_active,
        login: 1,
        role: data.role,
      }, { merge: true });  // `{ merge: true }` ช่วยให้ข้อมูลเดิมไม่ถูกลบ

      res.status(200).json({
        success: true,
        message: 'Data is available in the database, Login successful',
        role: data.role, // ส่ง role กลับไป
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: 'Invalid data' });
  }
});