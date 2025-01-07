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

        //กรณีมีการส่งค่าpasswordเข้ามาที่req
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

            try {
                const oldDocRef = doc(db, 'usersLogin', userData.name);
                const newDocRef = doc(db, 'usersLogin', updatedData.name);

                if (userData.name !== updatedData.name) {
                    const docSnapshot = await getDoc(oldDocRef);
                    if (docSnapshot.exists()) {
                        const oldData = docSnapshot.data();

                        await setDoc(newDocRef, oldData); // สร้างเอกสารใหม่ที่มีชื่อใหม่

                        await deleteDoc(oldDocRef); // ลบเอกสารเก่า

                        res.status(200).json({ message: 'Document name changed successfully.' });
                    } else {
                        res.status(404).json({ message: 'User document not found in Firestore.' });
                    }
                } else {
                    
                    const docSnapshot = await getDoc(oldDocRef);

                    if (docSnapshot.exists()) {
                        const oldData = docSnapshot.data();
                    
                        // อัปเดตข้อมูลใน Firestore
                        await updateDoc(oldDocRef, {
                            name: updatedData.name ?? oldData.name,
                            profileData: updatedData.profile ?? oldData.profile,
                        });
                    
                        res.status(200).json({ message: 'User account has been updated successfully.' });
                    } else {
                        res.status(404).json({ message: 'User document not found in Firestore.' });
                    }
                }
            } catch (firestoreError) {
                return res.status(500).json({ message: 'Failed to update user status in Firestore.' });
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});

