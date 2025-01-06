import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import { Convert } from "../../model/usermodel";  // เพิ่มการ import class Convert
import { db } from './../../firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, } from 'firebase/firestore'; // ฟังก์ชันที่จำเป็นจาก Firestore SDK




export const router = express.Router();

// router.post('/api/login_google', async (req, res) => {
//     const { tokenID } = req.body;

//     if (!tokenID) {
//         res.status(400).json({ error: 'tokenID is required.' });
//         return
//     }

//     try {
//         // ตรวจสอบ tokenID โดยใช้ Firebase Admin SDK

//         const decodedToken = await admin.auth().verifyIdToken(tokenID);
//         if (decodedToken.aud !== 'mydayplanner-e2f6b') {
//             throw new Error('Invalid audience');
//         }
//         // ถ้า token ถูกต้อง จะได้รับข้อมูลจาก decodedToken
//         const userId = decodedToken.uid;
//         res.status(200).json({ message: 'Token is valid', userId });
//     } catch (error) {
//         console.error("Error verifying token:", error);
//         res.status(401).json({ error: 'Invalid or expired tokenID' });
//     }
// });


router.post('/api/login', (req, res) => {
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
        const collectionRef = collection(db, 'usersLogin');
        // ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
        const passwordMatch = await bcrypt.compare(password, user.hashed_password); // เปลี่ยนจาก `user.password` เป็น `user.password_hash`
        if (passwordMatch) {
            const docRef = doc(collectionRef, user.name); // ใช้ `user.name` เป็น `document ID`
            await setDoc(docRef, {
                name: user.name,
                email: user.email,
                active: user.is_active,
                verify: user.is_verify,
                login: 1,
                role: user.role,
            }, { merge: true });  // `{ merge: true }` ช่วยให้ข้อมูลเดิมไม่ถูกลบ

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


router.post('/api/logout', (req, res) => {
    const { email } = req.body;

    // ตรวจสอบว่า email ถูกส่งมาหรือไม่
    if (!email) {
        res.status(400).json({ success: false, message: 'Email is required.' });
        return;
    }

    // Query ข้อมูลจากฐานข้อมูล
    const query = 'SELECT name FROM user WHERE email = ?';
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

        try {
            // const collectionRef = collection(db, 'usersLogin');
            const docRef = doc(db, 'usersLogin', result[0].name); // ใช้ `user.name` เป็น `document ID`

            // ลบ document ที่ระบุ
            await deleteDoc(docRef);

            // ส่งการตอบกลับเมื่อการลบสำเร็จ
            res.status(200).json({ success: true, message: 'User logged out successfully.' });
        } catch (err) {
            // หากเกิดข้อผิดพลาดในการลบจาก Firestore
            res.status(500).json({ success: false, message: 'Failed to log out user in Firestore.' });
        }
    });
});
