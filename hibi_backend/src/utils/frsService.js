/**
 * frsService.js
 * PRIMARY: Fetches attendance punch logs from the HiBi REST API
 *   https://toriiminds.com/backend/api/get-attendancelogs
 *
 * API Response format (array of objects):
 *   punch.after.EmployeeCode  — e.g. "0004"
 *   punch.after.timestamp     — ISO timestamp string (UTC)
 *   punch.after.Serialnumber  — device serial, e.g. "NCD8244900467"
 *
 * LEGACY (SOAP): The old eTimeTrackLite SOAP functions are kept below
 *   but are no longer called by default.
 */

const axios = require('axios');
const https = require('https');

// ─── REST API Config (PRIMARY) ─────────────────────────────────────────────
const REST_API_URL = process.env.FRS_REST_URL || 'https://toriiminds.com/backend/api/get-attendancelogs';

// ─── SOAP Config (LEGACY – kept for reference) ─────────────────────────────
const FRS_URL = process.env.FRS_SOAP_URL || 'http://frs.toriiminds.com/WebAPIService.asmx';
const FRS_USERNAME = process.env.FRS_API_USERNAME || 'essl';
const FRS_PASSWORD = process.env.FRS_API_PASSWORD || 'Essl@2025';

const TORII_DEVICES = [
    process.env.FRS_DEVICE_1 || 'NCD8244900467',
    process.env.FRS_DEVICE_2 || 'NCD8244900469',
];

const agent = new https.Agent({ rejectUnauthorized: false });

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY: Fetch punches from the HiBi REST API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch today's punches from the REST API.
 * Returns the same shape as the old SOAP function so the cron job works
 * without any changes:
 *   { employeeCode: string, punchTime: Date (UTC), direction: string }
 */
async function getPunchesFromRestAPI(fromDate, toDate) {
    try {
        console.log('[frsService] Fetching punches from REST API:', REST_API_URL);
        const response = await axios.get(REST_API_URL, { timeout: 30000 });
        const data = response.data;

        if (!Array.isArray(data) || data.length === 0) {
            console.log('[frsService] REST API returned no punches.');
            return [];
        }

        const rangeStart = new Date(fromDate);
        const rangeEnd = new Date(toDate);
        if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
            console.error('[frsService] Invalid REST API date range:', fromDate, toDate);
            return [];
        }

        const punches = [];
        for (const punch of data) {
            try {
                const raw = punch.after || punch; // support both { after: {...} } and flat objects

                const employeeCode = raw.EmployeeCode || raw.employeeCode;
                const timestampRaw = raw.timestamp || raw.punchTime;
                const deviceSerial = raw.Serialnumber || raw.serialNumber || 'REST_DEVICE';

                if (!employeeCode || !timestampRaw) continue;

                const punchTime = new Date(timestampRaw);
                if (isNaN(punchTime.getTime())) {
                    console.warn('[frsService] Invalid timestamp for employee:', employeeCode, timestampRaw);
                    continue;
                }

                if (punchTime < rangeStart || punchTime > rangeEnd) continue;

                punches.push({
                    employeeCode: String(employeeCode).trim(),
                    punchTime,
                    deviceSerial,
                    direction: 'in', // REST API does not provide direction; default to 'in'
                });
            } catch (err) {
                console.warn('[frsService] Skipped a punch record due to error:', err.message);
            }
        }

        console.log(`[frsService] REST API: ${punches.length} valid punches from ${rangeStart.toISOString()} to ${rangeEnd.toISOString()} (out of ${data.length} total records).`);
        return punches;

    } catch (err) {
        console.error('[frsService] REST API fetch failed:', err.message);
        return [];
    }
}

async function getTodaysPunchesFromRestAPI() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const fromDate = new Date(startOfDay.getTime() - 5.5 * 60 * 60 * 1000);
    return getPunchesFromRestAPI(fromDate, today);
}

/**
 * Convert IST datetime string to UTC Date object
 * FRS returns timestamps in IST (India Standard Time = UTC+5:30)
 */
function parseISTToUTC(istDateStr) {
    // "2026-04-15 08:53:01" is in IST
    const [datePart, timePart] = istDateStr.trim().split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, min, sec] = timePart.split(':').map(Number);
    // Build UTC: IST is UTC+5:30, so UTC = IST - 5h30m
    const utcMs = Date.UTC(year, month - 1, day, hour, min, sec) - (5.5 * 60 * 60 * 1000);
    return new Date(utcMs);
}

/**
 * Format a Date to "YYYY-MM-DD HH:mm:ss" in IST for the SOAP request
 */
function formatDateForSoap(date) {
    // Add IST offset to UTC to get IST time for the query
    const istMs = date.getTime() + (5.5 * 60 * 60 * 1000);
    const ist = new Date(istMs);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth()+1)}-${pad(ist.getUTCDate())} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
}

/**
 * Fetch punches from FRS for a single device serial
 * @returns {Promise<Array<{employeeCode, punchTime, deviceSerial, direction}>>}
 */
async function getPunchesForDevice(fromDate, toDate, serialNumber) {
    const from = formatDateForSoap(fromDate);
    const to = formatDateForSoap(toDate);

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTransactionsLog xmlns="http://tempuri.org/">
      <FromDateTime>${from}</FromDateTime>
      <ToDateTime>${to}</ToDateTime>
      <SerialNumber>${serialNumber}</SerialNumber>
      <UserName>${FRS_USERNAME}</UserName>
      <UserPassword>${FRS_PASSWORD}</UserPassword>
      <strDataList></strDataList>
    </GetTransactionsLog>
  </soap:Body>
</soap:Envelope>`;

    try {
        const response = await axios.post(FRS_URL, soapBody, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '"http://tempuri.org/GetTransactionsLog"',
            },
            httpsAgent: agent,
            timeout: 30000,
        });

        // Check for empty or unauthorized response
        if (response.data.includes('<GetTransactionsLogResult />') ||
            response.data.includes('<strDataList />')) {
            console.log(`[frsService] Device ${serialNumber}: no punches found`);
            return [];
        }

        // Extract the count result
        const resultMatch = response.data.match(/<GetTransactionsLogResult>([\s\S]*?)<\/GetTransactionsLogResult>/);
        const resultText = resultMatch ? resultMatch[1].trim() : '';
        if (resultText === 'Unathorised User') {
            console.error('[frsService] SOAP API: Unauthorised User — check credentials');
            return [];
        }

        // Extract strDataList (actual punch records)
        const dataMatch = response.data.match(/<strDataList>([\s\S]*?)<\/strDataList>/);
        if (!dataMatch || !dataMatch[1]) {
            console.log(`[frsService] Device ${serialNumber}: empty strDataList`);
            return [];
        }

        const rawData = dataMatch[1]
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();

        // Parse tab-separated lines: "empCode\tDate Time\tdirection"
        const punches = [];
        const lines = rawData.split('\n').filter(l => l.trim().length > 0);

        for (const line of lines) {
            const parts = line.trim().split(/\t|\s{2,}/); // split by tab or 2+ spaces
            if (parts.length < 2) continue;
            const employeeCode = parts[0].trim();
            // Reconstruct date+time (might be split across parts)
            const dateStr = `${parts[1].trim()} ${parts[2] ? parts[2].trim() : '00:00:00'}`;
            const direction = (parts[3] || 'in').trim().toLowerCase();

            if (!employeeCode || !dateStr) continue;

            const punchTime = parseISTToUTC(dateStr);
            if (isNaN(punchTime.getTime())) {
                console.warn(`[frsService] Could not parse time: "${dateStr}" for ${employeeCode}`);
                continue;
            }

            punches.push({ employeeCode, punchTime, deviceSerial: serialNumber, direction });
        }

        console.log(`[frsService] Device ${serialNumber}: ${punches.length} punches (${resultText})`);
        return punches;

    } catch (err) {
        console.error(`[frsService] Error fetching device ${serialNumber}:`, err.message);
        return [];
    }
}

/**
 * Fetch today's punches from ALL TORII devices
 * @returns {Promise<Array<{employeeCode, punchTime, deviceSerial, direction}>>}
 */
async function getTodaysPunchesFromFRS() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0); // midnight UTC (= 5:30 AM IST)

    // Go back to previous day midnight IST to catch early morning punches
    const fromDate = new Date(startOfDay.getTime() - 5.5 * 60 * 60 * 1000);

    const allPunches = [];
    for (const serial of TORII_DEVICES) {
        try {
            const punches = await getPunchesForDevice(fromDate, now, serial);
            allPunches.push(...punches);
        } catch (err) {
            console.error(`[frsService] Failed for device ${serial}:`, err.message);
        }
    }

    console.log(`[frsService] Total punches from all TORII devices: ${allPunches.length}`);
    return allPunches;
}

/**
 * Fetch punches for a custom date range from ALL TORII devices
 */
async function getPunchesFromFRS(fromDate, toDate) {
    const allPunches = [];
    for (const serial of TORII_DEVICES) {
        const punches = await getPunchesForDevice(fromDate, toDate, serial);
        allPunches.push(...punches);
    }
    return allPunches;
}

module.exports = {
    // PRIMARY — REST API (active)
    getTodaysPunchesFromRestAPI,
    getPunchesFromRestAPI,
    // LEGACY — SOAP API (kept for reference)
    getPunchesFromFRS,
    getTodaysPunchesFromFRS,
    getPunchesForDevice,
};
