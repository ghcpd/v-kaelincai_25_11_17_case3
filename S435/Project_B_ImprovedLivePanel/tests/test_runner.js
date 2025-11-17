const fs = require('fs');
const path = require('path');
const {chromium} = require('playwright');
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
      // apply mock state via localStorage
      if(scen.mockState){
        await page.evaluate((s)=>{ localStorage.setItem('mockState', JSON.stringify(s)); }, scen.mockState);
        await page.reload();
      }

      // run a11y check
      try{
        const axe = require('axe-core');
        const source = axe.source;
        await page.addScriptTag({content: source});
        const result = await page.evaluate(async ()=>{
          return await axe.run();
        });
        scenarioResult.assertions.push({a11y: result.violations.length===0, violationsCount: result.violations.length});
      }catch(e){ scenarioResult.assertions.push({a11y: 'error', error: e.message}); }

      // switch to tab if specified
      if(scen.tab){ await page.click(`#tab-${scen.tab}`); }

      for(const step of scen.steps){
        if(step.action === 'click'){ await page.click(step.target); }
        if(step.action === 'type'){ await page.fill(step.target, step.value); }
        if(step.action === 'wait'){ await page.waitForTimeout(step.value); }
      }

      // expectation checks
      for(const expect of scen.expected){
        if(expect.type === 'visible'){
          const ok = await page.isVisible(expect.selector);
          scenarioResult.assertions.push({selector:expect.selector, ok});
          if(!ok) throw new Error(`Expected visible ${expect.selector}`);
        }
        if(expect.type === 'text'){
          const text = await page.textContent(expect.selector);
          const ok = text && text.includes(expect.value);
          scenarioResult.assertions.push({selector:expect.selector, ok, text});
          if(!ok) throw new Error(`Expected text ${expect.value} in ${expect.selector}, got ${text}`);
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
  fs.writeFileSync(path.resolve(__dirname, '../results/results_post.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.resolve(__dirname, '../logs/log_post.txt'), logs.join('\n'));
  console.log('Improved tests complete');
})();
