
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  Home,
  Briefcase,
  Activity,
  Wallet,
  BarChart3,
  Bot,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Star,
  Search,
  Save,
  X,
  LogOut,
  Cloud,
  Download,
  Upload,
  PlayCircle,
  StopCircle,
  ClipboardCheck,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';
import './styles.css';

const firebaseConfig = {
  apiKey: "AIzaSyBzrwiianeCybG4Ez6QgEdVzcXq7-_BTGU",
  authDomain: "almeida-capital-pro.firebaseapp.com",
  projectId: "almeida-capital-pro",
  storageBucket: "almeida-capital-pro.firebasestorage.app",
  messagingSenderId: "139760939666",
  appId: "1:139760939666:web:35b533887cb050b16d6c4b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const initialState = {
  settings: {
    fx: 5.17,
    traderName: 'André',
    motto: 'Disciplina executa. Consistência constrói.'
  },
  workspaces: [
    { id: 'apex', name: 'Apex 20 PAs', icon:'🔥', type: 'Mesa Proprietária', status: 'Ativo', mission: 'Construir 20 PAs', target:20, progressManual:1, color: 'blue', favorite:true, notes: 'Projeto principal da jornada Apex.' },
    { id: 'mide', name: 'Mide Global', icon:'💙', type: 'Mesa Proprietária', status: 'Ativo', mission: 'Saque com colchão', target:3500, progressManual:0, color: 'cyan', favorite:false, notes: 'Controle de contas Mide e colchão.' },
    { id: 'tradeday', name: 'TradeDay', icon:'🟠', type: 'Mesa Proprietária', status: 'Ativo', mission: 'Financiadas e saques', target:2600, progressManual:0, color: 'orange', favorite:false, notes: 'Controle de contas TradeDay.' },
    { id: 'earn2trade', name: 'Earn2Trade Career', icon:'🟢', type: 'Mesa Proprietária', status: 'Ativo', mission: '50k → 100k → 200k → 400k', target:40000, progressManual:0, color: 'green', favorite:false, notes: 'Plano de carreira Earn2Trade.' },
    { id: 'lucid', name: 'Lucid Trading', icon:'🔴', type: 'Mesa Proprietária', status: 'Ativo', mission: 'Aprovação e primeira financiada', target:3000, progressManual:0, color: 'red', favorite:false, notes: 'Workspace oficial Lucid Trading.' },
    { id: 'capital', name: 'Capital Próprio', icon:'🏦', type: 'Conta Própria', status: 'Planejado', mission: 'Crescimento patrimonial', target:100000, progressManual:0, color: 'slate', favorite:false, notes: 'Contas próprias e investimentos.' }
  ],
  accounts: [
    { id: 'acc-apex-pa01', workspaceId: 'apex', name: 'Apex PA01', broker: 'Apex', accountCode: 'PA01', type: 'PA', status: 'Ativa', nominalBalance: 50000, initialResult: 0, safetyBuffer: 500, maxDailyLoss: 1100, notes: '' }
  ],
  operations: [],
  sessions: [],
  activeSession: null,
  updatedAt: new Date().toISOString()
};

const uid = (prefix='id') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const usd = v => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const avg = arr => {
  const valid = arr.map(Number).filter(v => v > 0);
  return valid.length ? valid.reduce((a,b)=>a+b,0) / valid.length : 0;
};

function calc(state, contextId = 'all') {
  const accountStats = state.accounts.map(acc => {
    const ops = state.operations.filter(o => o.accountId === acc.id);
    const result = ops.reduce((s,o)=>s + Number(o.result || 0), 0);
    const today = new Date().toISOString().slice(0,10);
    const resultToday = ops.filter(o => o.date === today).reduce((s,o)=>s + Number(o.result || 0), 0);
    const withdrawals = ops.reduce((s,o)=>s + Number(o.withdrawal || 0), 0);
    const net = Number(acc.initialResult || 0) + result - withdrawals;
    const health = net >= Math.max(Number(acc.safetyBuffer || 0), 1500) ? 'Saudável' : net >= 500 ? 'Atenção' : 'Risco';
    return { ...acc, result, resultToday, withdrawals, net, health };
  });

  const visibleAccounts = contextId === 'all' ? accountStats : accountStats.filter(a => a.workspaceId === contextId);
  const visibleAccountIds = visibleAccounts.map(a => a.id);
  const visibleOperations = state.operations.filter(o => contextId === 'all' || visibleAccountIds.includes(o.accountId));

  const netWorth = visibleAccounts.filter(a => ['Ativa','Em andamento','Aprovada'].includes(a.status)).reduce((s,a)=>s+a.net, 0);
  const withdrawals = visibleAccounts.reduce((s,a)=>s+a.withdrawals, 0);
  const todayResult = visibleAccounts.reduce((s,a)=>s+a.resultToday, 0);
  const exec = avg(visibleOperations.map(o => o.executionScore));
  const emotion = avg(visibleOperations.map(o => o.emotionalScore));
  const risk = avg(visibleOperations.map(o => o.riskScore));
  const discipline = avg(visibleOperations.map(o => o.disciplineScore));
  const tes = Math.round((exec * 0.30 + risk * 0.25 + discipline * 0.25 + emotion * 0.20) * 10) || 0;

  const workspaceStats = state.workspaces.map(ws => {
    const accounts = accountStats.filter(a => a.workspaceId === ws.id);
    const operations = state.operations.filter(o => accounts.some(a => a.id === o.accountId));
    const net = accounts.reduce((s,a)=>s+a.net,0);
    const today = accounts.reduce((s,a)=>s+a.resultToday,0);
    const withdrawals = accounts.reduce((s,a)=>s+a.withdrawals,0);
    const wsExec = avg(operations.map(o => o.executionScore));
    const wsEmotion = avg(operations.map(o => o.emotionalScore));
    const wsRisk = avg(operations.map(o => o.riskScore));
    const wsDiscipline = avg(operations.map(o => o.disciplineScore));
    const wsTes = Math.round((wsExec * 0.30 + wsRisk * 0.25 + wsDiscipline * 0.25 + wsEmotion * 0.20) * 10) || 0;
    const progressByAccounts = ws.id === 'apex' ? accounts.filter(a => a.status === 'Ativa').length : Number(ws.progressManual || 0);
    const progressValue = Math.max(Number(ws.progressManual || 0), progressByAccounts);
    const progressPercent = ws.target ? Math.min(100, Math.round((progressValue / Number(ws.target)) * 100)) : 0;
    return { ...ws, accountsCount: accounts.length, operationsCount: operations.length, net, today, withdrawals, tes:wsTes, progressValue, progressPercent };
  });

  return {
    accountStats,
    visibleAccounts,
    visibleOperations,
    workspaceStats,
    netWorth,
    withdrawals,
    todayResult,
    builtCapital: netWorth + withdrawals,
    totalOps: visibleOperations.length,
    avgExec: exec,
    avgEmotion: emotion,
    avgRisk: risk,
    avgDiscipline: discipline,
    tes
  };
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function doLogin() {
    try { setMsg('Entrando...'); await signInWithEmailAndPassword(auth, email, password); }
    catch (err) { setMsg(err.message); }
  }
  async function doSignup() {
    try { setMsg('Criando conta...'); await createUserWithEmailAndPassword(auth, email, password); }
    catch (err) { setMsg(err.message); }
  }
  async function resetPassword() {
    if (!email) return setMsg('Informe o e-mail para recuperar a senha.');
    try { await sendPasswordResetEmail(auth, email); setMsg('E-mail de recuperação enviado.'); }
    catch (err) { setMsg(err.message); }
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="logo-xl">AT</div>
        <h1>Almeida Trading OS</h1>
        <p>The Operating System for Professional Traders</p>
        <strong>Disciplina executa. Consistência constrói.</strong>
        <input placeholder="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={doLogin}>Entrar</button>
        <button className="secondary" onClick={doSignup}>Criar conta</button>
        <button className="ghost" onClick={resetPassword}>Esqueci minha senha</button>
        <small>{msg}</small>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [sync, setSync] = useState('Conectando');
  const [page, setPage] = useState('home');
  const [contextId, setContextId] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [state, setState] = useState(initialState);

  useEffect(() => onAuthStateChanged(auth, current => { setUser(current); if (!current) setLoaded(false); }), []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'foundation', 'state');
    setSync('Sincronizando...');
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        const mergedWorkspaces = data.workspaces?.some(w => w.id === 'lucid') ? data.workspaces : [...(data.workspaces || initialState.workspaces), initialState.workspaces.find(w => w.id === 'lucid')];
        setState({
          ...initialState,
          ...data,
          settings: { ...initialState.settings, ...(data.settings || {}) },
          workspaces: mergedWorkspaces,
          accounts: data.accounts || [],
          operations: data.operations || [],
          sessions: data.sessions || [],
          activeSession: data.activeSession || null
        });
        setSync('Sincronizado');
      } else {
        setDoc(ref, initialState);
        setSync('Base criada');
      }
      setLoaded(true);
    }, err => { console.error(err); setSync('Erro'); setLoaded(true); });
  }, [user]);

  useEffect(() => {
    if (!user || !loaded) return;
    const timer = setTimeout(() => {
      setSync('Salvando...');
      const ref = doc(db, 'users', user.uid, 'foundation', 'state');
      setDoc(ref, { ...state, updatedAt: new Date().toISOString() }, { merge: true })
        .then(()=>setSync('Sincronizado'))
        .catch(()=>setSync('Erro ao salvar'));
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  function update(fn) {
    setState(prev => {
      const next = structuredClone(prev);
      fn(next);
      next.updatedAt = new Date().toISOString();
      return next;
    });
  }

  if (!user) return <Login />;
  if (!loaded) return <div className="loading"><Cloud /> Carregando Almeida Trading OS...</div>;

  const metrics = calc(state, contextId);
  const contextWorkspace = state.workspaces.find(w => w.id === contextId);

  return (
    <div className="shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Topbar user={user} sync={sync} state={state} setState={setState} contextId={contextId} setContextId={setContextId} contextWorkspace={contextWorkspace} />
        <div className="breadcrumb">
          <button className={contextId === 'all' ? 'crumb active' : 'crumb'} onClick={()=>setContextId('all')}>Todos os Workspaces</button>
          {contextWorkspace && <><span>›</span><strong>{contextWorkspace.icon} {contextWorkspace.name}</strong></>}
        </div>
        <div className="content-grid">
          <section className="content">
            {page === 'home' && <HomePage state={state} metrics={metrics} setPage={setPage} contextWorkspace={contextWorkspace} contextId={contextId} />}
            {page === 'session' && <SessionPage state={state} update={update} contextId={contextId} setPage={setPage} />}
            {page === 'workspaces' && <WorkspacesPage state={state} update={update} setContextId={setContextId} setPage={setPage} />}
            {page === 'accounts' && <AccountsPage state={state} update={update} metrics={metrics} contextId={contextId} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} />}
            {page === 'operations' && <OperationsPage state={state} update={update} contextId={contextId} />}
            {page === 'finance' && <FinancePage state={state} metrics={metrics} />}
            {page === 'analytics' && <AnalyticsPage metrics={metrics} state={state} />}
            {page === 'javes' && <JavesPage state={state} metrics={metrics} contextWorkspace={contextWorkspace} />}
            {page === 'settings' && <SettingsPage state={state} update={update} user={user} />}
          </section>
          <aside className="javes-panel"><JavesPanel state={state} metrics={metrics} contextWorkspace={contextWorkspace} /></aside>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ page, setPage }) {
  const items = [
    ['home', Home, 'Home'],
    ['session', ClipboardCheck, 'Pregão Unificado'],
    ['workspaces', Briefcase, 'Workspaces'],
    ['accounts', Wallet, 'Contas'],
    ['operations', Activity, 'Operações'],
    ['finance', Wallet, 'Financeiro'],
    ['analytics', BarChart3, 'Analytics'],
    ['javes', Bot, 'J.A.V.E.S.'],
    ['settings', Settings, 'Configurações']
  ];
  return (
    <aside className="sidebar">
      <div className="brand"><div className="logo">AT</div><div><h2>Trading OS</h2><span>Pregão Unificado REAL</span></div></div>
      <nav>{items.map(([id, Icon, label]) => <button key={id} className={page === id ? 'nav active' : 'nav'} onClick={()=>setPage(id)}><Icon size={18} /> {label}</button>)}</nav>
      <div className="sidebar-footer"><span>Sprint 10.3</span><strong>Pregão Unificado REAL</strong></div>
    </aside>
  );
}

function Topbar({ user, sync, state, setState, contextId, setContextId, contextWorkspace }) {
  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'almeida-trading-os-workspace-pro-backup.json';
    a.click();
  }
  function importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { setState(JSON.parse(reader.result)); alert('Backup importado.'); }
      catch { alert('Arquivo inválido.'); }
    };
    reader.readAsText(file);
  }
  return (
    <header className="topbar">
      <div>
        <h1>{contextWorkspace ? `${contextWorkspace.icon} ${contextWorkspace.name}` : 'Pregão Unificado REAL'}</h1>
        <p>{contextWorkspace ? contextWorkspace.mission : 'Disciplina executa. Consistência constrói.'}</p>
      </div>
      <div className="top-actions">
        <span className="sync"><Cloud size={15} /> {sync}</span>
        <select value={contextId} onChange={e=>setContextId(e.target.value)}>
          <option value="all">Todos os Workspaces</option>
          {state.workspaces.map(w => <option key={w.id} value={w.id}>{w.icon || '🎯'} {w.name}</option>)}
        </select>
        <button className="ghost" onClick={exportBackup}><Download size={15} /> Backup</button>
        <label className="ghost upload"><Upload size={15} /> Importar<input type="file" accept=".json" onChange={importBackup} /></label>
        <button className="danger" onClick={()=>signOut(auth)}><LogOut size={15} /> Sair</button>
      </div>
    </header>
  );
}

function HomePage({ state, metrics, setPage, contextWorkspace, contextId }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const isGlobal = contextId === 'all';
  const mainTitle = isGlobal ? 'Centro de Comando Geral' : `${contextWorkspace.icon} ${contextWorkspace.name}`;

  return (
    <div className="stack">
      <section className="hero command-hero">
        <div>
          <span className="eyebrow">Almeida Trading OS • Sprint 10.3 Pregão Unificado REAL</span>
          <h2>{greet}, {state.settings.traderName}.</h2>
          <p>{isGlobal ? state.settings.motto : contextWorkspace.mission}</p>
        </div>
        <button onClick={()=>setPage('session')}><PlayCircle size={18} /> 🚀 Iniciar Pregão</button>
      </section>

      <div className="command-strip">
        <div>
          <span>Contexto atual</span>
          <strong>{mainTitle}</strong>
        </div>
        <div>
          <span>Modo</span>
          <strong>{isGlobal ? 'Visão consolidada' : 'Análise da mesa/projeto'}</strong>
        </div>
      </div>

      <div className="grid four">
        <Kpi title="Capital construído" value={<Money value={metrics.builtCapital} />} sub={brl(metrics.builtCapital * state.settings.fx)} />
        <Kpi title="Patrimônio real" value={<Money value={metrics.netWorth} />} sub={isGlobal ? 'Todos os Workspaces' : contextWorkspace.name} />
        <Kpi title="Resultado hoje" value={<Money value={metrics.todayResult} />} sub="pregão / operações do dia" />
        <Kpi title="TES" value={metrics.tes || 0} sub="Evolução do trader" />
      </div>

      <div className="grid two command-main">
        <Card title="Pregão" subtitle="Ação principal do dia">
          <div className="pregao-box">
            <h3>Preparar, executar e encerrar</h3>
            <p>Inicie o pregão, registre operações rápidas e encerre com resumo automático.</p>
            <button onClick={()=>setPage('session')}><PlayCircle size={18} /> 🚀 Iniciar Pregão</button>
          </div>
        </Card>

        <Card title="J.A.V.E.S. — Leitura rápida" subtitle="Painel por regras, sem API ainda">
          <div className="javes-message big">
            <p>{dailyBrief(state, metrics, contextWorkspace)}</p>
          </div>
        </Card>
      </div>

      {!isGlobal && <WorkspaceDashboard state={state} metrics={metrics} workspace={contextWorkspace} />}

      {isGlobal && (
        <Card title="Workspaces" subtitle="Escolha uma mesa/projeto no topo ou abra a tela Workspaces">
          <DataTable
            headers={['Workspace','Contas','Operações','Hoje','Patrimônio','TES']}
            rows={sortWorkspaces(metrics.workspaceStats).map(w => [
              `${w.icon || '🎯'} ${w.name}`,
              w.accountsCount,
              w.operationsCount,
              <Money value={w.today} />,
              <Money value={w.net} />,
              w.tes
            ])}
          />
        </Card>
      )}

      <div className="grid two">
        <Card title="Últimas operações" subtitle="Registro operacional">
          <DataTable
            headers={['Data','Conta','Resultado','Setup']}
            rows={metrics.visibleOperations.slice(-5).reverse().map(o => [
              o.date,
              accountName(state, o.accountId),
              <Money value={o.result} />,
              o.setup || '-'
            ])}
          />
        </Card>

        <Card title="Saúde das contas" subtitle="Risco e colchão">
          <div className="workspace-list">
            {metrics.visibleAccounts.slice(0, 6).map(a => (
              <div className="list-row" key={a.id}>
                <div>
                  <strong>{a.name}</strong>
                  <small>{a.health} • {a.status}</small>
                </div>
                <b>{<Money value={a.net} />}</b>
              </div>
            ))}
            {!metrics.visibleAccounts.length && <div className="empty">Nenhuma conta neste contexto.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WorkspaceDashboard({ state, metrics, workspace }) {
  const ws = metrics.workspaceStats.find(w => w.id === workspace.id);
  if (!ws) return null;
  return (
    <Card title={`${workspace.icon || '🎯'} Dashboard do Workspace`} subtitle={workspace.mission}>
      <div className="workspace-dash">
        <div><span>Progresso</span><strong>{ws.progressValue} / {workspace.target || 0}</strong><Progress value={ws.progressPercent} /></div>
        <div><span>Contas</span><strong>{ws.accountsCount}</strong><small>ativas/cadastradas</small></div>
        <div><span>Operações</span><strong>{ws.operationsCount}</strong><small>histórico</small></div>
        <div><span>Patrimônio</span><strong>{usd(ws.net)}</strong><small>real</small></div>
        <div><span>Hoje</span><strong>{usd(ws.today)}</strong><small>resultado do dia</small></div>
        <div><span>TES</span><strong>{ws.tes}</strong><small>evolução</small></div>
      </div>
    </Card>
  );
}



function SessionPage({ state, update, contextId, setPage }) {
  const active = state.activeSession;

  const [form, setForm] = useState({
    market: 'NQ',
    objective: 'Executar apenas setups A+',
    dailyTarget: 300,
    maxLoss: 180,
    emotionalStart: 7,
    marketNotes: '',
    plan: '',
    workspaceIds: state.workspaces.map(w => w.id)
  });

  const selectedWorkspaceIds = active?.workspaceIds?.length ? active.workspaceIds : form.workspaceIds;
  const accountsAvailable = state.accounts.filter(a => selectedWorkspaceIds.includes(a.workspaceId));

  const [quickOp, setQuickOp] = useState({
    accountId: accountsAvailable[0]?.id || '',
    asset:'NQ',
    setup:'',
    result:'',
    trades:1,
    contracts:1,
    executionScore:8,
    emotionalScore:8,
    riskScore:8,
    disciplineScore:8,
    notes:''
  });

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    const first = accountsAvailable[0]?.id || '';
    if (first && !accountsAvailable.some(a => a.id === quickOp.accountId)) {
      setQuickOp(q => ({ ...q, accountId: first }));
    }
  }, [selectedWorkspaceIds.join(','), accountsAvailable.length]);

  function toggleWorkspace(id) {
    setForm(f => {
      const exists = f.workspaceIds.includes(id);
      const next = exists ? f.workspaceIds.filter(x => x !== id) : [...f.workspaceIds, id];
      return { ...f, workspaceIds: next };
    });
  }

  function startSession() {
    if (!form.workspaceIds.length) return alert('Selecione pelo menos uma mesa/projeto.');
    const validAccounts = state.accounts.filter(a => form.workspaceIds.includes(a.workspaceId));
    if (!validAccounts.length) return alert('Cadastre pelo menos uma conta nas mesas selecionadas.');
    const session = {
      ...form,
      id: uid('pregao'),
      date: new Date().toISOString().slice(0,10),
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: 'Ativo',
      checklist: { market:false, dxy:false, bigs:false, agenda:false, aplus:false }
    };
    update(s => { s.activeSession = session; });
    setQuickOp(q => ({ ...q, accountId: validAccounts[0].id, asset: form.market || 'NQ' }));
  }

  function toggleCheck(key) {
    update(s => {
      if (!s.activeSession) return;
      s.activeSession.checklist[key] = !s.activeSession.checklist[key];
    });
  }

  function saveQuickOperation() {
    if (!active) return alert('Inicie um pregão primeiro.');
    if (!quickOp.accountId) return alert('Selecione uma conta.');
    const op = {
      ...quickOp,
      id: uid('op'),
      sessionId: active.id,
      date: active.date,
      result: Number(quickOp.result || 0),
      withdrawal: 0,
      trades: Number(quickOp.trades || 0),
      contracts: Number(quickOp.contracts || 0),
      executionScore: Number(quickOp.executionScore || 0),
      emotionalScore: Number(quickOp.emotionalScore || 0),
      riskScore: Number(quickOp.riskScore || 0),
      disciplineScore: Number(quickOp.disciplineScore || 0)
    };
    update(s => { s.operations.push(op); });
    setQuickOp({ ...quickOp, setup:'', result:'', notes:'' });
  }

  function finishSession() {
    if (!active) return;
    const ops = state.operations.filter(o => o.sessionId === active.id);
    const result = ops.reduce((sum,o)=>sum + Number(o.result || 0), 0);
    const wins = ops.filter(o => Number(o.result || 0) > 0).length;
    const losses = ops.filter(o => Number(o.result || 0) < 0).length;
    const winRate = ops.length ? Math.round((wins / ops.length) * 100) : 0;
    const avgExec = avg(ops.map(o => o.executionScore));
    const avgEmotion = avg(ops.map(o => o.emotionalScore));
    const summary = { ...active, endedAt: new Date().toISOString(), status:'Encerrado', result, operationsCount: ops.length, wins, losses, winRate, avgExec, avgEmotion };
    update(s => {
      s.sessions = s.sessions || [];
      s.sessions.push(summary);
      s.activeSession = null;
    });
  }

  function startEditSession(session) {
    setEditingSessionId(session.id);
    setEditForm({
      market: session.market || 'NQ',
      objective: session.objective || '',
      dailyTarget: session.dailyTarget || 0,
      maxLoss: session.maxLoss || 0,
      emotionalStart: session.emotionalStart || 0,
      marketNotes: session.marketNotes || '',
      plan: session.plan || '',
      workspaceIds: session.workspaceIds || []
    });
  }

  function cancelEditSession() {
    setEditingSessionId(null);
    setEditForm(null);
  }

  function saveEditSession() {
    if (!editingSessionId || !editForm) return;
    update(s => {
      const idx = (s.sessions || []).findIndex(sess => sess.id === editingSessionId);
      if (idx >= 0) {
        s.sessions[idx] = {
          ...s.sessions[idx],
          ...editForm,
          dailyTarget: Number(editForm.dailyTarget || 0),
          maxLoss: Number(editForm.maxLoss || 0),
          emotionalStart: Number(editForm.emotionalStart || 0)
        };
      }
    });
    cancelEditSession();
  }

  function deleteSession(sessionId, deleteOperations=false) {
    const msg = deleteOperations
      ? 'Excluir este pregão e apagar TODAS as operações vinculadas?'
      : 'Excluir este pregão mantendo as operações vinculadas?';
    if (!confirm(msg)) return;
    update(s => {
      s.sessions = (s.sessions || []).filter(sess => sess.id !== sessionId);
      if (deleteOperations) {
        s.operations = s.operations.filter(op => op.sessionId !== sessionId);
      } else {
        s.operations = s.operations.map(op => op.sessionId === sessionId ? { ...op, sessionId:null } : op);
      }
    });
  }

  function reopenSession(session) {
    if (state.activeSession && !confirm('Já existe um pregão ativo. Substituir pelo pregão selecionado?')) return;
    update(s => {
      s.sessions = (s.sessions || []).filter(sess => sess.id !== session.id);
      s.activeSession = { ...session, status:'Ativo', endedAt:null };
    });
  }

  const sessionOps = active ? state.operations.filter(o => o.sessionId === active.id) : [];
  const sessionResult = sessionOps.reduce((sum,o)=>sum + Number(o.result || 0), 0);
  const accountIds = [...new Set(sessionOps.map(o => o.accountId))];
  const workspaceIdsUsed = [...new Set(accountIds.map(id => state.accounts.find(a => a.id === id)?.workspaceId).filter(Boolean))];
  const started = active ? new Date(active.startedAt) : null;

  if (active) {
    return (
      <div className="stack">
        <section className="session-hero active-session">
          <div>
            <span className="eyebrow">Sprint 10.3 • Pregão Unificado REAL</span>
            <h2>Pregão em Andamento</h2>
            <p>{active.market} • {active.objective}</p>
          </div>
          <button className="danger" onClick={finishSession}><StopCircle size={18}/> 🛑 Encerrar Pregão</button>
        </section>

        <div className="grid four">
          <Kpi title="Início" value={started?.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})} sub="horário do pregão" />
          <Kpi title="Resultado Geral" value={<Money value={sessionResult} />} sub="todas as mesas" />
          <Kpi title="Operações" value={sessionOps.length} sub={`${accountIds.length} conta(s) usadas`} />
          <Kpi title="Mesas" value={workspaceIdsUsed.length || active.workspaceIds.length} sub="mesas/projetos ativos" />
        </div>

        <div className="grid two">
          <Card title="Checklist do pregão" subtitle="Leitura única para várias mesas">
            <div className="checklist session-checklist">
              <label><input type="checkbox" checked={active.checklist.market} onChange={()=>toggleCheck('market')} /> Mercado analisado</label>
              <label><input type="checkbox" checked={active.checklist.dxy} onChange={()=>toggleCheck('dxy')} /> DXY analisado</label>
              <label><input type="checkbox" checked={active.checklist.bigs} onChange={()=>toggleCheck('bigs')} /> Big Techs analisadas</label>
              <label><input type="checkbox" checked={active.checklist.agenda} onChange={()=>toggleCheck('agenda')} /> Agenda econômica revisada</label>
              <label><input type="checkbox" checked={active.checklist.aplus} onChange={()=>toggleCheck('aplus')} /> Setup A+ somente</label>
            </div>
          </Card>

          <Card title="Operação rápida" subtitle="Escolha a conta; a mesa vem junto">
            <div className="form session-op-form">
              <select value={quickOp.accountId} onChange={e=>setQuickOp({...quickOp,accountId:e.target.value})}>
                {accountsAvailable.map(a => <option key={a.id} value={a.id}>{workspaceName(state, a.workspaceId)} • {a.name}</option>)}
              </select>
              <input placeholder="Ativo" value={quickOp.asset} onChange={e=>setQuickOp({...quickOp,asset:e.target.value})} />
              <input placeholder="Setup" value={quickOp.setup} onChange={e=>setQuickOp({...quickOp,setup:e.target.value})} />
              <input type="number" placeholder="Resultado USD" value={quickOp.result} onChange={e=>setQuickOp({...quickOp,result:e.target.value})} />
              <input type="number" placeholder="Execução 0-10" value={quickOp.executionScore} onChange={e=>setQuickOp({...quickOp,executionScore:e.target.value})} />
              <input type="number" placeholder="Emocional 0-10" value={quickOp.emotionalScore} onChange={e=>setQuickOp({...quickOp,emotionalScore:e.target.value})} />
              <button onClick={saveQuickOperation}><Save size={15}/> Salvar Operação</button>
            </div>
          </Card>
        </div>

        <Card title="Resultado por mesa" subtitle="Mesmo pregão, várias contas">
          <DataTable
            headers={['Mesa/Projeto','Operações','Resultado']}
            rows={active.workspaceIds.map(wid => {
              const accs = state.accounts.filter(a => a.workspaceId === wid).map(a => a.id);
              const ops = sessionOps.filter(o => accs.includes(o.accountId));
              const res = ops.reduce((sum,o)=>sum + Number(o.result || 0), 0);
              return [workspaceName(state, wid), ops.length, <Money value={res} />];
            })}
          />
        </Card>

        <Card title="Operações do pregão" subtitle="Todas as mesas em uma única sessão">
          <DataTable
            headers={['Data','Mesa','Conta','Ativo','Setup','Resultado','Exec.','Emoc.']}
            rows={sessionOps.slice().reverse().map(o => {
              const acc = state.accounts.find(a => a.id === o.accountId);
              return [o.date, workspaceName(state, acc?.workspaceId), accountName(state,o.accountId), o.asset, o.setup || '-', <Money value={o.result} />, o.executionScore, o.emotionalScore];
            })}
          />
        </Card>
      </div>
    );
  }

  const lastSessions = (state.sessions || []).slice(-5).reverse();

  return (
    <div className="stack">
      <section className="session-hero">
        <div>
          <span className="eyebrow">Sprint 10.3 • Pregão Unificado REAL</span>
          <h2>🚀 Iniciar Pregão</h2>
          <p>Um único pregão pode conter operações em Apex, Mide, TradeDay, Lucid e outras mesas.</p>
        </div>
        <button onClick={startSession}><PlayCircle size={18}/> 🚀 Iniciar Pregão</button>
      </section>

      <Card title="Preparação do pregão" subtitle="A leitura é única; as execuções podem ser em várias mesas">
        <div className="form session-form">
          <input placeholder="Mercado / Ativo principal" value={form.market} onChange={e=>setForm({...form,market:e.target.value})} />
          <input placeholder="Objetivo do dia" value={form.objective} onChange={e=>setForm({...form,objective:e.target.value})} />
          <input type="number" placeholder="Meta diária USD" value={form.dailyTarget} onChange={e=>setForm({...form,dailyTarget:e.target.value})} />
          <input type="number" placeholder="Loss máximo USD" value={form.maxLoss} onChange={e=>setForm({...form,maxLoss:e.target.value})} />
          <input type="number" placeholder="Emocional inicial 0-10" value={form.emotionalStart} onChange={e=>setForm({...form,emotionalStart:e.target.value})} />
          <input placeholder="Notícias / agenda" value={form.marketNotes} onChange={e=>setForm({...form,marketNotes:e.target.value})} />
          <input placeholder="Plano do dia" value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})} />
        </div>
      </Card>

      <Card title="Mesas deste pregão" subtitle="Selecione as mesas que poderão receber operações">
        <div className="workspace-check-grid">
          {state.workspaces.map(w => (
            <label key={w.id} className={form.workspaceIds.includes(w.id) ? 'workspace-check active' : 'workspace-check'}>
              <input type="checkbox" checked={form.workspaceIds.includes(w.id)} onChange={()=>toggleWorkspace(w.id)} />
              <span>{w.icon || '🎯'} {w.name}</span>
            </label>
          ))}
        </div>
      </Card>

      {editingSessionId && editForm && (
        <Card title="Editar pregão encerrado" subtitle="Ajuste mercado, meta, loss e observações">
          <div className="form session-form">
            <input placeholder="Mercado" value={editForm.market} onChange={e=>setEditForm({...editForm,market:e.target.value})} />
            <input placeholder="Objetivo" value={editForm.objective} onChange={e=>setEditForm({...editForm,objective:e.target.value})} />
            <input type="number" placeholder="Meta diária USD" value={editForm.dailyTarget} onChange={e=>setEditForm({...editForm,dailyTarget:e.target.value})} />
            <input type="number" placeholder="Loss máximo USD" value={editForm.maxLoss} onChange={e=>setEditForm({...editForm,maxLoss:e.target.value})} />
            <input type="number" placeholder="Emocional inicial 0-10" value={editForm.emotionalStart} onChange={e=>setEditForm({...editForm,emotionalStart:e.target.value})} />
            <input placeholder="Notícias / agenda" value={editForm.marketNotes} onChange={e=>setEditForm({...editForm,marketNotes:e.target.value})} />
            <input placeholder="Plano" value={editForm.plan} onChange={e=>setEditForm({...editForm,plan:e.target.value})} />
            <button onClick={saveEditSession}><Save size={15}/> Salvar alterações</button>
            <button className="secondary" onClick={cancelEditSession}><X size={15}/> Cancelar</button>
          </div>
        </Card>
      )}

      <Card title="Últimos pregões" subtitle="Editar, reabrir ou excluir">
        <DataTable
          headers={['Data','Mercado','Resultado','Operações','Win Rate','Exec.','Emoc.','Ações']}
          rows={lastSessions.map(s => [
            s.date,
            s.market || 'NQ',
            <Money value={s.result} />,
            s.operationsCount,
            `${s.winRate || 0}%`,
            Number(s.avgExec||0).toFixed(1),
            Number(s.avgEmotion||0).toFixed(1),
            <div className="actions session-actions">
              <IconButton onClick={()=>startEditSession(s)} icon={<Edit3 size={15}/>} />
              <button className="secondary small-btn" onClick={()=>reopenSession(s)}>Reabrir</button>
              <IconButton danger onClick={()=>deleteSession(s.id,false)} icon={<Trash2 size={15}/>} />
              <button className="danger small-btn" onClick={()=>deleteSession(s.id,true)}>Apagar tudo</button>
            </div>
          ])}
        />
      </Card>
    </div>
  );
}


function WorkspacesPage({ state, update, setContextId, setPage }) {
  const empty = { name:'', icon:'🎯', type:'Mesa Proprietária', status:'Ativo', mission:'', target:0, progressManual:0, color:'blue', favorite:false, notes:'' };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('favorite');

  const metrics = calc(state);
  const list = sortWorkspaces(metrics.workspaceStats.filter(w => w.name.toLowerCase().includes(query.toLowerCase())), sort);

  function save() {
    if (!form.name) return alert('Informe o nome do Workspace.');
    const payload = { ...form, id: editing || uid('ws'), target:Number(form.target||0), progressManual:Number(form.progressManual||0) };
    update(s => {
      if (editing) {
        const idx = s.workspaces.findIndex(w => w.id === editing);
        if (idx >= 0) s.workspaces[idx] = payload;
      } else {
        s.workspaces.push(payload);
      }
    });
    setEditing(null); setForm(empty);
  }
  function edit(ws) { setEditing(ws.id); setForm({ ...ws }); }
  function remove(id) {
    if (!confirm('Excluir este Workspace? Contas e operações vinculadas também serão removidas.')) return;
    update(s => {
      const accIds = s.accounts.filter(a => a.workspaceId === id).map(a => a.id);
      s.workspaces = s.workspaces.filter(w => w.id !== id);
      s.accounts = s.accounts.filter(a => a.workspaceId !== id);
      s.operations = s.operations.filter(o => !accIds.includes(o.accountId));
    });
  }
  function duplicate(ws) {
    update(s => s.workspaces.push({ ...ws, id: uid('ws'), name: `${ws.name} - cópia`, favorite:false }));
  }
  function toggleFavorite(ws) {
    update(s => {
      const item = s.workspaces.find(w => w.id === ws.id);
      if (item) item.favorite = !item.favorite;
    });
  }
  function open(ws) { setContextId(ws.id); setPage('home'); }

  return (
    <div className="stack">
      <Card title={editing ? 'Editar Workspace' : 'Novo Workspace'} subtitle="Sprint 1 — Pregão Unificado REAL">
        <div className="form workspace-form">
          <input placeholder="Ícone" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} />
          <input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Mesa Proprietária</option><option>Conta Própria</option><option>Empresa</option><option>Estudos</option><option>Outro</option></select>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Ativo</option><option>Planejado</option><option>Pausado</option><option>Encerrado</option></select>
          <input placeholder="Missão" value={form.mission} onChange={e=>setForm({...form,mission:e.target.value})} />
          <input type="number" placeholder="Meta numérica" value={form.target} onChange={e=>setForm({...form,target:e.target.value})} />
          <input type="number" placeholder="Progresso manual" value={form.progressManual} onChange={e=>setForm({...form,progressManual:e.target.value})} />
          <select value={form.color} onChange={e=>setForm({...form,color:e.target.value})}><option>blue</option><option>cyan</option><option>orange</option><option>green</option><option>red</option><option>slate</option></select>
          <input placeholder="Notas" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <button onClick={save}><Save size={15} /> {editing ? 'Atualizar' : 'Salvar'}</button>
          {editing && <button className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}><X size={15}/>Cancelar</button>}
        </div>
      </Card>

      <div className="toolbar">
        <div className="searchbox"><Search size={16}/><input placeholder="Buscar Workspace..." value={query} onChange={e=>setQuery(e.target.value)} /></div>
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="favorite">Favoritos</option>
          <option value="name">Nome</option>
          <option value="net">Patrimônio</option>
          <option value="today">Resultado hoje</option>
          <option value="tes">TES</option>
        </select>
      </div>

      <div className="workspace-pro-grid">
        {list.map(ws => (
          <WorkspaceProCard
            key={ws.id}
            workspace={ws}
            open={()=>open(ws)}
            edit={()=>edit(ws)}
            remove={()=>remove(ws.id)}
            duplicate={()=>duplicate(ws)}
            favorite={()=>toggleFavorite(ws)}
          />
        ))}
      </div>
    </div>
  );
}

function WorkspaceProCard({ workspace, open, edit, remove, duplicate, favorite, compact=false }) {
  return (
    <div className={`workspace-pro ${workspace.color || 'blue'}`}>
      <div className="workspace-pro-head">
        <span className="ws-icon">{workspace.icon || '🎯'}</span>
        <button className={workspace.favorite ? 'star active' : 'star'} onClick={favorite || (()=>{})}><Star size={16} fill={workspace.favorite ? 'currentColor' : 'none'} /></button>
      </div>
      <div>
        <h3>{workspace.name}</h3>
        <p>{workspace.mission || 'Sem missão definida.'}</p>
      </div>
      <Progress value={workspace.progressPercent || 0} />
      <div className="ws-stats">
        <div><span>Contas</span><strong>{workspace.accountsCount}</strong></div>
        <div><span>Patrimônio</span><strong>{<Money value={workspace.net} />}</strong></div>
        <div><span>Hoje</span><strong>{<Money value={workspace.today} />}</strong></div>
        <div><span>TES</span><strong>{workspace.tes}</strong></div>
      </div>
      <div className="ws-footer">
        <span>{workspace.status}</span>
        <b>{workspace.progressValue || 0}/{workspace.target || 0}</b>
      </div>
      {!compact && (
        <div className="row-actions">
          <button className="secondary" onClick={open}>Abrir Workspace</button>
          <IconButton onClick={edit} icon={<Edit3 size={15}/>} />
          <IconButton onClick={duplicate} icon={<Copy size={15}/>} />
          <IconButton danger onClick={remove} icon={<Trash2 size={15}/>} />
        </div>
      )}
    </div>
  );
}

function AccountsPage({ state, update, metrics, contextId, selectedAccountId, setSelectedAccountId }) {
  const empty = {
    workspaceId: contextId === 'all' ? state.workspaces[0]?.id || '' : contextId,
    name:'',
    broker:'',
    accountCode:'',
    type:'PA',
    status:'Ativa',
    nominalBalance:50000,
    initialResult:0,
    safetyBuffer:0,
    maxDailyLoss:0,
    payoutTarget:0,
    notes:''
  };

  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(()=> {
    if (!editing) setForm(f => ({ ...f, workspaceId: contextId === 'all' ? f.workspaceId : contextId }));
  }, [contextId]);

  const accounts = metrics.visibleAccounts
    .filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || (a.accountCode || '').toLowerCase().includes(query.toLowerCase()))
    .filter(a => statusFilter === 'all' || a.status === statusFilter);

  const selectedAccount = metrics.visibleAccounts.find(a => a.id === selectedAccountId) || null;

  function save() {
    if (!form.name) return alert('Informe o nome da conta.');
    const payload = {
      ...form,
      id: editing || uid('acc'),
      nominalBalance:Number(form.nominalBalance || 0),
      initialResult:Number(form.initialResult || 0),
      safetyBuffer:Number(form.safetyBuffer || 0),
      maxDailyLoss:Number(form.maxDailyLoss || 0),
      payoutTarget:Number(form.payoutTarget || 0)
    };
    update(s => {
      if (editing) {
        const idx = s.accounts.findIndex(a => a.id === editing);
        if (idx >= 0) s.accounts[idx] = payload;
      } else {
        s.accounts.push(payload);
      }
    });
    setEditing(null);
    setForm(empty);
  }

  function edit(acc) {
    setEditing(acc.id);
    setForm({ ...acc, payoutTarget: acc.payoutTarget || 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(id) {
    if (!confirm('Excluir esta conta? Operações vinculadas também serão removidas.')) return;
    update(s => {
      s.accounts = s.accounts.filter(a => a.id !== id);
      s.operations = s.operations.filter(o => o.accountId !== id);
    });
    if (selectedAccountId === id) setSelectedAccountId(null);
  }

  function duplicate(acc) {
    update(s => {
      s.accounts.push({
        ...acc,
        id: uid('acc'),
        name: `${acc.name} - cópia`,
        accountCode: acc.accountCode ? `${acc.accountCode}-copy` : '',
        initialResult: 0
      });
    });
  }

  function openAccount(acc) {
    setSelectedAccountId(acc.id);
  }

  if (selectedAccount) {
    const ops = metrics.visibleOperations.filter(o => o.accountId === selectedAccount.id);
    const today = new Date().toISOString().slice(0,10);
    const todayResult = ops.filter(o => o.date === today).reduce((s,o)=>s+Number(o.result||0),0);
    const weekResult = ops.slice(-7).reduce((s,o)=>s+Number(o.result||0),0);
    const payoutProgress = selectedAccount.payoutTarget ? Math.min(100, Math.round((selectedAccount.net / selectedAccount.payoutTarget) * 100)) : 0;
    const ddRemaining = Number(selectedAccount.maxDailyLoss || 0) + Math.min(0, todayResult);

    return (
      <div className="stack">
        <button className="ghost back-btn" onClick={()=>setSelectedAccountId(null)}><ArrowLeft size={16}/> Voltar para contas</button>

        <section className="account-hero">
          <div>
            <span className="eyebrow">{workspaceName(state, selectedAccount.workspaceId)}</span>
            <h2>{selectedAccount.name}</h2>
            <p>{selectedAccount.type} • {selectedAccount.status} • {selectedAccount.broker}</p>
          </div>
          <div className={`health-badge ${healthClass(selectedAccount.health)}`}>{selectedAccount.health}</div>
        </section>

        <div className="grid four">
          <Kpi title="Patrimônio" value={<Money value={selectedAccount.net} />} sub="real" />
          <Kpi title="Hoje" value={<Money value={todayResult} />} sub="resultado do dia" />
          <Kpi title="Semana" value={<Money value={weekResult} />} sub="últimos registros" />
          <Kpi title="DD diário restante" value={<Money value={ddRemaining} />} sub="estimado" />
        </div>

        <div className="grid two">
          <Card title="Meta de saque" subtitle="Progresso da conta">
            <div className="mission-box">
              <h3>{selectedAccount.payoutTarget ? `${<Money value={selectedAccount.net} />} / ${usd(selectedAccount.payoutTarget)}` : 'Meta não definida'}</h3>
              <Progress value={payoutProgress} />
              <small>Colchão de segurança: {usd(selectedAccount.safetyBuffer)}</small>
            </div>
          </Card>
          <Card title="Resumo operacional" subtitle="Conta selecionada">
            <DataTable
              headers={['Indicador','Valor']}
              rows={[
                ['Operações', ops.length],
                ['Resultado total', usd(selectedAccount.result)],
                ['Saques', usd(selectedAccount.withdrawals)],
                ['Código/ID', selectedAccount.accountCode || '-'],
                ['Observações', selectedAccount.notes || '-']
              ]}
            />
          </Card>
        </div>

        <Card title="Histórico da conta" subtitle="Operações vinculadas">
          <DataTable
            headers={['Data','Ativo','Setup','Resultado','Exec.','Emoc.']}
            rows={ops.slice().reverse().map(o => [o.date, o.asset, o.setup || '-', <Money value={o.result} />, o.executionScore, o.emotionalScore])}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <Card title={editing ? 'Editar Conta' : 'Nova Conta'} subtitle="PA, financiada, avaliação ou capital próprio">
        <div className="form account-form">
          <select value={form.workspaceId} onChange={e=>setForm({...form,workspaceId:e.target.value})}>
            {state.workspaces.map(w => <option key={w.id} value={w.id}>{w.icon || '🎯'} {w.name}</option>)}
          </select>
          <input placeholder="Nome da conta" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input placeholder="Mesa/Corretora" value={form.broker} onChange={e=>setForm({...form,broker:e.target.value})} />
          <input placeholder="ID/Código" value={form.accountCode} onChange={e=>setForm({...form,accountCode:e.target.value})} />
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            <option>PA</option>
            <option>Avaliação</option>
            <option>Financiada</option>
            <option>Capital Próprio</option>
          </select>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Ativa</option>
            <option>Em andamento</option>
            <option>Pausada</option>
            <option>Aprovada</option>
            <option>Reprovada</option>
            <option>Encerrada</option>
          </select>
          <input type="number" placeholder="Saldo nominal" value={form.nominalBalance} onChange={e=>setForm({...form,nominalBalance:e.target.value})} />
          <input type="number" placeholder="Resultado inicial/manual" value={form.initialResult} onChange={e=>setForm({...form,initialResult:e.target.value})} />
          <input type="number" placeholder="Colchão de segurança" value={form.safetyBuffer} onChange={e=>setForm({...form,safetyBuffer:e.target.value})} />
          <input type="number" placeholder="Loss diário máximo" value={form.maxDailyLoss} onChange={e=>setForm({...form,maxDailyLoss:e.target.value})} />
          <input type="number" placeholder="Meta de saque" value={form.payoutTarget || 0} onChange={e=>setForm({...form,payoutTarget:e.target.value})} />
          <input placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <button onClick={save}><Save size={15} /> {editing ? 'Atualizar' : 'Salvar'}</button>
          {editing && <button className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}><X size={15}/>Cancelar</button>}
        </div>
      </Card>

      <div className="toolbar">
        <div className="searchbox"><Search size={16}/><input placeholder="Buscar conta ou ID..." value={query} onChange={e=>setQuery(e.target.value)} /></div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option>Ativa</option>
          <option>Em andamento</option>
          <option>Aprovada</option>
          <option>Pausada</option>
          <option>Reprovada</option>
          <option>Encerrada</option>
        </select>
      </div>

      <div className="account-grid">
        {accounts.map(a => (
          <AccountProCard
            key={a.id}
            account={a}
            workspace={workspaceName(state, a.workspaceId)}
            open={()=>openAccount(a)}
            edit={()=>edit(a)}
            duplicate={()=>duplicate(a)}
            remove={()=>remove(a.id)}
          />
        ))}
      </div>

      <Card title="Tabela de contas" subtitle="Visão detalhada">
        <DataTable
          headers={['Workspace','Conta','Tipo','Status','Inicial','Operações','Saques','Patrimônio','Ações']}
          rows={accounts.map(a => [
            workspaceName(state, a.workspaceId),
            a.name,
            a.type,
            a.status,
            <Money value={a.initialResult} />,
            <Money value={a.result} />,
            <Money value={a.withdrawals} />,
            <Money value={a.net} />,
            <Actions onEdit={()=>edit(a)} onDelete={()=>remove(a.id)} />
          ])}
        />
      </Card>
    </div>
  );
}

function AccountProCard({ account, workspace, open, edit, duplicate, remove }) {
  const ddRemaining = Number(account.maxDailyLoss || 0) + Math.min(0, Number(account.resultToday || 0));
  const payoutProgress = account.payoutTarget ? Math.min(100, Math.round((account.net / account.payoutTarget) * 100)) : 0;

  return (
    <div className={`account-pro ${healthClass(account.health)}`}>
      <div className="account-head">
        <div>
          <span>{workspace}</span>
          <h3>{account.name}</h3>
        </div>
        <div className={`health-dot ${healthClass(account.health)}`}></div>
      </div>
      <div className="account-meta">
        <span>{account.type}</span>
        <span>{account.status}</span>
        <span>{account.accountCode || 'Sem ID'}</span>
      </div>
      <div className="account-values">
        <div><span>Patrimônio</span><strong>{<Money value={account.net} />}</strong></div>
        <div><span>Hoje</span><strong>{<Money value={account.resultToday} />}</strong></div>
        <div><span>DD restante</span><strong>{<Money value={ddRemaining} />}</strong></div>
        <div><span>Colchão</span><strong>{usd(account.safetyBuffer)}</strong></div>
      </div>
      <div>
        <div className="account-progress-label">
          <span>Meta de saque</span>
          <b>{account.payoutTarget ? `${payoutProgress}%` : '—'}</b>
        </div>
        <Progress value={payoutProgress} />
      </div>
      <div className="row-actions">
        <button className="secondary" onClick={open}>Abrir Conta</button>
        <IconButton onClick={edit} icon={<Edit3 size={15}/>} />
        <IconButton onClick={duplicate} icon={<Copy size={15}/>} />
        <IconButton danger onClick={remove} icon={<Trash2 size={15}/>} />
      </div>
    </div>
  );
}

function healthClass(health) {
  if (health === 'Saudável') return 'healthy';
  if (health === 'Atenção') return 'warning';
  return 'risk';
}

function OperationsPage({ state, update, contextId }) {
  const visibleAccounts = contextId === 'all' ? state.accounts : state.accounts.filter(a => a.workspaceId === contextId);
  const empty = { date:new Date().toISOString().slice(0,10), accountId: visibleAccounts[0]?.id || '', asset:'NQ', setup:'', result:'', withdrawal:0, trades:1, contracts:1, executionScore:0, emotionalScore:0, riskScore:0, disciplineScore:0, notes:'' };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  useEffect(()=> { if (!editing && visibleAccounts[0]) setForm(f => ({ ...f, accountId: visibleAccounts[0].id })); }, [contextId, visibleAccounts.length]);
  const operations = state.operations.filter(o => contextId === 'all' || visibleAccounts.some(a => a.id === o.accountId));
  function save() {
    if (!form.accountId) return alert('Selecione uma conta.');
    const payload = { ...form, id: editing || uid('op'), result:Number(form.result || 0), withdrawal:Number(form.withdrawal || 0), trades:Number(form.trades || 0), contracts:Number(form.contracts || 0), executionScore:Number(form.executionScore || 0), emotionalScore:Number(form.emotionalScore || 0), riskScore:Number(form.riskScore || 0), disciplineScore:Number(form.disciplineScore || 0) };
    update(s => {
      if (editing) { const idx = s.operations.findIndex(o => o.id === editing); if (idx >= 0) s.operations[idx] = payload; }
      else s.operations.push(payload);
    });
    setEditing(null); setForm(empty);
  }
  function edit(op) { setEditing(op.id); setForm({ ...op }); }
  function remove(id) { if (!confirm('Excluir esta operação?')) return; update(s => { s.operations = s.operations.filter(o => o.id !== id); }); }
  return (
    <div className="stack">
      <Card title={editing ? 'Editar Operação' : 'Nova Operação'} subtitle="Registro objetivo e comportamental">
        <div className="form">
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <select value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})}>{visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <input placeholder="Ativo" value={form.asset} onChange={e=>setForm({...form,asset:e.target.value})} />
          <input placeholder="Setup" value={form.setup} onChange={e=>setForm({...form,setup:e.target.value})} />
          <input type="number" placeholder="Resultado USD" value={form.result} onChange={e=>setForm({...form,result:e.target.value})} />
          <input type="number" placeholder="Saque USD" value={form.withdrawal} onChange={e=>setForm({...form,withdrawal:e.target.value})} />
          <input type="number" placeholder="Qtd. trades" value={form.trades} onChange={e=>setForm({...form,trades:e.target.value})} />
          <input type="number" placeholder="Contratos" value={form.contracts} onChange={e=>setForm({...form,contracts:e.target.value})} />
          <input type="number" placeholder="Execução 0-10" value={form.executionScore} onChange={e=>setForm({...form,executionScore:e.target.value})} />
          <input type="number" placeholder="Emocional 0-10" value={form.emotionalScore} onChange={e=>setForm({...form,emotionalScore:e.target.value})} />
          <input type="number" placeholder="Risco 0-10" value={form.riskScore} onChange={e=>setForm({...form,riskScore:e.target.value})} />
          <input type="number" placeholder="Disciplina 0-10" value={form.disciplineScore} onChange={e=>setForm({...form,disciplineScore:e.target.value})} />
          <button onClick={save}><Save size={15} /> {editing ? 'Atualizar' : 'Salvar'}</button>
          {editing && <button className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}><X size={15}/>Cancelar</button>}
        </div>
      </Card>
      <Card title="Operações" subtitle="Histórico filtrado pelo Workspace">
        <DataTable headers={['Data','Conta','Ativo','Setup','Resultado','Exec.','Emoc.','Ações']} rows={operations.slice().reverse().map(o => [o.date, accountName(state, o.accountId), o.asset, o.setup || '-', <Money value={o.result} />, o.executionScore, o.emotionalScore, <Actions onEdit={()=>edit(o)} onDelete={()=>remove(o.id)} />])} />
      </Card>
    </div>
  );
}

function FinancePage({ state, metrics }) {
  return (
    <div className="stack">
      <div className="grid four">
        <Kpi title="Patrimônio real" value={<Money value={metrics.netWorth} />} sub={brl(metrics.netWorth * state.settings.fx)} />
        <Kpi title="Capital construído" value={<Money value={metrics.builtCapital} />} sub={brl(metrics.builtCapital * state.settings.fx)} />
        <Kpi title="Saques" value={<Money value={metrics.withdrawals} />} sub="Total registrado" />
        <Kpi title="Resultado hoje" value={<Money value={metrics.todayResult} />} sub="Contexto atual" />
      </div>
      <Card title="Patrimônio por Workspace" subtitle="Consolidado">
        <DataTable headers={['Workspace','Contas','Operações','Hoje','Patrimônio']} rows={metrics.workspaceStats.map(w => [w.name, w.accountsCount, w.operationsCount, <Money value={w.today} />, <Money value={w.net} />])} />
      </Card>
    </div>
  );
}

function AnalyticsPage({ metrics, state }) {
  return (
    <div className="stack">
      <div className="grid four">
        <Kpi title="TES" value={metrics.tes || 0} sub="Evolução operacional" />
        <Kpi title="Execução" value={metrics.avgExec.toFixed(1)} sub="Média" />
        <Kpi title="Emocional" value={metrics.avgEmotion.toFixed(1)} sub="Média" />
        <Kpi title="Risco" value={metrics.avgRisk.toFixed(1)} sub="Média" />
      </div>
      <Card title="Resultado por Setup" subtitle="Primeira leitura de performance">
        <DataTable headers={['Setup','Resultado','Operações']} rows={Object.values(metrics.visibleOperations.reduce((acc, op) => { const key = op.setup || 'Sem setup'; acc[key] = acc[key] || { setup:key, result:0, count:0 }; acc[key].result += Number(op.result || 0); acc[key].count += 1; return acc; }, {})).map(r => [r.setup, <Money value={r.result} />, r.count])} />
      </Card>
    </div>
  );
}

function JavesPage({ state, metrics, contextWorkspace }) {
  return (
    <div className="stack">
      <Card title="J.A.V.E.S." subtitle="Jornada Analítica Virtual de Evolução Estratégica">
        <div className="javes-message big"><h3>Briefing</h3><p>{dailyBrief(state, metrics, contextWorkspace)}</p></div>
      </Card>
      <Card title="Leitura atual" subtitle="Baseada nos dados registrados">
        <DataTable headers={['Indicador','Leitura']} rows={[['TES', metrics.tes || 0], ['Execução média', metrics.avgExec.toFixed(1)], ['Emocional médio', metrics.avgEmotion.toFixed(1)], ['Patrimônio real', <Money value={metrics.netWorth} />], ['Operações registradas', metrics.totalOps]]} />
      </Card>
    </div>
  );
}

function SettingsPage({ state, update, user }) {
  const [name, setName] = useState(state.settings.traderName);
  const [fx, setFx] = useState(state.settings.fx);
  const [motto, setMotto] = useState(state.settings.motto);
  function save() { update(s => { s.settings.traderName = name; s.settings.fx = Number(fx || 0); s.settings.motto = motto; }); }
  return (
    <div className="stack">
      <Card title="Configurações" subtitle="Perfil e sistema">
        <div className="form"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome" /><input type="number" value={fx} onChange={e=>setFx(e.target.value)} placeholder="Cotação USD/BRL" /><input value={motto} onChange={e=>setMotto(e.target.value)} placeholder="Lema" /><button onClick={save}><Save size={15} /> Salvar</button></div>
      </Card>
      <Card title="iPad / PWA" subtitle="Instalar como aplicativo">
        <div className="settings-box">
          <span>Como instalar no iPad</span>
          <strong>Safari → Compartilhar → Adicionar à Tela de Início</strong>
          <small>Use o mesmo login do PC para sincronizar seus dados via Firebase.</small>
        </div>
      </Card>
      <Card title="Usuários / Beta Testers" subtitle="Como suas amigas podem usar">
        <div className="settings-box">
          <span>Como liberar acesso agora</span>
          <strong>Envie o link do app. Cada pessoa clica em Criar conta com o próprio e-mail.</strong>
          <small>Os dados ficam separados por usuário no Firebase. Elas não veem seus dados e você não vê os dados delas.</small>
        </div>
      </Card>
      <Card title="Conta" subtitle="Firebase Auth"><div className="settings-box"><span>E-mail</span><strong>{user.email}</strong></div></Card>
    </div>
  );
}

function JavesPanel({ state, metrics, contextWorkspace }) {
  return (
    <div className="panel-inner">
      <div className="panel-title"><Bot size={20} /><div><strong>J.A.V.E.S.</strong><small>Online</small></div></div>
      <div className="javes-message"><p>{dailyBrief(state, metrics, contextWorkspace)}</p></div>
      <div className="checklist"><label><input type="checkbox" /> Mercado analisado</label><label><input type="checkbox" /> Plano revisado</label><label><input type="checkbox" /> Risco definido</label><label><input type="checkbox" /> Setup A+ somente</label></div>
      <button className="full"><PlayCircle size={16} /> 🚀 Iniciar Pregão</button>
    </div>
  );
}

function dailyBrief(state, metrics, contextWorkspace) {
  const name = state.settings.traderName || 'Trader';
  const ctx = contextWorkspace ? ` no Workspace ${contextWorkspace.name}` : '';
  if (!metrics.totalOps) return `Boa noite, ${name}. Pregão Unificado REAL ativo${ctx}. Cadastre contas, lance operações e eu começarei a analisar sua evolução.`;
  if (metrics.tes >= 85) return `${name}, sua execução está forte${ctx}. Mantenha o plano e evite aumentar risco sem necessidade.`;
  if (metrics.tes >= 60) return `${name}, há evolução${ctx}, mas ainda existe espaço para melhorar disciplina, risco e emocional. Foque em setups A+.`;
  return `${name}, os dados indicam necessidade de reduzir risco${ctx}. Hoje a prioridade é proteger capital, reduzir risco e executar apenas setups A+.`;
}

function Kpi({ title, value, sub }) { return <div className="kpi"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>; }

function Money({ value }) {
  const n = Number(value || 0);
  const cls = n > 0 ? 'money-positive' : n < 0 ? 'money-negative' : 'money-neutral';
  return <span className={cls}>{usd(n)}</span>;
}
function Card({ title, subtitle, children }) { return <section className="card"><div className="card-head"><div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</section>; }
function DataTable({ headers, rows }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}{!rows.length && <tr><td colSpan={headers.length}><div className="empty">Nenhum registro ainda.</div></td></tr>}</tbody></table></div>;
}
function Actions({ onEdit, onDelete }) { return <div className="actions"><IconButton onClick={onEdit} icon={<Edit3 size={15}/>} /><IconButton danger onClick={onDelete} icon={<Trash2 size={15}/>} /></div>; }
function IconButton({ icon, onClick, danger=false }) { return <button className={danger ? 'icon danger' : 'icon'} onClick={onClick}>{icon}</button>; }
function Progress({ value }) { return <div className="progress"><span style={{width:`${Math.min(100, Math.max(0, value || 0))}%`}} /></div>; }

function sortWorkspaces(list, sort='favorite') {
  return [...list].sort((a,b) => {
    if (sort === 'favorite') return Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name);
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'net') return b.net - a.net;
    if (sort === 'today') return b.today - a.today;
    if (sort === 'tes') return b.tes - a.tes;
    return 0;
  });
}
function workspaceName(state, id) { return state.workspaces.find(w => w.id === id)?.name || '-'; }
function accountName(state, id) { return state.accounts.find(a => a.id === id)?.name || '-'; }

createRoot(document.getElementById('root')).render(<App />);
