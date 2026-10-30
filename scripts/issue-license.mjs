#!/usr/bin/env node
// Issues a licence key manually (e.g. a school paying by invoice).
//   LICENSE_PRIVATE_KEY=... node scripts/issue-license.mjs --product offline --licensee "Skole AS" --seats 30
//   LICENSE_PRIVATE_KEY=... node scripts/issue-license.mjs --product online --licensee kari@example.no --days 365
// The token format must match src/services/licenseService.ts (EAT1.<payload>.<Ed25519 signature>).
import crypto from 'node:crypto';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : 'true']);
  return pairs;
}, []));

const product = args.product;
if (!['offline', 'online', 'trial'].includes(product)) throw new Error('--product must be offline, online or trial');
if (!args.licensee) throw new Error('--licensee is required (name or e-mail of the licence holder)');
const raw = (process.env.LICENSE_PRIVATE_KEY || '').trim();
if (!raw) throw new Error('Set LICENSE_PRIVATE_KEY (see scripts/license-keygen.mjs).');
const key = raw.includes('BEGIN') ? crypto.createPrivateKey(raw) : crypto.createPrivateKey({ key: Buffer.from(raw, 'base64url'), format: 'der', type: 'pkcs8' });

const days = args.days ? Number(args.days) : null;
if (product !== 'offline' && !days) throw new Error('--days is required for online and trial licences');
const payload = {
  v: 1,
  id: `lic_${crypto.randomUUID()}`,
  product,
  licensee: String(args.licensee).trim(),
  seats: Math.max(1, Number(args.seats || 1)),
  issuedAt: new Date().toISOString(),
  expiresAt: days ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
};
const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
const signature = crypto.sign(null, Buffer.from(`EAT1.${encoded}`, 'utf8'), key).toString('base64url');
console.error(`Licence ${payload.id} for ${payload.licensee} (${product}, ${payload.seats} seat(s), ${payload.expiresAt ? `expires ${payload.expiresAt}` : 'perpetual'})`);
console.log(`EAT1.${encoded}.${signature}`);
