
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  initializeApp
} from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
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
  Save,
  X,
  LogOut,
  Cloud,
  Download,
  Upload,
  PlayCircle
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
    {
      id: 'apex',
      name: 'Apex 20 PAs',
      type: 'Mesa Proprietária',
      status: 'Ativo',
      mission: 'Construir 20 PAs',
      color: 'blue',
      notes: 'Projeto principal da jornada Apex.'
    },
    {
      id: 'mide',
      name: 'Mide Global',
      type: 'Mesa Proprietária',
      status: 'Ativo',
      mission: 'Saque com colchão',
      color: 'cyan',
      notes: 'Controle de contas Mide e colchão.'
    },
    {
      id: 'tradeday',
      name: 'TradeDay',
      type: 'Mesa Proprietária',
      status: 'Ativo',
      mission: 'Financiadas e saques',
      color: 'orange',
      notes: 'Controle de contas TradeDay.'
    },
    {
      id: 'capital',
      name: 'Capital Próprio',
      type: 'Conta Própria',
      status: 'Planejado',
      mission: 'Crescimento patrimonial',
      color: 'green',
      notes: 'Contas próprias e investimentos.'
    }
  ],
  accounts: [
    {
      id: 'acc-apex-pa01',
      workspaceId: 'apex',
      name: 'Apex PA01',
      broker: 'Apex',
      accountCode: 'PA01',
      type: 'PA',
      status: 'Ativa',
      nominalBalance: 50000,
      initialResult: 0,
      safetyBuffer: 500,
      maxDailyLoss: 1100,
      notes: ''
    }
  ],
  operations: [],
  roadmap: [
    { id: 'r1', title: 'Foundation Alpha', status: 'Em andamento' },
    { id: 'r2', title: 'Analytics avançado', status: 'Próximo' },
    { id: 'r3', title: 'Modo Operação', status: 'Próximo' }
  ],
  updatedAt: new Date().toISOString()
};

const uid = (prefix='id') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const usd = v => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const avg = arr => {
  const valid = arr.map(Number).filter(v => v > 0);
  return valid.length ? valid.reduce((a,b)=>a+b,0) / valid.length : 0;
};

function calc(state) {
  const accountStats = state.accounts.map(acc => {
    const ops = state.operations.filter(o => o.accountId === acc.id);
    const result = ops.reduce((s,o)=>s + Number(o.result || 0), 0);
    const withdrawals = ops.reduce((s,o)=>s + Number(o.withdrawal || 0), 0);
    const net = Number(acc.initialResult || 0) + result - withdrawals;
    const health = net >= Math.max(Number(acc.safetyBuffer || 0), 1500) ? 'Saudável' : net >= 500 ? 'Atenção' : 'Risco';
    return { ...acc, result, withdrawals, net, health };
  });

  const netWorth = accountStats
    .filter(a => ['Ativa','Em andamento'].includes(a.status))
    .reduce((s,a)=>s+a.net, 0);

  const withdrawals = accountStats.reduce((s,a)=>s+a.withdrawals, 0);

  const workspaceStats = state.workspaces.map(ws => {
    const accounts = accountStats.filter(a => a.workspaceId === ws.id);
    const net = accounts.reduce((s,a)=>s+a.net,0);
    const operations = state.operations.filter(o => {
      const acc = state.accounts.find(a => a.id === o.accountId);
      return acc?.workspaceId === ws.id;
    });
    return {
      ...ws,
      accountsCount: accounts.length,
      operationsCount: operations.length,
      net
    };
  });

  const exec = avg(state.operations.map(o => o.executionScore));
  const emotion = avg(state.operations.map(o => o.emotionalScore));
  const risk = avg(state.operations.map(o => o.riskScore));
  const discipline = avg(state.operations.map(o => o.disciplineScore));
  const tes = Math.round((exec * 0.30 + risk * 0.25 + discipline * 0.25 + emotion * 0.20) * 10);

  return {
    accountStats,
    workspaceStats,
    netWorth,
    withdrawals,
    builtCapital: netWorth + withdrawals,
    totalOps: state.operations.length,
    avgExec: exec,
    avgEmotion: emotion,
    avgRisk: risk,
    avgDiscipline: discipline,
    tes: isNaN(tes) ? 0 : tes
  };
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function doLogin() {
    try {
      setMsg('Entrando...');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function doSignup() {
    try {
      setMsg('Criando conta...');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function resetPassword() {
    if (!email) return setMsg('Informe o e-mail para recuperar a senha.');
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg('E-mail de recuperação enviado.');
    } catch (err) {
      setMsg(err.message);
    }
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
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');
  const [state, setState] = useState(initialState);

  useEffect(() => {
    return onAuthStateChanged(auth, current => {
      setUser(current);
      if (!current) setLoaded(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'foundation', 'state');
    setSync('Sincronizando...');
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setState({
          ...initialState,
          ...data,
          settings: { ...initialState.settings, ...(data.settings || {}) },
          workspaces: data.workspaces || initialState.workspaces,
          accounts: data.accounts || [],
          operations: data.operations || [],
          roadmap: data.roadmap || initialState.roadmap
        });
        setSync('Sincronizado');
      } else {
        setDoc(ref, initialState);
        setSync('Base criada');
      }
      setLoaded(true);
    }, err => {
      console.error(err);
      setSync('Erro');
      setLoaded(true);
    });
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

  const metrics = calc(state);

  return (
    <div className="shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Topbar user={user} sync={sync} state={state} setState={setState} selectedWorkspace={selectedWorkspace} setSelectedWorkspace={setSelectedWorkspace} />
        <div className="content-grid">
          <section className="content">
            {page === 'home' && <HomePage state={state} metrics={metrics} setPage={setPage} />}
            {page === 'workspaces' && <WorkspacesPage state={state} update={update} setSelectedWorkspace={setSelectedWorkspace} setPage={setPage} />}
            {page === 'accounts' && <AccountsPage state={state} update={update} metrics={metrics} selectedWorkspace={selectedWorkspace} />}
            {page === 'operations' && <OperationsPage state={state} update={update} selectedWorkspace={selectedWorkspace} />}
            {page === 'finance' && <FinancePage state={state} metrics={metrics} />}
            {page === 'analytics' && <AnalyticsPage metrics={metrics} state={state} />}
            {page === 'javes' && <JavesPage state={state} metrics={metrics} />}
            {page === 'settings' && <SettingsPage state={state} update={update} user={user} />}
          </section>
          <aside className="javes-panel">
            <JavesPanel state={state} metrics={metrics} />
          </aside>
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
      <div className="brand">
        <div className="logo">AT</div>
        <div>
          <h2>Trading OS</h2>
          <span>Foundation</span>
        </div>
      </div>
      <nav>
        {items.map(([id, Icon, label]) => (
          <button key={id} className={page === id ? 'nav active' : 'nav'} onClick={()=>setPage(id)}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>v2.0.0-alpha</span>
        <strong>Foundation</strong>
      </div>
    </aside>
  );
}

function Topbar({ user, sync, state, setState, selectedWorkspace, setSelectedWorkspace }) {
  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'almeida-trading-os-foundation-backup.json';
    a.click();
  }

  function importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setState(JSON.parse(reader.result));
        alert('Backup importado.');
      } catch {
        alert('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <header className="topbar">
      <div>
        <h1>Centro de Comando</h1>
        <p>Disciplina executa. Consistência constrói.</p>
      </div>
      <div className="top-actions">
        <span className="sync"><Cloud size={15} /> {sync}</span>
        <select value={selectedWorkspace} onChange={e=>setSelectedWorkspace(e.target.value)}>
          <option value="all">Todos os Workspaces</option>
          {state.workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button className="ghost" onClick={exportBackup}><Download size={15} /> Backup</button>
        <label className="ghost upload"><Upload size={15} /> Importar<input type="file" accept=".json" onChange={importBackup} /></label>
        <button className="danger" onClick={()=>signOut(auth)}><LogOut size={15} /> Sair</button>
      </div>
    </header>
  );
}

function HomePage({ state, metrics, setPage }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const mainMission = state.workspaces[0]?.mission || 'Defina sua missão principal';

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <span className="eyebrow">Almeida Trading OS</span>
          <h2>{greet}, {state.settings.traderName}.</h2>
          <p>{state.settings.motto}</p>
        </div>
        <button onClick={()=>setPage('operations')}><PlayCircle size={18} /> Iniciar Sessão</button>
      </section>

      <div className="grid four">
        <Kpi title="Capital construído" value={usd(metrics.builtCapital)} sub={brl(metrics.builtCapital * state.settings.fx)} />
        <Kpi title="Patrimônio real" value={usd(metrics.netWorth)} sub="Sem saldo nominal" />
        <Kpi title="TES" value={metrics.tes || 0} sub="Trader Evolution Score" />
        <Kpi title="Operações" value={metrics.totalOps} sub="Total registrado" />
      </div>

      <div className="grid two">
        <Card title="Missão atual" subtitle="Foco principal">
          <div className="mission-box">
            <h3>{mainMission}</h3>
            <div className="progress"><span style={{width:'38%'}} /></div>
            <small>Foundation: transformar rotina em sistema.</small>
          </div>
        </Card>
        <Card title="Workspaces" subtitle="Ambientes ativos">
          <div className="workspace-list">
            {metrics.workspaceStats.map(w => (
              <div className="list-row" key={w.id}>
                <div>
                  <strong>{w.name}</strong>
                  <small>{w.accountsCount} conta(s) • {w.operationsCount} operação(ões)</small>
                </div>
                <b>{usd(w.net)}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid two">
        <Card title="Últimas operações" subtitle="Registro operacional">
          <DataTable
            headers={['Data','Conta','Resultado','Setup']}
            rows={state.operations.slice(-5).reverse().map(o => [
              o.date,
              accountName(state, o.accountId),
              usd(o.result),
              o.setup || '-'
            ])}
          />
        </Card>
        <Card title="Saúde das contas" subtitle="Risco e colchão">
          <div className="workspace-list">
            {metrics.accountStats.map(a => (
              <div className="list-row" key={a.id}>
                <div>
                  <strong>{a.name}</strong>
                  <small>{a.health} • {a.status}</small>
                </div>
                <b>{usd(a.net)}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WorkspacesPage({ state, update, setSelectedWorkspace, setPage }) {
  const empty = { name:'', type:'Mesa Proprietária', status:'Ativo', mission:'', color:'blue', notes:'' };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  function save() {
    if (!form.name) return alert('Informe o nome do Workspace.');
    const payload = { ...form, id: editing || uid('ws') };
    update(s => {
      if (editing) {
        const idx = s.workspaces.findIndex(w => w.id === editing);
        if (idx >= 0) s.workspaces[idx] = payload;
      } else {
        s.workspaces.push(payload);
      }
    });
    setEditing(null);
    setForm(empty);
  }

  function edit(ws) {
    setEditing(ws.id);
    setForm({ ...ws });
  }

  function remove(id) {
    if (!confirm('Excluir este Workspace? Contas e operações vinculadas também serão removidas.')) return;
    update(s => {
      const accIds = s.accounts.filter(a => a.workspaceId === id).map(a => a.id);
      s.workspaces = s.workspaces.filter(w => w.id !== id);
      s.accounts = s.accounts.filter(a => a.workspaceId !== id);
      s.operations = s.operations.filter(o => !accIds.includes(o.accountId));
    });
  }

  return (
    <div className="stack">
      <Card title={editing ? 'Editar Workspace' : 'Novo Workspace'} subtitle="Apex, Mide, TradeDay, Capital Próprio, Matrix...">
        <div className="form">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            <option>Mesa Proprietária</option>
            <option>Conta Própria</option>
            <option>Empresa</option>
            <option>Estudos</option>
            <option>Outro</option>
          </select>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Ativo</option>
            <option>Planejado</option>
            <option>Pausado</option>
            <option>Encerrado</option>
          </select>
          <input placeholder="Missão" value={form.mission} onChange={e=>setForm({...form,mission:e.target.value})} />
          <input placeholder="Notas" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <button onClick={save}><Save size={15} /> {editing ? 'Atualizar' : 'Salvar'}</button>
          {editing && <button className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}><X size={15}/>Cancelar</button>}
        </div>
      </Card>

      <div className="workspace-grid">
        {state.workspaces.map(ws => (
          <div className="workspace-card" key={ws.id}>
            <div className="workspace-top">
              <span>{ws.type}</span>
              <b>{ws.status}</b>
            </div>
            <h3>{ws.name}</h3>
            <p>{ws.mission || 'Sem missão definida.'}</p>
            <small>{ws.notes}</small>
            <div className="row-actions">
              <button className="secondary" onClick={()=>{setSelectedWorkspace(ws.id); setPage('accounts')}}>Abrir</button>
              <IconButton onClick={()=>edit(ws)} icon={<Edit3 size={15}/>} />
              <IconButton danger onClick={()=>remove(ws.id)} icon={<Trash2 size={15}/>} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountsPage({ state, update, metrics, selectedWorkspace }) {
  const empty = { workspaceId: selectedWorkspace === 'all' ? state.workspaces[0]?.id || '' : selectedWorkspace, name:'', broker:'', accountCode:'', type:'PA', status:'Ativa', nominalBalance:50000, initialResult:0, safetyBuffer:0, maxDailyLoss:0, notes:'' };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  useEffect(()=> {
    if (!editing) setForm(f => ({ ...f, workspaceId: selectedWorkspace === 'all' ? f.workspaceId : selectedWorkspace }));
  }, [selectedWorkspace]);

  const accounts = selectedWorkspace === 'all'
    ? metrics.accountStats
    : metrics.accountStats.filter(a => a.workspaceId === selectedWorkspace);

  function save() {
    if (!form.name) return alert('Informe o nome da conta.');
    const payload = {
      ...form,
      id: editing || uid('acc'),
      nominalBalance:Number(form.nominalBalance || 0),
      initialResult:Number(form.initialResult || 0),
      safetyBuffer:Number(form.safetyBuffer || 0),
      maxDailyLoss:Number(form.maxDailyLoss || 0)
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
    setForm({ ...acc });
  }

  function remove(id) {
    if (!confirm('Excluir esta conta? Operações vinculadas também serão removidas.')) return;
    update(s => {
      s.accounts = s.accounts.filter(a => a.id !== id);
      s.operations = s.operations.filter(o => o.accountId !== id);
    });
  }

  return (
    <div className="stack">
      <Card title={editing ? 'Editar Conta' : 'Nova Conta'} subtitle="PA, financiada, avaliação ou capital próprio">
        <div className="form">
          <select value={form.workspaceId} onChange={e=>setForm({...form,workspaceId:e.target.value})}>
            {state.workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
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
          <input placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <button onClick={save}><Save size={15} /> {editing ? 'Atualizar' : 'Salvar'}</button>
          {editing && <button className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}><X size={15}/>Cancelar</button>}
        </div>
      </Card>

      <Card title="Contas cadastradas" subtitle="Patrimônio real sem saldo nominal">
        <DataTable
          headers={['Workspace','Conta','Tipo','Status','Inicial','Operações','Saques','Patrimônio','Ações']}
          rows={accounts.map(a => [
            workspaceName(state, a.workspaceId),
            a.name,
            a.type,
            a.status,
            usd(a.initialResult),
            usd(a.result),
            usd(a.withdrawals),
            usd(a.net),
            <Actions onEdit={()=>edit(a)} onDelete={()=>remove(a.id)} />
          ])}
        />
      </Card>
    </div>
  );
}

function OperationsPage({ state, update, selectedWorkspace }) {
  const visibleAccounts = selectedWorkspace === 'all'
    ? state.accounts
    : state.accounts.filter(a => a.workspaceId === selectedWorkspace);

  const empty = { date:new Date().toISOString().slice(0,10), accountId: visibleAccounts[0]?.id || '', asset:'NQ', setup:'', result:'', withdrawal:0, trades:1, contracts:1, executionScore:0, emotionalScore:0, riskScore:0, disciplineScore:0, notes:'' };

  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  useEffect(()=> {
    if (!editing && visibleAccounts[0]) setForm(f => ({ ...f, accountId: visibleAccounts[0].id }));
  }, [selectedWorkspace, visibleAccounts.length]);

  const operations = state.operations.filter(o => {
    if (selectedWorkspace === 'all') return true;
    const acc = state.accounts.find(a => a.id === o.accountId);
    return acc?.workspaceId === selectedWorkspace;
  });

  function save() {
    if (!form.accountId) return alert('Selecione uma conta.');
    const payload = {
      ...form,
      id: editing || uid('op'),
      result:Number(form.result || 0),
      withdrawal:Number(form.withdrawal || 0),
      trades:Number(form.trades || 0),
      contracts:Number(form.contracts || 0),
      executionScore:Number(form.executionScore || 0),
      emotionalScore:Number(form.emotionalScore || 0),
      riskScore:Number(form.riskScore || 0),
      disciplineScore:Number(form.disciplineScore || 0)
    };
    update(s => {
      if (editing) {
        const idx = s.operations.findIndex(o => o.id === editing);
        if (idx >= 0) s.operations[idx] = payload;
      } else {
        s.operations.push(payload);
      }
    });
    setEditing(null);
    setForm(empty);
  }

  function edit(op) {
    setEditing(op.id);
    setForm({ ...op });
  }

  function remove(id) {
    if (!confirm('Excluir esta operação?')) return;
    update(s => {
      s.operations = s.operations.filter(o => o.id !== id);
    });
  }

  return (
    <div className="stack">
      <Card title={editing ? 'Editar Operação' : 'Nova Operação'} subtitle="Registro objetivo e comportamental">
        <div className="form">
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <select value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})}>
            {visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
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
          <input placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <button onClick={save}><Save size={15} /> {editing ? 'Atualizar' : 'Salvar'}</button>
          {editing && <button className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}><X size={15}/>Cancelar</button>}
        </div>
      </Card>

      <Card title="Operações" subtitle="Histórico filtrado pelo Workspace">
        <DataTable
          headers={['Data','Conta','Ativo','Setup','Resultado','Exec.','Emoc.','Ações']}
          rows={operations.slice().reverse().map(o => [
            o.date,
            accountName(state, o.accountId),
            o.asset,
            o.setup || '-',
            usd(o.result),
            o.executionScore,
            o.emotionalScore,
            <Actions onEdit={()=>edit(o)} onDelete={()=>remove(o.id)} />
          ])}
        />
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
        <Kpi title="Cotação" value={state.settings.fx} sub="USD/BRL manual" />
      </div>
      <Card title="Patrimônio por Workspace" subtitle="Consolidado">
        <DataTable
          headers={['Workspace','Contas','Operações','Patrimônio']}
          rows={metrics.workspaceStats.map(w => [w.name, w.accountsCount, w.operationsCount, usd(w.net)])}
        />
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
        <DataTable
          headers={['Setup','Resultado','Operações']}
          rows={Object.values(state.operations.reduce((acc, op) => {
            const key = op.setup || 'Sem setup';
            acc[key] = acc[key] || { setup:key, result:0, count:0 };
            acc[key].result += Number(op.result || 0);
            acc[key].count += 1;
            return acc;
          }, {})).map(r => [r.setup, usd(r.result), r.count])}
        />
      </Card>
    </div>
  );
}

function JavesPage({ state, metrics }) {
  return (
    <div className="stack">
      <Card title="J.A.V.E.S." subtitle="Jornada Analítica Virtual de Evolução Estratégica">
        <div className="javes-message big">
          <h3>Briefing do dia</h3>
          <p>{dailyBrief(state, metrics)}</p>
        </div>
      </Card>
      <Card title="Leitura atual" subtitle="Baseada nos dados registrados">
        <DataTable
          headers={['Indicador','Leitura']}
          rows={[
            ['TES', metrics.tes || 0],
            ['Execução média', metrics.avgExec.toFixed(1)],
            ['Emocional médio', metrics.avgEmotion.toFixed(1)],
            ['Patrimônio real', usd(metrics.netWorth)],
            ['Operações registradas', metrics.totalOps]
          ]}
        />
      </Card>
    </div>
  );
}

function SettingsPage({ state, update, user }) {
  const [name, setName] = useState(state.settings.traderName);
  const [fx, setFx] = useState(state.settings.fx);
  const [motto, setMotto] = useState(state.settings.motto);

  function save() {
    update(s => {
      s.settings.traderName = name;
      s.settings.fx = Number(fx || 0);
      s.settings.motto = motto;
    });
  }

  return (
    <div className="stack">
      <Card title="Configurações" subtitle="Perfil e sistema">
        <div className="form">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome" />
          <input type="number" value={fx} onChange={e=>setFx(e.target.value)} placeholder="Cotação USD/BRL" />
          <input value={motto} onChange={e=>setMotto(e.target.value)} placeholder="Lema" />
          <button onClick={save}><Save size={15} /> Salvar</button>
        </div>
      </Card>
      <Card title="Conta" subtitle="Firebase Auth">
        <div className="settings-box">
          <span>E-mail</span>
          <strong>{user.email}</strong>
        </div>
      </Card>
    </div>
  );
}

function JavesPanel({ state, metrics }) {
  return (
    <div className="panel-inner">
      <div className="panel-title">
        <Bot size={20} />
        <div>
          <strong>J.A.V.E.S.</strong>
          <small>Online</small>
        </div>
      </div>
      <div className="javes-message">
        <p>{dailyBrief(state, metrics)}</p>
      </div>
      <div className="checklist">
        <label><input type="checkbox" /> Mercado analisado</label>
        <label><input type="checkbox" /> Plano revisado</label>
        <label><input type="checkbox" /> Risco definido</label>
        <label><input type="checkbox" /> Setup A+ somente</label>
      </div>
      <button className="full"><PlayCircle size={16} /> Iniciar Sessão</button>
    </div>
  );
}

function dailyBrief(state, metrics) {
  const name = state.settings.traderName || 'Trader';
  if (!state.operations.length) {
    return `Boa noite, ${name}. A Foundation está pronta para começar seus registros. Cadastre suas contas, lance as operações e eu começarei a analisar sua evolução.`;
  }
  if (metrics.tes >= 85) return `${name}, sua execução está forte. Mantenha o plano e evite aumentar risco sem necessidade.`;
  if (metrics.tes >= 60) return `${name}, há evolução, mas ainda existe espaço para melhorar disciplina, risco e emocional. Foque em setups A+.`;
  return `${name}, os dados indicam necessidade de reduzir risco e simplificar a operação. Hoje a prioridade é proteger capital.`;
}

function Kpi({ title, value, sub }) {
  return <div className="kpi"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>;
}

function Card({ title, subtitle, children }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}
          {!rows.length && <tr><td colSpan={headers.length}><div className="empty">Nenhum registro ainda.</div></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Actions({ onEdit, onDelete }) {
  return (
    <div className="actions">
      <IconButton onClick={onEdit} icon={<Edit3 size={15}/>} />
      <IconButton danger onClick={onDelete} icon={<Trash2 size={15}/>} />
    </div>
  );
}

function IconButton({ icon, onClick, danger=false }) {
  return <button className={danger ? 'icon danger' : 'icon'} onClick={onClick}>{icon}</button>;
}

function workspaceName(state, id) {
  return state.workspaces.find(w => w.id === id)?.name || '-';
}
function accountName(state, id) {
  return state.accounts.find(a => a.id === id)?.name || '-';
}

createRoot(document.getElementById('root')).render(<App />);
