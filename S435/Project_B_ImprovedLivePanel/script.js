// Improved panel: tabs, optimistic UI, manual refresh, network simulation
const MOCK_PROGRAMS = [
  {id:'p1', title: 'Aurora Light Theme'},
  {id:'p2', title: 'Breeze Soundscape'},
  {id:'p3', title: 'Map Projection'}
];
const appState = { status:'NORMAL', queue: 3, health:'OK', programs: MOCK_PROGRAMS, network: 'good' }; // 'good' | 'weak' | 'fail'
// override from mock state in localStorage (for testing)
try{ const ms = localStorage.getItem('mockState'); if(ms){ const p = JSON.parse(ms); Object.assign(appState, p); } }catch(e){}

function formatTime() { return new Date().toLocaleTimeString(); }

function setNetworkMode(mode){ appState.network = mode; document.getElementById('network-toggle').textContent = 'Network: '+ (mode==='good'?'Good':mode==='weak'?'Weak':'Fail'); }

function renderStatus(){
  document.getElementById('status').textContent = appState.status;
  document.getElementById('queue').textContent = appState.queue;
  document.getElementById('health').textContent = appState.health;
  document.getElementById('res-queue').textContent = appState.queue;
  document.getElementById('last-updated').textContent = formatTime();
  // state restrictions
  const disabled = appState.status==='PAUSED' || appState.status==='MAINTENANCE';
  document.getElementById('action-button').disabled = disabled;
  document.getElementById('reserve-button').disabled = disabled;
  const hint = document.getElementById('control-hint');
  if(disabled){ hint.textContent = appState.status==='PAUSED' ? 'Site paused — actions are disabled.' : 'Under maintenance — interactive actions are disabled.'; } else { hint.textContent = 'Select a program and press Vote Theme. You can also reserve a slot from Reservations tab.' }
}

function setPrograms(){
  const sel = document.getElementById('program-select'); sel.innerHTML='';
  appState.programs.forEach(p=>sel.appendChild(new Option(p.title,p.id)));
}

function showTab(id){
  document.getElementById('interaction-panel').classList.toggle('hidden', id!=='interaction');
  document.getElementById('livewall-panel').classList.toggle('hidden', id!=='livewall');
  document.getElementById('reservation-panel').classList.toggle('hidden', id!=='reservation');
  document.getElementById('tab-interaction').setAttribute('aria-selected', id==='interaction');
  document.getElementById('tab-livewall').setAttribute('aria-selected', id==='livewall');
  document.getElementById('tab-reservation').setAttribute('aria-selected', id==='reservation');
}

async function fakeRequest(data, opts={}){
  const delay = appState.network==='good'?300: appState.network==='weak'?1200: 2000;
  await new Promise(res=>setTimeout(res, delay));
  // deterministic override if present in appState via localStorage.forceFail or forceSuccess
  const ms = (()=>{ try{ return JSON.parse(localStorage.getItem('mockState')||null); }catch(e){ return null;} })();
  if(ms && ms.forceFail) throw new Error('Network error');
  if(ms && ms.forceSuccess) return {ok:true,data};
  if(appState.network==='fail' && Math.random()<0.7) throw new Error('Network error');
  return {ok:true, data};
}


async function vote(){
  const btn = document.getElementById('action-button');
  const sel = document.getElementById('program-select');
  const pid = sel.value; if(!pid) return;
  const label = sel.options[sel.selectedIndex].text;
  // optimistic update
  const feedback = document.getElementById('interaction-feedback');
  btn.disabled = true; feedback.textContent = `Voting for ${label}...`;
  try{
    const resp = await fakeRequest({result: 'ok'});
    feedback.textContent = `Vote recorded for ${label} at ${formatTime()}`;
  }catch(e){
    feedback.innerHTML = `<span class='text-red-600'>Failed to record vote. <button id='retry-vote' class='underline'>Retry</button></span>`;
    document.getElementById('retry-vote').addEventListener('click', vote);
  }finally{ btn.disabled = false; }
}

async function sendLive(){
  const input = document.getElementById('live-message-input'); if(!input.value) return;
  const val = input.value; input.value = '';
  const box = document.getElementById('livewall-messages');
  const el = document.createElement('div'); el.className='px-2 py-1 border rounded my-1'; el.textContent = `You: ${val}`; box.appendChild(el); box.scrollTop = box.scrollHeight; // optimistic
  try{ await fakeRequest({ok:true});
  }catch(e){ 
    const err = document.createElement('div'); err.className='text-red-600'; err.textContent='Failed to send message'; box.appendChild(err);
  }
}

function toggleNetwork(){
  if(appState.network==='good') setNetworkMode('weak');
  else if(appState.network==='weak') setNetworkMode('fail');
  else setNetworkMode('good');
}

function setupAccessibility(){
  // keyboard navigation for tabs
  document.querySelectorAll('[role=tab]').forEach(t=>{
    t.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowRight') { const next = t.nextElementSibling || document.querySelector('[role=tab]'); next.focus(); }
      if(e.key === 'ArrowLeft') { const prev = t.previousElementSibling || document.querySelector('[role=tab]:last-child'); prev.focus(); }
    });
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  setPrograms(); renderStatus();
  document.getElementById('action-button').addEventListener('click', vote);
  document.getElementById('send-live').addEventListener('click', sendLive);
  document.getElementById('network-toggle').addEventListener('click', toggleNetwork);
  document.getElementById('tab-interaction').addEventListener('click', ()=>showTab('interaction'));
  document.getElementById('tab-livewall').addEventListener('click', ()=>showTab('livewall'));
  document.getElementById('tab-reservation').addEventListener('click', ()=>showTab('reservation'));
  document.getElementById('reserve-button').addEventListener('click', async ()=>{
    const btn = document.getElementById('reserve-button'); btn.disabled=true; try{ await fakeRequest({ok:true}); appState.queue += 1; document.getElementById('res-queue').textContent = appState.queue; document.getElementById('interaction-feedback').textContent = 'Reservation confirmed'; }catch(e){ document.getElementById('interaction-feedback').textContent = 'Failed to reserve'; } finally{ btn.disabled=false; }
  });
  showTab('interaction');
  setupAccessibility();
});
