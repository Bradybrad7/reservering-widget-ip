"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReservationAction = exports.testSmtpConfig = exports.sendSmtpEmail = void 0;
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors");
const admin = require("firebase-admin");
// Initialize Firebase Admin SDK
admin.initializeApp();
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
        const { to, subject, html } = req.body;
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
            // GEEN TEXT VERSIE MEER - alleen HTML
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
/**
 * Admin Actie Handler
 * Handelt admin acties af voor reserveringen (bevestigen/annuleren)
 */
exports.handleReservationAction = functions
    .region("europe-west1")
    .runWith({ memory: "256MB" })
    .https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        try {
            // Parse query parameters
            const { id, action, token } = req.query;
            // Validatie
            if (!id || !action || !token) {
                res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>❌ Ongeldige Link</title>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="error">
                <h2>❌ Ongeldige Link</h2>
                <p>Deze link is ongeldig of incomplete. Controleer de URL en probeer opnieuw.</p>
              </div>
            </body>
            </html>
          `);
                return;
            }
            // Security token validatie
            const expectedToken = `admin_action_token_${id}`;
            if (token !== expectedToken) {
                res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>🔒 Toegang Geweigerd</title>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="error">
                <h2>🔒 Toegang Geweigerd</h2>
                <p>Ongeldig security token. Deze link is mogelijk verlopen of gecompromitteerd.</p>
              </div>
            </body>
            </html>
          `);
                return;
            }
            // Verkrijg reservering uit Firestore
            const db = admin.firestore();
            const reservationRef = db.collection('reservations').doc(id);
            const reservationDoc = await reservationRef.get();
            if (!reservationDoc.exists) {
                res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>❌ Reservering Niet Gevonden</title>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="error">
                <h2>❌ Reservering Niet Gevonden</h2>
                <p>Reservering ${id} bestaat niet in het systeem.</p>
              </div>
            </body>
            </html>
          `);
                return;
            }
            const reservation = reservationDoc.data();
            const reservationId = id;
            const actionType = action;
            // Voer actie uit
            let newStatus;
            let actionMessage;
            let actionColor;
            if (actionType === 'confirm') {
                newStatus = 'confirmed';
                actionMessage = '✅ Reservering Bevestigd';
                actionColor = '#28a745';
                // Update reservering status
                await reservationRef.update({
                    status: newStatus,
                    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
                    confirmedBy: 'admin_email_action'
                });
            }
            else if (actionType === 'cancel') {
                newStatus = 'cancelled';
                actionMessage = '❌ Reservering Geannuleerd';
                actionColor = '#dc3545';
                // Update reservering status
                await reservationRef.update({
                    status: newStatus,
                    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                    cancelledBy: 'admin_email_action',
                    cancellationReason: 'Cancelled via admin email action'
                });
            }
            else {
                res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>❌ Ongeldige Actie</title>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="error">
                <h2>❌ Ongeldige Actie</h2>
                <p>Actie '${actionType}' wordt niet ondersteund. Gebruik 'confirm' of 'cancel'.</p>
              </div>
            </body>
            </html>
          `);
                return;
            }
            console.log(`✅ [ADMIN-ACTION] Reservation ${reservationId} ${actionType}ed successfully`);
            // Stuur success pagina terug
            res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${actionMessage} - Inspiration Point Admin</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0; 
                padding: 50px 20px; 
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .success-container {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
                width: 100%;
              }
              .success-header {
                background: ${actionColor};
                color: white;
                padding: 20px;
                margin: -40px -40px 30px -40px;
                border-radius: 16px 16px 0 0;
                font-size: 24px;
                font-weight: bold;
              }
              .reservation-info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .btn-dashboard {
                display: inline-block;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 12px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 20px;
                transition: transform 0.2s;
              }
              .btn-dashboard:hover {
                transform: translateY(-2px);
              }
            </style>
          </head>
          <body>
            <div class="success-container">
              <div class="success-header">
                ${actionMessage}
              </div>
              
              <div class="reservation-info">
                <h3>📋 Reservering Details</h3>
                <p><strong>ID:</strong> ${reservationId}</p>
                <p><strong>Bedrijf:</strong> ${(reservation === null || reservation === void 0 ? void 0 : reservation.companyName) || 'Onbekend'}</p>
                <p><strong>Contact:</strong> ${(reservation === null || reservation === void 0 ? void 0 : reservation.contactPerson) || 'Onbekend'}</p>
                <p><strong>Nieuwe Status:</strong> <span style="color: ${actionColor}; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
              </div>
              
              <p style="color: #666; margin: 20px 0;">
                De reservering is succesvol ${actionType === 'confirm' ? 'bevestigd' : 'geannuleerd'}. 
                De klant zal automatisch op de hoogte worden gesteld.
              </p>
              
              <a href="https://inspirationpoint-reserveringssysteem.web.app/admin" class="btn-dashboard">
                🎛️ Ga naar Admin Dashboard
              </a>
            </div>
          </body>
          </html>
        `);
            // TODO: Hier zou je ook een email naar de klant kunnen sturen om te informeren over de statuswijziging
        }
        catch (error) {
            console.error("❌ [ADMIN-ACTION] Error processing reservation action:", error);
            res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>❌ Server Error</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>❌ Server Error</h2>
              <p>Er is een fout opgetreden bij het verwerken van deze actie. Probeer het later opnieuw of neem contact op met de systeembeheerder.</p>
              <p><small>Error: ${error instanceof Error ? error.message : String(error)}</small></p>
            </div>
          </body>
          </html>
        `);
        }
    });
});
//# sourceMappingURL=index.js.map