import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const forbiddenExtensions = new Set(['.map', '.env', '.pem', '.key', '.p12', '.pfx']);
const textExtensions = new Set(['.js', '.html', '.json', '.txt', '.xml', '.css']);
const forbiddenContents = [
  { label: 'unpublished player birth date', pattern: /\\bbirthDate\\b/ },
  { label: 'private service-account credentials', pattern: /(?:GA4_SERVICE_ACCOUNT_JSON|GEMINI_API_KEY|BEGIN (?:RSA |EC )?PRIVATE KEY|private_key|client_secret)/ },
  { label: 'embedded provider key/token', pattern: /(?:AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9_]{30,}|sk_(?:live|test)_[A-Za-z0-9]{20,})/ },
];

const failures = [];
let inspected = 0;

const visit = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    const path = relative(distDir, fullPath);
    const ext = extname(path).toLowerCase();
    if (forbiddenExtensions.has(ext) || /(?:^|\\/)\\.env(?:\\.|$)/.test(path)) {
      failures.push(path + ': secret, environment or source-map file included in public build');
      continue;
    }
    if (!textExtensions.has(ext)) continue;
    inspected += 1;
    const contents = await readFile(fullPath, 'utf8');
    for (const { label, pattern } of forbiddenContents) {
      if (pattern.test(contents)) failures.push(path + ': ' + label);
    }
  }
};

await visit(distDir);
if (failures.length) {
  console.error('Public build privacy validation failed:');
  for (const problem of failures) console.error('- ' + problem);
  process.exitCode = 1;
} else {
  console.log('Public build privacy validation passed (' + inspected + ' text assets checked)');
}
