from pathlib import Path
import re, html, textwrap
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, CondPageBreak
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/ESTUDO_COMPLETO_PERFUSELAB.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
for name,file in [('Segoe','segoeui.ttf'),('SegoeBold','segoeuib.ttf'),('SegoeItalic','segoeuii.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFontFamily('Segoe',normal='Segoe',bold='SegoeBold',italic='SegoeItalic',boldItalic='SegoeBold')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Body',fontName='Segoe',fontSize=9.5,leading=14,spaceAfter=7,textColor=colors.HexColor('#193448')))
styles.add(ParagraphStyle(name='TitleCustom',parent=styles['Body'],fontName='SegoeBold',fontSize=28,leading=35,spaceAfter=20))
styles.add(ParagraphStyle(name='H2Custom',parent=styles['Body'],fontName='SegoeBold',fontSize=17,leading=23,spaceBefore=12,spaceAfter=12,keepWithNext=True))
styles.add(ParagraphStyle(name='H3Custom',parent=styles['Body'],fontName='SegoeBold',fontSize=12,leading=17,spaceBefore=12,spaceAfter=8,keepWithNext=True))
styles.add(ParagraphStyle(name='Cell',parent=styles['Body'],fontSize=8,leading=10.8,spaceAfter=0,splitLongWords=True))
styles.add(ParagraphStyle(name='SmallCell',parent=styles['Cell'],fontSize=6.6,leading=9))
styles.add(ParagraphStyle(name='CodeLine',parent=styles['Body'],fontSize=7,leading=10,spaceAfter=1,leftIndent=8))
styles.add(ParagraphStyle(name='ListItemCustom',parent=styles['Body'],leftIndent=12,firstLineIndent=-8))

def inline(s):
    s=s.replace('\u2011','-').replace('\u2013','-').replace('\u2014','-')
    s=html.escape(html.unescape(s))
    s=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'<link href="\2" color="#006a91">\1</link>',s)
    s=re.sub(r'`([^`]+)`',r'<font color="#305d71">\1</font>',s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
    return s

class Doc(SimpleDocTemplate):
    def afterFlowable(self,f):
        if isinstance(f,Paragraph) and f.style.name=='H2Custom':
            title=f.getPlainText(); key='section-'+str(self.seq.nextf('section'))
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title,key,0,False)
            self.notify('TOCEntry',(0,title,self.page,key))

def footer(c,d):
    c.saveState(); w,h=A4
    c.setStrokeColor(colors.HexColor('#d4e2ea'));c.line(42,39,w-42,39)
    c.setFillColor(colors.HexColor('#557182'));c.setFont('Segoe',8)
    c.drawString(42,25,'PerfuseLab | Dossie de estudo | 25/10/2026')
    c.drawRightString(w-42,25,str(d.page))
    c.restoreState()

text=(ROOT/'docs/ESTUDO_COMPLETO_PERFUSELAB.md').read_text(encoding='utf-8')
lines=text.splitlines(); story=[]
story.extend([Spacer(1,65),Paragraph('PERFUSELAB',styles['TitleCustom']),Paragraph('Dossie tecnico completo<br/>Guia de estudo para congresso',styles['H2Custom']),Spacer(1,18),Paragraph('Projeto, funcionalidades, variaveis, formulas e relacoes. Inclui auditoria de 41 casos, catalogo de campos e inventario das fontes.',styles['Body']),Spacer(1,20),Paragraph('Revisao: 25 de outubro de 2026<br/>Conversao integral do dossie em Markdown. Os casos sinteticos e as regras locais destinam-se ao estudo; nao constituem validacao clinica.',styles['Body']),PageBreak(),Paragraph('Sumario',styles['TitleCustom'])])
toc=TableOfContents();toc.levelStyles=[ParagraphStyle(name='Toc',fontName='Segoe',fontSize=8.5,leading=12,spaceBefore=2)]
toc.tableStyle=TableStyle([('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),1)])
story.extend([toc,PageBreak()])
i=0
while i<len(lines):
    line=lines[i].strip()
    if not line or line.startswith('<!--') or line.startswith('# '): i+=1;continue
    if line.startswith('```'):
        i+=1
        while i<len(lines) and not lines[i].startswith('```'):
            value=lines[i].replace('\t','    ')
            for chunk in textwrap.wrap(value,width=115,replace_whitespace=False,drop_whitespace=False) or [' ']:
                story.append(Paragraph(html.escape(chunk).replace(' ','&#160;'),styles['CodeLine']))
            i+=1
        story.append(Spacer(1,8));i+=1;continue
    if line.startswith('## '):
        if story and not isinstance(story[-1],PageBreak):
            story.append(PageBreak() if 'Apêndice' in line else CondPageBreak(160))
        story.append(Paragraph(inline(line[3:]),styles['H2Custom']));i+=1;continue
    if line.startswith('### '):
        story.append(Paragraph(inline(line[4:]),styles['H3Custom']));i+=1;continue
    if line.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            row=re.split(r'(?<!\\)\|',lines[i].strip())[1:-1]
            row=[s.strip().replace('\\|','|') for s in row]
            if not all(re.fullmatch(r'[:\- ]+',s or '-') for s in row):rows.append(row)
            i+=1
        n=len(rows[0]);width=A4[0]-84
        if n==10:weights=[.65,.6,.6,.6,.8,.65,.65,.8,.75,1.4]
        elif n==7:weights=[3, .4, .6, 1.2, .7, .7, .9]
        elif n==4 and 'Arquivo' in rows[0][0]:weights=[3.3,1.5,.65,1.4]
        elif n==3:weights=[1.4,1,2.2]
        elif n==4:weights=[1.2,1.4,1.4,1.8]
        else:weights=[1]*n
        widths=[width*w/sum(weights) for w in weights]
        sty=styles['SmallCell'] if n>=7 else styles['Cell']
        data=[[Paragraph(('<b>'+inline(c)+'</b>') if j==0 else inline(c),sty) for c in row] for j,row in enumerate(rows)]
        t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
        t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e4eff5')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f8fa')]),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#cfdee8')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]))
        story.extend([t,Spacer(1,10)]);continue
    if line.startswith('- ') or re.match(r'^\d+\. ',line):
        val='- '+line[2:] if line.startswith('- ') else line
        story.append(Paragraph(inline(val),styles['ListItemCustom']));i+=1;continue
    para=[line];i+=1
    while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','```','- ','<!--')) and not re.match(r'^\d+\. ',lines[i]):
        para.append(lines[i].strip());i+=1
    story.append(Paragraph(inline(' '.join(para)),styles['Body']))

doc=Doc(str(OUT),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=52,title='PerfuseLab - Dossie completo de estudo',author='PerfuseLab')
doc.multiBuild(story,onFirstPage=footer,onLaterPages=footer)
r=PdfReader(OUT)
full='\n'.join(p.extract_text() or '' for p in r.pages)
assert 'justificativa-score.docx' in full and 'Apendice' in full.replace('Apêndice','Apendice')
assert len(r.pages)>20
print('PDF:',OUT,'PAGES:',len(r.pages),'BYTES:',OUT.stat().st_size)
Path(ROOT/'output/pdf/verificacao.txt').write_text('\n'.join(f'{i+1}: {len(p.extract_text() or "")} caracteres' for i,p in enumerate(r.pages)),encoding='utf-8')
