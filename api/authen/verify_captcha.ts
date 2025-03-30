import dotenv from "dotenv";
import express, { Request, Response, Router } from "express";
import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

dotenv.config();

const router: Router = express.Router();

// กำหนดค่า reCAPTCHA จาก environment variables
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const RECAPTCHA_KEY = process.env.RECAPTCHA_SITE_KEY;

if (!PROJECT_ID || !RECAPTCHA_KEY) {
  console.error("❌ ERROR: Missing GOOGLE_CLOUD_PROJECT_ID or RECAPTCHA_SITE_KEY in .env");
  process.exit(1);
}

/**
 * API ตรวจสอบ reCAPTCHA token
 */
router.post("/verify-recaptcha", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, action } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: "Token is required" });
      return;
    }

    const userIpAddress = Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const assessmentResult = await createAssessment({
      projectID: PROJECT_ID,
      recaptchaKey: RECAPTCHA_KEY,
      token,
      recaptchaAction: action,
      userIpAddress,
      userAgent,
    });

    if (assessmentResult) {
      res.json({
        success: true,
        score: assessmentResult.score,
        action: assessmentResult.action,
        reasons: assessmentResult.reasons || [],
      });
    } else {
      res.status(400).json({ success: false, message: "reCAPTCHA verification failed" });
    }
  } catch (error) {
    console.error("❌ Error verifying reCAPTCHA:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * ฟังก์ชันสร้าง assessment สำหรับ reCAPTCHA
 */
async function createAssessment({
  projectID,
  recaptchaKey,
  token,
  recaptchaAction,
  userIpAddress,
  userAgent,
}: {
  projectID: string;
  recaptchaKey: string;
  token: string;
  recaptchaAction?: string;
  userIpAddress?: string;
  userAgent?: string;
}): Promise<{ score: number; action: string; reasons: string[] } | null> {
  try {
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    const request = {
      assessment: {
        event: {
          token,
          siteKey: recaptchaKey,
          userIpAddress,
          userAgent,
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    if (!response.tokenProperties || !response.tokenProperties.valid) {
      if (response.tokenProperties) {
        console.log("❌ Token invalid:", response.tokenProperties.invalidReason);
      } else {
        console.log("❌ Token properties are null or undefined.");
      }
      return null;
    }

    if (recaptchaAction && response.tokenProperties.action !== recaptchaAction) {
      console.log(`⚠️ Action mismatch: expected ${recaptchaAction}, but got ${response.tokenProperties.action}`);
      return null;
    }

    return {
      score: response.riskAnalysis?.score || 0,
      action: response.tokenProperties.action || "",
      reasons: response.riskAnalysis?.reasons?.map(reason => reason.toString()) ?? [],
    };
  } catch (error) {
    console.error("❌ Error in createAssessment:", error);
    return null;
  }
}

// ✅ ใช้ export แบบถูกต้องสำหรับ TypeScript
export default router;
