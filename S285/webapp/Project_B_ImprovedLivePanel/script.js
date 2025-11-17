// Improved behavior: structured UI, manual refresh, optimistic updates, network simulation
const stateEl = document.getElementById('state');
const queueEl = document.getElementById('queue');
const healthEl = document.getElementById('health');
const statusNote = document.getElementById('status-note');
const announce = document.getElementById('announce');

let appState = {state:'NORMAL', queue:0, health:'OK', programs:[{id:'p1',title:'Light Themes',available:true},{id:'p2',title:'Sound Garden',available:true}], messages:[] };
let networkMode = 'good';
let pending = [];

function setState(s){
  appState = {...appState,...s};
  stateEl.textContent = appState.state;
  queueEl.textContent = appState.queue;
  healthEl.textContent = appState.health;
  if(appState.state==='PAUSED' || appState.state==='MAINTENANCE'){
    statusNote.textContent = 'Interactions are temporarily disabled — '+appState.state;
  }else if(appState.state==='CROWDED'){
    statusNote.textContent = 'High demand — expect wait times';
  }else{
    statusNote.textContent = '';
  }
  renderPrograms();
  renderQueue();
}

function renderPrograms(){
  const el = document.getElementById('program-list');
  el.innerHTML='';
  if(appState.programs.length===0){
    el.innerHTML = '<div class="text-sm text-slate-500">No programs available. Explore other installations nearby.</div>';
    return;
  }
  appState.programs.forEach(p=>{
    const div = document.createElement('div');
    div.className='p-3 bg-slate-50 rounded border';
    const title = document.createElement('div'); title.className='font-semibold'; title.textContent=p.title;
    const btn = document.createElement('button');
    btn.className='btn mt-2';
    btn.textContent='Interact';
    btn.disabled = (appState.state==='PAUSED'||appState.state==='MAINTENANCE')||!p.available;
    btn.addEventListener('click',()=>handleProgramInteract(p));
    div.appendChild(title); div.appendChild(btn);
    el.appendChild(div);
  });
}

function renderQueue(){
  const list = document.getElementById('queue-list');
  list.innerHTML = '';
  const q = appState.queue;
  if(q===0) list.innerHTML='<div class="text-sm text-slate-500">No one in queue</div>';
  else list.innerHTML = `<div class="text-sm">Approximately ${q*2} minutes wait</div>`;
}

function showToast(msg){
  const t = document.createElement('div'); t.className='p-2 bg-emerald-50 border-l-4 border-emerald-200 text-sm rounded'; t.textContent=msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(()=>t.remove(),4000);
}

async function networkSend(payload){
  // simulate slow or flakey networks
  const mode = networkMode;
  if(mode==='slow') await new Promise(r=>setTimeout(r,2000));
  if(mode==='flaky' && Math.random()<0.5) throw new Error('Transient network error');
  return {ok:true};
}

async function handleProgramInteract(program){
  // optimistic UI: assume success
  showToast('Submitting interaction...');
  pending.push(program.id);
  try{
    const res = await networkSend({action:'interact',program:program.id});
    pending = pending.filter(id=>id!==program.id);
    if(res.ok){
      showToast('Interaction accepted');
    }
  }catch(e){
    pending = pending.filter(id=>id!==program.id);
    // show retry
    const r = confirm('Failed to submit due to network. Retry?');
    if(r) handleProgramInteract(program);
  }
}

// Live Wall
const messagesEl = document.getElementById('messages');
async function sendMessage(text){
  if(appState.state==='PAUSED' || appState.state==='MAINTENANCE') return showToast('Messaging disabled');
  addMessage({text,local:true});
  try{
    await networkSend({msg:text});
    showToast('Message posted');
  }catch(e){
    const retry = confirm('Message failed. Retry?');
    if(retry) sendMessage(text);
    else showToast('Message failed permanently');
  }
}

function addMessage(m){
  appState.messages.push(m);
  const d = document.createElement('div'); d.className='text-sm p-1'; d.textContent = m.text+(m.local?' (pending)':'');
  messagesEl.appendChild(d);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// tabs
document.querySelectorAll('[role=tab]').forEach(btn=>btn.addEventListener('click',(e)=>{
  document.querySelectorAll('[role=tab]').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('[role=tab]').forEach(b=>b.setAttribute('aria-selected','false'));
  e.currentTarget.classList.add('active'); e.currentTarget.setAttribute('aria-selected','true');
  const t = e.currentTarget.dataset.tab;
  document.querySelectorAll('[role=tabpanel]').forEach(p=>p.hidden=true);
  document.getElementById('tab-'+t).hidden=false;
}));

// inputs
document.getElementById('send-btn').addEventListener('click',()=>{
  const txt = document.getElementById('msg-input').value;
  if(!txt) return;
  sendMessage(txt);
  document.getElementById('msg-input').value = '';
});

// manual refresh
document.getElementById('refresh-btn').addEventListener('click',()=>{
  fetchStatusAndUpdate();
});

async function fetchStatusAndUpdate(){
  // simulate fetch
  showToast('Refreshing...');
  try{
    await networkSend({action:'status'});
    showToast('Refreshed');
  }catch(e){
    showToast('Failed to refresh');
  }
}

// keyboard accessibility
document.addEventListener('keydown',(e)=>{
  if(e.key==='/' && document.activeElement.tagName !== 'INPUT'){
    e.preventDefault(); document.getElementById('msg-input').focus();
  }
});

// initial render
setState(appState);

// Expose for tests
window.__app = {setState,setNetworkMode:(m)=>networkMode=m, getState:()=>appState};
