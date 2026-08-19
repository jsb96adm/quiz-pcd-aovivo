(function(){

const QUESTIONS = [
  {
    q:"Na aposentadoria da PCD por tempo de contribuição, quanto tempo é exigido de um HOMEM com deficiência GRAVE?",
    options:{a:"20 anos",b:"25 anos",c:"29 anos",d:"33 anos"},
    correct:"b",
    explain:"Grave: 25 anos (H) / 20 (M). Moderada: 29/24. Leve: 33/28. Quanto mais grave, menor o tempo exigido (art. 3º, I a III, LC 142/2013)."
  },
  {
    q:"Quais os requisitos da modalidade por IDADE da aposentadoria da PCD?",
    options:{a:"65 (H)/62 (M) anos + 15 anos de contribuição",b:"62 (H)/57 (M) anos + 20 anos de contribuição",c:"60 (H)/55 (M) anos + 15 anos de contribuição como PCD, qualquer grau",d:"60/55 anos + 25 anos, apenas para grau grave"},
    correct:"c",
    explain:"Art. 3º, IV, LC 142: 60 (H)/55 (M) anos + 15 anos de contribuição na condição de PCD, independentemente do grau."
  },
  {
    q:"Qual a carência exigida nas duas modalidades da aposentadoria da PCD?",
    options:{a:"60 contribuições",b:"120 contribuições",c:"240 contribuições",d:"180 contribuições"},
    correct:"d",
    explain:"São exigidas 180 contribuições mensais de carência, tanto por idade quanto por tempo de contribuição."
  },
  {
    q:"Sobre a distinção entre deficiência e incapacidade, é correto afirmar:",
    options:{a:"São conceitos sinônimos",b:"A incapacidade pressupõe a deficiência; a deficiência não depende da incapacidade para existir",c:"A deficiência pressupõe a incapacidade",d:"Toda pessoa com deficiência é incapaz para o trabalho"},
    correct:"b",
    explain:"A incapacidade parte de uma deficiência que impede o exercício laboral; já a deficiência pode existir sem incapacidade. A PCD trabalha, apesar das barreiras."
  },
  {
    q:"Quem realiza a avaliação da deficiência no INSS para fins de aposentadoria da PCD?",
    options:{a:"Perícia médica e serviço social, em avaliação biopsicossocial",b:"Apenas o perito médico",c:"Apenas o assistente social",d:"Uma junta de três médicos"},
    correct:"a",
    explain:"Avaliação biopsicossocial com dupla aplicação (perícia médica + serviço social), pelo IF-BrA, sobre 41 atividades em 7 domínios."
  },
  {
    q:"No IF-BrA, uma atividade que a pessoa realiza sozinha, mas com adaptação e mais lentamente (independência modificada), recebe:",
    options:{a:"100 pontos",b:"50 pontos",c:"75 pontos",d:"25 pontos"},
    correct:"c",
    explain:"100 = independente pleno; 75 = independência modificada; 50 = auxílio de terceiros; 25 = não realiza / dependência total. Menor pontuação, deficiência mais grave."
  },
  {
    q:"Qual faixa de pontuação do IF-BrA enquadra a deficiência como GRAVE?",
    options:{a:"≤ 5.739",b:"5.740 a 6.354",c:"6.355 a 7.584",d:"≥ 7.585"},
    correct:"a",
    explain:"Grave ≤ 5.739; moderada 5.740–6.354; leve 6.355–7.584; insuficiente ≥ 7.585 (Portaria Interministerial nº 1/2014)."
  },
  {
    q:"Como fica a RMI da aposentadoria da PCD em cada modalidade?",
    options:{a:"Sempre 60% + 2% por ano de contribuição",b:"Por tempo: 70% + 1%; por idade: 100% do salário de benefício",c:"Sempre 100% do salário de benefício",d:"Por tempo: 100% do salário de benefício; por idade: 70% + 1% por grupo de 12 contribuições"},
    correct:"d",
    explain:"Art. 8º, LC 142: por tempo de contribuição, 100% do SB; por idade, 70% + 1% por grupo de 12 contribuições, até o teto de 100%."
  },
  {
    q:"Como se apura o salário de benefício da PCD e qual o efeito da EC 103/2019?",
    options:{a:"Média de 100% dos salários, por força da EC 103",b:"Média dos 80% maiores salários (art. 29); a EC 103 não alterou a LC 142 (art. 22)",c:"Média dos 60% maiores salários",d:"A EC 103 passou a exigir idade mínima de 65/62"},
    correct:"b",
    explain:"O art. 22 da EC 103 preservou a LC 142, inclusive o cálculo: SB = média dos 80% maiores. O INSS às vezes erra aplicando a média de 100% e/ou o coeficiente de 60% — o que rende revisão."
  },
  {
    q:"Tempo especial e deficiência no mesmo período contributivo:",
    options:{a:"Somam-se as duas reduções",b:"Usa-se sempre a redução por deficiência",c:"Não se acumulam as duas reduções; converte-se o especial em tempo de PCD se for mais vantajoso",d:"É vedada qualquer conversão"},
    correct:"c",
    explain:"Art. 10 da LC 142 / art. 70-F do Dec. 3.048: as reduções não se acumulam; permite-se converter o tempo especial em PCD apenas se resultar mais favorável ao segurado."
  }
];

const DURATION_MS = 25000;
const SESSION_KEY = "pcdquiz_session_v1";
const PLAYER_PREFIX = "pcdquiz_player_v1_";
const LETTERS = ["a","b","c","d"];

const FORCED_ROLE = (typeof window !== 'undefined' && window.PCDQUIZ_FORCED_ROLE) ? window.PCDQUIZ_FORCED_ROLE : null;
let role = FORCED_ROLE;
let playerId = null;
let playerName = "";
let playerCache = null; // last known own record
let lastAnsweredIndex = -1;
let session = {phase:"lobby", currentIndex:-1, questionStartedAt:0, ranking:[]};
let players = [];
let qrUrl = (typeof window !== "undefined" && window.location ? new URL("participante.html", window.location.href).href : "");
let pollHandle = null;
let tickHandle = null;
let loading = false;

async function getKey(key){
  try{
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : null;
  }catch(e){ return null; }
}
async function setKey(key, val){
  try{
    await window.storage.set(key, JSON.stringify(val), true);
    return true;
  }catch(e){ console.error("storage set failed", e); return false; }
}
async function deleteKey(key){
  try{ await window.storage.delete(key, true); }catch(e){}
}
async function listPlayerKeys(){
  try{
    const r = await window.storage.list(PLAYER_PREFIX, true);
    return r ? r.keys : [];
  }catch(e){ return []; }
}
async function fetchAllPlayers(){
  const keys = await listPlayerKeys();
  const vals = await Promise.all(keys.map(k => getKey(k)));
  return vals.filter(Boolean).sort((a,b)=> (b.total||0)-(a.total||0));
}
function genId(){
  return Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

async function refresh(){
  const s = await getKey(SESSION_KEY);
  session = s || {phase:"lobby", currentIndex:-1, questionStartedAt:0, ranking:[]};
  if(role === "host"){
    players = await fetchAllPlayers();
  }
  render();
}

function startPolling(){
  stopPolling();
  refresh();
  pollHandle = setInterval(refresh, 2500);
}
function stopPolling(){
  if(pollHandle) clearInterval(pollHandle);
  pollHandle = null;
}
function startTicking(){
  stopTicking();
  tickHandle = setInterval(render, 1000);
}
function stopTicking(){
  if(tickHandle) clearInterval(tickHandle);
  tickHandle = null;
}

// ---------- ACTIONS ----------

async function actionChooseRole(r){
  role = r;
  if(r === "host"){
    startPolling();
  } else {
    render();
  }
}

async function actionJoin(name){
  if(!name || !name.trim()) return;
  playerName = name.trim().slice(0,40);
  playerId = genId();
  playerCache = {name: playerName, total:0, answers:{}};
  await setKey(PLAYER_PREFIX + playerId, playerCache);
  startPolling();
}

async function actionHostStart(){
  await setKey(SESSION_KEY, {phase:"question", currentIndex:0, questionStartedAt: Date.now(), ranking:[]});
  refresh();
}

async function actionHostReveal(){
  const list = await fetchAllPlayers();
  players = list;
  const ranking = list.map(p => ({name:p.name, total:p.total||0}));
  await setKey(SESSION_KEY, {...session, phase:"reveal", ranking});
  refresh();
}

async function actionHostRanking(){
  await setKey(SESSION_KEY, {...session, phase:"ranking"});
  refresh();
}

async function actionHostNext(){
  const nextIdx = session.currentIndex + 1;
  if(nextIdx >= QUESTIONS.length){
    const list = await fetchAllPlayers();
    const ranking = list.map(p => ({name:p.name, total:p.total||0}));
    await setKey(SESSION_KEY, {...session, phase:"end", ranking});
  } else {
    await setKey(SESSION_KEY, {...session, phase:"question", currentIndex: nextIdx, questionStartedAt: Date.now()});
  }
  refresh();
}

async function actionHostReset(){
  if(!confirm("Reiniciar o quiz? Isso apaga o placar de todos os participantes.")) return;
  const keys = await listPlayerKeys();
  await Promise.all(keys.map(k => deleteKey(k)));
  await setKey(SESSION_KEY, {phase:"lobby", currentIndex:-1, questionStartedAt:0, ranking:[]});
  refresh();
}

async function actionAnswer(letter){
  if(session.phase !== "question") return;
  if(lastAnsweredIndex === session.currentIndex) return;
  lastAnsweredIndex = session.currentIndex;
  const q = QUESTIONS[session.currentIndex];
  const correct = letter === q.correct;
  const elapsed = Date.now() - (session.questionStartedAt || Date.now());
  const points = correct ? Math.max(200, Math.round(1000 - (Math.min(elapsed, DURATION_MS)/DURATION_MS)*800)) : 0;
  const rec = (await getKey(PLAYER_PREFIX + playerId)) || {name: playerName, total:0, answers:{}};
  rec.answers[session.currentIndex] = {choice: letter, correct, points};
  rec.total = Object.values(rec.answers).reduce((sum,a)=>sum + (a.points||0), 0);
  playerCache = rec;
  await setKey(PLAYER_PREFIX + playerId, rec);
  render();
}

// ---------- RENDER ----------

function root(){ return document.getElementById("pcdquiz-root"); }

function render(){
  const el = root();
  if(!el) return;
  if(role === null){
    el.innerHTML = viewRoleSelect();
  } else if(role === "host"){
    el.innerHTML = viewHost();
    if(session.phase === "lobby"){
      requestAnimationFrame(drawQR);
    }
  } else if(role === "player"){
    el.innerHTML = viewPlayer();
  }
  attachHandlers(el);
}

function drawQR(){
  const box = document.getElementById("pq-qrbox");
  if(!box) return;
  box.innerHTML = "";
  try{
    new QRCode(box, {text: qrUrl, width:196, height:196, colorDark:"#0F2340", colorLight:"#ffffff"});
  }catch(e){}
}

function viewRoleSelect(){
  return `
  <div class="pq-shell narrow">
    <div class="pq-eyebrow"><span class="rule"></span>Maximiano Advogados · Equipe Previdenciária</div>
    <h1 class="pq-title">Quiz ao vivo — Aposentadoria da PCD</h1>
    <p class="pq-sub">LC 142/2013 · 10 questões · escolha como você vai participar.</p>
    <div class="pq-role-grid">
      <div class="pq-card pq-role-card">
        <div class="tag">Projetor</div>
        <h3>Sou o apresentador</h3>
        <p>Controla o ritmo do quiz, exibe o QR code para entrada e revela as respostas na tela grande.</p>
        <button class="pq-btn pq-btn-primary" data-action="role-host">Abrir painel do apresentador</button>
      </div>
      <div class="pq-card pq-role-card">
        <div class="tag">Celular</div>
        <h3>Vou responder</h3>
        <p>Entre com seu nome e responda pelo celular, acompanhando sua pontuação em tempo real.</p>
        <button class="pq-btn pq-btn-gold" data-action="role-player">Entrar no quiz</button>
      </div>
    </div>
    <div class="pq-footer">Maximiano Advogados</div>
  </div>`;
}

// ---- HOST ----

function viewHost(){
  const total = players.length;
  let body = "";
  if(session.phase === "lobby") body = hostLobby(total);
  else if(session.phase === "question") body = hostQuestion(total);
  else if(session.phase === "reveal") body = hostReveal();
  else if(session.phase === "ranking") body = hostRanking(session.ranking, false);
  else if(session.phase === "end") body = hostEnd(session.ranking);

  return `
  <div class="pq-shell">
    ${FORCED_ROLE ? "" : '<button class="pq-back" data-action="role-none">← trocar de painel</button>'}
    <div class="pq-host-header">
      <div>
        <div class="pq-eyebrow"><span class="rule"></span>Painel do apresentador</div>
        <h1 class="pq-title" style="font-size:24px;margin-bottom:0;">Aposentadoria da PCD — quiz ao vivo</h1>
      </div>
      <div style="display:flex;gap:8px;">
        <span class="pq-pill">${total} participante${total===1?"":"s"}</span>
        ${session.phase!=="lobby" ? `<span class="pq-pill gold">Pergunta ${session.currentIndex+1} de ${QUESTIONS.length}</span>` : ""}
      </div>
    </div>
    ${body}
  </div>`;
}

function hostLobby(total){
  return `
  <div class="pq-card" style="padding:30px;text-align:center;">
    <p style="font-size:14px;color:var(--ink-soft);margin:0 0 16px;">Peça para o grupo apontar a câmera do celular para o código abaixo. Confirme se o link corresponde ao endereço público deste artifact antes de começar.</p>
    <div id="pq-qrbox" class="pq-qr-box"></div>
    <div class="pq-join-row" style="max-width:520px;margin-left:auto;margin-right:auto;">
      <input id="pq-url-input" type="text" value="${escapeHtml(qrUrl)}" />
      <button class="pq-btn pq-btn-ghost" data-action="update-qr">Atualizar QR</button>
    </div>
  </div>
  <div class="pq-card" style="margin-top:18px;padding:24px 26px;">
    <div style="font-weight:700;color:var(--navy);font-size:14px;margin-bottom:10px;">Participantes que já entraram (${total})</div>
    ${players.length === 0 ? `<div style="color:var(--ink-soft);font-size:13.5px;">Ainda ninguém entrou. Aguardando...</div>` :
      `<div style="display:flex;flex-wrap:wrap;gap:8px;">${players.map(p=>`<span class="pq-pill" style="background:var(--paper-2);color:var(--navy);">${escapeHtml(p.name)}</span>`).join("")}</div>`}
  </div>
  <div class="pq-controls">
    <button class="pq-btn pq-btn-primary" data-action="host-start" ${players.length===0 ? "disabled":""}>Iniciar quiz</button>
  </div>`;
}

function hostQuestion(total){
  const q = QUESTIONS[session.currentIndex];
  const answered = players.filter(p => p.answers && p.answers[session.currentIndex]).length;
  return `
  <div class="pq-docket">${docketTabs()}</div>
  <div class="pq-card">
    <div class="pq-timerwrap" style="padding-top:20px;"><div class="pq-timerbar"><div class="pq-timerfill" style="width:${timerPct()}%;"></div></div></div>
    <div class="pq-qhead">
      <div class="pq-qnum">Pergunta ${session.currentIndex+1} de ${QUESTIONS.length}</div>
      <div class="pq-qtext">${escapeHtml(q.q)}</div>
    </div>
    <div class="pq-options">
      ${LETTERS.map(L => `
        <div class="pq-opt">
          <span class="letter">${L.toUpperCase()}</span>
          <span>${escapeHtml(q.options[L])}</span>
        </div>`).join("")}
    </div>
    <div class="pq-count-badge">${answered} de ${total} já responderam</div>
  </div>
  <div class="pq-controls">
    <button class="pq-btn pq-btn-gold" data-action="host-reveal">Revelar resposta</button>
  </div>`;
}

function hostReveal(){
  const q = QUESTIONS[session.currentIndex];
  const isLast = session.currentIndex >= QUESTIONS.length - 1;
  return `
  <div class="pq-docket">${docketTabs()}</div>
  <div class="pq-card">
    <div class="pq-qhead">
      <div class="pq-qnum">Pergunta ${session.currentIndex+1} de ${QUESTIONS.length} — resposta</div>
      <div class="pq-qtext">${escapeHtml(q.q)}</div>
    </div>
    <div class="pq-options">
      ${LETTERS.map(L => `
        <div class="pq-opt ${L===q.correct ? "correct":""}">
          <span class="letter">${L.toUpperCase()}</span>
          <span>${escapeHtml(q.options[L])}</span>
        </div>`).join("")}
    </div>
    <div class="pq-explain">${escapeHtml(q.explain)}</div>
  </div>
  <div class="pq-controls">
    <button class="pq-btn pq-btn-primary" data-action="host-ranking">Ver ranking</button>
    <button class="pq-btn pq-btn-ghost" data-action="host-next">${isLast ? "Encerrar quiz" : "Próxima pergunta"}</button>
  </div>`;
}

function hostRanking(ranking, isFinal){
  const isLast = session.currentIndex >= QUESTIONS.length - 1;
  return `
  <div class="pq-card">
    <div style="padding:22px 26px 6px;font-weight:700;color:var(--navy);font-family:'Fraunces',serif;font-size:19px;">Ranking parcial</div>
    ${rankingList(ranking)}
  </div>
  <div class="pq-controls">
    <button class="pq-btn pq-btn-primary" data-action="host-next">${isLast ? "Encerrar quiz" : "Próxima pergunta"}</button>
  </div>`;
}

function hostEnd(ranking){
  return `
  <div class="pq-card">
    <div style="padding:24px 26px 0;text-align:center;">
      <div class="pq-eyebrow" style="justify-content:center;"><span class="rule"></span>Resultado final<span class="rule"></span></div>
      <h2 class="display" style="font-size:24px;color:var(--navy);margin:6px 0 0;">Aposentadoria da PCD</h2>
    </div>
    ${podium(ranking)}
    ${rankingList(ranking.slice(3))}
  </div>
  <div class="pq-controls">
    <button class="pq-btn pq-btn-danger" data-action="host-reset">Reiniciar quiz para nova turma</button>
  </div>`;
}

function podium(ranking){
  const p = [ranking[1], ranking[0], ranking[2]]; // 2nd, 1st, 3rd for visual order
  const classes = ["p2","p1","p3"];
  const medals = ["🥈","🥇","🥉"];
  return `<div class="pq-podium">
    ${p.map((pl,i)=> pl ? `
      <div class="place ${classes[i]}">
        <div class="bar">${medals[i]}</div>
        <div class="pname">${escapeHtml(pl.name)}</div>
        <div class="pscore">${pl.total} pts</div>
      </div>` : "").join("")}
  </div>`;
}

function rankingList(ranking){
  if(!ranking || ranking.length===0) return `<div style="padding:20px 26px;color:var(--ink-soft);font-size:13.5px;">Sem dados ainda.</div>`;
  return `<div style="padding:6px 6px 18px;">
    ${ranking.map((p,i)=>`
      <div class="pq-rank-row ${i===0?"top1":i===1?"top2":i===2?"top3":""}">
        <span class="pq-rank-pos">${i+1}</span>
        <span class="pq-rank-name">${escapeHtml(p.name)}</span>
        <span class="pq-rank-score">${p.total} pts</span>
      </div>`).join("")}
  </div>`;
}

function docketTabs(){
  return QUESTIONS.map((_,i)=>{
    let cls = "";
    if(i < session.currentIndex) cls = "done";
    if(i === session.currentIndex) cls = "active";
    return `<div class="pq-tab ${cls}">${i+1}</div>`;
  }).join("");
}

function timerPct(){
  if(session.phase !== "question") return 100;
  const elapsed = Date.now() - (session.questionStartedAt||Date.now());
  const pct = Math.max(0, 100 - (elapsed/DURATION_MS)*100);
  return pct;
}

// ---- PLAYER ----

function viewPlayer(){
  if(!playerId) return playerJoin();
  if(session.phase === "lobby") return playerWaitingLobby();
  if(session.phase === "question"){
    if(lastAnsweredIndex === session.currentIndex) return playerAnsweredWait();
    return playerQuestion();
  }
  if(session.phase === "reveal") return playerReveal();
  if(session.phase === "ranking") return playerRankingView();
  if(session.phase === "end") return playerEnd();
  return playerWaitingLobby();
}

function playerJoin(){
  return `
  <div class="pq-shell narrow">
    ${FORCED_ROLE ? "" : '<button class="pq-back" data-action="role-none">← voltar</button>'}
    <div class="pq-eyebrow"><span class="rule"></span>Aposentadoria da PCD</div>
    <h1 class="pq-title" style="font-size:24px;">Entrar no quiz</h1>
    <div class="pq-card pq-lobby-name">
      <p style="color:var(--ink-soft);font-size:14px;margin:0;">Digite seu nome como quer aparecer no ranking.</p>
      <input id="pq-name-input" type="text" placeholder="Seu nome" maxlength="40" />
      <div><button class="pq-btn pq-btn-primary" data-action="join">Entrar</button></div>
    </div>
    <div class="pq-footer">Não atualize a página depois de entrar</div>
  </div>`;
}

function playerShell(inner){
  return `
  <div class="pq-shell narrow">
    <div class="pq-eyebrow"><span class="rule"></span>${escapeHtml(playerName)} · ${playerCache && playerCache.total ? playerCache.total+" pts" : "0 pts"}</div>
    ${inner}
  </div>`;
}

function playerWaitingLobby(){
  return playerShell(`
    <div class="pq-card pq-wait">
      <div class="pulse"></div>
      <div style="font-weight:700;color:var(--navy);font-family:'Fraunces',serif;font-size:19px;">Você está dentro!</div>
      <p style="margin-top:8px;">Aguardando o apresentador iniciar o quiz.</p>
    </div>`);
}

function playerQuestion(){
  const q = QUESTIONS[session.currentIndex];
  return playerShell(`
    <div class="pq-card">
      <div class="pq-timerwrap" style="padding-top:18px;"><div class="pq-timerbar"><div class="pq-timerfill" style="width:${timerPct()}%;"></div></div></div>
      <div class="pq-qhead" style="padding:16px 20px 0;">
        <div class="pq-qnum">Pergunta ${session.currentIndex+1} de ${QUESTIONS.length}</div>
        <div class="pq-qtext" style="font-size:18px;">${escapeHtml(q.q)}</div>
      </div>
      <div class="pq-options" style="grid-template-columns:1fr;padding:0 20px 22px;">
        ${LETTERS.map(L=>`
          <button class="pq-btn pq-opt" data-action="answer" data-letter="${L}" style="width:100%;">
            <span class="letter">${L.toUpperCase()}</span>
            <span>${escapeHtml(q.options[L])}</span>
          </button>`).join("")}
      </div>
    </div>`);
}

function playerAnsweredWait(){
  const rec = playerCache && playerCache.answers ? playerCache.answers[session.currentIndex] : null;
  if(!rec) return playerWaitingLobby();
  return playerShell(`
    <div class="pq-card pq-feedback">
      <div class="big" style="color:${rec.correct?"var(--ok)":"var(--bad)"};">${rec.correct ? "Certinho! ✓" : "Não foi dessa vez"}</div>
      <div class="pts">${rec.correct ? "+"+rec.points+" pontos" : "0 pontos"} · aguardando o apresentador revelar</div>
    </div>`);
}

function playerReveal(){
  const q = QUESTIONS[session.currentIndex];
  const rec = playerCache && playerCache.answers ? playerCache.answers[session.currentIndex] : null;
  return playerShell(`
    <div class="pq-card">
      <div class="pq-qhead" style="padding:18px 20px 0;">
        <div class="pq-qnum">Resposta certa</div>
        <div class="pq-qtext" style="font-size:17px;">${escapeHtml(q.q)}</div>
      </div>
      <div class="pq-options" style="grid-template-columns:1fr;padding:0 20px 10px;">
        ${LETTERS.map(L=>{
          let cls = L===q.correct ? "correct":"";
          if(rec && rec.choice===L) cls += rec.correct ? " picked-correct":" picked-wrong";
          return `<div class="pq-opt ${cls}"><span class="letter">${L.toUpperCase()}</span><span>${escapeHtml(q.options[L])}</span></div>`;
        }).join("")}
      </div>
      <div class="pq-explain">${escapeHtml(q.explain)}</div>
    </div>`);
}

function playerRankingView(){
  const ranking = session.ranking || [];
  const myPos = ranking.findIndex(p => p.name === playerName);
  return playerShell(`
    <div class="pq-card">
      <div style="padding:20px 20px 4px;font-weight:700;color:var(--navy);font-family:'Fraunces',serif;font-size:18px;">Ranking parcial</div>
      ${rankingList(ranking.slice(0,5))}
      ${myPos>4 ? `<div style="padding:0 20px 18px;font-size:13px;color:var(--ink-soft);">Você está em ${myPos+1}º lugar</div>` : ""}
    </div>`);
}

function playerEnd(){
  const ranking = session.ranking || [];
  const myPos = ranking.findIndex(p => p.name === playerName);
  return playerShell(`
    <div class="pq-card" style="text-align:center;padding:24px 0;">
      <div style="font-family:'Fraunces',serif;font-size:21px;color:var(--navy);">Quiz encerrado!</div>
      ${podium(ranking)}
      ${myPos>=0 ? `<p style="font-size:14px;color:var(--ink-soft);">Você ficou em <strong style="color:var(--navy);">${myPos+1}º lugar</strong> com ${ranking[myPos].total} pontos.</p>` : ""}
    </div>`);
}

// ---------- EVENTS ----------

function attachHandlers(el){
  el.querySelectorAll("[data-action]").forEach(node=>{
    const act = node.getAttribute("data-action");
    node.onclick = async (e)=>{
      e.preventDefault();
      if(act === "role-host"){ await actionChooseRole("host"); }
      else if(act === "role-player"){ await actionChooseRole("player"); }
      else if(act === "role-none"){ stopPolling(); role=null; render(); }
      else if(act === "join"){
        const input = document.getElementById("pq-name-input");
        await actionJoin(input ? input.value : "");
      }
      else if(act === "update-qr"){
        const input = document.getElementById("pq-url-input");
        if(input && input.value.trim()) qrUrl = input.value.trim();
        drawQR();
      }
      else if(act === "host-start"){ await actionHostStart(); }
      else if(act === "host-reveal"){ await actionHostReveal(); }
      else if(act === "host-ranking"){ await actionHostRanking(); }
      else if(act === "host-next"){ await actionHostNext(); }
      else if(act === "host-reset"){ await actionHostReset(); }
      else if(act === "answer"){
        const letter = node.getAttribute("data-letter");
        await actionAnswer(letter);
      }
    };
  });
}

render();
startTicking();
if(role === "host"){ startPolling(); }

})();
