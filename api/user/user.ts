import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import { Convert, Usermodel } from "../../model/usermodel";  // เพิ่มการ import class Convert
import { db } from '../../firebase';
import { addDoc, collection, doc, getDoc, getDocs, setDoc, } from 'firebase/firestore'; // ฟังก์ชันที่จำเป็นจาก Firestore SDK
import { promisify } from "util";

export const router = express.Router();

router.post('/api/get_user', (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({ success: false, message: 'Email is required.' });
        return
    }

    conn.query('SELECT * FROM user WHERE email = ?', [email], (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ success: false, message: 'Database query failed.' });
        }
        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        try {
            const userObject = result[0];
            const usermodel: Usermodel = {
                user_id: userObject.user_id,
                name: userObject.name,
                email: userObject.email,
                hashed_password: userObject.hashed_password,
                profile: userObject.profile,
                role: userObject.role,
                is_active: userObject.is_active,
                is_verify: userObject.is_verify,
                create_at: new Date(userObject.create_at),
            };
            return res.status(200).json(usermodel);
        } catch (error) {
            console.error("Error parsing user data:", error);
            return res.status(500).json({ success: false, message: 'Error parsing user data.' });
        }
    });
});

router.post('/api/create_acc', async (req, res) => {
    const accData: Usermodel = req.body;

    try {
        const createdAt = new Date();
        let sql, params;
        //ถ้ามี password ถูกส่งเข้ามาในระบบ
        if (accData.hashed_password) {
            //hashed Password
            const hashedPassword = await bcrypt.hash(accData.hashed_password, 10);

            sql = `
                INSERT INTO user (name, email, hashed_password, profile, role, is_active, is_verify, create_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            params = [
                accData.name,
                accData.email,
                hashedPassword,
                accData.profile || "non-url",
                accData.role || "user",
                accData.is_active ?? "1",
                accData.is_verify ?? 0,
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
                accData.profile || "non-url",
                accData.hashed_password = '-',
                accData.role || "user",
                accData.is_active ?? "1",
                accData.is_verify ?? 0,
                createdAt,
            ];
        }
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


router.get('/api/get_all_user', (req, res) => {
    conn.query('SELECT * FROM user', (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ success: false, message: 'Database query failed.' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found.' });
        }

        try {
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
            return res.status(200).json({ success: true, users });
        } catch (error) {
            console.error("Error processing user data:", error);
            return res.status(500).json({ success: false, message: 'Error processing user data.' });
        }
    });
});

router.delete("/account", (req, res) => {
    const { email } = req.body;

    const checkSql = `
        SELECT DISTINCT *
        FROM user
        LEFT JOIN board ON user.user_id = board.create_by
        LEFT JOIN board_user ON user.user_id = board_user.user_id
        WHERE user.email = ?
            AND (board.board_id IS NOT NULL OR board_user.board_id IS NOT NULL)
    `;

    conn.query(checkSql, [email], (err, result) => {
        if (err) {
            console.error("Error during SELECT query:", err);
            return res.status(500).json({ error: "Database error during SELECT query" });
        }

        if (result.length > 0) {
            const deleteSql = `
                UPDATE user
                SET is_active = "2"
                WHERE email = ?;
            `;

            conn.query(deleteSql, [email], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error("Error during DELETE query:", deleteErr);
                    return res.status(500).json({ error: "Database error during DELETE query" });
                }

                if (deleteResult.affectedRows === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                return res.status(200).json({ message: "User deleted successfully" });
            });
        } else {
            const deleteSql = `
                DELETE FROM user
                WHERE email = ?;
            `;

            conn.query(deleteSql, [email], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error("Error during DELETE query:", deleteErr);
                    return res.status(500).json({ error: "Database error during DELETE query" });
                }

                if (deleteResult.affectedRows === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                return res.status(200).json({ message: "User deleted successfully" });
            });
        }
    });
});

