const puppeteer = require('puppeteer');
const fs = require('fs');
const scenarios = require('../../shared/test_scenarios.json');

(async ()=>{
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const results = [];

  for(const s of scenarios){
    const res = {id:s.id, ok:true, errors:[]};
    try{
      await page.goto('http://localhost:3000', {waitUntil:'networkidle2'});
      // simple checks
      const state = await page.evaluate(()=>document.getElementById('state').textContent);
      if(state !== s.initial.state && s.initial.state) {
        res.ok=false; res.errors.push(`expected state ${s.initial.state} but got ${state}`);
      }
    }catch(e){
      res.ok=false; res.errors.push(e.message);
    }
    results.push(res);
  }

  await browser.close();
  fs.writeFileSync('results_pre.json',JSON.stringify({scenarios:results},null,2));
  console.log('Baseline tests done.');
})();
