#!/usr/bin/env node
// Parse docs/scenarios/*.feature into build/harness/indexes/scenarios.index.json.
//
// Subset of Gherkin supported (Cucumber 런타임은 사용하지 않음):
//   - Feature: <title>           (1 per file)
//   - Scenario: <title>          (0..n per feature)
//   - @TAG lines (Feature/Scenario level, including @REQ-XXX)
//   - Covers: 블록 + `- AC 문장` 행 (Scenario description의 비표준 확장)
//   - Given/When/Then/And/But step 줄
//   - `#`로 시작하는 코멘트 줄과 빈 줄은 무시
//
// 지원하지 않음 (만나면 issue로 보고):
//   - Background:
//   - Scenario Outline: / Examples:
//   - DocString """ ... """ / Data Table | ... |
//   - `# language: ...` dialect 지시자 (영어 키워드 + 한국어 본문이 표준)

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const scenariosDir = path.join(repoRoot, 'docs', 'scenarios');
const outDir = path.join(repoRoot, 'build', 'harness', 'indexes');
const outFile = path.join(outDir, 'scenarios.index.json');

const STEP_KEYWORDS = ['Given', 'When', 'Then', 'And', 'But'];
const UNSUPPORTED_KEYWORDS = ['Background:', 'Scenario Outline:', 'Examples:', 'Rule:'];

function isTagLine(text) {
  return /^@\S/.test(text);
}

function extractTags(text) {
  return text.split(/\s+/).filter(t => t.startsWith('@'));
}

function deriveRequirementIds(tags) {
  return tags
    .filter(t => /^@REQ-[A-Za-z0-9-]+$/.test(t))
    .map(t => t.slice(1));
}

function parseStep(text) {
  for (const kw of STEP_KEYWORDS) {
    if (text === kw) return { keyword: kw, text: '' };
    if (text.startsWith(kw + ' ')) return { keyword: kw, text: text.slice(kw.length + 1).trim() };
  }
  return null;
}

function parseFeatureFile(fileRel, source) {
  const feature = {
    file: fileRel,
    tags: [],
    requirementIds: [],
    title: null,
    line: null,
    scenarios: [],
    issues: [],
  };
  const lines = source.split(/\r?\n/);
  let pendingTags = [];
  let state = 'BEFORE_FEATURE'; // BEFORE_FEATURE | IN_FEATURE | IN_SCENARIO | IN_COVERS | IN_STEPS | IN_UNSUPPORTED
  let scenario = null;

  const finishScenario = () => {
    if (scenario) {
      feature.scenarios.push(scenario);
      scenario = null;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const lineNo = idx + 1;
    const trimmed = raw.trim();

    if (trimmed === '') continue;
    if (trimmed.startsWith('#')) {
      if (/^#\s*language\s*:/i.test(trimmed)) {
        feature.issues.push({
          line: lineNo,
          message: '`# language:` dialect 지시자는 사용하지 않는다. 영어 Gherkin 키워드 + 한국어 본문이 표준이다.',
        });
      }
      continue;
    }

    if (state === 'BEFORE_FEATURE') {
      if (isTagLine(trimmed)) {
        pendingTags.push(...extractTags(trimmed));
        continue;
      }
      if (trimmed.startsWith('Feature:')) {
        feature.tags = pendingTags;
        feature.requirementIds = deriveRequirementIds(pendingTags);
        pendingTags = [];
        feature.title = trimmed.slice('Feature:'.length).trim();
        feature.line = lineNo;
        state = 'IN_FEATURE';
        continue;
      }
      feature.issues.push({ line: lineNo, message: `Feature: 헤더 전에 알 수 없는 줄: ${trimmed}` });
      continue;
    }

    if (isTagLine(trimmed)) {
      pendingTags.push(...extractTags(trimmed));
      continue;
    }

    if (trimmed.startsWith('Scenario:')) {
      finishScenario();
      scenario = {
        title: trimmed.slice('Scenario:'.length).trim(),
        tags: pendingTags,
        line: lineNo,
        covers: [],
        steps: [],
      };
      pendingTags = [];
      state = 'IN_SCENARIO';
      continue;
    }

    const unsupportedHit = UNSUPPORTED_KEYWORDS.find(kw => trimmed.startsWith(kw));
    if (unsupportedHit) {
      feature.issues.push({
        line: lineNo,
        message: `${unsupportedHit} 는 현재 하네스가 지원하지 않음`,
      });
      state = 'IN_UNSUPPORTED';
      continue;
    }

    if (state === 'IN_UNSUPPORTED') {
      // 지원되지 않는 블록 본문은 다음 Scenario: 또는 새 태그를 만날 때까지 통째로 무시한다.
      continue;
    }

    if (trimmed === 'Covers:' || /^Covers:\s*$/.test(trimmed)) {
      if (!scenario) {
        feature.issues.push({ line: lineNo, message: 'Covers: 는 Scenario 안에서만 허용됨' });
        continue;
      }
      state = 'IN_COVERS';
      continue;
    }

    const step = parseStep(trimmed);
    if (step) {
      if (!scenario) {
        feature.issues.push({ line: lineNo, message: `step은 Scenario 안에서만 허용됨: ${trimmed}` });
        continue;
      }
      scenario.steps.push({ keyword: step.keyword, text: step.text, line: lineNo });
      state = 'IN_STEPS';
      continue;
    }

    if (state === 'IN_COVERS' && trimmed.startsWith('-')) {
      if (!scenario) continue;
      const ac = trimmed.replace(/^-\s*/, '').trim();
      if (ac) scenario.covers.push({ text: ac, line: lineNo });
      continue;
    }

    // Otherwise: free-text description. Tolerated, not captured.
  }
  finishScenario();

  if (!feature.title) {
    feature.issues.push({ line: 0, message: 'Feature: 헤더가 없음' });
  }
  if (feature.requirementIds.length === 0) {
    feature.issues.push({ line: feature.line ?? 0, message: '@REQ-XXX Feature 태그가 없음' });
  }

  return feature;
}

function listFeatureFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.feature'))
    .sort();
}

function main() {
  const features = [];
  const globalIssues = [];

  const files = listFeatureFiles(scenariosDir);
  for (const f of files) {
    const filePath = path.join(scenariosDir, f);
    const source = fs.readFileSync(filePath, 'utf8');
    const rel = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    features.push(parseFeatureFile(rel, source));
  }

  fs.mkdirSync(outDir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    scenariosDir: path.relative(repoRoot, scenariosDir).replace(/\\/g, '/'),
    features,
    issues: globalIssues,
  };
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');

  const scenarioCount = features.reduce((acc, f) => acc + f.scenarios.length, 0);
  const issueCount =
    globalIssues.length + features.reduce((acc, f) => acc + f.issues.length, 0);
  console.log(
    `scenarios.index.json: ${features.length} feature(s), ${scenarioCount} scenario(s), ${issueCount} issue(s)`,
  );
}

main();
