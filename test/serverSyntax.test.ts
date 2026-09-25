import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

test('server entrypoint remains valid TypeScript syntax', () => {
  const serverPath = path.resolve(process.cwd(), 'server.ts');
  const source = readFileSync(serverPath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: serverPath,
    reportDiagnostics: true
  });

  const diagnostics = output.diagnostics ?? [];
  assert.equal(
    diagnostics.length,
    0,
    diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('\n')
  );
});
