import express from "express";
import { router as index } from "./api/index";
import { router as user } from "./api/user";
import { router as board } from "./api/board";
import bodyParser from "body-parser";

export const app = express();

app.use(bodyParser.json());
app.use("/", index);
app.use("/user", user);
app.use("/board", board);