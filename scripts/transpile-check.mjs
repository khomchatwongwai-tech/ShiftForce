import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const roots = ['server.ts','src','scripts'];
const files=[];
function walk(p){ const st=fs.statSync(p); if(st.isDirectory()) for(const n of fs.readdirSync(p)) walk(path.join(p,n)); else if(/\.(ts|tsx)$/.test(p)) files.push(p); }
for(const r of roots) if(fs.existsSync(r)) walk(r);
let failed=0;
for(const f of files){ const source=fs.readFileSync(f,'utf8'); const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true}); const errs=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error); if(errs.length){ failed++; console.error(`FAIL ${f}`); for(const d of errs) console.error(ts.flattenDiagnosticMessageText(d.messageText,' ')); }}
if(failed) process.exit(1); console.log(`Transpile syntax gate passed (${files.length} files).`);
