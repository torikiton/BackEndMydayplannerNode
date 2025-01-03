import express from "express";
import { conn,queryAsync } from "../dbconnect";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import { Convert } from "../model/usermodel";  // เพิ่มการ import class Convert
import { db } from './../firebase';
import { addDoc, collection, doc, getDoc, getDocs, setDoc,   } from 'firebase/firestore'; // ฟังก์ชันที่จำเป็นจาก Firestore SDK
import { promisify } from "util";

export const router = express.Router();

router.post('/api/get_user', (req, res) => {
    const { email } = req.body;  // รับ email จาก body ของ request

    // ตรวจสอบว่าได้ส่ง email มาใน request หรือไม่
    if (!email) {
        res.status(400).json({ success: false, message: 'Email is required.' });
        return;
    }

    // Query ข้อมูลจากฐานข้อมูลโดยใช้ email
    conn.query('SELECT * FROM user WHERE email = ?', [email], (err, result, fields) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Database query failed.' });
            return;
        }

        // ตรวจสอบว่าพบข้อมูลหรือไม่
        if (result.length === 0) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }

        // แปลงข้อมูล JSON ที่ได้จากฐานข้อมูลให้เป็น Usermodel
        try {
            const usermodel = Convert.toUsermodel(JSON.stringify(result));  // แปลงเป็น array ของ Usermodel
            res.status(200).json(usermodel[0]);  // ส่งข้อมูลกลับไปยัง client
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error parsing user data.' });
        }
    });
});



