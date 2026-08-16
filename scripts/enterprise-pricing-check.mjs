import fs from 'node:fs';
const src = fs.readFileSync(new URL('../src/data/enterprisePricing.ts', import.meta.url), 'utf8');
const checks = [
 ['1 store free', /id:'free-1'[\s\S]*monthlyPrice:0/],
 ['2-5 stores $49', /minLocations:2, maxLocations:5[\s\S]*monthlyPrice:49/],
 ['6-10 stores $99', /minLocations:6, maxLocations:10[\s\S]*monthlyPrice:99/],
 ['11-20 stores $199', /minLocations:11, maxLocations:20[\s\S]*monthlyPrice:199/],
 ['21-50 stores $399', /minLocations:21, maxLocations:50[\s\S]*monthlyPrice:399/],
 ['51-100 stores $699', /minLocations:51, maxLocations:100[\s\S]*monthlyPrice:699/],
 ['101-200 stores $1199', /minLocations:101, maxLocations:200[\s\S]*monthlyPrice:1199/],
 ['201-500 stores $2499', /minLocations:201, maxLocations:500[\s\S]*monthlyPrice:2499/],
 ['501-1000 stores $3999', /minLocations:501, maxLocations:1000[\s\S]*monthlyPrice:3999/],
 ['1001-2000 stores $5999', /minLocations:1001, maxLocations:2000[\s\S]*monthlyPrice:5999/],
 ['2001+ custom', /minLocations:2001, maxLocations:null[\s\S]*monthlyPrice:-1/],
 ['paid employees unlimited', /maxEmployees:-1/],
];
let fail=0; for(const [name,re] of checks){if(re.test(src)) console.log(`PASS: ${name}`); else {console.error(`FAIL: ${name}`); fail++;}}
if(fail) process.exit(1); console.log(`Enterprise pricing gate passed (${checks.length}/${checks.length}).`);
