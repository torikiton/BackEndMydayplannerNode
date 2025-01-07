import express from "express";
import { router as index } from "./api/index";
import { router as user } from "./api/user";
import { router as board } from "./api/board";
import { router as otp } from "./api/authen/otp";
import { router as signin_up } from "./api/authen/signin_up";
import { router as googlelogin } from "./api/authen/google_login";
import { router as resetpassword } from "./api/resetpassword/resetpassword";
import { router as admin } from "./api/admin/edituser";
import { router as users } from "./api/user/profile";
import bodyParser from "body-parser";

export const app = express();

app.use(bodyParser.json());
app.use("/", index);
app.use("/user", user);
app.use("/board", board);
app.use("/otp", otp);
app.use("/signin_up", signin_up);
app.use("/google", googlelogin);
app.use("/resetpassword", resetpassword);
app.use("/admin", admin);
app.use("/users", users);
