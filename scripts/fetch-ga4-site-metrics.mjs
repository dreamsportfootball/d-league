import { createSign } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const propertyId = process.env.GA4_PROPERTY_ID?.trim();
const serviceAccountJson = process.env.GA4_SERVICE_ACCOUNT_JSON?.trim();
const outputPath = fileURLToPath(new URL('../public/data/site-metrics.json', import.meta.url));

if (!propertyId || !serviceAccountJson) {
  console.log('GA4 reporting credentials are not configured; keeping the existing site metrics file.');
  process.exit(0);
}

const credentials = JSON.parse(serviceAccountJson);
const clientEmail = credentials.client_email;
const privateKey = credentials.private_key;

if (typeof clientEmail !== 'string' || typeof privateKey !== 'string') {
  throw new Error('GA4 service account JSON must include client_email and private_key.');
}

const toBase64Url = (value) => Buffer.from(value).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const payload = toBase64Url(
  JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }),
);
const unsignedToken = `${header}.${payload}`;
const signer = createSign('RSA-SHA256');
signer.update(unsignedToken);
signer.end();
const assertion = `${unsignedToken}.${signer.sign(privateKey, 'base64url')}`;

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  }),
});

if (!tokenResponse.ok) {
  throw new Error(`Google OAuth request failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
}

const tokenPayload = await tokenResponse.json();
const accessToken = tokenPayload.access_token;

if (typeof accessToken !== 'string') {
  throw new Error('Google OAuth response did not include an access token.');
}

const reportResponse = await fetch(
  `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
  {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '2026-06-26', endDate: 'today' }],
      metrics: [{ name: 'screenPageViews' }],
    }),
  },
);

if (!reportResponse.ok) {
  throw new Error(`GA4 Data API request failed: ${reportResponse.status} ${await reportResponse.text()}`);
}

const report = await reportResponse.json();
const rawValue = report.rows?.[0]?.metricValues?.[0]?.value ?? '0';
const totalViews = Number.parseInt(rawValue, 10);

if (!Number.isInteger(totalViews) || totalViews < 0) {
  throw new Error(`GA4 returned an invalid screenPageViews value: ${rawValue}`);
}

await writeFile(
  outputPath,
  `${JSON.stringify({ totalViews, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  'utf8',
);

console.log(`Updated cumulative site views: ${totalViews}`);
