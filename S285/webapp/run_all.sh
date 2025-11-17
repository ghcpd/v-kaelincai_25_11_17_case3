#!/usr/bin/env bash
set -e
ROOT=$(pwd)
mkdir -p results

# Run baseline
cd "$ROOT/Project_A_BaselineLivePanel"
./setup.sh || true
nohup python3 -m http.server 3000 > /tmp/html_server.log 2>&1 &
server_pid=$!
sleep 1
npm run test || true
kill $server_pid || true
mv results_pre.json "$ROOT/results/results_pre.json" || true
cp /tmp/html_server.log "$ROOT/results/log_pre.txt" || true

# Run improved
cd "$ROOT/Project_B_ImprovedLivePanel"
./setup.sh || true
nohup python3 -m http.server 3000 > /tmp/html_server.log 2>&1 &
server_pid=$!
sleep 1
npm run test || true
kill $server_pid || true
mv results_post.json "$ROOT/results/results_post.json" || true
cp /tmp/html_server.log "$ROOT/results/log_post.txt" || true

# Compare
python3 - <<'PY'
import json,sys
pre=json.load(open('results/results_pre.json'))
post=json.load(open('results/results_post.json'))
report={'summary':[]}
for p in pre['scenarios']:
  id=p['id']
  q=[x for x in post['scenarios'] if x['id']==id]
  r={'id':id,'pre_ok':p['ok'],'post_ok':(q[0]['ok'] if q else None)}
  report['summary'].append(r)
open('results/compare_report.md','w').write('# Compare Report\n\n'+json.dumps(report,indent=2))
print('Report generated')
PY

echo 'All done. Results in ./results'