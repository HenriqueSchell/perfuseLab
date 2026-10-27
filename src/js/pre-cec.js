(()=>{

'use strict';
const $=id=>document.getElementById(id), form=$('planForm'), KEY='perfuselab.precec.v1';
const ids=['caseId','age','weight','height','sex','procedure','basalHb','professional','date','index','target','plannedFlow','hb','sao2','pao2','temperature'];
let model=null, prepared=false;
const fmt=(v,d=2)=>Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
function num(id){const e=$(id); if(!e.value.trim()||!e.validity.valid)return null;const v=Number(e.value);return Number.isFinite(v)?v:null;}
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function calculate(p){
 const valid=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
 const adult=valid(p.age,18,120), bsa=valid(p.weight,25,300)&&valid(p.height,100,230)?Math.sqrt(p.weight*p.height/3600):null;
 const reference=adult&&bsa&&valid(p.index,1.5,3.5)?bsa*p.index:null;
 const cao2=adult&&valid(p.hb,3,22)&&valid(p.sao2,50,100)&&valid(p.pao2,20,600)?1.36*p.hb*p.sao2/100+.003*p.pao2:null;
 const gdp=reference&&cao2&&[280,300].includes(p.target)?p.target*bsa/(10*cao2):null;
 const ido2=reference&&cao2&&valid(p.plannedFlow,.5,15)?10*p.plannedFlow/bsa*cao2:null;
 return {bsa,bmi:bsa?p.weight/(p.height/100)**2:null,reference,cao2,gdp,ido2,temperature:valid(p.temperature,28,37)?p.temperature:null,adult};
}
window.PreCecPlanning={calculate};
function setStatus(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function update(){
 const p=Object.fromEntries(['age','weight','height','index','target','hb','sao2','pao2','plannedFlow','temperature'].map(id=>[id,num(id)]));model=calculate(p);
 $('bsa').textContent=fmt(model.bsa)+' m²';$('bmi').textContent=fmt(model.bmi,1)+' kg/m²';$('resultBsa').textContent=fmt(model.bsa)+' m²';$('resultIndex').textContent=fmt(p.index,1);
 $('referenceFlow').textContent=fmt(model.reference);$('gdpFlow').textContent=fmt(model.gdp);$('estimatedIdo2').textContent=fmt(model.ido2,0);
 $('useReference').disabled=!model.reference||model.reference>15;$('useGdp').disabled=!model.gdp||model.gdp>15;
 $('contextTag').textContent=!model.adult?'Informe idade adulta (≥18 anos)':!model.bsa?'Preencha peso e altura':'Planejamento pré-CEC';
 $('gdpNote').textContent=!model.gdp?'Preencha Hb, SaO₂ e PaO₂ esperadas.':`Meta ${p.target} · CaO₂ previsto ${fmt(model.cao2)} mL/dL. `+(model.gdp>15?'Fluxo fora da faixa de entrada (0,5–15 L/min).':model.ido2!==null?(model.ido2<p.target?'O fluxo escolhido fica abaixo da meta simulada.':'A meta matemática é atingida com essas hipóteses.'):'Selecione o fluxo que a equipe pretende utilizar.');
 const t=model.temperature;$('tempMarker').style.display=t===null?'none':'block';if(t!==null)$('tempMarker').style.left=((t-28)/9*100)+'%';
 $('tempSummary').textContent=t===null?'A definir pela equipe':fmt(t,1)+' °C planejados';
 $('thermalNote').textContent=t===null?'Selecione a meta térmica.':'Meta térmica registrada no plano.';
 $('tempContext').textContent='Temperatura planejada pela equipe.';
 $('bars').replaceChildren();[2.2,2.4,2.6,2.8].forEach(ic=>{const r=document.createElement('div');r.className='bar-row';const label=document.createElement('span');label.textContent=fmt(ic,1);const b=document.createElement('div');b.className='bar';const fill=document.createElement('i');fill.style.width=model.reference?(ic/2.8*100)+'%':'0';b.append(fill);const val=document.createElement('span');val.textContent=model.reference?fmt(ic*model.bsa):'—';r.append(label,b,val);$('bars').append(r);});
 if(prepared){startForm.reset();prepared=false;$('ready').hidden=true;$('phaseText').textContent='Plano alterado · revisar e salvar';}
}
function payload(status){return {schemaVersion:1,prototype:false,status,savedAt:new Date().toISOString(),inputs:Object.fromEntries(ids.map(id=>[id,$(id).value])),estimates:model,temperatureSource:'team_planned_not_flow_derived',measurements:[],cecStarted:false};}
function save(status){try{localStorage.setItem(KEY,JSON.stringify(payload(status)));return true;}catch{setStatus('O navegador não permitiu salvar. Libere espaço ou permita armazenamento e tente novamente.',true);return false;}}
function validate(){const invalid=[...form.elements].find(e=>typeof e.checkValidity==='function'&&!e.checkValidity());if(invalid){invalid.reportValidity();invalid.focus();setStatus('Confira os campos obrigatórios e os limites indicados.',true);return false;}if(!model.reference||!model.temperature){setStatus('Preencha os dados básicos, o índice e a temperatura planejada.',true);return false;}return true;}
form.addEventListener('input',()=>{update();setStatus('Alterações ainda não salvas.');});form.addEventListener('change',update);
form.addEventListener('submit',e=>{e.preventDefault();if(!validate())return;const persisted=save('prepared');if(!persisted)return;prepared=true;$('ready').hidden=false;$('readySummary').textContent=`${$('caseId').value} · fluxo planejado ${fmt(num('plannedFlow'))} L/min · temperatura planejada ${fmt(model.temperature,1)} °C · SC ${fmt(model.bsa)} m².`;$('phaseText').textContent='Plano preparado · aguardando CEC';if(persisted)setStatus('Plano salvo neste navegador. Nenhuma CEC ou monitorização foi iniciada.');$('ready').focus();$('ready').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});});
const use=(id,value)=>{if(value){$(id).value=(Math.ceil(value*100)/100).toFixed(2);update();setStatus('Fluxo atualizado no plano.');}};
 $('useReference').addEventListener('click',()=>use('plannedFlow',model.reference));$('useGdp').addEventListener('click',()=>use('plannedFlow',model.gdp));
 $('draft').addEventListener('click',()=>{if(save('draft'))setStatus('Rascunho salvo apenas neste navegador. Você pode retomar antes da CEC.');});
 $('example').addEventListener('click',()=>{const example={caseId:'SIM-025 · exemplo sintético',age:62,weight:75,height:170,sex:'Masculino',procedure:'Revascularização do miocárdio',basalHb:12.5,professional:'Profissional de demonstração',date:localDate(),index:2.4,target:280,plannedFlow:'',hb:8.5,sao2:98,pao2:150,temperature:35};ids.forEach(id=>$(id).value=example[id]??'');update();setStatus('Exemplo sintético carregado. Escolha o fluxo planejado; nenhum dado foi salvo.');});
 $('clear').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch{setStatus('Não foi possível limpar o rascunho salvo.',true);return;}form.reset();startForm.reset();$('date').value=localDate();prepared=false;$('ready').hidden=true;$('phaseText').textContent='CEC ainda não iniciada';update();setStatus('Rascunho limpo.');});
 $('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(payload('prepared'),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='plano-pre-cec.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('date').value=localDate();
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.schemaVersion===1&&saved.inputs&&typeof saved.inputs==='object'){ids.forEach(id=>{if(typeof saved.inputs[id]==='string')$(id).value=saved.inputs[id];});setStatus('Rascunho recuperado. Revise as hipóteses e confirme novamente o plano.');}}catch{setStatus('Não foi possível recuperar o rascunho. Comece um novo plano.',true);}update();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let scheduled=false;
 function parallax(){scheduled=false;$('parallax').style.transform=reduced.matches?'none':`translateY(${Math.min(window.scrollY,500)*.17}px)`;}
 window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(parallax);}},{passive:true});reduced.addEventListener('change',parallax);


// Planejamento nunca preenche automaticamente uma medição real.
const startDialog=$('startDialog'), startForm=$('startForm');
$('openDashboard').addEventListener('click',()=>{
 if(!prepared||!validate())return;
 const planning=payload('prepared');
 const patient={procedimento:$('procedure').value.trim(),sexo:$('sex').value.toLowerCase(),idade:num('age'),peso:num('weight'),alturaNum:num('height')};
 const clinicalCase={metadados:{id_caso:crypto.randomUUID(),origem:'entrada_pre_cec'},identificacao:{id_caso:$('caseId').value.trim(),data_cirurgia:$('date').value},procedimento:{tipo_cirurgia:patient.procedimento},equipe_perfusao:{responsavel_cec:$('professional').value.trim()},planejamento_pre_cec:planning};
 try{
  iniciarCecComPlano(patient, clinicalCase);
  window.location.href='dashboard.html';
 }catch{setStatus('Não foi possível abrir o plano. Verifique o armazenamento do navegador e tente novamente.',true);}
});
$('startCec').addEventListener('click',()=>{
 if(!prepared||!validate())return;
 const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
 if(!$('cecStartTime').value)$('cecStartTime').value=now.toISOString().slice(0,16);
 $('startStatus').textContent='';startDialog.showModal();
});
$('cancelStart').addEventListener('click',()=>startDialog.close());
startForm.addEventListener('submit',event=>{
 event.preventDefault();
 if(!prepared||!validate()||!startForm.reportValidity())return;
 const startTime=new Date($('cecStartTime').value);
 const sampleMinute=num('sampleMinute');
 if(!Number.isFinite(startTime.getTime())||startTime.getTime()+sampleMinute*60000>Date.now()+60000){
  $('startStatus').textContent='Confira o horário: início e coleta não podem estar no futuro.';return;
 }
 const measurement={tempo:sampleMinute,fluxo:num('measuredFlow'),hb:num('measuredHb'),hct:num('measuredHct'),sao2:num('measuredSao2'),sao2Informada:true,pao2:num('measuredPao2'),lactato:num('measuredLactate'),temperatura:num('measuredTemperature'),pam:num('measuredPam')};
 const patient={procedimento:$('procedure').value.trim(),sexo:$('sex').value.toLowerCase(),idade:num('age'),peso:num('weight'),alturaNum:num('height'),hemoglobina:measurement.hb,hematocrito:measurement.hct,fluxo:measurement.fluxo,sao2:measurement.sao2,temperatura:measurement.temperatura,pam:measurement.pam,lactato:measurement.lactato};
 const planning=payload('started');planning.cecStarted=true;planning.measurements=[measurement];
 const clinicalCase={metadados:{id_caso:crypto.randomUUID(),origem:'entrada_pre_cec'},identificacao:{id_caso:$('caseId').value.trim(),data_cirurgia:$('date').value},procedimento:{tipo_cirurgia:patient.procedimento},equipe_perfusao:{responsavel_cec:$('professional').value.trim()},tempos_cirurgicos:{inicio_cec:$('cecStartTime').value.slice(11),inicio_cec_iso:startTime.toISOString()},planejamento_pre_cec:planning};
 try{
  salvarEntradaLocal({'paciente':patient,'historicoImportado':[measurement],'casoClinicoImportado':clinicalCase,[KEY]:planning});
  window.location.href='dashboard.html';
 }catch(error){$('startStatus').textContent='Não foi possível salvar a medição neste navegador. Libere espaço ou permita armazenamento e tente novamente.';}
});
})();
