// Simple baseline behavior: single page, manual refresh, no optimistic updates
const MOCK_PROGRAMS = [
  {id: 'p1', title: 'Light Theme: Aurora'},
  {id: 'p2', title: 'Soundscape: Breeze'},
  {id: 'p3', title: 'Projection: City Map'}
];
let state = {status: 'NORMAL', queue: 2, health: 'OK', programs: MOCK_PROGRAMS};

// Check for mock state (for tests)
try{ const ms = localStorage.getItem('mockState'); if(ms){ const parsed = JSON.parse(ms); state = {...state, ...parsed}; } }catch(e){}

function render(){
  document.getElementById('status').textContent = state.status;
  document.getElementById('queue').textContent = state.queue;
  document.getElementById('health').textContent = state.health;

  const select = document.getElementById('program-select');
  select.innerHTML = '';
  state.programs.forEach(p => {
    const opt = document.createElement('option');opt.value = p.id; opt.textContent = p.title; select.appendChild(opt);
  });

  const list = document.getElementById('program-list');
  list.innerHTML = state.programs.map(p=>`<div>${p.title}</div>`).join('');

  // disable actions in PAUSED/MAINTENANCE
  const disabled = state.status === 'PAUSED' || state.status === 'MAINTENANCE';
  document.getElementById('action-button').disabled = disabled;
  if(disabled){ document.getElementById('messages').textContent = state.status === 'PAUSED' ? 'Site paused — actions are disabled.' : 'Under maintenance — actions disabled.' }
}

function refresh(){
  // fake request (fast)
  document.getElementById('messages').textContent = 'Refreshing...';
  setTimeout(()=>{ document.getElementById('messages').textContent = 'Refreshed'; }, 500);
}

function vote(){
  const btn = document.getElementById('action-button');
  btn.disabled = true; document.getElementById('messages').textContent = 'Submitting...';
  // fake request with random failure
  setTimeout(()=>{
    // deterministic behavior if mocked
    const ms = (()=>{try{ return JSON.parse(localStorage.getItem('mockState')||null);}catch(e){return null}})();
    if(ms && ms.forceFail){ document.getElementById('messages').textContent = 'Failed to submit. Try again.'; }
    else{ document.getElementById('messages').textContent = 'Vote recorded. Thank you.'; }
    btn.disabled = false;
  }, 800);
}

window.addEventListener('DOMContentLoaded', ()=>{
  render();
  document.getElementById('refresh').addEventListener('click', refresh);
  document.getElementById('action-button').addEventListener('click', vote);
});