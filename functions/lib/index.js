"use strict";
/**
 * Cloud Functions for Dinner Theater Booking System
 *
 * Triggers:
 * - onReservationCreate: Capacity validation and audit logging
 * - onReservationUpdate: Change tracking and audit logging
 * - onOptionExpiry: Check expired options daily
 *
 * Callables:
 * - redeemVoucher: Voucher redemption with validation
 * - processWaitlist: Manual waitlist processing
 * - setAdminClaim: Set admin custom claim (protected)
 *
 * Scheduled:
 * - checkExpiredOptions: Daily check for expired options
 * - processWaitlistDaily: Daily waitlist processing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWaitlistDaily = exports.checkExpiredOptions = exports.setAdminClaim = exports.processWaitlist = exports.redeemVoucher = exports.onReservationDelete = exports.onReservationUpdate = exports.onReservationCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Calculate total capacity for an event
 */
async function calculateEventCapacity(eventId) {
    const reservationsSnapshot = await db
        .collection("reservations")
        .where("eventId", "==", eventId)
        .where("status", "in", ["confirmed", "option"])
        .get();
    return reservationsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().numberOfPersons || 0);
    }, 0);
}
/**
 * Update customer statistics
 */
async function updateCustomerStats(email, increment) {
    const customersSnapshot = await db
        .collection("customers")
        .where("email", "==", email)
        .limit(1)
        .get();
    if (!customersSnapshot.empty) {
        const customerDoc = customersSnapshot.docs[0];
        await customerDoc.ref.update({
            totalBookings: admin.firestore.FieldValue.increment(increment),
            totalSpent: admin.firestore.FieldValue.increment(0), // Calculate from reservation
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
}
// ============================================================================
// FIRESTORE TRIGGERS
// ============================================================================
/**
 * Trigger when a new reservation is created
 * - Validates capacity
 * - Updates event capacity
 * - Updates customer statistics
 * - Creates audit log
 */
exports.onReservationCreate = functions.firestore
    .document("reservations/{reservationId}")
    .onCreate(async (snapshot, context) => {
    const reservation = snapshot.data();
    const { reservationId } = context.params;
    const eventId = reservation.eventId;
    try {
        // Get event
        const eventRef = db.collection("events").doc(eventId);
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            console.error("Event not found:", eventId);
            return;
        }
        const event = eventDoc.data();
        // Calculate new capacity
        const totalPersons = await calculateEventCapacity(eventId);
        // Check if exceeds max capacity
        if (totalPersons > event.maxCapacity) {
            console.warn(`Capacity exceeded for event ${eventId}: ${totalPersons}/${event.maxCapacity}`);
        }
        // Update event capacity
        await eventRef.update({
            currentCapacity: totalPersons,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update customer statistics
        if (reservation.status === "confirmed") {
            await updateCustomerStats(reservation.email, 1);
        }
        // Create audit log
        await db.collection("auditLogs").add({
            action: "reservation_created",
            entityType: "reservation",
            entityId: reservationId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                eventId,
                email: reservation.email,
                numberOfPersons: reservation.numberOfPersons,
                status: reservation.status,
                totalAmount: reservation.totalAmount,
            },
        });
        console.log(`✅ Reservation created: ${reservationId}`);
    }
    catch (error) {
        console.error(`❌ Error processing reservation ${reservationId}:`, error);
    }
});
/**
 * Trigger when a reservation is updated
 * - Tracks status changes
 * - Updates capacity on status/person changes
 * - Creates audit log
 */
exports.onReservationUpdate = functions.firestore
    .document("reservations/{reservationId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { reservationId } = context.params;
    try {
        const changes = {};
        // Track status changes
        if (before.status !== after.status) {
            changes.status = { from: before.status, to: after.status };
            // Update customer stats on status change
            if (after.status === "confirmed" && before.status !== "confirmed") {
                await updateCustomerStats(after.email, 1);
            }
            else if (after.status === "cancelled" && before.status === "confirmed") {
                await updateCustomerStats(after.email, -1);
            }
        }
        // Track person count changes
        if (before.numberOfPersons !== after.numberOfPersons) {
            changes.numberOfPersons = {
                from: before.numberOfPersons,
                to: after.numberOfPersons,
            };
        }
        // Recalculate capacity if relevant changes occurred
        if (changes.status || changes.numberOfPersons) {
            const totalPersons = await calculateEventCapacity(after.eventId);
            await db.collection("events").doc(after.eventId).update({
                currentCapacity: totalPersons,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Create audit log
        await db.collection("auditLogs").add({
            action: "reservation_updated",
            entityType: "reservation",
            entityId: reservationId,
            adminUserId: after.lastModifiedBy || "system",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            changes,
        });
        console.log(`✅ Reservation updated: ${reservationId}`);
    }
    catch (error) {
        console.error(`❌ Error updating reservation ${reservationId}:`, error);
    }
});
/**
 * Trigger when a reservation is deleted
 * - Updates event capacity
 * - Creates audit log
 */
exports.onReservationDelete = functions.firestore
    .document("reservations/{reservationId}")
    .onDelete(async (snapshot, context) => {
    const reservation = snapshot.data();
    const { reservationId } = context.params;
    try {
        // Recalculate capacity
        const totalPersons = await calculateEventCapacity(reservation.eventId);
        await db.collection("events").doc(reservation.eventId).update({
            currentCapacity: totalPersons,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update customer stats if was confirmed
        if (reservation.status === "confirmed") {
            await updateCustomerStats(reservation.email, -1);
        }
        // Create audit log
        await db.collection("auditLogs").add({
            action: "reservation_deleted",
            entityType: "reservation",
            entityId: reservationId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                eventId: reservation.eventId,
                email: reservation.email,
                numberOfPersons: reservation.numberOfPersons,
            },
        });
        console.log(`✅ Reservation deleted: ${reservationId}`);
    }
    catch (error) {
        console.error(`❌ Error deleting reservation ${reservationId}:`, error);
    }
});
// ============================================================================
// CALLABLE FUNCTIONS
// ============================================================================
/**
 * Redeem a voucher and create reservation with discount
 */
exports.redeemVoucher = functions.https.onCall(async (data, context) => {
    const { voucherCode, reservationData } = data;
    if (!voucherCode || !reservationData) {
        throw new functions.https.HttpsError("invalid-argument", "Voucher code en reserveringsgegevens zijn verplicht");
    }
    try {
        // Get voucher
        const voucherRef = db.collection("issuedVouchers").doc(voucherCode);
        const voucherDoc = await voucherRef.get();
        if (!voucherDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Voucher niet gevonden");
        }
        const voucher = voucherDoc.data();
        // Validate voucher status
        if (voucher.status !== "active") {
            throw new functions.https.HttpsError("failed-precondition", `Voucher is niet actief (status: ${voucher.status})`);
        }
        // Check expiry
        if (voucher.expiryDate) {
            const expiryDate = voucher.expiryDate.toDate();
            if (expiryDate < new Date()) {
                throw new functions.https.HttpsError("failed-precondition", "Voucher is verlopen");
            }
        }
        // Check max uses
        if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
            throw new functions.https.HttpsError("failed-precondition", "Voucher is al volledig gebruikt");
        }
        // Transaction for atomic update
        const result = await db.runTransaction(async (transaction) => {
            // Update voucher
            const newUsedCount = (voucher.usedCount || 0) + 1;
            const newStatus = voucher.maxUses && newUsedCount >= voucher.maxUses ?
                "fully_redeemed" : "active";
            transaction.update(voucherRef, {
                usedCount: newUsedCount,
                status: newStatus,
                lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Create reservation with voucher discount
            const reservationRef = db.collection("reservations").doc();
            transaction.set(reservationRef, Object.assign(Object.assign({}, reservationData), { voucherCode, discountAmount: voucher.discountAmount || 0, discountType: voucher.discountType || "fixed", createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
            // Add usage to voucher history
            const usageRef = voucherRef.collection("usageHistory").doc();
            transaction.set(usageRef, {
                reservationId: reservationRef.id,
                usedAt: admin.firestore.FieldValue.serverTimestamp(),
                usedBy: reservationData.email,
                discountApplied: voucher.discountAmount,
            });
            return { reservationId: reservationRef.id };
        });
        console.log(`✅ Voucher redeemed: ${voucherCode} -> ${result.reservationId}`);
        return {
            success: true,
            message: "Voucher succesvol ingewisseld",
            reservationId: result.reservationId,
        };
    }
    catch (error) {
        console.error("❌ Error redeeming voucher:", error);
        throw error;
    }
});
/**
 * Process waitlist - notify customers when space becomes available
 */
exports.processWaitlist = functions.https.onCall(async (data, context) => {
    // Require admin authentication
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError("permission-denied", "Alleen admins kunnen de waitlist verwerken");
    }
    const { eventId } = data;
    if (!eventId) {
        throw new functions.https.HttpsError("invalid-argument", "Event ID is verplicht");
    }
    try {
        // Get event
        const eventDoc = await db.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Event niet gevonden");
        }
        const event = eventDoc.data();
        const availableSpots = event.maxCapacity - (event.currentCapacity || 0);
        if (availableSpots <= 0) {
            return {
                success: true,
                message: "Geen beschikbare plaatsen",
                notified: 0,
            };
        }
        // Get active waitlist entries
        const waitlistSnapshot = await db
            .collection("waitlistEntries")
            .where("eventId", "==", eventId)
            .where("status", "==", "active")
            .orderBy("createdAt", "asc")
            .get();
        let notifiedCount = 0;
        let remainingSpots = availableSpots;
        for (const waitlistDoc of waitlistSnapshot.docs) {
            const entry = waitlistDoc.data();
            if (entry.numberOfPersons <= remainingSpots) {
                // Mark as notified
                await waitlistDoc.ref.update({
                    notificationSent: true,
                    notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                notifiedCount++;
                remainingSpots -= entry.numberOfPersons;
                console.log(`📧 Notified ${entry.customerEmail} - ${entry.numberOfPersons} spots available`);
            }
            if (remainingSpots <= 0)
                break;
        }
        return {
            success: true,
            message: `${notifiedCount} klanten genotificeerd`,
            notified: notifiedCount,
        };
    }
    catch (error) {
        console.error("❌ Error processing waitlist:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Set admin custom claim on user
 * PROTECTED: Requires admin secret
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
    var _a, _b;
    const { uid, secret } = data;
    // Verify secret (set this in Firebase Functions config)
    const adminSecret = ((_a = functions.config().admin) === null || _a === void 0 ? void 0 : _a.secret) || "your-secret-here";
    if (secret !== adminSecret) {
        throw new functions.https.HttpsError("unauthenticated", "Invalid admin secret");
    }
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "User ID is required");
    }
    try {
        await admin.auth().setCustomUserClaims(uid, { admin: true });
        // Create audit log
        await db.collection("auditLogs").add({
            action: "admin_claim_set",
            entityType: "user",
            entityId: uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            adminUserId: ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid) || "system",
        });
        console.log(`✅ Admin claim set for user: ${uid}`);
        return { success: true, message: "Admin claim set successfully" };
    }
    catch (error) {
        console.error("❌ Error setting admin claim:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================
/**
 * Check for expired options daily at 9 AM
 */
exports.checkExpiredOptions = functions.pubsub
    .schedule("every day 09:00")
    .timeZone("Europe/Amsterdam")
    .onRun(async (context) => {
    console.log("🕒 Checking expired options...");
    try {
        const now = admin.firestore.Timestamp.now();
        // Get all option reservations
        const optionsSnapshot = await db
            .collection("reservations")
            .where("status", "==", "option")
            .get();
        let expiredCount = 0;
        const batch = db.batch();
        for (const optionDoc of optionsSnapshot.docs) {
            const option = optionDoc.data();
            // Check if expired
            if (option.optionExpiresAt && option.optionExpiresAt < now) {
                // Update to expired status
                batch.update(optionDoc.ref, {
                    status: "expired",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                // Create audit log
                const auditRef = db.collection("auditLogs").doc();
                batch.set(auditRef, {
                    action: "option_expired",
                    entityType: "reservation",
                    entityId: optionDoc.id,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    metadata: {
                        eventId: option.eventId,
                        email: option.email,
                        expiredAt: option.optionExpiresAt,
                    },
                });
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            await batch.commit();
            console.log(`✅ Expired ${expiredCount} options`);
        }
        else {
            console.log("✅ No expired options found");
        }
        return null;
    }
    catch (error) {
        console.error("❌ Error checking expired options:", error);
        return null;
    }
});
/**
 * Process waitlist daily at 9 AM
 */
exports.processWaitlistDaily = functions.pubsub
    .schedule("every day 09:00")
    .timeZone("Europe/Amsterdam")
    .onRun(async (context) => {
    console.log("📋 Processing waitlist daily...");
    try {
        // Get all future events
        const now = admin.firestore.Timestamp.now();
        const eventsSnapshot = await db
            .collection("events")
            .where("date", ">=", now)
            .where("isActive", "==", true)
            .get();
        let totalNotified = 0;
        for (const eventDoc of eventsSnapshot.docs) {
            const event = eventDoc.data();
            const availableSpots = event.maxCapacity - (event.currentCapacity || 0);
            if (availableSpots <= 0)
                continue;
            // Get waitlist for this event
            const waitlistSnapshot = await db
                .collection("waitlistEntries")
                .where("eventId", "==", eventDoc.id)
                .where("status", "==", "active")
                .where("notificationSent", "==", false)
                .orderBy("createdAt", "asc")
                .get();
            let remainingSpots = availableSpots;
            for (const waitlistDoc of waitlistSnapshot.docs) {
                const entry = waitlistDoc.data();
                if (entry.numberOfPersons <= remainingSpots) {
                    await waitlistDoc.ref.update({
                        notificationSent: true,
                        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    totalNotified++;
                    remainingSpots -= entry.numberOfPersons;
                    console.log(`📧 Notified ${entry.customerEmail} for event ${eventDoc.id}`);
                }
                if (remainingSpots <= 0)
                    break;
            }
        }
        console.log(`✅ Daily waitlist processing complete - ${totalNotified} notifications sent`);
        return null;
    }
    catch (error) {
        console.error("❌ Error processing daily waitlist:", error);
        return null;
    }
});
//# sourceMappingURL=index.js.map