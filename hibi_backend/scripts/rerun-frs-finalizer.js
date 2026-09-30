/**
 * Re-run the FRS backfill + attendance finalizer for a date range, so that
 * late-in/early-out/half-day statuses are recomputed from the (now
 * IST-shifted) punch times.
 *
 *   node scripts/rerun-frs-finalizer.js 2026-06-25 2026-07-09
 *
 * Safe to run with the backend up; the backfill is the same code path the
 * cron uses and dedupes punches by sourceId.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { backfillFRSAttendance } = require('../src/utils/frsAttendanceCron');

const [fromDate, toDate] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(toDate || '')) {
    console.error('Usage: node scripts/rerun-frs-finalizer.js <from YYYY-MM-DD> <to YYYY-MM-DD>');
    process.exit(1);
}

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Re-running FRS backfill + finalizer for ${fromDate} .. ${toDate}`);
    const result = await backfillFRSAttendance(fromDate, toDate);
    console.log(JSON.stringify(result, null, 2));
    console.log('Done.');
    process.exit(0);
})().catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
});
