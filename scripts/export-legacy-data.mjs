import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';

const rootDir = resolve(process.cwd());
const outputDir = resolve(process.argv[2] ?? join(rootDir, 'legacy-export'));

const readSource = (relativePath) => {
  const absolutePath = join(rootDir, relativePath);
  return {
    absolutePath,
    sourceFile: ts.createSourceFile(
      absolutePath,
      readFileSync(absolutePath, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    ),
  };
};

const propertyName = (node) => {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  throw new Error(`Unsupported property name: ${node.getText()}`);
};

const evaluate = (node) => {
  if (!node) return undefined;

  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    return evaluate(node.expression);
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isIdentifier(node)) {
    if (node.text === 'undefined') return undefined;
    throw new Error(`Unsupported identifier value: ${node.text}`);
  }

  if (ts.isPrefixUnaryExpression(node)) {
    const value = evaluate(node.operand);
    if (node.operator === ts.SyntaxKind.MinusToken) return -value;
    if (node.operator === ts.SyntaxKind.PlusToken) return +value;
    if (node.operator === ts.SyntaxKind.ExclamationToken) return !value;
  }

  if (ts.isTemplateExpression(node)) {
    let output = node.head.text;
    for (const span of node.templateSpans) {
      output += String(evaluate(span.expression));
      output += span.literal.text;
    }
    return output;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) {
        throw new Error(`Spread elements are not supported: ${element.getText()}`);
      }
      return evaluate(element);
    });
  }

  if (ts.isObjectLiteralExpression(node)) {
    const output = {};
    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        output[propertyName(property.name)] = evaluate(property.initializer);
        continue;
      }
      if (ts.isShorthandPropertyAssignment(property)) {
        throw new Error(`Shorthand properties are not supported: ${property.getText()}`);
      }
      if (ts.isSpreadAssignment(property)) {
        Object.assign(output, evaluate(property.expression));
        continue;
      }
      throw new Error(`Unsupported object property: ${property.getText()}`);
    }
    return output;
  }

  if (ts.isNewExpression(node)) {
    if (ts.isIdentifier(node.expression) && node.expression.text === 'Date') {
      const args = (node.arguments ?? []).map(evaluate);
      return new Date(...args);
    }
  }

  if (ts.isCallExpression(node)) {
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'toISOString'
    ) {
      const target = evaluate(node.expression.expression);
      if (target instanceof Date) return target.toISOString();
    }
  }

  throw new Error(`Unsupported syntax: ${ts.SyntaxKind[node.kind]} :: ${node.getText()}`);
};

const findVariableInitializer = (sourceFile, variableName) => {
  let initializer;

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      initializer = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (!initializer) {
    throw new Error(`Unable to find exported variable ${variableName}`);
  }

  return initializer;
};

const extractVariable = (relativePath, variableName) => {
  const { sourceFile } = readSource(relativePath);
  return evaluate(findVariableInitializer(sourceFile, variableName));
};

const normalizeAssetPath = (value) => {
  if (!value || /^https?:\/\//.test(value)) return value;
  return String(value).replace(/^\/+/, '').replace(/^d-league\//, '');
};

const ensureUnique = (items, label) => {
  const ids = new Set();
  for (const item of items) {
    if (!item.id) throw new Error(`${label} contains an item without id`);
    if (ids.has(item.id)) throw new Error(`${label} contains duplicate id: ${item.id}`);
    ids.add(item.id);
  }
};

const writeJson = (relativePath, value) => {
  const target = join(outputDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const players = extractVariable('playerData.ts', 'ALL_PLAYERS');
const matchEvents = extractVariable('matchData.ts', 'MATCH_EVENTS');
const media = extractVariable('matchData.ts', 'MOCK_VIDEOS').map((item) => ({
  ...item,
  thumbnail: normalizeAssetPath(item.thumbnail),
}));
const news = extractVariable('services/geminiService.ts', 'MOCK_NEWS').map((item) => ({
  ...item,
  seasonId: '2025-26',
  imageUrl: normalizeAssetPath(item.imageUrl),
}));

const teams = JSON.parse(
  readFileSync(join(rootDir, 'data/seasons/2025-26/teams.json'), 'utf8'),
);
const matches = JSON.parse(
  readFileSync(join(rootDir, 'data/seasons/2025-26/matches.json'), 'utf8'),
);

ensureUnique(players, 'players');
ensureUnique(media, 'media');
ensureUnique(news, 'news');

const teamIds = new Set(teams.map((team) => team.id));
for (const player of players) {
  if (!teamIds.has(player.teamId)) {
    throw new Error(`Player ${player.id} references unknown team ${player.teamId}`);
  }
}

const matchIds = new Set(matches.map((match) => match.id));
for (const matchId of Object.keys(matchEvents)) {
  if (!matchIds.has(matchId)) {
    throw new Error(`Match events reference unknown match ${matchId}`);
  }
}

writeJson('data/seasons/2025-26/players.json', players);
writeJson('data/seasons/2025-26/matchEvents.json', matchEvents);
writeJson('data/seasons/2025-26/media.json', media);
writeJson('data/seasons/2025-26/news.json', news);
writeJson('migration-report.json', {
  generatedAt: new Date().toISOString(),
  counts: {
    players: players.length,
    matchesWithEvents: Object.keys(matchEvents).length,
    events: Object.values(matchEvents).reduce((sum, events) => sum + events.length, 0),
    media: media.length,
    news: news.length,
  },
});

console.log(`Legacy season data exported to ${outputDir}`);
