import json, sys
db=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'catalogo.json')); EX={e['id']:e for e in db['ejercicios']}; SRC={f['id']:f for f in db['fuentes']}
def ref(tag):
    s,t=tag.split('@') if '@' in tag else (tag,'')
    f=SRC.get(s); return f"{f['autor'] if f else s}{' '+t if t else ''}"
L=["# Catálogo de calistenia — base de conocimiento","",f"Versión {db['version']}. Generado desde `catalogo.json`, que es la fuente de verdad.","","## Fuentes",""]
for f in db['fuentes']: L.append(f"- **{f['autor']}** — "+(f"[{f['titulo']}]({f['url']})" if f.get('url') else f['titulo'])+f" · {f['tipo']}. {f['aporta']}")
L+=["","## Principios de programación",""]+[f"- **{p['tema']}.** {p['texto']} _({ref(p['fuente'])})_" for p in db['principios']]
L+=["","## Conflictos entre fuentes",""]+[f"- **{c['tema']}.** {c['a']}. {c['b']}. → Tracker: {c['decision_tracker']}" for c in db['conflictos']]
L+=["","## Pendientes",""]+[f"- {p}" for p in db['pendientes']]
for s in db['escaleras']:
    L+=["",f"## {s['nombre']} (`{s['id']}`)",""]
    if s.get('notas'): L+=[f"_{s['notas']}_",""]
    for i,p in enumerate(s['peldanos'],1):
        e=EX[p]; ex=[]
        if e['tipo']!='repes': ex.append(e['tipo'])
        if e['material']!=['suelo']: ex.append(', '.join(e['material']))
        L.append(f"{i}. **{e['nombre']}** `{p}`"+(f" ({'; '.join(ex)})" if ex else "")+" — "+"; ".join(ref(t) for t in e['fuentes']))
        for c in e['cues']: L.append(f"   - ✓ {c}")
        for c in e['errores']: L.append(f"   - ✗ {c}")
        for c in e['criterios']: L.append(f"   - ↑ {c}")
        if e.get('notas'): L.append(f"   - ℹ {e['notas']}")
open(sys.argv[2] if len(sys.argv)>2 else 'docs/catalogo-calistenia.md','w').write("\n".join(L)+"\n")
print("ok")
