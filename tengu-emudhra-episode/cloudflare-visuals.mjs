// Diagrams share the retained scene clock via data-from / data-only.
export function cloudflareVisual(s,{ru,esc,svg,node,line,svgText,id}){
 const a=s.labels;
 const mobile=rows=>'<ol class="mobile-diagram">'+rows.map((x,j)=>`<li data-from="${Math.min(j,2)}"><span>0${j+1}</span>${esc(x)}</li>`).join('')+'</ol>';
 const diagram=(body,rows)=>'<div class="diagram-wrap">'+svg(body,s.lead,id)+mobile(rows)+'</div>';
 const badge=(x,y,label,from=0)=>`<g class="verify-badge" data-from="${from}"><rect x="${x-150}" y="${y-23}" width="300" height="46" rx="23"/>${svgText(x,y+6,label,'',18)}</g>`;
 if(s.kind==='response'){
  return diagram(node(165,70,a[0],'',0,250)+line('M290 70H440')+node(565,70,a[1],'',0,250)+line('M690 70H830',1)+node(965,70,a[2],'',1,270)
   +node(165,240,a[3],'',1,250)+line('M290 240H830',1)+node(965,240,a[4],'',1,270)
   +'<g data-from="1">'+svgText(565,165,a[5],'audit-line',23)+'</g>'
   +badge(565,300,ru?'Проверка доверия обновлена':'Trust checks updated',2),
   [a[0]+' → '+a[1],a[1]+' → '+a[2]+' / '+a[3]+' → '+a[4],ru?'Общие и отдельные хранилища':'Shared and separate trust stores']);
 }
 if(s.kind==='clients')return '<div class="client-grid">'+[0,1,2,3].map((j)=>`<article data-from="${j<2?0:1}"><span class="client-symbol" aria-hidden="true">${['◉','1.1','↔','▣'][j]}</span><div><h3>${esc(a[j*2])}</h3><p>${esc(a[j*2+1])}</p></div></article>`).join('')+`<div class="client-boundary" data-from="2">Gateway + ${ru?'актуальный клиент':'up-to-date client'}</div></div>`;
 if(s.kind==='ownership')return '<div class="ownership-map">'+[0,1].map(j=>`<article data-from="${j}"><span class="ownership-label">${esc(a[j*4])}</span><div class="identity-route"><b>${esc(a[j*4+1])}</b><span aria-hidden="true">${j?'←':'→'}</span><b>${esc(a[j*4+2])}</b></div><p>${esc(a[j*4+3])}</p></article>`).join('')+`<div class="ownership-warning" data-from="2">${ru?'Ошибка проверки ≠ повод её выключить':'Verification error ≠ a reason to disable verification'}</div></div>`;
 if(s.kind==='egress'){
  const body=node(170,110,a[0],'',0,280)+node(950,110,a[1],'',0,280)
   +'<g data-only="0">'+line('M310 110H810')+badge(170,230,a[2])+svgText(560,70,a[6],'micro',18)+'</g>'
   +'<g data-from="1">'+line('M310 110H420',1)+node(560,110,a[3],'',1,280)+line('M700 110H810',1)+badge(560,230,a[4],1)+svgText(560,32,a[7],'micro',18)+'</g>'
   +'<g data-from="2">'+svgText(560,325,ru?'Другой маршрут → другая проверка':'Another route → another verifier','audit-line',24)+'</g>';
  return diagram(body,[a[6]+': '+a[0]+' → '+a[1],a[7]+': '+a[0]+' → '+a[3]+' → '+a[1],ru?'Только перехваченные соединения':'Only intercepted connections']);
 }
 if(s.kind==='dependency')return '<div class="dependency-map"><div class="dependency-chain">'+[0,1,2,3].map((j)=>`<article class="dep-${j}"><span>0${j+1}</span><h3>${esc(a[j])}</h3>${j<3?'<i aria-hidden="true">→</i>':''}</article>`).join('')+`</div><div class="dependency-results"><span>${esc(a[4])}</span><div class="dependency-result-stack"><strong data-only="0">${esc(a[5])}</strong><strong data-only="1">${esc(a[5])}</strong><strong data-only="2">${esc(a[6])}</strong></div><small data-from="2">${esc(a[7])}</small></div></div>`;
 return null;
}
