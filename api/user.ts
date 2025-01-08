import express from "express";
import { conn,queryAsync } from "../dbconnect";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import { Convert, Usermodel } from "../model/usermodel";  // เพิ่มการ import class Convert
import { db } from './../firebase';
import { addDoc, collection, doc, getDoc, getDocs, setDoc,   } from 'firebase/firestore'; // ฟังก์ชันที่จำเป็นจาก Firestore SDK
import { promisify } from "util";

export const router = express.Router();

router.post('/api/get_user', (req, res) => {
    const { email } = req.body;

    // Validate the input
    if (!email) {
        res.status(400).json({ success: false, message: 'Email is required.' });
        return 
    }

    // Query the database to get user details
    conn.query('SELECT * FROM user WHERE email = ?', [email], (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ success: false, message: 'Database query failed.' });
        }

        // Check if the user exists
        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        try {
            // Convert the first result to a Usermodel object
            const userObject = result[0]; // Assuming the first row is the desired user
            const usermodel: Usermodel = {
                user_id: userObject.user_id,
                name: userObject.name,
                email: userObject.email,
                hashed_password: userObject.hashed_password,
                profile: userObject.profile,
                role: userObject.role,
                is_active: userObject.is_active,
                is_verify: userObject.is_verify,
                create_at: new Date(userObject.create_at), // Ensure `create_at` is a Date object
            };

            return res.status(200).json(usermodel); // Send the user data as JSON
        } catch (error) {
            console.error("Error parsing user data:", error);
            return res.status(500).json({ success: false, message: 'Error parsing user data.' });
        }
    });
});

router.post('/api/create_acc', async (req, res) => {
    const accData: Usermodel = req.body;

    try {
        // Default values
        const defaultRole = "user"; // Default role
        const defaultActive = 1; // Default active status
        const defaultVerify = 0; // Default: not verified
        const createdAt = new Date(); // Current timestamp

        let sql, params;

        // Build query dynamically based on hashed_password presence
        if (accData.hashed_password) {
            const hashedPassword = await bcrypt.hash(accData.hashed_password, 10);

            sql = `
                INSERT INTO user (name, email, hashed_password, profile, role, is_active, is_verify, create_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            params = [
                accData.name,
                accData.email,
                hashedPassword,
                accData.profile || null,
                accData.role || defaultRole,
                accData.is_active ?? defaultActive,
                accData.is_verify ?? defaultVerify,
                createdAt,
            ];
        } else {
            sql = `
                INSERT INTO user (name, email, profile, hashed_password, role, is_active, is_verify, create_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            params = [
                accData.name,
                accData.email,
                accData.profile || null,
                accData.hashed_password = '-',
                accData.role || defaultRole,
                accData.is_active ?? defaultActive,
                accData.is_verify ?? defaultVerify,
                createdAt,
            ];
        }

        // Format the SQL query with the parameters
        sql = mysql.format(sql, params);

        // Execute the query
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


router.get('/api/get_all_user', (req, res) => {
    // Query the database to get user details
    conn.query('SELECT * FROM user', (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ success: false, message: 'Database query failed.' });
        }

        // Check if there are any results
        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found.' });
        }

        try {
            // Map results to an array of Usermodel
            const users: Usermodel[] = results.map((userObject: any) => ({
                user_id: userObject.user_id,
                name: userObject.name,
                email: userObject.email,
                hashed_password: userObject.hashed_password,
                profile: userObject.profile,
                role: userObject.role,
                is_active: userObject.is_active,
                is_verify: userObject.is_verify,
                create_at: new Date(userObject.create_at),
            }));

            // Return all users as JSON
            return res.status(200).json({ success: true, users });
        } catch (error) {
            console.error("Error processing user data:", error);
            return res.status(500).json({ success: false, message: 'Error processing user data.' });
        }
    });
});
