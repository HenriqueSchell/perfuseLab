// Auditoria reprodutível, somente leitura dos casos e do motor clínico.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const noop = () => {};
const el = () => ({addEventListener:noop, classList:{add:noop,remove:noop},value:''});
const ctx = vm.createContext({console,document:{getElementById:el,addEventListener:noop},window:{},localStorage:{},setTimeout:noop});
vm.runInContext(fs.readFileSync(path.join(root,'src/js/index.js'),'utf8'),ctx);
// Contextos separados, pois os dois arquivos declaram identificadores globais.
const dash = vm.createContext({console,document:{addEventListener:noop},window:{},Chart:{defaults:{font:{}}}});
vm.runInContext(fs.readFileSync(path.join(root,'src/js/dashboard.js'),'utf8'),dash);
const files = ['entrada-paciente-valvular.json'];
for (const dir of ['casos-clinicos-didaticos','casos-completos-cirurgicos']) {
  for (const file of fs.readdirSync(path.join(root,dir)).sort()) {
    if (/^\d+.*\.(csv|json)$/.test(file)) files.push(`${dir}/${file}`);
  }
}
const results = files.map(file => {
  const imp = ctx.prepararImportacao(fs.readFileSync(path.join(root,file),'utf8'),path.extname(file).slice(1));
  const sc = dash.superficieCorporal(imp.paciente.peso,imp.paciente.alturaNum);
  const hist = imp.historico.map(e=>dash.completarExame(e,sc));
  const a = dash.montarAnalisePerfusional(imp.paciente,hist,imp.dadosOriginais||{},sc);
  return {file,sc,registros:hist.length,risco:a.risco,ido2:hist.map(e=>e.ido2),score:hist.map(e=>e.score),auc:dash.calcularAucDeficit(a.dados,()=>280),metricas:a.metricas,alertas:a.alertas,monitorizacao:hist};
});
const output = path.join(root,'docs','auditoria-documentacao.json');
fs.writeFileSync(output,JSON.stringify({data:'2026-10-25',casos:results},null,2));
console.log(`${results.length} casos recalculados; saída: docs/auditoria-documentacao.json`);
console.log(JSON.stringify(results[0],null,2));
