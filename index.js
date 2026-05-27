const fs = require('fs');
const token = process.env.DEPLOY_TOKEN || 'NOT_SET';
console.log('=== PRODUCTION DEPLOY ===');
console.log('Token preview:', token.substring(0, 8) + '...');

// Simular uso de helper module (instalado via cache)
const helperPath = './node_modules/.bin/helper';
if (fs.existsSync('./node_modules/helper/index.js')) {
  console.log('[!] Loading helper module from cache...');
  require('./node_modules/helper/index.js');
} else {
  console.log('Normal deploy - no cache hit');
}
