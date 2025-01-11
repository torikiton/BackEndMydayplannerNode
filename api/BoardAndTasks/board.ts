import express from "express";
import { conn,queryAsync } from "../../dbconnect";
import mysql from "mysql";
import {Boardmodel} from "../../model/boardmodel";
import { error } from "console";

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
            res.status(500).send({message:"Error inserting data"});
            return;
        }
        res.status(200).send({message:"board create successfully"});
    });
  });


router.get("/boardCreateby/:id", (req, res) => {
  let id = +req.params.id;
  conn.query("select * from board where create_by = ?" , [id], (err, result, fields) => {
  if (err) throw err;
    res.status(200).json(result);
  });
});