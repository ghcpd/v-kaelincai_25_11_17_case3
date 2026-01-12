// Minimal baseline interactions
const stateEl = document.getElementById('state');
const queueEl = document.getElementById('queue');
const healthEl = document.getElementById('health');

let state = 'NORMAL';
let queue = 2;

function render(){
  stateEl.textContent = state;
  queueEl.textContent = queue;
}

render();

// Flawed behavior: aggressive refresh every 3s causing jank
setInterval(()=>{
  // simulate minor changes
  if(Math.random()>0.7){
    queue += Math.random()>0.5?1:-1;
    if(queue<0)queue=0;
  }
  render();
},3000);

// minimal click handlers
document.querySelectorAll('.vote').forEach(btn=>{
  btn.addEventListener('click',()=>{
    alert('Vote recorded (baseline)');
  });
});

const sendBtn = document.getElementById('send-btn');
sendBtn.addEventListener('click',()=>{
  const msg = document.getElementById('msg-input').value || '(empty)';
  const list = document.getElementById('messages');
  const el = document.createElement('div');
  el.className='msg';
  el.textContent = msg;
  list.appendChild(el);
});
