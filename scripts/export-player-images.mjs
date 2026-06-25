import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';

const rootDir = resolve(process.cwd());
const outputDir = resolve(process.argv[2] ?? join(rootDir, 'season-export'));
const sourcePath = join(rootDir, 'staticData.ts');
const sourceFile = ts.createSourceFile(
  sourcePath,
  readFileSync(sourcePath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

let initializer;
const visit = (node) => {
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === 'PLAYER_IMAGES'
  ) {
    initializer = node.initializer;
    return;
  }
  ts.forEachChild(node, visit);
};
visit(sourceFile);

if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
  throw new Error('Unable to read PLAYER_IMAGES from staticData.ts');
}

const images = {};
for (const property of initializer.properties) {
  if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer)) {
    throw new Error(`Unsupported PLAYER_IMAGES entry: ${property.getText()}`);
  }

  const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
    ? property.name.text
    : null;

  if (!name) throw new Error(`Unsupported PLAYER_IMAGES key: ${property.name.getText()}`);

  images[name] = property.initializer.text
    .replace(/^\/+/, '')
    .replace(/^d-league\//, '');
}

const target = join(outputDir, 'data/seasons/2025-26/playerImages.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(images, null, 2)}\n`, 'utf8');
console.log(`Exported ${Object.keys(images).length} player images`);
