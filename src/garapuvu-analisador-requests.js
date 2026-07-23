var $=function(id){return document.getElementById(id);};
var fileInput=$('file'),keyInput=$('key'),go=$('go'),dl=$('dl'),msg=$('msg');
var loaded=null,decoded=null;
function setMsg(t,cls){msg.textContent=t;msg.className='msg '+cls;}
function toggleGo(){go.disabled=!(loaded&&keyInput.value);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function fromB64(str){var bin=atob(str);var u8=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return u8;}
function pretty(v){if(v==null)return '';var s=String(v);try{return JSON.stringify(JSON.parse(s),null,2);}catch(e){return s;}}
function hostOf(u){try{return new URL(u).host;}catch(e){return '';}}
function pathOf(u){try{var x=new URL(u);return x.pathname+(x.search?x.search:'');}catch(e){return u;}}

fileInput.addEventListener('change',function(){var f=fileInput.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{loaded=JSON.parse(r.result);setMsg('Arquivo carregado. Informe a chave e clique em Analisar.','ok');}catch(e){loaded=null;setMsg('Arquivo invalido (nao e JSON).','err');}toggleGo();};r.readAsText(f);});
keyInput.addEventListener('input',toggleGo);

go.addEventListener('click',async function(){
  if(!loaded||!loaded.encrypted){setMsg('Arquivo sem bloco criptografado.','err');return;}
  var e=loaded.encrypted;
  try{
    var enc=new TextEncoder(),dec=new TextDecoder();
    var base=await crypto.subtle.importKey('raw',enc.encode(keyInput.value),'PBKDF2',false,['deriveKey']);
    var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:fromB64(e.salt),iterations:e.iter||150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(e.iv)},key,fromB64(e.data));
    var sensitive=JSON.parse(dec.decode(pt));
    decoded={meta:loaded.meta||{},networkSummary:loaded.networkSummary||[],sensitive:sensitive};
    setMsg('Descriptografado com sucesso.','ok');dl.style.display='inline-block';render();
  }catch(err){setMsg('Falha ao descriptografar. Chave incorreta ou arquivo corrompido.','err');$('viewer').style.display='none';$('metaCard').style.display='none';}
});
dl.addEventListener('click',function(){if(!decoded)return;var blob=new Blob([JSON.stringify(decoded,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='garapuvu-sessao-DECIFRADA.json';document.body.appendChild(a);a.click();a.remove();});

function stClass(st){if(!st)return 's0';var n=Math.floor(st/100);return 's'+(n>=2&&n<=5?n:'0');}

function render(){
  var m=decoded.meta||{};
  var modeP=/completo/i.test(m.mode||'')?'<span class="pill full">completo</span>':'<span class="pill snap">snapshot</span>';
  var mg='';
  mg+='<div><span class="k">Host principal:</span> <span class="pill host">'+esc(m.host||'?')+'</span></div>';
  mg+='<div><span class="k">Modo de captura:</span> '+modeP+'</div>';
  mg+='<div><span class="k">Capturado em:</span> <b>'+esc(m.capturedAt||'')+'</b></div>';
  mg+='<div><span class="k">Consentimento:</span> <b>'+esc(m.consent)+'</b></div>';
  mg+='<div style="grid-column:1/-1"><span class="k">URL:</span> <b class="mono">'+esc(m.url||'')+'</b></div>';
  mg+='<div style="grid-column:1/-1"><span class="k">User-Agent:</span> <span class="small">'+esc(m.userAgent||'')+'</span></div>';
  $('meta').innerHTML=mg;$('metaCard').style.display='block';

  var s=decoded.sensitive||{};
  var net=(s.network&&s.network.length)?s.network:null;
  var fb=(!net&&decoded.networkSummary&&decoded.networkSummary.length)?decoded.networkSummary:null;
  var netCount=net?net.length:(fb?fb.length:0);
  var con=Array.isArray(s.console)?s.console:null;
  var cookies=parseCookies(s.cookies);
  var ls=(s.localStorage&&typeof s.localStorage==='object')?s.localStorage:{};
  var ss=(s.sessionStorage&&typeof s.sessionStorage==='object')?s.sessionStorage:{};
  var cache=Array.isArray(s.cacheStorage)?s.cacheStorage:[];
  var cacheCount=cache.reduce(function(a,c){return a+((c.urls&&c.urls.length)||0);},0);

  var audit=securityAudit(s,m,net,cookies,ls,ss);
  var tabsDef=[['sec','Seguranca',audit.findings.length],['perf','Performance',0],['req','Requisicoes',netCount],['con','Console',con?con.length:0],['cook','Cookies',cookies.length],['ls','localStorage',Object.keys(ls).length],['ss','sessionStorage',Object.keys(ss).length],['cache','Cache',cacheCount]];
  var th='';for(var i=0;i<tabsDef.length;i++){th+='<button class="tab'+(i===0?' active':'')+'" data-p="'+tabsDef[i][0]+'" data-testid="tab-'+tabsDef[i][0]+'">'+tabsDef[i][1]+'<span class="n">'+tabsDef[i][2]+'</span></button>';}
  $('tabs').innerHTML=th;
  var panes='';tabsDef.forEach(function(t,i){panes+='<div class="pane'+(i===0?' active':'')+'" id="pane-'+t[0]+'" data-testid="pane-'+t[0]+'"></div>';});
  $('panes').innerHTML=panes;$('viewer').style.display='block';

  renderReq(net,fb,m.host);
  renderConsole(con,s.console);
  renderCookies(cookies);
  renderStorage('pane-ls',ls);
  renderStorage('pane-ss',ss);
  renderCache(cache);
  renderSecurity(audit);
  renderPerf();
  document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active');});document.querySelectorAll('.pane').forEach(function(x){x.classList.remove('active');});b.classList.add('active');$('pane-'+b.dataset.p).classList.add('active');});});
}

function renderReq(net,fb,mainHost){
  var host=$('pane-req');
  if(!net&&!fb){host.innerHTML='<div class="empty">Nenhuma requisicao capturada.</div>';return;}
  var isFull=!!net;
  var list=(net||fb).map(function(r){return {rec:isFull?r:null,method:isFull?(r.method||''):((r.type||'').toUpperCase()),status:isFull?r.status:null,url:r.url,host:r.host||hostOf(r.url),dur:r.durationMs,err:r.error};});
  // domain facet
  var counts={};list.forEach(function(it){var h=it.host||'(relativo)';counts[h]=(counts[h]||0)+1;});
  var hosts=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];});
  var opts='<option value="">Todos os dominios ('+list.length+')</option>';
  hosts.forEach(function(h){opts+='<option value="'+esc(h)+'"'+(h===mainHost?' selected':'')+'>'+esc(h)+' ('+counts[h]+')</option>';});
  var note=isFull?'':'<div class="empty" style="margin-bottom:12px">Modo <b>snapshot</b>: sem status/body/headers. Para detalhes, capture com o <b>INICIAR</b>.</div>';
  host.innerHTML=note+'<div class="toolbar"><select id="reqDomain">'+opts+'</select><input class="search" id="reqSearch" placeholder="filtrar por URL, metodo ou status..." style="flex:1;min-width:240px"><span class="small" id="reqCount"></span></div><table><thead><tr><th>Metodo</th><th>Status</th><th>Dominio</th><th>Endpoint</th><th>Duracao</th></tr></thead><tbody id="reqBody"></tbody></table>';
  var body=$('reqBody');
  function draw(){
    var f=($('reqSearch').value||'').toLowerCase().trim();var dom=$('reqDomain').value;
    body.innerHTML='';var shown=0;
    list.forEach(function(it){
      if(dom&&it.host!==dom)return;
      var hay=((it.method||'')+' '+(it.status||'')+' '+(it.url||'')).toLowerCase();
      if(f&&hay.indexOf(f)<0)return;shown++;
      var tr=document.createElement('tr');tr.className='req-row';
      var stTxt=isFull?(it.status||(it.err?'ERR':'-')):'-';
      tr.innerHTML='<td><span class="method">'+esc(it.method)+'</span></td><td><span class="st '+stClass(it.status)+'">'+stTxt+'</span></td><td class="hostcell mono">'+esc(it.host)+'</td><td class="url mono">'+esc(pathOf(it.url))+'</td><td class="small">'+(it.dur!=null?it.dur+' ms':'-')+'</td>';
      body.appendChild(tr);
      if(it.rec){var det=document.createElement('tr');det.style.display='none';var dc=document.createElement('td');dc.colSpan=5;dc.className='detail';dc.innerHTML=reqDetail(it.rec);det.appendChild(dc);tr.addEventListener('click',function(){det.style.display=det.style.display==='none'?'':'none';});body.appendChild(det);}
    });
    $('reqCount').textContent=shown+' de '+list.length;
  }
  draw();
  $('reqSearch').addEventListener('input',draw);
  $('reqDomain').addEventListener('change',draw);
}
function reqDetail(r){
  var h='';
  h+='<div class="box"><h4>URL completa</h4><pre>'+esc(r.url)+'</pre></div>';
  if(r.error)h+='<div class="box"><h4>Erro</h4><pre>'+esc(r.error)+'</pre></div>';
  h+='<div class="box"><h4>Request headers</h4>'+kvBlock(r.reqHeaders)+'</div>';
  if(r.reqBody)h+='<div class="box"><h4>Request body</h4><pre>'+esc(pretty(r.reqBody))+'</pre></div>';
  h+='<div class="box"><h4>Response headers</h4>'+kvBlock(r.respHeaders)+'</div>';
  h+='<div class="box"><h4>Response body</h4><pre>'+(r.respBody?esc(pretty(r.respBody)):'<span class="small">(vazio)</span>')+'</pre></div>';
  return h;
}
function kvBlock(o){if(!o||typeof o!=='object'||!Object.keys(o).length)return '<span class="small">(nenhum)</span>';var h='<div class="kv">';Object.keys(o).forEach(function(k){h+='<div><span class="kk">'+esc(k)+':</span>'+esc(o[k])+'</div>';});return h+'</div>';}

function renderConsole(con,raw){
  var host=$('pane-con');
  if(!con){host.innerHTML='<div class="empty">'+esc(typeof raw==='string'?raw:'Console nao capturado.')+'<br><span class="small">Use o INICIAR no comeco para capturar o console.</span></div>';return;}
  if(!con.length){host.innerHTML='<div class="empty">Nenhuma mensagem de console registrada apos o INICIAR.</div>';return;}
  var levels={};con.forEach(function(l){levels[l.level]=(levels[l.level]||0)+1;});
  var chips='<span class="chip on" data-lv="all">Todos ('+con.length+')</span>';
  Object.keys(levels).forEach(function(lv){chips+='<span class="chip" data-lv="'+esc(lv)+'">'+esc(lv)+' ('+levels[lv]+')</span>';});
  host.innerHTML='<div class="toolbar">'+chips+'</div><div class="toolbar"><input class="search" id="conSearch" placeholder="buscar no console..." style="flex:1;min-width:240px"></div><div id="conList"></div>';
  var cur='all';
  function draw(){var f=($('conSearch').value||'').toLowerCase().trim();var html='';con.forEach(function(l){if(cur!=='all'&&l.level!==cur)return;var text=(l.msg||[]).join(' ');if(f&&text.toLowerCase().indexOf(f)<0)return;var tt=(l.t||'').slice(11,23);html+='<div class="logline"><span class="lv '+esc(l.level)+'">'+esc(l.level)+'</span><span class="lt">'+esc(tt)+'</span><span class="lm">'+esc(text)+'</span></div>';});$('conList').innerHTML=html||'<div class="empty">Nada encontrado.</div>';}
  draw();$('conSearch').addEventListener('input',draw);
  host.querySelectorAll('.chip').forEach(function(c){c.addEventListener('click',function(){host.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on');});c.classList.add('on');cur=c.dataset.lv;draw();});});
}

function parseCookies(str){if(!str||typeof str!=='string')return [];return str.split(';').map(function(p){p=p.trim();if(!p)return null;var i=p.indexOf('=');return {name:i>=0?p.slice(0,i):p,value:i>=0?p.slice(i+1):''};}).filter(Boolean);}
function looksJwt(v){v=String(v).replace(/^Bearer\s+/i,'');return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v);}
function decodeJwt(v){try{v=String(v).replace(/^Bearer\s+/i,'');var p=v.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');var pad=p.length%4;if(pad)p+='='.repeat(4-pad);return JSON.stringify(JSON.parse(decodeURIComponent(escape(atob(p)))),null,2);}catch(e){return '(nao foi possivel decodificar)';}}
function renderCookies(cookies){
  var host=$('pane-cook');
  if(!cookies.length){host.innerHTML='<div class="empty">Nenhum cookie acessivel (ou apenas HttpOnly, invisiveis por script).</div>';return;}
  var h='<table><thead><tr><th style="width:220px">Nome</th><th>Valor</th></tr></thead><tbody>';
  cookies.forEach(function(c,i){var jwt=looksJwt(c.value);h+='<tr><td class="mono" style="padding:9px 10px;vertical-align:top">'+esc(c.name)+(jwt?'<button class="sec tokbtn" data-jwt="'+i+'">decodificar JWT</button>':'')+'</td><td style="padding:9px 10px"><div class="mono" style="word-break:break-all;font-size:12px">'+esc(c.value)+'</div><pre id="jwt-'+i+'" style="display:none;margin-top:8px"></pre></td></tr>';});
  h+='</tbody></table>';host.innerHTML=h;
  host.querySelectorAll('[data-jwt]').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();var i=b.dataset.jwt;var pre=$('jwt-'+i);if(pre.style.display==='none'){pre.textContent=decodeJwt(cookies[i].value);pre.style.display='block';}else{pre.style.display='none';}});});
}
function renderStorage(paneId,obj){
  var host=$(paneId);var keys=Object.keys(obj||{});
  if(!keys.length){host.innerHTML='<div class="empty">Vazio.</div>';return;}
  var h='<table><thead><tr><th style="width:260px">Chave</th><th>Valor</th></tr></thead><tbody>';
  keys.forEach(function(k){h+='<tr><td class="mono" style="padding:9px 10px;vertical-align:top;word-break:break-all">'+esc(k)+'</td><td style="padding:9px 10px"><pre>'+esc(pretty(obj[k]))+'</pre></td></tr>';});
  h+='</tbody></table>';host.innerHTML=h;
}
function renderCache(cache){
  var host=$('pane-cache');
  if(!cache.length){host.innerHTML='<div class="empty">Nenhum cache registrado.</div>';return;}
  var h='';cache.forEach(function(c){h+='<div class="box" style="background:var(--card2);border:1px solid var(--ln);border-radius:12px;padding:12px 16px;margin:10px 0"><h4 style="margin:0 0 6px;color:var(--mut)">'+esc(c.cache)+' ('+((c.urls&&c.urls.length)||0)+')</h4><pre>'+esc((c.urls||[]).join('\n'))+'</pre></div>';});
  host.innerHTML=h;
}

function securityAudit(s,meta,net,cookies,ls,ss){
  var F=[],creds=[];
  var SENS=/(?:^|[^a-z0-9])(password|passwd|senha|pwd|pass|secret|client[_-]?secret|api[_-]?key|apikey|authorization|access[_-]?token|refresh[_-]?token|token|jwt|private[_-]?key|cvv|cartao|card)(?:[^a-z0-9]|$)/i;
  var PWDKEY=/(?:^|[^a-z0-9])(password|passwd|senha|pwd|pass)(?:[^a-z0-9]|$)/i;
  function isJwtish(v){v=String(v).replace(/^Bearer\s+/i,'');return /^eyJ[\w-]*\.[\w-]+(\.[\w-]*)?$/.test(v);}
  function add(sev,title,detail,where,rec){F.push({sev:sev,title:title,detail:detail||'',where:where||'',rec:rec||''});}
  function mask(v){v=String(v);if(v.length<=4)return '****';return v.slice(0,2)+'***'+v.slice(-2)+' ('+v.length+' chars)';}
  function shortU(u){try{var x=new URL(u);return x.host+x.pathname;}catch(e){return u;}}
  function lc(o){var r={};Object.keys(o||{}).forEach(function(k){r[k.toLowerCase()]=o[k];});return r;}
  function flatten(o,pre,acc){acc=acc||{};pre=pre||'';Object.keys(o||{}).forEach(function(k){var v=o[k];if(v&&typeof v==='object')flatten(v,pre+k+'.',acc);else acc[pre+k]=v;});return acc;}
  function parseBody(b){if(!b)return null;try{return JSON.parse(b);}catch(e){}try{var o={},sp=new URLSearchParams(b);sp.forEach(function(v,k){o[k]=v;});if(Object.keys(o).length)return o;}catch(e){}return null;}
  function scanKV(obj,src){Object.keys(obj||{}).forEach(function(k){var v=obj[k];if(v&&typeof v==='object'){scanKV(v,src);return;}if(PWDKEY.test(k)&&v){creds.push({key:k,value:String(v),src:src});}});}
  function jwtPart(p){try{p=p.replace(/-/g,'+').replace(/_/g,'/');var pad=p.length%4;if(pad)p+='='.repeat(4-pad);return decodeURIComponent(escape(atob(p)));}catch(e){return '';}}
  function analyzeJwt(tok,where){try{var t=String(tok).replace(/^Bearer\s+/i,'');var parts=t.split('.');if(parts.length<2)return;var hdr=jwtPart(parts[0]),pl=jwtPart(parts[1]);if(hdr&&/"alg"\s*:\s*"none"/i.test(hdr))add('critico','JWT com alg=none (sem assinatura)',where,'','Rejeite tokens sem assinatura no backend.');var o={};try{o=JSON.parse(pl);}catch(e){}if(o.exp){var ex=o.exp*1000;if(ex<Date.now())add('info','JWT expirado',where+' (exp '+new Date(ex).toISOString()+')','','');}var pii=[];Object.keys(o).forEach(function(kk){if(/(email|cpf|phone|mobile|fullname|name|user)/i.test(kk)&&o[kk])pii.push(kk);});if(pii.length)add('medio','PII dentro do JWT',where+': '+pii.join(', '),'','JWT e Base64 (nao criptografado). Evite PII sensivel no payload.');Object.keys(o).forEach(function(kk){if(PWDKEY.test(kk)&&o[kk]){add('critico','SENHA/credencial dentro do token',where+' -> campo "'+kk+'"','','Qualquer um decodifica o Base64. Nunca coloque senha no token.');creds.push({key:kk,value:String(o[kk]),src:where});}});}catch(e){}}
  net=net||[];
  net.forEach(function(r){
    var url=r.url||'';
    if(/^http:\/\//i.test(url))add('alto','Requisicao sem HTTPS',r.method+' '+shortU(url),url,'Dados trafegam em texto claro. Force HTTPS/HSTS.');
    try{var q=new URL(url).searchParams,hits=[];q.forEach(function(v,k){if(SENS.test(k))hits.push(k+'='+mask(v));});if(hits.length)add('critico','Dado sensivel na URL (query string)',hits.join(' , '),shortU(url),'Credenciais/tokens na URL vazam em logs, historico e header Referer.');}catch(e){}
    var rb=parseBody(r.reqBody);
    if(rb){scanKV(rb,r.method+' '+shortU(url));var fl=flatten(rb),found=[];Object.keys(fl).forEach(function(k){if(SENS.test(k))found.push(k);});if(found.length&&/login|auth|signin|token|session|senha/i.test(url))add('alto','Credenciais no corpo do login',found.join(', ')+' em '+shortU(url),url,'Mesmo em HTTPS o valor e extraivel de quem captura o navegador/trafego. Nao logue e limite exposicao.');}
    var rh=r.reqHeaders||{};Object.keys(rh).forEach(function(k){if(/^authorization$/i.test(k)){var val=String(rh[k]);add('medio','Token de autorizacao em header',k+': '+mask(val),shortU(url),'Token capturavel; use expiracao curta e escopo minimo.');if(isJwtish(val))analyzeJwt(val,'Authorization em '+shortU(url));}});
    var H=lc(r.respHeaders||{});
    if(H['access-control-allow-origin']==='*')add('medio','CORS liberado (Access-Control-Allow-Origin: *)',shortU(url),url,'Nao use * junto com credenciais; restrinja as origens.');
    if(H['set-cookie']){var sc=String(H['set-cookie']),miss=[];if(!/httponly/i.test(sc))miss.push('HttpOnly');if(!/secure/i.test(sc))miss.push('Secure');if(!/samesite/i.test(sc))miss.push('SameSite');if(miss.length)add('alto','Set-Cookie sem flags de seguranca ('+miss.join(', ')+')',shortU(url),url,'Adicione HttpOnly, Secure e SameSite nos cookies de sessao.');}
    if(r.respBody){var rbody=String(r.respBody);if(/["']?\s*(pass(word)?|senha)\s*["']?\s*[:=]/i.test(rbody))add('critico','Possivel senha/credencial no corpo da RESPOSTA',shortU(url),url,'A API nao deve retornar senha/segredos no payload.');try{scanKV(JSON.parse(rbody),'resposta '+shortU(url));}catch(e){}var cpf=rbody.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);if(cpf)add('medio','CPF exposto na resposta',cpf[0],shortU(url),'Mascare/omita PII em respostas.');}
  });
  var secHdrs=['strict-transport-security','content-security-policy','x-content-type-options','x-frame-options','referrer-policy'],seen={};
  net.forEach(function(r){var H=lc(r.respHeaders||{});secHdrs.forEach(function(h){if(H[h])seen[h]=true;});});
  var missing=secHdrs.filter(function(h){return !seen[h];});
  if(net.length&&missing.length)add('baixo','Cabecalhos de seguranca ausentes (nas respostas capturadas)',missing.join(', '),'','Considere adicionar: '+missing.join(', ')+'.');
  (cookies||[]).forEach(function(c){if(/(auth|token|session|sid|jwt|access)/i.test(c.name)){add('alto','Cookie de sessao/token acessivel por JavaScript','Cookie "'+c.name+'" veio de document.cookie => NAO e HttpOnly','cookie '+c.name,'Marque HttpOnly para mitigar roubo via XSS.');if(isJwtish(c.value))analyzeJwt(c.value,'cookie '+c.name);}if(PWDKEY.test(c.name))creds.push({key:c.name,value:c.value,src:'cookie'});});
  [['localStorage',ls],['sessionStorage',ss]].forEach(function(pair){var name=pair[0],obj=pair[1]||{};Object.keys(obj).forEach(function(k){var v=String(obj[k]);if(SENS.test(k)||isJwtish(v)){add('alto','Token/segredo em '+name,'chave "'+k+'"','','Dados em '+name+' sao acessiveis por qualquer script (XSS). Prefira cookie HttpOnly.');if(isJwtish(v))analyzeJwt(v,name+' chave '+k);}if(PWDKEY.test(k))creds.push({key:k,value:v,src:name});});});
  var fseen={},fu=[];F.forEach(function(f){var kk=f.sev+'|'+f.title+'|'+f.detail;if(!fseen[kk]){fseen[kk]=1;fu.push(f);}});
  var cseen={},cu=[];creds.forEach(function(c){var kk=c.src+'|'+c.key+'|'+c.value;if(!cseen[kk]){cseen[kk]=1;cu.push(c);}});
  return {findings:fu,creds:cu};
}

var __zap=null,__lh=null;
function setTabBadge(p,n){var t=document.querySelector('.tab[data-p="'+p+'"] .n');if(t)t.textContent=n;}
function maskC(v){v=String(v);if(v.length<=4)return '****';return v.slice(0,1)+'***'+v.slice(-1)+' ('+v.length+' chars)';}
function credboxHtml(creds){var h='<div class="credbox '+(creds.length?'bad':'good')+'"><h3 style="margin:0 0 8px">&#128273; Caca-credenciais</h3>';if(creds.length){h+='<p class="small" style="margin:0 0 10px">Encontrei '+creds.length+' valor(es) sob chaves de senha/credencial:</p><table><thead><tr><th>Chave</th><th>Origem</th><th>Valor</th></tr></thead><tbody>';creds.forEach(function(c,i){h+='<tr><td class="mono">'+esc(c.key)+'</td><td class="small">'+esc(c.src)+'</td><td><span class="mono" id="cv-'+i+'">'+esc(maskC(c.value))+'</span> <button class="sec tokbtn" data-cv="'+i+'">revelar</button></td></tr>';});h+='</tbody></table>';}else{h+='<p class="small" style="margin:0">Nenhuma senha em texto sob chaves de credencial. Obs.: senha de login em HTTPS ainda aparece no corpo da requisicao.</p>';}return h+'</div>';}
function wireCredReveal(host,creds){host.querySelectorAll('[data-cv]').forEach(function(b){b.addEventListener('click',function(){var i=b.dataset.cv;$('cv-'+i).textContent=creds[i].value;b.style.display='none';});});}
function findingHtml(f,labels){return '<div class="finding '+f.sev+'"><div class="fh"><span class="sev '+f.sev+'">'+labels[f.sev]+'</span><b>'+esc(f.title)+'</b></div>'+(f.detail?'<div class="fd">'+esc(f.detail)+'</div>':'')+(f.where?'<div class="small">Onde: '+esc(f.where)+'</div>':'')+(f.rec?'<div class="frec">&#128161; '+esc(f.rec)+'</div>':'')+'</div>';}
function zapSev(risk){risk=(risk||'').toLowerCase();if(/alto|high/.test(risk))return 'alto';if(/m..?dio|medium/.test(risk))return 'medio';if(/baixo|low/.test(risk))return 'baixo';return 'info';}
function parseZapHtml(text){var doc=new DOMParser().parseFromString(text,'text/html');var rows=doc.querySelectorAll('.alert-type-counts-table tbody tr');var alerts=[],total=0;rows.forEach(function(tr){var an=tr.querySelector('th a')||tr.querySelector('th');var name=an?an.textContent.trim():'';var rl=tr.querySelector('.risk-level');var risk=rl?rl.textContent.trim():'';var cs=tr.querySelector('td span');var cnt=cs?(parseInt((cs.textContent||'').replace(/\D/g,''))||0):0;if(!name)return;alerts.push({name:name,risk:risk,count:cnt,sev:zapSev(risk)});total+=cnt;});var byRisk={};alerts.forEach(function(a){byRisk[a.risk]=(byRisk[a.risk]||0)+a.count;});return {total:total,alerts:alerts,byRisk:byRisk,source:'html'};}
function parseZapJson(o){var alerts=[],map={};function addA(a){var name=a.alert||a.name||'Alerta';var risk=String(a.riskdesc||a.risk||'').split(' ')[0]||'';var cnt=parseInt(a.count||(a.instances&&a.instances.length)||1)||1;if(!map[name]){map[name]={name:name,risk:risk,count:0,sev:zapSev(risk)};alerts.push(map[name]);}map[name].count+=cnt;}if(o.site){(Array.isArray(o.site)?o.site:[o.site]).forEach(function(st){(st.alerts||[]).forEach(addA);});}else if(o.alerts){o.alerts.forEach(addA);}var total=alerts.reduce(function(x,a){return x+a.count;},0);var byRisk={};alerts.forEach(function(a){byRisk[a.risk]=(byRisk[a.risk]||0)+a.count;});return {total:total,alerts:alerts,byRisk:byRisk,source:'json'};}
function zapSectionHtml(zap){var labels={critico:'CRITICO',alto:'ALTO',medio:'MEDIO',baixo:'BAIXO',info:'INFO'},order={critico:0,alto:1,medio:2,baixo:3,info:4};var al=zap.alerts.slice().sort(function(a,b){return (order[a.sev]-order[b.sev])||(b.count-a.count);});var top=al.filter(function(a){return a.sev==='alto'||a.sev==='medio';}).slice(0,3).map(function(a){return a.name;});var interp='O ZAP encontrou '+zap.total+' alerta(s) em '+zap.alerts.length+' tipo(s). '+(top.length?('Priorize: '+top.join('; ')+'.'):'Sem alertas de risco medio/alto.');var h='<h3 style="margin:22px 0 8px">&#9889; OWASP ZAP</h3><div class="note">'+esc(interp)+'</div><table><thead><tr><th>Alerta</th><th>Risco</th><th>Qtde</th></tr></thead><tbody>';al.forEach(function(a){h+='<tr><td>'+esc(a.name)+'</td><td><span class="sev '+a.sev+'">'+esc(a.risk||a.sev)+'</span></td><td>'+a.count+'</td></tr>';});return h+'</tbody></table>';}
function renderSecurity(audit){var host=$('pane-sec');var order={critico:0,alto:1,medio:2,baixo:3,info:4},labels={critico:'CRITICO',alto:'ALTO',medio:'MEDIO',baixo:'BAIXO',info:'INFO'};var zap=__zap;var counts={critico:0,alto:0,medio:0,baixo:0,info:0};audit.findings.forEach(function(f){counts[f.sev]=(counts[f.sev]||0)+1;});if(zap){zap.alerts.forEach(function(a){counts[a.sev]=(counts[a.sev]||0)+(a.count||1);});}var total=audit.findings.length+(zap?zap.total:0);var sum='';['critico','alto','medio','baixo','info'].forEach(function(sv){sum+='<span class="sevpill '+sv+'">'+labels[sv]+': '+(counts[sv]||0)+'</span>';});var h='<div class="scanpanel"><div class="scanhead"><b>Scan de seguranca consolidado</b><span class="small">'+total+' achado(s) '+(zap?'(sessao + OWASP ZAP)':'(sessao)')+'</span></div><div class="secsummary">'+sum+'</div><div class="importrow"><label class="imp" data-testid="btn-import-zap">Importar relatorio OWASP ZAP<input type="file" id="zapFile" data-testid="input-zap" accept=".html,.json,.xml" style="display:none"></label>'+(zap?'<span class="small">ZAP: '+zap.total+' alertas / '+zap.alerts.length+' tipos ('+zap.source+')</span>':'<span class="small">nenhum relatorio ZAP importado</span>')+'</div></div>';h+=credboxHtml(audit.creds);if(zap)h+=zapSectionHtml(zap);h+='<h3 style="margin:22px 0 8px">Achados da sessao capturada</h3>';if(!audit.findings.length){h+='<div class="empty">Nenhum achado nas heuristicas da sessao.</div>';}else{var sorted=audit.findings.slice().sort(function(a,b){return order[a.sev]-order[b.sev];});h+='<div class="findlist">';sorted.forEach(function(f){h+=findingHtml(f,labels);});h+='</div>';}host.innerHTML=h;wireCredReveal(host,audit.creds);var zf=$('zapFile');if(zf){zf.addEventListener('change',function(){var fl=zf.files[0];if(!fl)return;var r=new FileReader();r.onload=function(){try{__zap=/\.json$/i.test(fl.name)?parseZapJson(JSON.parse(r.result)):parseZapHtml(r.result);setTabBadge('sec',audit.findings.length+__zap.total);renderSecurity(audit);}catch(e){alert('Nao consegui ler o relatorio ZAP: '+e);}};r.readAsText(fl);});}}
function parseLighthouse(o){var cats=o.categories||{};function C(k){return cats[k]&&cats[k].score!=null?Math.round(cats[k].score*100):null;}var scores={performance:C('performance'),accessibility:C('accessibility'),'best-practices':C('best-practices'),seo:C('seo'),pwa:C('pwa')};var au=o.audits||{};function metric(k){var a=au[k];return a?{title:a.title,display:a.displayValue,score:a.score}:null;}var vitals={lcp:metric('largest-contentful-paint'),fcp:metric('first-contentful-paint'),cls:metric('cumulative-layout-shift'),tbt:metric('total-blocking-time'),si:metric('speed-index'),tti:metric('interactive')};var opps=[];Object.keys(au).forEach(function(k){var a=au[k];if(a&&a.details&&a.details.type==='opportunity'&&a.numericValue>0&&a.score!=null&&a.score<1){opps.push({title:a.title,ms:Math.round(a.numericValue),display:a.displayValue});}});opps.sort(function(x,y){return y.ms-x.ms;});
  // Screenshots capturados (data URIs) e dados do treemap de JS — como no DevTools
  function shot(k){var a=au[k];return (a&&a.details&&a.details.data)?a.details.data:null;}
  var finalScreenshot=shot('final-screenshot');
  var filmstrip=[];var stn=au['screenshot-thumbnails'];if(stn&&stn.details&&stn.details.items){filmstrip=stn.details.items.filter(function(it){return it&&it.data;}).map(function(it){return {data:it.data,timing:it.timing};});}
  var treemap=null;var tm=au['script-treemap-data'];if(tm&&tm.details){treemap=tm.details.nodes||tm.details.items||null;}
  return {scores:scores,vitals:vitals,opps:opps.slice(0,8),url:(o.finalDisplayedUrl||o.finalUrl||o.requestedUrl||''),finalScreenshot:finalScreenshot,filmstrip:filmstrip,treemap:treemap};}
// Le o relatorio HTML do Lighthouse/PageSpeed usando o markup padrao do renderer (.lh-*).
// Funciona tanto para um relatorio Lighthouse "puro" quanto para a pagina salva do pagespeed.web.dev,
// pois ambos embutem os gauges de categoria (.lh-gauge__wrapper) e as metricas (.lh-metric).
function parseLighthouseHtml(html){try{
  var doc=new DOMParser().parseFromString(html,'text/html');
  // 1) Scores por categoria: cada gauge e um <a href="...#categoria"> com um .lh-gauge__percentage
  var scores={};
  doc.querySelectorAll('a.lh-gauge__wrapper[href*="#"]').forEach(function(w){
    var cat=(w.getAttribute('href')||'').split('#').pop();
    if(!cat||scores[cat]!==undefined)return; // primeira ocorrencia vence (evita duplicatas)
    var pct=w.querySelector('.lh-gauge__percentage');
    var txt=pct?(pct.textContent||'').trim():'';
    var num=parseInt((txt||'').replace(/\D/g,''));
    scores[cat]=(txt&&!isNaN(num))?num:null; // null quando o gauge veio com "Erro!"
  });
  // 2) Core Web Vitals / metricas: <div class="lh-metric" id="..."> com __title e __value
  var idMap={'largest-contentful-paint':'lcp','first-contentful-paint':'fcp','cumulative-layout-shift':'cls','total-blocking-time':'tbt','speed-index':'si','interactive':'tti'};
  var vitals={};
  doc.querySelectorAll('.lh-metric').forEach(function(el){
    var key=idMap[el.id];if(!key||vitals[key])return;
    var title=(el.querySelector('.lh-metric__title')||{}).textContent||el.id;
    var val=(el.querySelector('.lh-metric__value')||{}).textContent||'';
    vitals[key]={title:(title||'').trim(),display:(val||'').trim()||'-',score:/error|erro/i.test(val)?0:1};
  });
  // 3) URL analisada (varias origens possiveis, incluindo o comentario "saved from url")
  var url='';
  var m=(html.match(/saved from url=\(\d+\)([^\s"]+)/)||[])[1];
  if(m)url=decodeURIComponent(m);
  var urlEl=doc.querySelector('.lh-topbar__url, a.lh-topbar__url, [data-final-url]');
  if(!url&&urlEl)url=(urlEl.getAttribute('href')||urlEl.getAttribute('data-final-url')||urlEl.textContent||'').trim();
  return {scores:scores,vitals:vitals,opps:[],url:url};
}catch(e){return null;}}
function fmtKB(b){b=b||0;return b>=1048576?(b/1048576).toFixed(1)+' MB':(b/1024).toFixed(1)+' KB';}
function tmShort(n){n=String(n||'');var q=n.split('?')[0];var parts=q.split('/');return parts[parts.length-1]||q||n;}
function openLightbox(src){if(!src)return;var d=document.createElement('div');d.className='lightbox';var img=document.createElement('img');img.src=src;d.appendChild(img);d.addEventListener('click',function(){d.remove();});document.body.appendChild(d);}
function renderTreemap(nodes,container,crumb){
  crumb=crumb||[];nodes=nodes||[];
  var total=nodes.reduce(function(a,n){return a+(n.resourceBytes||0);},0)||1;
  var sorted=nodes.slice().sort(function(a,b){return (b.resourceBytes||0)-(a.resourceBytes||0);});
  var h='<div class="tmbar"><button class="sec" id="tmRoot">Raiz</button>';
  crumb.forEach(function(c,i){h+='<span class="small">/</span><button class="sec" data-crumb="'+i+'">'+esc(tmShort(c.name))+'</button>';});
  h+='<span class="small">'+fmtKB(total)+' • '+nodes.length+' item(ns)</span></div><div class="treemap">';
  sorted.forEach(function(n,i){
    var pct=Math.max(6,Math.round((n.resourceBytes||0)/total*100));
    var unused=n.unusedBytes?Math.min(100,Math.round(n.unusedBytes/(n.resourceBytes||1)*100)):0;
    var kids=n.children&&n.children.length;
    h+='<div class="tmtile" data-idx="'+i+'" style="flex:'+(n.resourceBytes||1)+' 1 '+pct+'%" title="'+esc(n.name)+'"><div class="tmb" style="width:'+unused+'%"></div><div class="tmt">'+esc(tmShort(n.name))+(kids?' ▸':'')+'</div><div class="tms">'+fmtKB(n.resourceBytes)+(unused?(' • '+unused+'% n/ usado'):'')+'</div></div>';
  });
  h+='</div><div class="small" style="margin-top:6px">A faixa vermelha indica bytes baixados e nao utilizados. Clique num item com ▸ para abrir os modulos.</div>';
  container.innerHTML=h;
  container.querySelectorAll('.tmtile').forEach(function(t){t.addEventListener('click',function(){var n=sorted[+t.dataset.idx];if(n.children&&n.children.length)renderTreemap(n.children,container,crumb.concat([n]));});});
  var root=container.querySelector('#tmRoot');if(root)root.addEventListener('click',function(){renderTreemap(__lh.treemap,container,[]);});
  container.querySelectorAll('[data-crumb]').forEach(function(b){b.addEventListener('click',function(){var i=+b.dataset.crumb;renderTreemap(crumb[i].children,container,crumb.slice(0,i+1));});});
}
function lhSectionHtml(lh){function col(s){if(s==null)return 'var(--mut)';return s>=90?'#0cce6b':(s>=50?'#ffa400':'#ff4e42');}var names={performance:'Performance',accessibility:'Acessibilidade','best-practices':'Boas praticas',seo:'SEO',pwa:'PWA'};var h='<h3 style="margin:22px 0 8px">Scores Lighthouse</h3><div class="scorewrap">';Object.keys(names).forEach(function(k){var sc=lh.scores[k];h+='<div class="scorecard"><div class="ring" style="--c:'+col(sc)+'"><span>'+(sc==null?'-':sc)+'</span></div><div class="small">'+names[k]+'</div></div>';});h+='</div>';
  if(lh.filmstrip&&lh.filmstrip.length){h+='<h3 style="margin:22px 0 8px">Filmstrip (carregamento)</h3><div class="lh-film">';lh.filmstrip.forEach(function(f){var t=f.timing!=null?(f.timing>=1000?(f.timing/1000).toFixed(1)+'s':f.timing+'ms'):'';h+='<div style="text-align:center"><img src="'+esc(f.data)+'" alt="frame '+esc(t)+'"><div class="small">'+esc(t)+'</div></div>';});h+='</div>';}
  var vn={lcp:'LCP',fcp:'FCP',cls:'CLS',tbt:'TBT',si:'Speed Index',tti:'TTI'};h+='<h3 style="margin:22px 0 8px">Core Web Vitals</h3><table><thead><tr><th>Metrica</th><th>Valor</th></tr></thead><tbody>';Object.keys(vn).forEach(function(k){var v=lh.vitals[k];if(v)h+='<tr><td>'+vn[k]+' - '+esc(v.title||'')+'</td><td><b>'+esc(v.display||'-')+'</b></td></tr>';});h+='</tbody></table>';
  if(lh.finalScreenshot){h+='<h3 style="margin:22px 0 8px">Screenshot final</h3><img class="lh-shot" id="lhShot" data-testid="lh-shot" src="'+esc(lh.finalScreenshot)+'" alt="screenshot final"><div class="small">Clique para ampliar.</div>';}
  if(lh.treemap&&lh.treemap.length){h+='<h3 style="margin:22px 0 8px">Treemap de JavaScript</h3><div class="tmbar"><button class="sec" id="tmBtn" data-testid="btn-treemap">Ver Treemap</button><span class="small">'+lh.treemap.length+' script(s) — navegue como no DevTools</span></div><div id="tmWrap" data-testid="treemap-wrap"></div>';}
  if(lh.opps.length){h+='<h3 style="margin:22px 0 8px">Principais oportunidades</h3><table><thead><tr><th>Oportunidade</th><th>Economia estimada</th></tr></thead><tbody>';lh.opps.forEach(function(o){h+='<tr><td>'+esc(o.title)+'</td><td>'+esc(o.display||(o.ms+' ms'))+'</td></tr>';});h+='</tbody></table>';}return h;}
function renderPerf(){var host=$('pane-perf');if(!host)return;var meta=(window.decoded&&window.decoded.meta)||{};var main=meta.url||'';if(!main&&window.decoded&&window.decoded.sensitive&&window.decoded.sensitive.network&&window.decoded.sensitive.network[0])main=window.decoded.sensitive.network[0].url||'';var lh=__lh;var h='<div class="scanpanel"><div class="scanhead"><b>Performance (Lighthouse)</b><span class="small">URL principal da 1a interacao</span></div><label>URL a testar</label><div class="importrow"><input class="search" id="perfUrl" data-testid="input-perf-url" value="'+esc(main)+'" style="flex:1;min-width:320px"><button id="perfRun" data-testid="btn-pagespeed">Rodar no Lighthouse (PageSpeed)</button></div><div class="small">Abre o Lighthouse na nuvem e gera o relatorio completo. Local: <code>npx lighthouse URL --view</code></div><div class="importrow" style="margin-top:12px"><label class="imp" data-testid="btn-import-lh-json">Importar JSON do Lighthouse (DevTools)<input type="file" id="lhJsonFile" data-testid="input-lh-json" accept=".json,application/json" style="display:none"></label><label class="imp" data-testid="btn-import-lh-html">Importar HTML do PageSpeed (.html / .htm)<input type="file" id="lhFile" data-testid="input-lh-html" accept=".json,.html,.htm,application/json" style="display:none"></label>'+(lh?'<span class="small">relatorio importado ('+esc(lh.url||'')+')</span>':'<span class="small">nenhum relatorio importado</span>')+'</div></div>';if(lh)h+=lhSectionHtml(lh);else h+='<div class="empty">Rode o Lighthouse (botao acima) e depois importe o JSON ou HTML para ver scores, Core Web Vitals e oportunidades. Ou use o PageSpeed para o relatorio completo online.</div>';host.innerHTML=h;var pr=$('perfRun');if(pr)pr.addEventListener('click',function(){var u=($('perfUrl').value||'').trim();if(!u){alert('Informe a URL.');return;}if(!/^https?:/i.test(u))u='https://'+u;window.open('https://pagespeed.web.dev/analysis?url='+encodeURIComponent(u),'_blank');});function loadLh(fl,forceJson){if(!fl)return;var r=new FileReader();r.onload=function(){try{var content=r.result;var isJson=forceJson||/^\s*\{/.test(content);__lh=isJson?parseLighthouse(JSON.parse(content)):parseLighthouseHtml(content);if(!__lh){alert('Nao consegui ler o relatorio Lighthouse (formato invalido).');return;}renderPerf();}catch(e){alert('Nao consegui ler o relatorio Lighthouse: '+e);}};r.readAsText(fl);}
  var lf=$('lhFile');if(lf)lf.addEventListener('change',function(){loadLh(lf.files[0],false);});
  var lj=$('lhJsonFile');if(lj)lj.addEventListener('change',function(){loadLh(lj.files[0],true);});
  var tb=$('tmBtn');if(tb)tb.addEventListener('click',function(){var w=$('tmWrap');if(!w||!__lh)return;if(w.dataset.open==='1'){w.innerHTML='';w.dataset.open='';tb.textContent='Ver Treemap';}else{renderTreemap(__lh.treemap,w,[]);w.dataset.open='1';tb.textContent='Ocultar Treemap';}});
  var ls=$('lhShot');if(ls)ls.addEventListener('click',function(){openLightbox(ls.getAttribute('src'));});
  host.querySelectorAll('.lh-film img').forEach(function(im){im.addEventListener('click',function(){openLightbox(im.getAttribute('src'));});});
}
