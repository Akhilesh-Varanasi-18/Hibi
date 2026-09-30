/**
 * One-time migration: shift FRS-sourced punch times to the app-wide
 * IST-shifted convention (+5h30m), recompute their dedupe sourceIds,
 * and fix the DailyAttendance rows that were built from them.
 *
 * Run with the backend STOPPED (so the cron doesn't write concurrently):
 *   node scripts/migrate-frs-ist.js
 *
 * Safe to re-run: a marker in the `migrations` collection makes it a no-op
 * the second time.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const migrations = db.collection('migrations');
    if (await migrations.findOne({ name: 'frs-ist-shift' })) {
        console.log('Migration "frs-ist-shift" already applied. Nothing to do.');
        process.exit(0);
    }

    const punchesCol = db.collection('attendancepunches');
    const dailyCol = db.collection('dailyattendances');

    const punches = await punchesCol.find({ source: 'FRS_DEVICE' }).sort({ punchTime: 1 }).toArray();
    console.log(`FRS punches to shift: ${punches.length}`);
    if (punches.length === 0) {
        await migrations.insertOne({ name: 'frs-ist-shift', at: new Date(), punches: 0 });
        console.log('No punches; marker written. Done.');
        process.exit(0);
    }

    // 1. Shift every FRS punch and recompute its sourceId
    const ops = [];
    const groups = new Map(); // employeeId|istDay -> shifted times
    for (const p of punches) {
        const shifted = new Date(p.punchTime.getTime() + IST_OFFSET_MS);
        ops.push({
            updateOne: {
                filter: { _id: p._id },
                update: { $set: { punchTime: shifted, sourceId: `FRS-${p.employeeCode}-${shifted.getTime()}` } },
            },
        });
        const day = shifted.toISOString().split('T')[0];
        const key = `${p.employeeId}|${day}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(shifted);
    }
    const bulkResult = await punchesCol.bulkWrite(ops);
    console.log(`Punches shifted: ${bulkResult.modifiedCount}`);

    // 2. Fix DailyAttendance rows written from those punches.
    //    An FRS-derived row has logInTime == (first punch, unshifted) — match
    //    with a +/-2 min tolerance and rewrite in/out from the shifted punches.
    let fixed = 0;
    let unmatched = 0;
    const days = new Set();
    for (const [key, times] of groups) {
        const [employeeId, day] = key.split('|');
        days.add(day);
        times.sort((a, b) => a - b);
        const first = times[0];
        const last = times[times.length - 1];
        const logOut = last.getTime() - first.getTime() >= 60 * 1000 ? last : null;
        const oldFirst = new Date(first.getTime() - IST_OFFSET_MS);

        const row = await dailyCol.findOne({
            employeeId: new mongoose.Types.ObjectId(employeeId),
            logInTime: {
                $gte: new Date(oldFirst.getTime() - 2 * 60 * 1000),
                $lte: new Date(oldFirst.getTime() + 2 * 60 * 1000),
            },
        });
        if (!row) { unmatched++; continue; }

        await dailyCol.updateOne(
            { _id: row._id },
            { $set: { logInTime: first, ...(logOut ? { logOutTime: logOut } : {}) } }
        );
        fixed++;
    }
    const sortedDays = [...days].sort();
    console.log(`Daily attendance rows fixed: ${fixed}, unmatched (left as-is): ${unmatched}`);
    console.log(`Affected IST days: ${sortedDays[0]} .. ${sortedDays[sortedDays.length - 1]}`);

    await migrations.insertOne({
        name: 'frs-ist-shift',
        at: new Date(),
        punches: punches.length,
        dailyFixed: fixed,
        dailyUnmatched: unmatched,
        fromDay: sortedDays[0],
        toDay: sortedDays[sortedDays.length - 1],
    });
    console.log('Migration complete. Marker written.');
    console.log(`Next: node scripts/rerun-frs-finalizer.js ${sortedDays[0]} ${sortedDays[sortedDays.length - 1]}`);
    process.exit(0);
})().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
