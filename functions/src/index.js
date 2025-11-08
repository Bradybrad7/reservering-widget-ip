"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.testSmtpConfig = exports.sendSmtpEmail = void 0;
var functions = require("firebase-functions");
var nodemailer = require("nodemailer");
var cors = require("cors");
// CORS handler om verzoeken van je website toe te staan
var corsHandler = cors({ origin: true });
// Haal veilige SMTP configuratie op
var smtpConfig = functions.config().smtp;
// Maak SMTP transporter aan voor Office 365
var transporter = nodemailer.createTransporter({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port, 10),
    secure: false,
    auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
    },
    tls: {
        ciphers: "SSLv3"
    }
});
/**
 * SMTP Email Functie
 * Veilige backend functie om emails te versturen via Office 365
 */
exports.sendSmtpEmail = functions
    .region("europe-west1") // Amsterdam region
    .https.onRequest(function (req, res) {
    corsHandler(req, res, function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, to, subject, html, text, mailOptions, info, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Alleen POST requests accepteren
                    if (req.method !== "POST") {
                        res.status(405).send("Method Not Allowed");
                        return [2 /*return*/];
                    }
                    _a = req.body, to = _a.to, subject = _a.subject, html = _a.html, text = _a.text;
                    // Validatie
                    if (!to || !subject || !html) {
                        res.status(400).send({
                            success: false,
                            error: "Missing required fields: to, subject, html"
                        });
                        return [2 /*return*/];
                    }
                    mailOptions = {
                        from: "\"Inspiration Point Theater\" <".concat(smtpConfig.user, ">"),
                        to: to,
                        subject: subject,
                        html: html,
                        text: text || ""
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    console.log("\uD83D\uDCE7 [SMTP] Sending email to: ".concat(to));
                    console.log("\uD83D\uDCE7 [SMTP] Subject: ".concat(subject));
                    return [4 /*yield*/, transporter.sendMail(mailOptions)];
                case 2:
                    info = _b.sent();
                    console.log("\u2705 [SMTP] Email sent successfully:", info.messageId);
                    res.status(200).send({
                        success: true,
                        message: "Email sent successfully",
                        messageId: info.messageId
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    console.error("❌ [SMTP] Error sending email:", error_1);
                    res.status(500).send({
                        success: false,
                        error: "Failed to send email",
                        details: error_1 instanceof Error ? error_1.message : String(error_1)
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
});
/**
 * Test functie om SMTP configuratie te verifiëren
 */
exports.testSmtpConfig = functions
    .region("europe-west1")
    .https.onRequest(function (req, res) {
    corsHandler(req, res, function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Test de SMTP verbinding
                    return [4 /*yield*/, transporter.verify()];
                case 1:
                    // Test de SMTP verbinding
                    _a.sent();
                    res.status(200).send({
                        success: true,
                        message: "SMTP configuration is valid",
                        config: {
                            host: smtpConfig.host,
                            port: smtpConfig.port,
                            user: smtpConfig.user
                        }
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("❌ [SMTP] Configuration test failed:", error_2);
                    res.status(500).send({
                        success: false,
                        error: "SMTP configuration is invalid",
                        details: error_2 instanceof Error ? error_2.message : String(error_2)
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
});
