import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const result = spawnSync(
  process.execPath,
  ['./node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false'],
  { encoding: 'utf8' },
);

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
writeFileSync('typecheck.log', output || 'TypeScript completed without output.\n', 'utf8');
process.stdout.write(output);
process.exit(result.status ?? 1);
