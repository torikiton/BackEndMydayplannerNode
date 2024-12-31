import express from "express";
import { conn,queryAsync } from "../dbconnect";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import { Convert } from "../model/usermodel";  // เพิ่มการ import class Convert

export const router = express.Router();


router.post('/signin-user', (req, res) => {
    const { email, password } = req.body;

    // ตรวจสอบว่า email และ password ถูกส่งมาหรือไม่
    if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
    }

    // Query ข้อมูลจากฐานข้อมูล
    const query = 'SELECT * FROM user WHERE email = ?';
    conn.query(query, [email], async (err, result) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Database query failed.' });
            return;
        }

        // ตรวจสอบว่าพบผู้ใช้หรือไม่
        if (result.length === 0) {
            res.status(404).json({ success: false, message: 'Email not found.' });
            return;
        }

        const user = result[0];

        // ตรวจสอบสถานะผู้ใช้ (is_active และ is_verify)
        if (!user.is_active) {
            res.status(403).json({ success: false, message: 'Your account is inactive. Please contact support.' });
            return;
        }

        if (!user.is_verify) {
            res.status(403).json({ success: false, message: 'Your email has not been verified. Please verify your email.' });
            return;
        }

        // ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
        const passwordMatch = await bcrypt.compare(password, user.hashed_password); // เปลี่ยนจาก `user.password` เป็น `user.password_hash`
        if (passwordMatch) {
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                role: user.role, // ส่ง role กลับไป
            });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect password.' });
        }
    });
});



router.post('/get_user', (req, res) => {
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



