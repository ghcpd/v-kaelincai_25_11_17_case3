/* Playwright-based test runner for baseline project */
const fs = require('fs');
const path = require('path');
const {chromium, devices} = require('playwright');
const scenarios = require('../../test_scenarios.json');

(async ()=>{
  const results = [];
  const logs = [];
  const browser = await chromium.launch();
  for(const scen of scenarios){
    const context = await browser.newContext({viewport: scen.viewport || {width: 375, height: 667}});
    const page = await context.newPage();
    const scenarioResult = {id: scen.id, name: scen.name, passed: false, assertions: []};
    try{
      await page.goto('http://localhost:3000', {waitUntil: 'domcontentloaded'});
      // Standard checks for baseline
      await page.waitForSelector('#status-area');
      // accessibility check (axe)
      try{ const axe = require('axe-core'); await page.addScriptTag({content: axe.source}); const a11 = await page.evaluate(async ()=> await axe.run()); scenarioResult.assertions.push({a11y: a11.violations.length===0, violations: a11.violations.length}); }catch(e){ scenarioResult.assertions.push({a11y:'error', error:e.message}); }
      // Apply initial state if provided via localStorage
      if(scen.mockState){
        await page.evaluate((s)=>{ localStorage.setItem('mockState', JSON.stringify(s)); }, scen.mockState);
        await page.reload();
      }

      // Run user steps
      for(const step of scen.steps){
        if(step.action === 'click'){ await page.click(step.target); }
        if(step.action === 'type'){ await page.fill(step.target, step.value); }
        if(step.action === 'wait'){ await page.waitForTimeout(step.value); }
      }

      // Verify expected outcomes (simple DOM checks), mapping improved selectors to baseline equivalents
      function mapSelector(sel){
        const map = {'#interaction-feedback':'#messages', '#res-queue':'#queue', '#livewall-messages':'#messages', '#reservation-panel':'#controls', '#control-hint':'#messages'};
        return map[sel] || sel;
      }
      for(const expect of scen.expected){
        const sel = mapSelector(expect.selector);
        if(expect.type === 'visible'){
          const ok = await page.isVisible(sel);
          scenarioResult.assertions.push({selector:sel, ok});
          if(!ok) throw new Error(`Expected visible ${sel}`);
        }
        if(expect.type === 'text'){
          const text = await page.textContent(sel);
          const ok = text && text.includes(expect.value);
          scenarioResult.assertions.push({selector:sel, ok, text});
          if(!ok) throw new Error(`Expected text ${expect.value} in ${sel}, got ${text}`);
        }
      }
      scenarioResult.passed = true;
    }catch(e){
      logs.push(`${scen.id} - ${scen.name}: ${e.message}`);
    }finally{
      await context.close();
      results.push(scenarioResult);
    }
  }
  await browser.close();
  fs.writeFileSync(path.resolve(__dirname, '../results/results_pre.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.resolve(__dirname, '../logs/log_pre.txt'), logs.join('\n'));
  console.log('Baseline tests complete');
})();
