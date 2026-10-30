#!/usr/bin/env node
// Generates the seller's Ed25519 licence key pair. Run once and store the private key as a secret.
//   node scripts/license-keygen.mjs
// LICENSE_PRIVATE_KEY  -> server secret (Render/Docker env). Never commit it, never put it in a VITE_ variable.
// VITE_LICENSE_PUBLIC_KEY -> build-time variable; embedded in the app to verify licences offline.
import crypto from 'node:crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
const privateDer = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64url');
const publicRaw = publicKey.export({ format: 'jwk' }).x;

console.log('# Keep the private key secret (password manager / hosting secret store).');
console.log(`LICENSE_PRIVATE_KEY=${privateDer}`);
console.log(`VITE_LICENSE_PUBLIC_KEY=${publicRaw}`);
