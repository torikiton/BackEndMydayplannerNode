import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import { Convert, Usermodel } from "../../model/usermodel";
import { db } from './../../firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, } from 'firebase/firestore';

export const router = express.Router();

router.put('/api/edit_profile', async (req, res) => {
    const { email, profileData }: Usermodel = req.body;
    
    try {
        if (!email || !profileData) {
            res.status(400).json({ message: 'Missing profile data or email.' });
            return 
        }

        const response = await fetch('https://node-myday-planner.onrender.com/user/api/get_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            res.status(500).json({ message: 'Failed to fetch user data from external API.' });
            return
        }

        const userData: Usermodel = await response.json();
        if (!userData) {
            res.status(404).json({ message: 'User not found.' });
            return 
        }

        if (profileData?.hashed_password) {
            const hashedPassword = await bcrypt.hash(profileData.hashed_password, 10);
            // เพิ่ม hashedPassword เข้าไปใน updatedData
            profileData.hashed_password = hashedPassword;
        }

        const updatedData = { ...userData,  ...profileData };
        const createAt = new Date(updatedData.create_at).toISOString().slice(0, 19).replace('T', ' ');

        let sql = `
            UPDATE \`user\`
            SET
              \`name\` = ?, \`hashed_password\` = ?, \`profile\` = ?, 
              \`role\` = ?, \`is_active\` = ?, \`is_verify\` = ?, \`create_at\` = ?
            WHERE \`email\` = ?;
        `;

        sql = mysql.format(sql, [
            updatedData.name,
            updatedData.hashed_password,
            updatedData.profile,
            updatedData.role,
            updatedData.is_active,
            updatedData.is_verify,
            createAt,
            email, // ใช้ email ในการค้นหาผู้ใช้
        ]);

        conn.query(sql, async (err, result) => {
            if (err) {
                res.status(500).json({ message: 'Failed to update user in the database.' });
                return 
            }
            return res.status(200).json({ message: 'Profile updated successfully.' });
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'An unexpected error occurred.' });
        return 
    }
});

