import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import { v4 as uuidv4 } from "uuid";
import { Boardmodel } from "../../model/boardmodel";


export const router = express.Router();



router.post('/api/share_link', async (req, res) => {
    const { boardId, expiresAt, userId } = req.body;
    try {
        // 1. ตรวจสอบว่าบอร์ดมีอยู่และผู้ใช้เป็นเจ้าของบอร์ดหรือไม่
        conn.query(
            'SELECT * FROM `board` WHERE board_id = ? AND create_by = ?',
            [boardId, userId],
            (err, result) => {
                if (err) {
                    console.error("Database query error:", err);
                    return res.status(500).json({ success: false, message: 'Database query failed.' });
                }

                if (result.length === 0) {
                    return res.status(403).json({ success: false, message: 'You are not authorized to share this board.' });
                }

                const boardObject = result[0] as Boardmodel;

                // 2. สร้าง Token และบันทึกลงในฐานข้อมูล
                const token = uuidv4();
                const shareLink = `https://node-myday-planner.onrender.com/board/share/${token}`;

                const expiresDate = expiresAt ? new Date(expiresAt) : null;

                conn.query(
                    'INSERT INTO `board_token` (board_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
                    [boardId, token, expiresDate],
                    (err) => {
                        if (err) {
                            console.error("Error saving token to database:", err);
                            return res.status(500).json({ success: false, message: 'Failed to save token to database.' });
                        }

                        // 3. ส่งลิงก์แชร์กลับไปยังผู้ใช้
                        res.status(201).json({
                            success: true,
                            message: 'Share link created successfully.',
                            link: shareLink,
                            expiresAt: expiresDate,
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error creating share link:", error);
        res.status(500).json({ success: false, message: "Failed to create share link." });
    }
});

router.post('/share/:token', async (req, res) => {
    const { token } = req.params; // รับ Token จาก URL
    const userId = req.body.userId; // ID ผู้ใช้จากคำขอ

    try {
        // 1. ตรวจสอบว่า Token มีอยู่และยังใช้งานได้
        conn.query(
            'SELECT * FROM `board_token` WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW())',
            [token],
            (err, result) => {
                if (err) {
                    console.error("Database query error:", err);
                    return res.status(500).json({ success: false, message: 'Database query failed.' });
                }

                if (result.length === 0) {
                    return res.status(400).json({ success: false, message: 'Invalid or expired link.' });
                }

                const boardToken = result[0];

                // 2. ตรวจสอบว่าผู้ใช้เป็นสมาชิกบอร์ดอยู่แล้วหรือไม่
                conn.query(
                    'SELECT * FROM `board_users` WHERE board_id = ? AND user_id = ?',
                    [boardToken.board_id, userId],
                    (err, result) => {
                        if (err) {
                            console.error("Database query error:", err);
                            return res.status(500).json({ success: false, message: 'Database query failed.' });
                        }

                        if (result.length > 0) {
                            return res.status(200).json({
                                success: true,
                                message: 'You are already a member of this board.',
                            });
                        }

                        // 3. เพิ่มผู้ใช้ในบอร์ด
                        conn.query(
                            'INSERT INTO `board_users` (board_id, user_id, added_at) VALUES (?, ?, NOW())',
                            [boardToken.board_id, userId],
                            (err) => {
                                if (err) {
                                    console.error("Error adding user to board:", err);
                                    return res.status(500).json({ success: false, message: 'Failed to join the board.' });
                                }

                                res.status(200).json({
                                    success: true,
                                    message: 'Successfully joined the board.',
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error joining board:", error);
        res.status(500).json({ success: false, message: 'Failed to process the link.' });
    }
});