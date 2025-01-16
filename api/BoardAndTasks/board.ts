import express from "express";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import { Boardmodel } from "../../model/boardmodel";
import { error } from "console";

export const router = express.Router();

router.post("/createBoard", (req, res) => {
  let { board_name, create_by, is_group } = req.body;
  if (is_group == 1) {
    let sql = `
          INSERT INTO board (board_name, create_by,create_at)
          VALUES (?, ?, NOW())
      `;
    sql = mysql.format(sql, [
      board_name,
      create_by,
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
        create_by,
      ]);

      conn.query(userSql, function (err, userResult) {
        if (err) {
          res.status(500).send({ message: "Error inserting into board_user:", err });
          return;
        }
        res.status(201).send({ message: "Board and Board_User records inserted successfully!" });
      });
    });
  } else if (is_group == 0) {
    let sql = `
                INSERT INTO board (board_name, create_by, create_at)
                VALUES (?, ?, NOW())
          `;
    sql = mysql.format(sql, [
      board_name,
      create_by,
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


router.post("/boardbyID", (req, res) => {
  let { userID, group } = req.body;
  if (group == 1) {
    const sql = `
      SELECT *
      FROM board 
      INNER JOIN board_user ON board.board_id = board_user.board_id
      WHERE create_by = ?
    `;

    conn.query(sql, [userID], (err, result, fields) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(200).json(result);
    });
  } else {
    const sql = `
      SELECT *
      FROM board
      WHERE board_id NOT IN (
          SELECT board_id
          FROM board_user
      )AND create_by = ?;
    `;

    conn.query(sql, [userID], (err, result, fields) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(200).json(result);
    });
  }
});

