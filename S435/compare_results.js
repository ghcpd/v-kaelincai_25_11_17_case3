const fs = require('fs');
const prePath = './results/results_pre.json';
const postPath = './results/results_post.json';
const out = './compare_report.md';
function safeRead(p){ if(!fs.existsSync(p)) return []; return JSON.parse(fs.readFileSync(p)); }
const pre = safeRead(prePath); const post = safeRead(postPath);
let md = '# Compare Report: Baseline vs Improved\n\n';
function summarize(arr){ const passed = arr.filter(x=>x.passed).length; return `${passed}/${arr.length}`; }
md += `## Summary\n- Baseline passed: ${summarize(pre)}\n- Improved passed: ${summarize(post)}\n\n`;
md += '## Per Scenario\n\n';
const ids = new Set([...(pre||[]).map(x=>x.id), ...(post||[]).map(x=>x.id)]);
ids.forEach(id=>{
  const p = (pre||[]).find(x=>x.id===id);
  const q = (post||[]).find(x=>x.id===id);
  md += `### Scenario ${id}\n- Baseline: ${p && p.passed ? 'PASSED' : 'FAILED' }\n- Improved: ${q && q.passed ? 'PASSED' : 'FAILED' }\n\n`;
});
// compute metrics
function metrics(arr){ const total=arr.length; const passed=arr.filter(x=>x.passed).length; const a11yPass = arr.filter(x=>x.assertions && x.assertions.some(a=>a.a11y===true)).length; return {total, passed, passPercent: Math.round((passed/total)*100), a11yPass}; }
const mPre = metrics(pre||[]); const mPost = metrics(post||[]);
md += `\n## Metrics\n- Scenarios executed (baseline): ${mPre.total}\n- Passed: ${mPre.passed} (${mPre.passPercent}%)\n- Accessibility checks passed: ${mPre.a11yPass}\n- Scenarios executed (improved): ${mPost.total}\n- Passed: ${mPost.passed} (${mPost.passPercent}%)\n- Accessibility checks passed: ${mPost.a11yPass}\n\n`;
md += '## Notes\n- Improved UI aimed to add clear status area, tabs, optimistic updates, and network simulation.\n- Visual changes are validated via DOM assertions; accessibility checks use axe-core and are included in results.\n';
fs.writeFileSync(out, md);
console.log('compare_report.md generated');
