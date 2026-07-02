/**
 * test-frs.js
 * Run with: node test-frs.js
 * 
 * Tests the connection to frs.toriiminds.com eTimeTrackLite SOAP API
 * and prints the raw punch data so we can verify the format.
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');

const FRS_URL = 'http://frs.toriiminds.com/WebAPIService.asmx';
const FRS_USERNAME = 'essl';
const FRS_PASSWORD = 'Essl@2025';

// TORII device serials found in FRS dashboard:
// TORII-1F-SF: NCD8244900467
// TORII-2F-S3: NCD8244900469
// Leave empty to get ALL devices
const FRS_SERIAL = process.env.FRS_SERIAL_NUMBER || '';

const agent = new https.Agent({ rejectUnauthorized: false });

async function testFRS() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Try both date formats eTimeTrackLite might expect
    const fmtISO = (d) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const fmtUS = (d) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // Try also with wider range (last 7 days) to ensure we catch any records
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const testCases = [
        { label: 'ISO format (today)', from: fmtISO(startOfDay), to: fmtISO(now), serial: '' },
        { label: 'US format (today)', from: fmtUS(startOfDay), to: fmtUS(now), serial: '' },
        { label: 'ISO format (7 days)', from: fmtISO(sevenDaysAgo), to: fmtISO(now), serial: '' },
        { label: 'ISO format + TORII-1F device', from: fmtISO(startOfDay), to: fmtISO(now), serial: 'NCD8244900467' },
        { label: 'ISO format + TORII-2F device', from: fmtISO(startOfDay), to: fmtISO(now), serial: 'NCD8244900469' },
    ];

    for (const tc of testCases) {
        console.log(`\n🧪 Testing: ${tc.label} | from: ${tc.from} to: ${tc.to}`);
        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTransactionsLog xmlns="http://tempuri.org/">
      <FromDateTime>${tc.from}</FromDateTime>
      <ToDateTime>${tc.to}</ToDateTime>
      <SerialNumber>${tc.serial}</SerialNumber>
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

            if (response.data.includes('<GetTransactionsLogResult />')) {
                console.log('  ⚠️  Empty result (no data)');
                continue;
            }

            // Extract GetTransactionsLogResult (count/status)
            const resultMatch = response.data.match(/<GetTransactionsLogResult>([\s\S]*?)<\/GetTransactionsLogResult>/);
            const resultText = resultMatch ? resultMatch[1].trim() : '';

            // Extract strDataList (the actual punch records)
            const dataMatch = response.data.match(/<strDataList>([\s\S]*?)<\/strDataList>/);
            const dataRaw = dataMatch ? dataMatch[1]
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim() : '';

            if (resultText === 'Unathorised User') {
                console.log('  ❌ Unauthorised User');
                continue;
            }

            console.log(`  ✅ Result: ${resultText}`);

            if (dataRaw) {
                console.log(`\n  📊 PUNCH DATA (strDataList):`);
                console.log('  ' + '─'.repeat(70));
                console.log(dataRaw.substring(0, 1000));
                console.log('  ' + '─'.repeat(70));
                // Try to parse lines
                const lines = dataRaw.split('\n').filter(l => l.trim().length > 0);
                console.log(`  Total lines: ${lines.length}`);
                console.log('  First 5 lines:');
                lines.slice(0, 5).forEach((l, i) => console.log(`    [${i+1}] ${l}`));
                break;
            } else {
                console.log('  ⚠️  strDataList is empty — punch records may need different params');
            }
        } catch (err) {
            console.error(`  ❌ Error: ${err.message}`);
        }
    }


    process.exit(0);
}

testFRS();
