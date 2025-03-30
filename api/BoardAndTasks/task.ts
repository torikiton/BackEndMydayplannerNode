import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import { Boardmodel } from "../../model/boardmodel";
import { Tasksmodel } from "../../model/tasksmodel";
import {  Checklistmodel } from "../../model/checklistmodel";
import { error } from "console";

export const router = express.Router();

router.post("/createTasks", (req, res) => {
    const tasks = req.body; // รับข้อมูลจาก request body
    const userSql = `
        INSERT INTO tasks (
            board_id, 
            task_name, 
            description, 
            status, 
            priority, 
            due_date, 
            is_archive, 
            create_by, 
            assigned_to, 
            create_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const sqlParams = [
        tasks.board_id,
        tasks.task_name,
        tasks.description || null,
        tasks.status || "today",
        tasks.priority,
        tasks.due_date || null,
        tasks.is_archive || 0,
        tasks.create_by,
        tasks.assigned_to || null
    ];

    conn.query(userSql, sqlParams, (err, results) => {
        if (err) {
            console.error("Error inserting task:", err);
            res.status(500).send("An error occurred while inserting the task.");
            return;
        }
        res.status(200).send("Task inserted successfully.");
    });
});

router.post("/createTasks/checklist", (req, res) => {
    const checklist:Checklistmodel = req.body; // รับข้อมูลจาก request body
    const sql = `
        INSERT INTO checklist (
            task_id, 
            checklist_name, 
            is_archive, 
            assigned_to, 
            created_at
        )
        VALUES (?, ?, ?, ?, NOW())
    `;

    const sqlParams = [
        checklist.task_id,
        checklist.checklist_name,
        checklist.is_archive || 0,
        checklist.assigned_to || null
    ];

    conn.query(sql, sqlParams, (err, results) => {
        if (err) {
            console.error("Error inserting checklist:", err);
            res.status(500).send("An error occurred while inserting the checklist.");
            return;
        }
        res.status(200).send("checklist inserted successfully.");
    });
});

router.get("/tasks", (req, res) => {
    conn.query("select * from tasks", (err, result, fields) => {
        if (err) throw err;
        res.status(200).json(result);
    });
});
router.get("/tasks/:id", (req, res) => {
    let id = +req.params.id;
    conn.query("select * from tasks where task_id = ?", [id], (err, result, fields) => {
      if (err) throw err;
      res.status(200).json(result);
    });
  });

router.get("/checklist", (req, res) => {
    conn.query("select * from checklist", (err, result, fields) => {
        if (err) throw err;
        res.status(200).json(result);
    });
});

router.get("/checklist/:id", (req, res) => {
    let id = +req.params.id;
    conn.query("select * from checklist where checklist_id = ?", [id], (err, result, fields) => {
      if (err) throw err;
      res.status(200).json(result);
    });
  });

