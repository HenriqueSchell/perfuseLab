const { chromium } = require('C:/Users/henri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('url');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const out=path.join(root,'docs','prototipo-pre-cec');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'prototipo-pre-cec.html')).href);
 await page.evaluate(()=>{localStorage.setItem('paciente','original-sentinel');localStorage.removeItem('perfuselab.prototype.precec.v1');});await page.reload();
 assert.equal(await page.locator('#referenceFlow').textContent(),'—');
 await page.screenshot({path:path.join(out,'desktop-inicial.png'),fullPage:true});
 const values=await page.evaluate(()=>{
   const calculate=PreCecPrototype.calculate;
   const p={age:50,weight:75,height:170,index:2.4,target:280,hb:10,sao2:98,pao2:150,plannedFlow:4.5,temperature:35};
   return {base:calculate(p),cold:calculate({...p,temperature:28}),child:calculate({...p,age:12}),missing:calculate({...p,pao2:null}),zero:calculate({...p,weight:0}),invalid:calculate({...p,sao2:101}),higher:calculate({...p,target:300})};
 });
 const bsa=Math.sqrt(75*170/3600),cao2=10*1.36*.98+.003*150;
 assert.ok(Math.abs(values.base.reference-bsa*2.4)<1e-10);
 assert.ok(Math.abs(values.base.gdp-280*bsa/(10*cao2))<1e-10);
 assert.ok(Math.abs(values.base.ido2-10*4.5/bsa*cao2)<1e-10);
 assert.equal(values.cold.gdp,values.base.gdp);
 assert.equal(values.child.reference,null);assert.equal(values.missing.gdp,null);assert.equal(values.zero.reference,null);assert.equal(values.invalid.gdp,null);
 assert.ok(values.higher.gdp>values.base.gdp);
 await page.click('#example');await page.click('#useGdp');
 assert.ok(Number(await page.inputValue('#plannedFlow'))>4);
 await page.click('button[type=submit]');await page.waitForSelector('#ready:visible');
 const state=await page.evaluate(()=>({saved:JSON.parse(localStorage.getItem('perfuselab.prototype.precec.v1')),original:localStorage.getItem('paciente')}));
 assert.equal(state.saved.status,'prepared');assert.equal(state.saved.cecStarted,false);assert.equal(state.saved.measurements.length,0);assert.equal(state.original,'original-sentinel');
 await page.locator('#weight').fill('80');assert.equal(await page.locator('#ready').isVisible(),false);
 await page.click('#draft');await page.reload();assert.equal(await page.inputValue('#weight'),'80');assert.equal(await page.locator('#ready').isVisible(),false);
 await page.screenshot({path:path.join(out,'desktop-preenchido.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollTo(0,300));await page.waitForTimeout(150);
 assert.equal(await page.locator('#parallax').evaluate(e=>getComputedStyle(e).transform),'none');
 await page.click('#clear');assert.equal(await page.inputValue('#weight'),'');assert.equal(await page.evaluate(()=>localStorage.getItem('paciente')),'original-sentinel');
 assert.deepEqual(errors,[]);
 console.log('OK: fórmulas, limites, dados ausentes, pediatria bloqueada, invariância térmica, rascunho, preparação, isolamento do original, responsividade e movimento reduzido.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
