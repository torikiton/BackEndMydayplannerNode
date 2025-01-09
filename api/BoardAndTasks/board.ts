import express from "express";
import { conn,queryAsync } from "../../dbconnect";
import mysql from "mysql";
import {Boardmodel} from "../../model/boardmodel";

export const router = express.Router();

router.post("/createBoard", (req, res) => {
    let board: Boardmodel = req.body;
  
    let sql = `
            INSERT INTO board (board_name, create_by, is_group)
            VALUES (?, ?, ?)
        `;
        sql = mysql.format(sql, [
            board.board_name,
            board.create_by,
            board.is_group,
        ]);
  
    conn.query(sql, (err) => {
        if (err) {
            res.status(500).send("Error inserting data");
            return;
        }
        res.send("board create successfully");
    });
  });


router.get("/boardCreateby/:id", (req, res) => {
  let id = +req.params.id;
  conn.query("select * from board where create_by = ?" , [id], (err, result, fields) => {
  if (err) throw err;
    res.json(result);
  });
});