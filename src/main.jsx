
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
          operations: data.operations || []
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
            {page === 'workspaces' && <WorkspacesPage state={state} update={update} setContextId={setContextId} setPage={setPage} />}
            {page === 'accounts' && <AccountsPage state={state} update={update} metrics={metrics} contextId={contextId} />}
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
      <div className="brand"><div className="logo">AT</div><div><h2>Trading OS</h2><span>Workspace PRO</span></div></div>
      <nav>{items.map(([id, Icon, label]) => <button key={id} className={page === id ? 'nav active' : 'nav'} onClick={()=>setPage(id)}><Icon size={18} /> {label}</button>)}</nav>
      <div className="sidebar-footer"><span>v2.1</span><strong>Workspace PRO</strong></div>
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
        <h1>{contextWorkspace ? `${contextWorkspace.icon} ${contextWorkspace.name}` : 'Centro de Comando'}</h1>
        <p>{contextWorkspace ? contextWorkspace.mission : 'Disciplina executa. Consistência constrói.'}</p>
      </div>
      <div className="top-actions">
        <span className="sync"><Cloud size={15} /> {sync}</span>
        <select value={contextId} onChange={e=>setContextId(e.target.value)}>
          <option value="all">Todos os Workspaces</option>
          {state.workspaces.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
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
  return (
    <div className="stack">
      <section className="hero">
        <div>
          <span className="eyebrow">{contextWorkspace ? 'Workspace ativo' : 'Almeida Trading OS'}</span>
          <h2>{greet}, {state.settings.traderName}.</h2>
          <p>{contextWorkspace ? contextWorkspace.notes : state.settings.motto}</p>
        </div>
        <button onClick={()=>setPage('operations')}><PlayCircle size={18} /> Executar Plano</button>
      </section>

      <div className="grid four">
        <Kpi title="Capital construído" value={usd(metrics.builtCapital)} sub={brl(metrics.builtCapital * state.settings.fx)} />
        <Kpi title="Patrimônio real" value={usd(metrics.netWorth)} sub="Sem saldo nominal" />
        <Kpi title="Hoje" value={usd(metrics.todayResult)} sub={contextId === 'all' ? 'Todos os Workspaces' : 'Workspace ativo'} />
        <Kpi title="TES" value={metrics.tes || 0} sub="Trader Evolution Score" />
      </div>

      {contextWorkspace && <WorkspaceDashboard state={state} metrics={metrics} workspace={contextWorkspace} />}
      {!contextWorkspace && (
        <div className="workspace-pro-grid">
          {sortWorkspaces(metrics.workspaceStats).map(w => <WorkspaceProCard key={w.id} workspace={w} open={()=>{}} compact />)}
        </div>
      )}

      <div className="grid two">
        <Card title="Últimas operações" subtitle="Registro operacional">
          <DataTable headers={['Data','Conta','Resultado','Setup']} rows={metrics.visibleOperations.slice(-5).reverse().map(o => [o.date, accountName(state, o.accountId), usd(o.result), o.setup || '-'])} />
        </Card>
        <Card title="Saúde das contas" subtitle="Risco e colchão">
          <div className="workspace-list">
            {metrics.visibleAccounts.map(a => <div className="list-row" key={a.id}><div><strong>{a.name}</strong><small>{a.health} • {a.status}</small></div><b>{usd(a.net)}</b></div>)}
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
    <Card title={`${workspace.icon} Dashboard do Workspace`} subtitle={workspace.mission}>
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
      <Card title={editing ? 'Editar Workspace' : 'Novo Workspace'} subtitle="Sprint 1 — Workspace PRO">
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
        <div><span>Patrimônio</span><strong>{usd(workspace.net)}</strong></div>
        <div><span>Hoje</span><strong>{usd(workspace.today)}</strong></div>
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

function AccountsPage({ state, update, metrics, contextId }) {
  const empty = { workspaceId: contextId === 'all' ? state.workspaces[0]?.id || '' : contextId, name:'', broker:'', accountCode:'', type:'PA', status:'Ativa', nominalBalance:50000, initialResult:0, safetyBuffer:0, maxDailyLoss:0, notes:'' };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  useEffect(()=> { if (!editing) setForm(f => ({ ...f, workspaceId: contextId === 'all' ? f.workspaceId : contextId })); }, [contextId]);
  const accounts = metrics.visibleAccounts;
  function save() {
    if (!form.name) return alert('Informe o nome da conta.');
    const payload = { ...form, id: editing || uid('acc'), nominalBalance:Number(form.nominalBalance || 0), initialResult:Number(form.initialResult || 0), safetyBuffer:Number(form.safetyBuffer || 0), maxDailyLoss:Number(form.maxDailyLoss || 0) };
    update(s => {
      if (editing) { const idx = s.accounts.findIndex(a => a.id === editing); if (idx >= 0) s.accounts[idx] = payload; }
      else s.accounts.push(payload);
    });
    setEditing(null); setForm(empty);
  }
  function edit(acc) { setEditing(acc.id); setForm({ ...acc }); }
  function remove(id) {
    if (!confirm('Excluir esta conta? Operações vinculadas também serão removidas.')) return;
    update(s => { s.accounts = s.accounts.filter(a => a.id !== id); s.operations = s.operations.filter(o => o.accountId !== id); });
  }
  return (
    <div className="stack">
      <Card title={editing ? 'Editar Conta' : 'Nova Conta'} subtitle="PA, financiada, avaliação ou capital próprio">
        <div className="form">
          <select value={form.workspaceId} onChange={e=>setForm({...form,workspaceId:e.target.value})}>{state.workspaces.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}</select>
          <input placeholder="Nome da conta" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input placeholder="Mesa/Corretora" value={form.broker} onChange={e=>setForm({...form,broker:e.target.value})} />
          <input placeholder="ID/Código" value={form.accountCode} onChange={e=>setForm({...form,accountCode:e.target.value})} />
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>PA</option><option>Avaliação</option><option>Financiada</option><option>Capital Próprio</option></select>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Ativa</option><option>Em andamento</option><option>Pausada</option><option>Aprovada</option><option>Reprovada</option><option>Encerrada</option></select>
          <input type="number" placeholder="Saldo nominal" value={form.nominalBalance} onChange={e=>setForm({...form,nominalBalance:e.target.value})} />
          <input type="number" placeholder="Resultado inicial/manual" value={form.initialResult} onChange={e=>setForm({...form,initialResult:e.target.value})} />
          <input type="number" placeholder="Colchão de segurança" value={form.safetyBuffer} onChange={e=>setForm({...form,safetyBuffer:e.target.value})} />
          <input type="number" placeholder="Loss diário máximo" value={form.maxDailyLoss} onChange={e=>setForm({...form,maxDailyLoss:e.target.value})} />
          <button onClick={save}><Save size={15} /> {editing ? 'Atualizar' : 'Salvar'}</button>
          {editing && <button className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}><X size={15}/>Cancelar</button>}
        </div>
      </Card>
      <Card title="Contas cadastradas" subtitle="Patrimônio real sem saldo nominal">
        <DataTable headers={['Workspace','Conta','Tipo','Status','Inicial','Operações','Saques','Patrimônio','Ações']} rows={accounts.map(a => [workspaceName(state, a.workspaceId), a.name, a.type, a.status, usd(a.initialResult), usd(a.result), usd(a.withdrawals), usd(a.net), <Actions onEdit={()=>edit(a)} onDelete={()=>remove(a.id)} />])} />
      </Card>
    </div>
  );
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
        <DataTable headers={['Data','Conta','Ativo','Setup','Resultado','Exec.','Emoc.','Ações']} rows={operations.slice().reverse().map(o => [o.date, accountName(state, o.accountId), o.asset, o.setup || '-', usd(o.result), o.executionScore, o.emotionalScore, <Actions onEdit={()=>edit(o)} onDelete={()=>remove(o.id)} />])} />
      </Card>
    </div>
  );
}

function FinancePage({ state, metrics }) {
  return (
    <div className="stack">
      <div className="grid four">
        <Kpi title="Patrimônio real" value={usd(metrics.netWorth)} sub={brl(metrics.netWorth * state.settings.fx)} />
        <Kpi title="Capital construído" value={usd(metrics.builtCapital)} sub={brl(metrics.builtCapital * state.settings.fx)} />
        <Kpi title="Saques" value={usd(metrics.withdrawals)} sub="Total registrado" />
        <Kpi title="Resultado hoje" value={usd(metrics.todayResult)} sub="Contexto atual" />
      </div>
      <Card title="Patrimônio por Workspace" subtitle="Consolidado">
        <DataTable headers={['Workspace','Contas','Operações','Hoje','Patrimônio']} rows={metrics.workspaceStats.map(w => [w.name, w.accountsCount, w.operationsCount, usd(w.today), usd(w.net)])} />
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
        <DataTable headers={['Setup','Resultado','Operações']} rows={Object.values(metrics.visibleOperations.reduce((acc, op) => { const key = op.setup || 'Sem setup'; acc[key] = acc[key] || { setup:key, result:0, count:0 }; acc[key].result += Number(op.result || 0); acc[key].count += 1; return acc; }, {})).map(r => [r.setup, usd(r.result), r.count])} />
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
        <DataTable headers={['Indicador','Leitura']} rows={[['TES', metrics.tes || 0], ['Execução média', metrics.avgExec.toFixed(1)], ['Emocional médio', metrics.avgEmotion.toFixed(1)], ['Patrimônio real', usd(metrics.netWorth)], ['Operações registradas', metrics.totalOps]]} />
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
      <button className="full"><PlayCircle size={16} /> Executar Plano</button>
    </div>
  );
}

function dailyBrief(state, metrics, contextWorkspace) {
  const name = state.settings.traderName || 'Trader';
  const ctx = contextWorkspace ? ` no Workspace ${contextWorkspace.name}` : '';
  if (!metrics.totalOps) return `Boa noite, ${name}. Workspace PRO ativo${ctx}. Cadastre contas, lance operações e eu começarei a analisar sua evolução.`;
  if (metrics.tes >= 85) return `${name}, sua execução está forte${ctx}. Mantenha o plano e evite aumentar risco sem necessidade.`;
  if (metrics.tes >= 60) return `${name}, há evolução${ctx}, mas ainda existe espaço para melhorar disciplina, risco e emocional. Foque em setups A+.`;
  return `${name}, os dados indicam necessidade de reduzir risco${ctx}. Hoje a prioridade é proteger capital.`;
}

function Kpi({ title, value, sub }) { return <div className="kpi"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>; }
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
