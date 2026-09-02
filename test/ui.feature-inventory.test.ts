import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const appPath = resolve(process.cwd(), 'src/App.tsx');
const headerPath = resolve(process.cwd(), 'src/components/Header.tsx');

const requiredTabs = [
  'overview',
  'search',
  'details',
  'evaluate',
  'compare',
  'peer_review',
  'synthesis',
  'audittrail',
  'who_validation',
  'methodology_audit',
  'meta_research',
  'reference_library',
  'validation_dashboard',
  'help_examples',
  'instrumentinfo',
] as const;

test('historical ActiveTab inventory remains declared and rendered', async () => {
  const [app, header] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(headerPath, 'utf8'),
  ]);

  for (const tab of requiredTabs) {
    assert.match(header, new RegExp(`['"]${tab}['"]`), `Header must retain tab: ${tab}`);
    assert.match(app, new RegExp(`activeTab === ['"]${tab}['"]`), `App must retain rendered feature: ${tab}`);
  }
});

test('core Evidence Tool interactions remain wired', async () => {
  const [app, header] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(headerPath, 'utf8'),
  ]);

  assert.match(header, /onOpenPrivacyCenter/);
  assert.match(header, /onOpenDocAnalysis/);
  assert.match(header, /onOpenImportExport/);
  assert.match(header, /onOpenAutosave/);
  assert.match(header, /onNewArticle/);

  for (const marker of [
    'DocumentAnalysisModal',
    'ImportExportModal',
    'AutosaveModal',
    'GdprPrivacyCenterModal',
    'ToastProvider',
  ]) {
    assert.match(app, new RegExp(marker));
  }
});
