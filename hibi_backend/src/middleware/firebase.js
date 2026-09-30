const admin = require('firebase-admin');

// serviceAccountKey.json is a gitignored secret; without it, push
// notifications are disabled but the server still boots.
try {
  const serviceAccount = require('../../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.warn(
    '[firebase] serviceAccountKey.json not found — Firebase Admin not initialized, push notifications disabled.'
  );
}

module.exports = admin;
