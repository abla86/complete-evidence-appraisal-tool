import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { createLicensePayload, signLicense } from '../src/services/licenseServer';
import { parseLicenseToken, productAllowedInEdition, verifyLicenseToken } from '../src/services/licenseService';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
const publicRaw = (publicKey.export({ format: 'jwk' }) as { x: string }).x;

test('a licence signed on the server verifies offline with only the public key', async () => {
  const token = signLicense(createLicensePayload({ product: 'offline', licensee: 'Skole AS', seats: 30, expiresAt: null }), privateKey);
  const check = await verifyLicenseToken(token, publicRaw);
  assert.equal(check.valid, true);
  assert.equal(check.payload?.product, 'offline');
  assert.equal(check.payload?.seats, 30);
  assert.equal(check.payload?.expiresAt, null);
});

test('tampering with the payload invalidates the signature', async () => {
  const token = signLicense(createLicensePayload({ product: 'online', licensee: 'a@b.no', expiresAt: new Date(Date.now() + 86_400_000).toISOString() }), privateKey);
  const [prefix, , signature] = token.split('.');
  const forged = { ...parseLicenseToken(token)!, product: 'offline', expiresAt: null };
  const forgedToken = `${prefix}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${signature}`;
  const check = await verifyLicenseToken(forgedToken, publicRaw);
  assert.equal(check.valid, false);
  assert.match(check.reason ?? '', /signatur/);
});

test('a licence from another key is rejected', async () => {
  const other = crypto.generateKeyPairSync('ed25519').privateKey;
  const token = signLicense(createLicensePayload({ product: 'offline', licensee: 'x', expiresAt: null }), other);
  assert.equal((await verifyLicenseToken(token, publicRaw)).valid, false);
});

test('expired licences are rejected', async () => {
  const token = signLicense(createLicensePayload({ product: 'trial', licensee: 'x', expiresAt: new Date(Date.now() - 1000).toISOString() }), privateKey);
  const check = await verifyLicenseToken(token, publicRaw);
  assert.equal(check.valid, false);
  assert.match(check.reason ?? '', /utløp/);
});

test('missing public key or malformed tokens never validate', async () => {
  const token = signLicense(createLicensePayload({ product: 'offline', licensee: 'x', expiresAt: null }), privateKey);
  assert.equal((await verifyLicenseToken(token, '')).valid, false);
  assert.equal((await verifyLicenseToken('EAT1.abc.def', publicRaw)).valid, false);
  assert.equal((await verifyLicenseToken('not-a-token', publicRaw)).valid, false);
});

test('only the one-time download licence unlocks the downloadable edition', () => {
  assert.equal(productAllowedInEdition('offline', 'offline'), true);
  assert.equal(productAllowedInEdition('online', 'offline'), false);
  assert.equal(productAllowedInEdition('trial', 'offline'), false);
  for (const product of ['offline', 'online', 'trial'] as const) assert.equal(productAllowedInEdition(product, 'web'), true);
});
