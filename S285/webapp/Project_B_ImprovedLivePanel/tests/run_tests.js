const puppeteer = require('puppeteer');
const fs = require('fs');
const scenarios = require('../../shared/test_scenarios.json');
(async ()=>{
  const results = [];
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  page.on('console',m=>console.log('PAGE:',m.text()));

  // basic accessibility checks using axe-core injected
  const axeSource = require('axe-core').source;

  for(const s of scenarios){
    const r={id:s.id,ok:true,errors:[]};
    try{
      await page.goto('http://localhost:3000', {waitUntil:'networkidle2'});
      // set initial state via window.__app
      await page.evaluate((state)=>window.__app.setState(state), s.initial);

      // apply network condition
      if(s.initial.network) await page.evaluate((n)=>window.__app.setNetworkMode(n), s.initial.network);

      // scenario-specific actions
      if(s.id==='normal-flow'){
        await page.click('[role=tab][data-tab="programs"]');
        await page.waitForSelector('#program-list button');
        await page.click('#program-list button');
        // wait for toast
        await page.waitForSelector('#toasts div', {timeout:3000});
      }

      if(s.id==='weak-network'){
        await page.click('[role=tab][data-tab="livewall"]');
        await page.type('#msg-input', 'Hello');
        await page.click('#send-btn');
        // allow retry confirmation path via override
        await page.waitForTimeout(2000);
      }

      if(s.id==='paused-state'){
        const disabled = await page.evaluate(()=>{
          return Array.from(document.querySelectorAll('#program-list button')).every(b=>b.disabled);
        });
        if(!disabled){ r.ok=false; r.errors.push('Buttons not disabled in PAUSED state'); }
      }

      // run accessibility audit
      await page.addScriptTag({content:axeSource});
      const axeResults = await page.evaluate(async ()=>await axe.run());
      if(axeResults.violations.length>0){
        r.errors.push('Accessibility violations: '+axeResults.violations.map(v=>v.id).join(', '));
        r.ok=false;
      }

    }catch(e){ r.ok=false; r.errors.push(e.message); }
    results.push(r);
  }

  await browser.close();
  fs.writeFileSync('results_post.json',JSON.stringify({scenarios:results},null,2));
  console.log('Improved tests done');
})();
