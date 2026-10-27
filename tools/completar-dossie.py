"""Acrescenta inventários locais e resultados reproduzidos ao dossiê de estudo."""
from pathlib import Path
from zipfile import ZipFile
import ast
import csv
import hashlib
import html
import io
import json
import re
import sys
import xml.etree.ElementTree as ET
import markdown

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/ESTUDO_COMPLETO_PERFUSELAB.md'
MARK = '<!-- APENDICES_AUTOMATICOS -->'
generated = {'ESTUDO_COMPLETO_PERFUSELAB.md', 'ESTUDO_COMPLETO_PERFUSELAB.html',
             'auditoria-documentacao.json', 'inventario-documentacao.json'}
excluded = {'.git', 'node_modules', 'dist', '__pycache__', '.agents', '.codex'}
texts, inventory, binaries = {}, [], []
for p in sorted(ROOT.rglob('*')):
    rel = p.relative_to(ROOT)
    if not p.is_file() or any(x in excluded for x in rel.parts) or p.name in generated:
        continue
    if p.name.startswith('.env') and p.name != '.env.example':
        continue
    data = p.read_bytes()
    name = rel.as_posix()
    if p.suffix == '.docx':
        with ZipFile(p) as z:
            xml = ET.fromstring(z.read('word/document.xml'))
            ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            text = '\n'.join(''.join(t.text or '' for t in para.iter(ns+'t')) for para in xml.iter(ns+'p'))
        kind = 'DOCX: texto extraído'
    elif b'\0' not in data:
        try:
            text = data.decode('utf-8-sig')
        except UnicodeDecodeError:
            binaries.append(name)
            continue
        kind = 'Texto/código/configuração'
    else:
        binaries.append(name)
        continue
    texts[name] = text
    inventory.append({'arquivo':name,'tipo':kind,'bytes':len(data),'linhas':len(text.splitlines()),
                      'sha256':hashlib.sha256(data).hexdigest()})

parts = [DOC.read_text(encoding='utf-8').split(MARK)[0] + MARK]
def add(s): parts.append(s)
def cell(s): return html.escape(str(s), quote=False).replace('|','\\|').replace('\n',' ')
def table(headers, rows):
    add('| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |')
    add('\n'.join('| '+' | '.join(cell(v) for v in row)+' |' for row in rows))

add('## Apêndice A — Inventário e cobertura da leitura\n')
add(f'Foram lidos integralmente por varredura {len(inventory)} arquivos textuais ou DOCX, incluindo configurações ocultas disponíveis. O inventário identifica cada fonte; a análise explicativa prioriza o motor, dados e notas clínicas. {len(binaries)} recursos não textuais foram apenas inventariados. Os arquivos de documentação criados nesta tarefa são excluídos da própria varredura para evitar recursão. O hash completo das fontes está em `inventario-documentacao.json`.\n')
table(['Arquivo','Tipo','Linhas de texto','SHA-256 (prefixo)'],[(i['arquivo'],i['tipo'],i['linhas'],i['sha256'][:16]) for i in inventory])
add('\nRecursos binários: '+ '; '.join(f'`{x}`' for x in binaries)+'.\n')

add('## Apêndice B — Resultados reproduzidos de todos os casos\n')
results=json.loads((ROOT/'docs/auditoria-documentacao.json').read_text(encoding='utf-8'))['casos']
add('Resultados obtidos com as funções reais do programa, em ambiente JavaScript isolado, sem banco ou intervenção clínica. AUC em (mL/min/m²) × min; tempo em minutos. O primeiro arquivo é a conversão do prompt original; os outros 40 são sintéticos.\n')
table(['Arquivo','N','SC m²','iDO₂ inicial → final','AUC <280','Min <280','Risco'],[
    (r['file'],r['registros'],f"{r['sc']:.4f}",f"{r['ido2'][0]:.2f} → {r['ido2'][-1]:.2f}",r['auc']['auc'],r['auc']['tempoAbaixo'],r['risco']) for r in results])
for r in results:
    add(f"### {Path(r['file']).stem}\n")
    note = texts.get(r['file'].replace('.csv','_interpretacao.txt'))
    if note:
        match=re.search(r'OBJETIVO DID[ÁA]TICO\s*\n(.*?)(?:\n\s*\n)',note,re.S)
        if match: add('Objetivo registrado: '+match.group(1).strip()+'\n')
    else:
        data=json.loads(texts[r['file']])
        add('Procedimento: '+str(data.get('paciente',{}).get('procedimento','não informado'))+'.\n')
    table(['Tempo','Hb','Hct','IC','iDO₂','iVO₂','O₂ER','DO₂/VO₂','Lactato','Origem/consistência'],[
        (e.get('tempo'),e.get('hb'),e.get('hct'),e.get('IC'),e.get('ido2'),e.get('ivo2'),e.get('o2er'),e.get('relacaoDo2Vo2'),e.get('lactato'),e.get('fonteIdo2','')+'/'+e.get('consistenciaIdo2','')) for e in r['monitorizacao']])
    add('\nPrincipais determinantes do risco (títulos distintos, preservada a ordem):\n')
    titles=list(dict.fromkeys(re.sub(r' aos .*? min','',a['titulo']) for a in r['alertas'] if a['nivel']!='informativo'))
    add('\n'.join('- '+t for t in titles) or '- Nenhum alerta alto/moderado.')
    add('\nÍndice histórico por amostra: '+', '.join(map(str,r['score']))+'.\n')

add('## Apêndice C — Catálogo literal de campos JSON e CSV\n')
add('Este catálogo cobre os caminhos encontrados nos dados clínicos locais, inclusive campos apenas armazenados. `[]` representa qualquer elemento da lista. Tipos são os efetivamente encontrados nos arquivos; não são validação clínica ou esquema obrigatório. Não inclui a árvore de dependências do package-lock.\n')
fields={}
def walk(obj, prefix, source):
    if isinstance(obj,dict):
        for key,val in obj.items(): walk(val,prefix+'.'+key if prefix else key,source)
    elif isinstance(obj,list):
        for val in obj: walk(val,prefix+'[]',source)
        if not obj: fields.setdefault(prefix,{'types':set(),'sources':set()})['types'].add('lista vazia')
    else:
        item=fields.setdefault(prefix,{'types':set(),'sources':set()})
        item['types'].add(type(obj).__name__)
        item['sources'].add(source)
for name,text in texts.items():
    if name.endswith('.json') and ('casos-completos' in name or name=='entrada-paciente-valvular.json' or name.endswith('/exames.json')):
        walk(json.loads(text),'',name)
table(['Caminho literal','Tipos','Fonte de exemplo'],[(f,', '.join(sorted(v['types'])),sorted(v['sources'])[0] if v['sources'] else '') for f,v in sorted(fields.items())])
headers={}
for name,text in texts.items():
    if name.endswith('.csv'):
        row=next(csv.reader(io.StringIO(text),delimiter=';' if text.splitlines()[0].count(';')>=text.splitlines()[0].count(',') else ','))
        for k in row: headers.setdefault(k,[]).append(name)
add('\nCabeçalhos CSV encontrados: '+', '.join('`'+k+'`' for k in sorted(headers))+'.\n')

add('## Apêndice D — Índice técnico de variáveis, parâmetros e funções\n')
add('Este índice complementa o dicionário semântico dos capítulos 5–10. As declarações abaixo são transcrições literais com linha de origem; variáveis de interface (`campo…`, `btn…`, `modal`, `container`, `ctx`) representam elementos ou estado visual, não grandezas fisiológicas. A extração lexical de JavaScript lista declarações e assinaturas, não é um analisador semântico completo de todos os escopos; parâmetros de callbacks e propriedades estão disponíveis no código-fonte correspondente. O catálogo clínico acima e as tabelas de propriedades cobrem o contrato de dados.\n')
for name,text in texts.items():
    if not name.endswith(('.js','.py','.cjs')) or name in {'tools/auditar-documentacao.cjs','tools/completar-dossie.py'}: continue
    add('### '+name+'\n')
    lines=[]
    for n,line in enumerate(text.splitlines(),1):
        if re.search(r'\b(?:const|let|var)\s|\bfunction\s*\w*\s*\(|^\s*(?:async\s+)?def\s',line):
            lines.append(f'{n}: {line.strip()}')
    add('```text\n'+'\n'.join(lines)+'\n```\n')
    if name.endswith('.py'):
        tree=ast.parse(text)
        ids=sorted({n.id for n in ast.walk(tree) if isinstance(n,ast.Name) and isinstance(n.ctx,ast.Store)} | {n.arg for n in ast.walk(tree) if isinstance(n,ast.arg)})
        add('Identificadores Python atribuídos/parâmetros: '+', '.join('`'+i+'`' for i in ids)+'.\n')

add('## Apêndice E — Campos de formulário e constantes de apresentação\n')
add('Campos HTML literais permitem localizar entradas, inclusive o modelo de checklist independente. Identificadores de apresentação não são novas variáveis clínicas.\n')
for name,text in texts.items():
    if not name.endswith('.html'): continue
    controls=re.findall(r'<(?:input|select|textarea)\b[^>]*>',text,re.I)
    if controls:
        add('### '+name+'\n')
        table(['Elemento literal'],[(x,) for x in controls])
css=texts.get('src/css/style.css','')
variables=re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+)',css)
if variables:
    add('\nVariáveis CSS de apresentação:\n')
    table(['Nome','Valor'],variables)

add('## Apêndice F — Notas históricas extraídas dos documentos Word\n')
add('A transcrição abaixo preserva a justificativa antiga para comparação com a implementação. Seus rótulos e propostas não substituem os capítulos 7 e 8 deste dossiê.\n')
add('### justificativa-score.docx\n\n```text\n'+texts['justificativa-score.docx']+'\n```\n')
add('O texto do manual Word também foi extraído. Sua cobertura de 20 casos e sua descrição de regras foram comparadas ao acervo atual de 30 CSV e ao motor. O documento original continua disponível em `../casos-clinicos-didaticos/manual_interpretacao_cec_perfuselab.docx`.\n')
content='\n\n'.join(parts)+'\n'
DOC.write_text(content,encoding='utf-8')
(ROOT/'docs/inventario-documentacao.json').write_text(json.dumps({'data':'2026-10-25','fontes':inventory,'binarios':binaries},ensure_ascii=False,indent=2),encoding='utf-8')
md=markdown.Markdown(extensions=['tables','fenced_code','toc'],extension_configs={'toc':{'toc_depth':'2'}})
body=md.convert(content)
style='''body{font-family:Segoe UI,Arial,sans-serif;color:#173044;line-height:1.65;margin:0;background:#f1f5f9}main{max-width:1100px;margin:24px auto;background:white;padding:46px}h1,h2,h3{line-height:1.25;color:#113e59}h1{font-size:34px}h2{border-top:2px solid #d9e6ee;padding-top:28px;margin-top:45px}h3{margin-top:32px}table{border-collapse:collapse;width:100%;font-size:13px;margin:20px 0;overflow-wrap:anywhere}th,td{border:1px solid #d5e0e8;padding:9px;text-align:left;vertical-align:top}th{background:#e7f1f6}tr:nth-child(even){background:#f8fafc}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#edf3f6;padding:18px;font-size:12px}code{font-size:.9em}a{color:#036b96}nav{background:#edf5f9;padding:20px}nav li{margin:5px 0}.badge{color:#587185;font-size:14px}@media(max-width:700px){main{margin:0;padding:18px}table{font-size:11px}td,th{padding:5px}}@media print{body{background:white}main{margin:0;padding:0;max-width:none}h2{break-before:page}h2,h3{break-after:avoid}tr{break-inside:avoid}pre{font-size:9px}a{color:inherit}nav{display:none}}'''
out='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PerfuseLab — Dossiê completo de estudo</title><style>'+style+'</style></head><body><main><p class="badge">DOCUMENTAÇÃO TÉCNICA • 25/10/2026 • LEITURA E IMPRESSÃO</p><nav aria-label="Sumário"><strong>Sumário navegável</strong>'+md.toc+'</nav>'+body+'</main></body></html>'
DOC.with_suffix('.html').write_text(out,encoding='utf-8')
print(json.dumps({'fontes':len(inventory),'binarios':len(binaries),'casos':len(results),'campos_json':len(fields),'palavras':len(content.split()),'markdown_bytes':len(content.encode()),'html_bytes':len(out.encode())},ensure_ascii=False))
