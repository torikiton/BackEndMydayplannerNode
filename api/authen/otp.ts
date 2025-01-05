import express from "express";
import nodemailer from 'nodemailer';
import { Convert, Usermodel } from "../../model/usermodel";
import { conn, queryAsync } from "../../dbconnect";
import mysql from "mysql";
import { messaging } from "firebase-admin";

export const router = express.Router();

const transporter = nodemailer.createTransport({
    host : "smtp.gmail.com",
    port : 465,
    secure : true,
    auth: {
        user: 'projectmuutoo@gmail.com',
        pass: 'kuag wzhc bizy cfjp'
    }
})

router.post('/api/otp', async (req, res) => {
    try {
        const {recipient} = req.body;
        const OTP = generateOTP();
        const REF = generateREF();
        const content = generateEmailContent(OTP, REF);

        const info = await transporter.sendMail({
            from: '"MydayPlanner "<projectmuutoo@gmail.com>',
            to: recipient,
            subject: "MydayPlanner Login OTP code",
            html: content
        });

        console.log("Email sent:", info.response);
        res.json({ 
            message: "Email sent successfully",
            OTP: OTP,
            REF: REF
        });
        

    } catch (error) {
        console.error("Error sending email:",error);
        res.status(500).json({error: 'Fail to send email'});
    }
})

function generateOTP(length = 6) {
    // ตรวจสอบว่า length มีค่าเหมาะสม
    if (length <= 0) {
        throw new Error("OTP length must be greater than 0");
    }
    
    // สร้าง OTP โดยการสุ่มตัวเลข
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10); // สุ่มเลข 0-9
    }
    return otp;
}
function generateREF(length = 10) {
    // กำหนดชุดตัวอักษรและตัวเลขที่ใช้ใน REF
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let ref = '';
    
    // สุ่มตัวอักษรและตัวเลขตามความยาวที่กำหนด
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        ref += characters[randomIndex];
    }
    
    return ref;
}

function generateEmailContent(OTP: string, REF: string) {
    return `
        <table width="680px" cellpadding="0" cellspacing="0" border="0">
                            <tbody>
                              <tr>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="80%" bgcolor="#eeeeee" align="center"><h1>My day Planner</h1></td>
                                <td width="5%" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="20" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" height="72" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="72" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="72" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="72" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="72" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="80%" bgcolor="#ffffff" align="center" valign="top" style="line-height:24px"><font color="#333333" face="Arial"><span style="font-size:20px">สวัสดี!</span></font><br><font color="#333333" face="Arial"><span style="font-size:16px">กรุณานำรหัส <span class="il">OTP</span> ด้านล่าง ไปกรอกในหน้ายืนยัน.</span></font><br></td>
                                <td width="5%" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" height="42" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="42" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="42" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="42" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="42" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" height="72" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="72" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="72" bgcolor="#ffffff" align="center" valign="top">
                                  <table width="100%" height="72" cellpadding="0" cellspacing="0" border="0">
                                    <tbody><tr>
                                      <td width="10%" height="1" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="1" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="5%" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="*" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="5%" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="1" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="10%" height="1" bgcolor="#ffffff" style="font-size:0"></td>
                                    </tr>
                                    <tr>
                                      <td width="10%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="1" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="5%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="*" height="20" bgcolor="#ffffff" align="center" valign="middle" style="font-size:18px;color:#c00;font-family:Arial">
                                        <span class="il">OTP</span> : <strong style="color:#000">${ OTP }</strong></td>
                                      <td width="5%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="1" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="10%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                    </tr>
                                    <tr>
                                      <td width="10%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="1" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="5%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="*" height="20" bgcolor="#ffffff" align="center" valign="middle" style="font-size:18px;color:#c00;font-family:Arial">
                                        <span class="il">Ref</span> : <strong style="color:#000">${ REF }</strong></td>
                                      <td width="5%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="1" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="10%" height="20" bgcolor="#ffffff" style="font-size:0"></td>
                                    </tr>
                                    <tr>
                                      <td width="10%" height="1" bgcolor="#ffffff" style="font-size:0"></td>
                                      <td width="1" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="5%" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="*" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="5%" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="1" height="1" bgcolor="#cc0000" style="font-size:0"></td>
                                      <td width="10%" height="1" bgcolor="#ffffff" style="font-size:0"></td>
                                    </tr>
                                  </tbody></table>
                                </td>
                                <td width="5%" height="72" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="72" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>	
                              <tr>
                                <td width="5%" height="78" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="78" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="78" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="78" bgcolor="#ffffff" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="78" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" height="54" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="54" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="54" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="54" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="54" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                              <tr>
                                <td width="5%" height="24" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="24" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="80%" height="24" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="24" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                                <td width="5%" height="24" bgcolor="#eeeeee" style="font-size:0">&nbsp;</td>
                              </tr>
                            </tbody>
                          </table>
                          `;
}

router.put('/api/is_verify', async (req, res) => {
  const { email } = req.body;
  let userData: Usermodel | undefined;

  const response = await fetch('https://node-myday-planner.onrender.com/user/api/get_user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email })
  });
  
  const dataResponse = await response.json();
  userData = dataResponse as Usermodel;

  if (!userData) {
    res.status(404).json({ message: 'User not found' });
    return 
  }


  const data: Usermodel = { ...userData, is_verify: 1 };
  const createAt = new Date(data.create_at).toISOString().slice(0, 19).replace('T', ' ');

  let sql = `
    UPDATE \`user\`
    SET
      \`name\` = ?, \`email\` = ?, \`hashed_password\` = ?, \`profile\` = ?, 
      \`role\` = ?, \`is_active\` = ?, \`is_verify\` = ?, \`create_at\` = ?
    WHERE \`email\` = ?;
  `;

  sql = mysql.format(sql, [
    data.name,
    data.email,
    data.hashed_password,
    data.profile,
    data.role,
    data.is_active,
    data.is_verify,
    createAt,
    email,
  ]);

  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database update failed' });
    }
    res.status(200).json({ message: 'Database update successfuly' });
  });
});
