import express from "express";
import { router as index } from "./api/index";
import { router as user } from "./api/user";

export const app = express();

app.use("/", index);
app.use("/user", user);