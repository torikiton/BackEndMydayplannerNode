import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import { Boardmodel } from "../../model/boardmodel";
import { error } from "console";

export const router = express.Router();

router.post("/createBoard", (req, res) => {
  let board: Boardmodel = req.body;
  if (board.is_group == 1) {
    let sql = `
          INSERT INTO board (board_name, create_by, is_group)
          VALUES (?, ?, ?)
      `;
    sql = mysql.format(sql, [
      board.board_name,
      board.create_by,
      board.is_group,
    ]);

    conn.query(sql, function (err, result) {
      if (err) {
        res.status(500).send({ message: "Error inserting into board:", err });
        return;
      }

      const board_id = result.insertId;
      
      let userSql = `
              INSERT INTO board_user (board_id, user_id, added_at)
              VALUES (?, ?, NOW())
          `;
      userSql = mysql.format(userSql, [
        board_id,
        board.create_by,
      ]);

      conn.query(userSql, function (err, userResult) {
        if (err) {
          res.status(500).send({ message: "Error inserting into board_user:", err });
          return;
        }
        res.status(201).send({ message: "Board and Board_User records inserted successfully!" });
      });
    });
  } else if (board.is_group == 0) {
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
        res.status(500).send({ message: "Error inserting data" });
        return;
      }
      res.status(201).send({ message: "board create successfully" });
    });
  }

});


router.get("/boardCreateby/:id", (req, res) => {
  let id = +req.params.id;
  conn.query("select * from board where create_by = ?", [id], (err, result, fields) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});