import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import http from 'node:http';

import { createApp } from '../src/api/http.js';

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = http.createServer(createApp());
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Test server did not expose a TCP port');
  }

  try {
    return await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
}

test('extract rejects paths outside the configured upload directory', async () => {
  await withServer(async baseUrl => {
    const outsidePath = path.resolve(process.cwd(), 'outside-test-file.txt');
    const response = await fetch(`${baseUrl}/api/research/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filePath: outsidePath })
    });

    assert.equal(response.status, 403);
    const body = await response.json() as { success: boolean; error: string };
    assert.equal(body.success, false);
    assert.match(body.error, /inside the configured research upload directory/);
  });
});

test('health endpoint is available through the application', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: 'ok',
      service: 'academic-research-engine',
      version: '1.0.0'
    });
  });
});
