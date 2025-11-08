"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSmtpConfig = exports.sendSmtpEmail = void 0;
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors");
// CORS handler om verzoeken van je website toe te staan
const corsHandler = cors({ origin: true });
// Haal veilige SMTP configuratie op
const smtpConfig = functions.config().smtp;
// Maak SMTP transporter aan voor Office 365
const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port, 10),
    secure: false,
    auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass, // crfrwkbcdcdfzkxp (app password)
    },
    tls: {
        ciphers: "SSLv3",
    },
});
/**
 * SMTP Email Functie
 * Veilige backend functie om emails te versturen via Office 365
 */
exports.sendSmtpEmail = functions
    .region("europe-west1") // Amsterdam region
    .runWith({ memory: "256MB" })
    .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // Alleen POST requests accepteren
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const { to, subject, html, text } = req.body;
        // Validatie
        if (!to || !subject || !html) {
            res.status(400).send({
                success: false,
                error: "Missing required fields: to, subject, html"
            });
            return;
        }
        const mailOptions = {
            from: `"Inspiration Point Theater" <${smtpConfig.user}>`,
            to: to,
            subject: subject,
            html: html,
            text: text || "", // Fallback text versie
        };
        try {
            console.log(`📧 [SMTP] Sending email to: ${to}`);
            console.log(`📧 [SMTP] Subject: ${subject}`);
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ [SMTP] Email sent successfully:`, info.messageId);
            res.status(200).send({
                success: true,
                message: "Email sent successfully",
                messageId: info.messageId
            });
        }
        catch (error) {
            console.error("❌ [SMTP] Error sending email:", error);
            res.status(500).send({
                success: false,
                error: "Failed to send email",
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
});
/**
 * Test functie om SMTP configuratie te verifiëren
 */
exports.testSmtpConfig = functions
    .region("europe-west1")
    .runWith({ memory: "256MB" })
    .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            // Test de SMTP verbinding
            await transporter.verify();
            res.status(200).send({
                success: true,
                message: "SMTP configuration is valid",
                config: {
                    host: smtpConfig.host,
                    port: smtpConfig.port,
                    user: smtpConfig.user,
                    // Wachtwoord NIET tonen voor security
                }
            });
        }
        catch (error) {
            console.error("❌ [SMTP] Configuration test failed:", error);
            res.status(500).send({
                success: false,
                error: "SMTP configuration is invalid",
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
});
//# sourceMappingURL=index.js.map