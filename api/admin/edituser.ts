import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import { Convert, Usermodel } from "../../model/usermodel";
import { db } from './../../firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, } from 'firebase/firestore';

export const router = express.Router();

router.put('/api/edit_active', async (req, res) => {
    const { email }: Usermodel = req.body;
    if (!email) {
        res.status(400).json({ message: 'Email is required.' });
        return
    }

    try {
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

        const userData: Usermodel | undefined = await response.json();
        if (!userData) {
            res.status(404).json({ message: 'User not found.' });
            return
        }
        if (userData.is_active == "1") {
            // Update user data locally
        const updatedData: Usermodel = { ...userData, is_active: "0" };
        const createAt = new Date(updatedData.create_at).toISOString().slice(0, 19).replace('T', ' ');

        let sql = `
            UPDATE \`user\`
            SET
              \`name\` = ?, \`email\` = ?, \`hashed_password\` = ?, \`profile\` = ?, 
              \`role\` = ?, \`is_active\` = ?, \`is_verify\` = ?, \`create_at\` = ?
            WHERE \`email\` = ?;
        `;

        sql = mysql.format(sql, [
            updatedData.name,
            updatedData.email,
            updatedData.hashed_password,
            updatedData.profile,
            updatedData.role,
            updatedData.is_active,
            updatedData.is_verify,
            createAt,
            email,
        ]);

        conn.query(sql, async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to update user in the database.' });
            }

            try {
                // Reference to Firestore document
                const docRef = doc(db, 'usersLogin', updatedData.email);
                const docSnapshot = await getDoc(docRef);
            
                if (docSnapshot.exists()) {
                    // Update the document if it exists
                    await updateDoc(docRef, { active: updatedData.is_active });
                    res.status(200).json({ message: 'User account has been disable successfully.' });
                } else {
                    res.status(200).json({ message: 'User not login and User account has been disable successfully.' });
                    return;
                }
            } catch (firestoreError) {
                console.error("Firestore error:", firestoreError);
                res.status(500).json({ message: 'Failed to update or create user document in Firestore.' });
            }
        });
        }else{
            // Update user data locally
        const updatedData: Usermodel = { ...userData, is_active: "1" };
        const createAt = new Date(updatedData.create_at).toISOString().slice(0, 19).replace('T', ' ');

        let sql = `
            UPDATE \`user\`
            SET
              \`name\` = ?, \`email\` = ?, \`hashed_password\` = ?, \`profile\` = ?, 
              \`role\` = ?, \`is_active\` = ?, \`is_verify\` = ?, \`create_at\` = ?
            WHERE \`email\` = ?;
        `;

        sql = mysql.format(sql, [
            updatedData.name,
            updatedData.email,
            updatedData.hashed_password,
            updatedData.profile,
            updatedData.role,
            updatedData.is_active,
            updatedData.is_verify,
            createAt,
            email,
        ]);

        conn.query(sql, async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to update user in the database.' });
            }

            try {
                // Reference to Firestore document
                const docRef = doc(db, 'usersLogin', updatedData.email);
                const docSnapshot = await getDoc(docRef);
            
                if (docSnapshot.exists()) {
                    // Update the document if it exists
                    await updateDoc(docRef, { active: updatedData.is_active });
                    res.status(200).json({ message: 'User account has been disable successfully.' });
                } else {
                    res.status(200).json({ message: 'User not login and User account has been disable successfully.' });
                    return;
                }
            } catch (firestoreError) {
                console.error("Firestore error:", firestoreError);
                res.status(500).json({ message: 'Failed to update or create user document in Firestore.' });
            }
        });
        }

        
    } catch (error) {
        res.status(500).json({ message: 'An unexpected error' });
        return
    }
});

router.post('/api/create_acc', async (req, res) => {
    const accData: Usermodel = req.body;

    try {
        const createdAt = new Date();

        let sql, params;
        const hashedPassword = await bcrypt.hash(accData.hashed_password, 10);
        sql = `
                INSERT INTO user (name, email, hashed_password, profile, role, is_active, is_verify, create_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
        params = [
            accData.name = "admin",
            accData.email,
            hashedPassword,
            accData.profile || "none-url",
            accData.role = "admin",
            accData.is_active = "1",
            accData.is_verify = 0,
            createdAt,
        ];

        sql = mysql.format(sql, params);
        conn.query(sql, (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ message: 'Unable to save data.' });
            }

            return res.status(201).json({
                message: 'User account created successfully.',
                user_id: result.insertId,
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.put('/api/is_verify', async (req, res) => {
  const { email } = req.body;
  let userData: Usermodel | undefined;

  const response = await fetch('https://node-myday-planner.onrender.com/user/api/get_user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email })
  });

  const dataResponse = await response.json();
  userData = dataResponse as Usermodel;

  if (!userData) {
    res.status(404).json({ message: 'User not found' });
    return
  }


  const data: Usermodel = { ...userData, is_verify: 1 };
  const createAt = new Date(data.create_at).toISOString().slice(0, 19).replace('T', ' ');

  let sql = `
    UPDATE \`user\`
    SET
      \`name\` = ?, \`email\` = ?, \`hashed_password\` = ?, \`profile\` = ?, 
      \`role\` = ?, \`is_active\` = ?, \`is_verify\` = ?, \`create_at\` = ?
    WHERE \`email\` = ?;
  `;

  sql = mysql.format(sql, [
    data.name,
    data.email,
    data.hashed_password,
    data.profile,
    data.role,
    data.is_active,
    data.is_verify,
    createAt,
    email,
  ]);

  conn.query(sql, async (err, result) => {
    if (err) {
      console.error('MySQL error:', err);
  
      if (!result[0] || !result[0].name) {
        console.error('Invalid document ID');
        return res.status(500).json({ message: 'Invalid document ID' });
      }
  
      return res.status(500).json({ message: 'Database update failed' });
    }
    res.status(200).json({ message: 'Database update successful' });
  });
});
