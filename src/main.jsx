
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
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import {
  LayoutDashboard,
  Target,
  Activity,
  Wallet,
  BarChart3,
  Globe2,
  BookOpen,
  BrainCircuit,
  Settings,
  Download,
  Upload,
  Plus,
  Save,
  LogOut,
  Cloud,
  ShieldCheck,
  Edit3,
  Trash2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
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

const STORAGE_KEY = 'almeida-trading-os-cloud-local';

const initialState = {
  fx: 5.17,
  projects: [
    { id:'apex20', name:'Apex 20 PAs', type:'Prop Firm', status:'Ativo', goal:'20 PAs', targetPas:20, description:'Projeto específico para construir até 20 PAs na Apex.' },
    { id:'mide', name:'Mide Global', type:'Prop Firm', status:'Ativo', goal:'Saque com colchão', targetPas:0, description:'Controle das contas Mide, colchão, saques e dias mínimos.' },
    { id:'tradeday', name:'TradeDay', type:'Prop Firm', status:'Ativo', goal:'Financiadas e saques', targetPas:0, description:'Controle de contas TradeDay, risco diário e evolução.' },
    { id:'earn2trade', name:'Earn2Trade Career', type:'Prop Firm', status:'Ativo', goal:'50k → 400k', targetPas:0, description:'Plano de carreira Earn2Trade com progressão por etapas.' },
    { id:'capital-proprio', name:'Capital Próprio', type:'Conta Própria', status:'Planejado', goal:'Crescimento patrimonial', targetPas:0, description:'Operações e investimentos com capital próprio.' }
  ],
  accounts: [
    { id:'pa-01', projectId:'apex20', broker:'Apex', name:'Apex PA 01', type:'PA', status:'Ativa', nominalBalance:50000, manualResult:0, safetyBuffer:500, createdAt:new Date().toISOString().slice(0,10) }
  ],
  evaluations: [],
  operations: [],
  withdrawals: [],
  updatedAt: new Date().toISOString()
};

function uid(prefix='id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function money(v) {
  return '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function brl(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
function average(values) {
  const valid = values.map(Number).filter(v => v > 0);
  return valid.length ? valid.reduce((a,b)=>a+b,0) / valid.length : 0;
}

function computeMetrics(state, projectFilter = 'all') {
  const projectMatch = id => projectFilter === 'all' || id === projectFilter;

  const operations = state.operations.filter(o => {
    const acc = state.accounts.find(a => a.id === o.accountId);
    const ev = state.evaluations.find(e => e.id === o.accountId);
    return projectFilter === 'all' || acc?.projectId === projectFilter || ev?.projectId === projectFilter;
  });

  const paStats = state.accounts
    .filter(a => projectMatch(a.projectId))
    .map(acc => {
      const ops = operations.filter(o => o.accountId === acc.id && o.accountType === 'PA');
      const opResult = ops.reduce((s,o)=>s + Number(o.result || 0), 0);
      const withdrawals = ops.reduce((s,o)=>s + Number(o.withdrawal || 0), 0);
      const net = Number(acc.manualResult || 0) + opResult - withdrawals;
      const built = net + withdrawals;
      const health = net >= Math.max(acc.safetyBuffer || 0, 1500) ? 'Saudável' : net >= 500 ? 'Atenção' : 'Risco';
      return { ...acc, opResult, withdrawals, net, built, health };
    });

  const activePas = paStats.filter(a => a.status === 'Ativa' && (a.type === 'PA' || a.type === 'Financiada' || a.type === 'Capital Próprio'));
  const netWorth = activePas.reduce((s,a)=>s+a.net, 0);
  const withdrawals = activePas.reduce((s,a)=>s+a.withdrawals, 0);
  const builtCapital = netWorth + withdrawals;

  const evals = state.evaluations.filter(e => projectMatch(e.projectId));
  const approved = evals.filter(e => e.status === 'Aprovada').length;

  const projectStats = state.projects.map(p => {
    const accs = paStats.filter(a => a.projectId === p.id && a.status === 'Ativa');
    return {
      ...p,
      net: accs.reduce((s,a)=>s+a.net, 0),
      count: accs.length
    };
  });

  return {
    paStats,
    activePas,
    apexActivePas: activePas.filter(a => a.projectId === 'apex20').length,
    netWorth,
    withdrawals,
    builtCapital,
    projectStats,
    evals,
    approved,
    approvalRate: evals.length ? approved / evals.length : 0,
    operations,
    totalOps: operations.length,
    totalTrades: operations.reduce((s,o)=>s+Number(o.trades || 0), 0),
    avgExec: average(operations.map(o => o.executionScore)),
    avgEmotion: average(operations.map(o => o.emotionalScore)),
    avgReading: average(operations.map(o => o.readingScore))
  };
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function login() {
    try {
      setMsg('Entrando...');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setMsg('Erro: ' + e.message);
    }
  }

  async function signup() {
    try {
      setMsg('Criando conta...');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setMsg('Erro: ' + e.message);
    }
  }

  return (
    <div className="loginScreen">
      <div className="loginCard">
        <div className="brandLogo big">AT</div>
        <h1>Almeida Trading OS</h1>
        <p>Entre para sincronizar PC, iPad e futuramente iPhone.</p>
        <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={login}>Entrar</button>
        <button className="secondary" onClick={signup}>Criar conta</button>
        <small>{msg}</small>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Conectando...');
  const [active, setActive] = useState('dashboard');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentWorkspaceProject, setCurrentWorkspaceProject] = useState('apex20');
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialState;
  });
  const [cloudLoaded, setCloudLoaded] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, current => {
      setUser(current);
      if (!current) {
        setSyncStatus('Aguardando login');
        setCloudLoaded(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setSyncStatus('Sincronizando...');
    const ref = doc(db, 'users', user.uid, 'tradingOS', 'state');
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setState({
          fx: data.fx ?? 5.17,
          projects: data.projects || initialState.projects,
          accounts: data.accounts || [],
          evaluations: data.evaluations || [],
          operations: data.operations || [],
          withdrawals: data.withdrawals || [],
          updatedAt: data.updatedAt || new Date().toISOString()
        });
        setSyncStatus('Sincronizado');
      } else {
        setDoc(ref, { ...initialState, updatedAt: new Date().toISOString() });
        setSyncStatus('Base criada');
      }
      setCloudLoaded(true);
    }, err => {
      console.error(err);
      setSyncStatus('Erro de sincronização');
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!user || !cloudLoaded) return;
    const timer = setTimeout(() => {
      const ref = doc(db, 'users', user.uid, 'tradingOS', 'state');
      setDoc(ref, { ...state, updatedAt: new Date().toISOString() }, { merge: true })
        .then(()=>setSyncStatus('Sincronizado'))
        .catch(()=>setSyncStatus('Erro ao salvar'));
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  const metrics = useMemo(() => computeMetrics(state, projectFilter), [state, projectFilter]);

  function updateState(fn) {
    setState(prev => {
      const next = structuredClone(prev);
      fn(next);
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setSyncStatus('Salvando...');
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'almeida-trading-os-cloud-backup.json';
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

  if (!user) return <LoginScreen />;
  if (!cloudLoaded) return <div className="loading"><Cloud /> Carregando dados da nuvem...</div>;

  const nav = [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['projects', Target, 'Projetos'],
    ['operations', Activity, 'Operações'],
    ['finance', Wallet, 'Financeiro'],
    ['analytics', BarChart3, 'Analytics'],
    ['panorama', Globe2, 'Panorama'],
    ['studies', BookOpen, 'Estudos'],
    ['ai', BrainCircuit, 'IA'],
    ['settings', Settings, 'Configurações']
  ];

  function openWorkspace(id) {
    setCurrentWorkspaceProject(id);
    setProjectFilter(id);
    setActive('workspace');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandLogo">AT</div>
          <div>
            <h1>Almeida Trading OS</h1>
            <p>Cloud Career OS</p>
          </div>
        </div>

        <nav className="nav">
          {nav.map(([id, Icon, label]) => (
            <button key={id} className={active === id ? 'navItem active' : 'navItem'} onClick={() => setActive(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
          <div className="subNavTitle">Projetos</div>
          {state.projects.map(p => (
            <button key={p.id} className="subNavItem" onClick={()=>openWorkspace(p.id)}>
              {projectIcon(p.id)} {p.name}
            </button>
          ))}
        </nav>

        <div className="sideCard">
          <span>Missão principal</span>
          <strong>Apex 20 PAs</strong>
          <small>{metrics.apexActivePas}/20 PAs ativas</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>{pageTitle(active)}</h2>
            <p>{pageSubtitle(active)}</p>
          </div>
          <div className="topActions">
            <span className="syncPill"><Cloud size={15} /> {syncStatus}</span>
            <select value={projectFilter} onChange={e => {
              setProjectFilter(e.target.value);
              if (e.target.value === 'all') setActive('dashboard');
              else openWorkspace(e.target.value);
            }}>
              <option value="all">Todos os projetos</option>
              {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label>Cotação</label>
            <input type="number" step="0.01" value={state.fx} onChange={e=>updateState(s=>{s.fx=Number(e.target.value||0)})} />
            <button onClick={exportBackup}><Download size={16}/> Backup</button>
            <label className="uploadBtn"><Upload size={16}/> Importar<input type="file" accept=".json" onChange={importBackup}/></label>
            <button className="danger" onClick={()=>signOut(auth)}><LogOut size={16}/> Sair</button>
          </div>
        </header>

        <MissionStrip metrics={metrics} />

        {active === 'dashboard' && <Dashboard state={state} metrics={metrics} />}
        {active === 'workspace' && <ProjectWorkspace state={state} projectId={currentWorkspaceProject} />}
        {active === 'projects' && <Projects state={state} updateState={updateState} openWorkspace={openWorkspace} />}
        {active === 'operations' && <Operations state={state} updateState={updateState} />}
        {active === 'finance' && <Finance state={state} metrics={metrics} updateState={updateState} />}
        {active === 'analytics' && <Analytics metrics={metrics} />}
        {active === 'panorama' && <Placeholder icon={<Globe2 />} title="Panorama" text="Aqui entraremos com DXY, Big Techs, Treasuries, VIX, calendário econômico e checklist pré-mercado." />}
        {active === 'studies' && <Placeholder icon={<BookOpen />} title="Centro de Estudos" text="Livros, cursos, checklists, anotações e evolução de estudo." />}
        {active === 'ai' && <Placeholder icon={<BrainCircuit />} title="Assistente de IA" text="No futuro, analisará seus dados e apontará padrões de execução, emocional, setup e risco." />}
        {active === 'settings' && <SettingsPanel state={state} user={user} syncStatus={syncStatus} />}
      </main>
    </div>
  );
}

function MissionStrip({ metrics }) {
  return (
    <section className="missionStrip">
      <div>
        <span>Missão atual</span>
        <strong>Apex 20 PAs</strong>
      </div>
      <div className="stripProgress">
        <div className="progress"><div style={{width: `${Math.min(metrics.apexActivePas/20*100,100)}%`}} /></div>
        <small>{metrics.apexActivePas} / 20 PAs</small>
      </div>
      <div>
        <span>Próxima meta</span>
        <strong>{metrics.apexActivePas < 1 ? 'Conquistar PA01' : `Conquistar PA${String(metrics.apexActivePas+1).padStart(2,'0')}`}</strong>
      </div>
      <div>
        <span>Objetivo saque</span>
        <strong>$1.500</strong>
      </div>
    </section>
  );
}

function Dashboard({ state, metrics }) {
  return (
    <div className="stack">
      <section className="hero">
        <div>
          <span className="eyebrow">Trading Career Operating System</span>
          <h1>{greeting()}, André.</h1>
          <p>Visão geral dos projetos, contas, patrimônio, operações, disciplina e evolução.</p>
        </div>
        <div className="missionCard">
          <span>Projeto Apex 20 PAs</span>
          <strong>{metrics.apexActivePas} / 20</strong>
          <div className="progress"><div style={{width: `${Math.min(metrics.apexActivePas/20*100,100)}%`}} /></div>
          <small>{Math.round(metrics.apexActivePas/20*100)}% concluído</small>
        </div>
      </section>

      <div className="kpis">
        <Kpi label="Patrimônio líquido" value={money(metrics.netWorth)} sub={brl(metrics.netWorth * state.fx)} />
        <Kpi label="Capital construído" value={money(metrics.builtCapital)} sub={brl(metrics.builtCapital * state.fx)} />
        <Kpi label="Total sacado" value={money(metrics.withdrawals)} sub="Saques registrados" />
        <Kpi label="PAs ativas" value={metrics.activePas.length} sub="Todas as mesas" />
        <Kpi label="Execução média" value={metrics.avgExec.toFixed(1)} sub="Nota 0–10" />
        <Kpi label="Emocional médio" value={metrics.avgEmotion.toFixed(1)} sub="Nota 0–10" />
      </div>

      <div className="grid two">
        <Panel title="Patrimônio por conta" subtitle="Sem somar valor nominal">
          <BarGraph data={metrics.paStats.filter(a=>a.status==='Ativa')} labelKey="name" valueKey="net" />
        </Panel>
        <Panel title="Painel de Prioridades" subtitle="Onde focar primeiro hoje">
          <PriorityList state={state} metrics={metrics} />
        </Panel>
      </div>

      <div className="grid two">
        <Panel title="Saúde das contas" subtitle="Monitor de risco">
          <HealthList accounts={metrics.paStats.filter(a=>a.status==='Ativa')} />
        </Panel>
        <Panel title="Patrimônio por projeto" subtitle="Apex, Mide, TradeDay, Earn2Trade...">
          <BarGraph data={metrics.projectStats} labelKey="name" valueKey="net" />
        </Panel>
      </div>

      <div className="grid two">
        <Panel title="Projetos ativos" subtitle="Visão por módulo">
          <div className="projectCards">
            {state.projects.map(p => (
              <div className="projectMini" key={p.id}>
                <div>
                  <strong>{projectIcon(p.id)} {p.name}</strong>
                  <small>{p.type} • {p.status}</small>
                </div>
                <span>{p.goal}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Garagem Apex 20 PAs" subtitle="Missão específica">
          <Garage count={metrics.apexActivePas} />
        </Panel>
      </div>
    </div>
  );
}

function ProjectWorkspace({ state, projectId }) {
  const p = state.projects.find(x => x.id === projectId);
  const metrics = computeMetrics(state, projectId);
  if (!p) return <Placeholder title="Projeto não encontrado" text="Selecione outro projeto." />;

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <span className="eyebrow">Workspace do Projeto</span>
          <h1>{projectIcon(p.id)} {p.name}</h1>
          <p>{p.description}</p>
        </div>
        <div className="missionCard">
          <span>Status</span>
          <strong>{p.status}</strong>
          <small>{p.goal}</small>
        </div>
      </section>

      <div className="kpis">
        <Kpi label="Patrimônio Projeto" value={money(metrics.netWorth)} sub={brl(metrics.netWorth * state.fx)} />
        <Kpi label="Capital Construído" value={money(metrics.builtCapital)} sub={brl(metrics.builtCapital * state.fx)} />
        <Kpi label="Contas Ativas" value={metrics.activePas.length} sub="Financiadas/PAs" />
        <Kpi label="Avaliações" value={metrics.evals.length} sub="Histórico do projeto" />
        <Kpi label="Operações" value={metrics.totalOps} sub="Lançamentos" />
        <Kpi label="Execução Média" value={metrics.avgExec.toFixed(1)} sub="Nota 0–10" />
      </div>

      <div className="grid two">
        <Panel title="Contas do projeto" subtitle="Patrimônio líquido">
          <BarGraph data={metrics.paStats} labelKey="name" valueKey="net" />
        </Panel>
        <Panel title="Prioridades do projeto" subtitle="Onde focar primeiro">
          <PriorityList state={state} metrics={metrics} />
        </Panel>
      </div>

      <div className="grid two">
        <Panel title="Contas cadastradas" subtitle="Somente deste projeto">
          <DataTable headers={['Conta','Mesa','Status','Patrimônio','Saques']} rows={metrics.paStats.map(a=>[a.name,a.broker,a.status,money(a.net),money(a.withdrawals)])} />
        </Panel>
        <Panel title="Avaliações" subtitle="Somente deste projeto">
          <DataTable headers={['Avaliação','Mesa','Status','Custo','Meta']} rows={metrics.evals.map(e=>[e.name,e.broker,e.status,money(e.cost),money(e.target)])} />
        </Panel>
      </div>

      <Panel title="Operações recentes" subtitle="Somente deste projeto">
        <DataTable
          headers={['Data','Tipo','Conta','Resultado','Trades','Setup']}
          rows={metrics.operations.map(o=>[o.date,o.accountType,accountName(state,o.accountId),money(o.result),o.trades,o.setup||'-'])}
        />
      </Panel>
    </div>
  );
}

function PriorityList({ state, metrics }) {
  const items = [];
  metrics.paStats.forEach(a => {
    if (a.status !== 'Ativa') return;
    if (a.net < 500) items.push({ title:a.name, sub:`${projectName(state,a.projectId)} • patrimônio baixo`, tag:'Risco', score:100 });
    else if (a.net < 1500) items.push({ title:a.name, sub:`${projectName(state,a.projectId)} • construir colchão`, tag:'Atenção', score:80 });
    else items.push({ title:a.name, sub:`${projectName(state,a.projectId)} • saudável`, tag:'Monitorar', score:20 });
  });
  metrics.evals.filter(e=>e.status==='Em andamento').forEach(e => {
    const ops = state.operations.filter(o=>o.accountId===e.id && o.accountType==='Avaliação');
    const result = ops.reduce((s,o)=>s+Number(o.result||0),0);
    const pct = e.target ? result/e.target : 0;
    items.push({ title:e.name, sub:`${projectName(state,e.projectId)} • avaliação ${Math.round(pct*100)}%`, tag:pct>=.7?'Perto da meta':'Avaliação', score:pct>=.7?90:60 });
  });
  if (!items.length) items.push({ title:'Sem prioridade crítica', sub:'Cadastre contas, avaliações ou operações para gerar prioridades.', tag:'OK', score:0 });
  items.sort((a,b)=>b.score-a.score);

  return (
    <div className="priorityList">
      {items.slice(0,5).map((it,i)=>(
        <div className="priorityItem" key={i}>
          <div className="priorityRank">{i+1}</div>
          <div><strong>{it.title}</strong><small>{it.sub}</small></div>
          <div className="priorityTag">{it.tag}</div>
        </div>
      ))}
    </div>
  );
}

function Projects({ state, updateState, openWorkspace }) {
  const [form, setForm] = useState({ name:'', type:'Prop Firm', status:'Ativo', goal:'', targetPas:0, description:'' });

  function addProject() {
    if (!form.name) return alert('Informe o nome do projeto.');
    updateState(s => {
      s.projects.push({ ...form, id:uid('project'), targetPas:Number(form.targetPas||0) });
    });
    setForm({ name:'', type:'Prop Firm', status:'Ativo', goal:'', targetPas:0, description:'' });
  }

  return (
    <div className="stack">
      <Panel title="Novo projeto" subtitle="Ex.: Apex 20 PAs, Mide, Earn2Trade, Capital Próprio">
        <div className="form">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Prop Firm</option><option>Conta Própria</option><option>Investimento</option><option>Estudos</option></select>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Ativo</option><option>Planejado</option><option>Pausado</option><option>Encerrado</option></select>
          <input placeholder="Meta" value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})} />
          <input type="number" placeholder="Meta PAs" value={form.targetPas} onChange={e=>setForm({...form,targetPas:e.target.value})} />
          <input placeholder="Descrição" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <button onClick={addProject}><Plus size={16}/> Criar projeto</button>
        </div>
      </Panel>

      <Panel title="Projetos" subtitle="Módulos da sua carreira">
        <div className="projectGrid">
          {state.projects.map(p=>(
            <button className="projectCard clickable" key={p.id} onClick={()=>openWorkspace(p.id)}>
              <div><span className="badge">{p.type}</span><h3>{projectIcon(p.id)} {p.name}</h3><p>{p.description}</p></div>
              <div className="projectFooter"><span>{p.status}</span><strong>{p.goal}</strong></div>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Operations({ state, updateState }) {
  const emptyForm = {
    date:new Date().toISOString().slice(0,10),
    accountType:'PA',
    accountId:'',
    result:'',
    withdrawal:0,
    trades:'',
    contracts:'',
    executionScore:'',
    emotionalScore:'',
    readingScore:'',
    setup:'',
    window:'',
    notes:''
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const accounts = form.accountType === 'PA' ? state.accounts : state.evaluations;

  useEffect(() => {
    if (!form.accountId && accounts[0]) setForm(f=>({...f, accountId:accounts[0].id}));
  }, [form.accountType, accounts.length]);

  function clearForm() {
    setEditingId(null);
    setForm({ ...emptyForm, accountId: accounts[0]?.id || '' });
  }

  function saveOperation() {
    if (!form.accountId) return alert('Cadastre uma conta ou avaliação primeiro.');
    const payload = {
      ...form,
      id: editingId || uid('op'),
      result:Number(form.result||0),
      withdrawal:form.accountType==='PA' ? Number(form.withdrawal||0) : 0,
      trades:Number(form.trades||0),
      contracts:Number(form.contracts||0),
      executionScore:Number(form.executionScore||0),
      emotionalScore:Number(form.emotionalScore||0),
      readingScore:Number(form.readingScore||0)
    };

    updateState(s => {
      if (editingId) {
        const idx = s.operations.findIndex(o => o.id === editingId);
        if (idx >= 0) s.operations[idx] = payload;
      } else {
        s.operations.push(payload);
      }
    });
    clearForm();
  }

  function editOperation(op) {
    setEditingId(op.id);
    setForm({
      date:op.date || new Date().toISOString().slice(0,10),
      accountType:op.accountType || 'PA',
      accountId:op.accountId || '',
      result:op.result ?? '',
      withdrawal:op.withdrawal ?? 0,
      trades:op.trades ?? '',
      contracts:op.contracts ?? '',
      executionScore:op.executionScore ?? '',
      emotionalScore:op.emotionalScore ?? '',
      readingScore:op.readingScore ?? '',
      setup:op.setup || '',
      window:op.window || '',
      notes:op.notes || ''
    });
  }

  function deleteOperation(id) {
    if (!confirm('Excluir esta operação?')) return;
    updateState(s => {
      s.operations = s.operations.filter(o => o.id !== id);
    });
  }

  return (
    <div className="stack">
      <Panel title={editingId ? 'Editar operação' : 'Central de Operações'} subtitle="Lance operações de avaliações, PAs e capital próprio">
        <div className="form ops">
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <select value={form.accountType} onChange={e=>setForm({...form,accountType:e.target.value,accountId:''})}><option value="PA">PA / Financiada</option><option value="Avaliação">Avaliação</option></select>
          <select value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})}><option value="">Selecione</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <input type="number" placeholder="Resultado USD" value={form.result} onChange={e=>setForm({...form,result:e.target.value})}/>
          <input type="number" placeholder="Saque USD" value={form.withdrawal} onChange={e=>setForm({...form,withdrawal:e.target.value})}/>
          <input type="number" placeholder="Qtd. trades" value={form.trades} onChange={e=>setForm({...form,trades:e.target.value})}/>
          <input type="number" placeholder="Contratos" value={form.contracts} onChange={e=>setForm({...form,contracts:e.target.value})}/>
          <input type="number" placeholder="Execução 0–10" value={form.executionScore} onChange={e=>setForm({...form,executionScore:e.target.value})}/>
          <input type="number" placeholder="Emocional 0–10" value={form.emotionalScore} onChange={e=>setForm({...form,emotionalScore:e.target.value})}/>
          <input type="number" placeholder="Leitura 0–10" value={form.readingScore} onChange={e=>setForm({...form,readingScore:e.target.value})}/>
          <input placeholder="Setup" value={form.setup} onChange={e=>setForm({...form,setup:e.target.value})}/>
          <input placeholder="Janela/Horário" value={form.window} onChange={e=>setForm({...form,window:e.target.value})}/>
          <input placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          <button onClick={saveOperation}><Save size={16}/> {editingId ? 'Atualizar' : 'Salvar'}</button>
          {editingId && <button className="secondary" onClick={clearForm}>Cancelar</button>}
        </div>
      </Panel>

      <Panel title="Histórico de operações" subtitle="Últimos lançamentos">
        <DataTable
          headers={['Data','Tipo','Conta','Resultado','Trades','Exec.','Emoc.','Setup','Ações']}
          rows={state.operations.map(o=>[
            o.date,
            o.accountType,
            accountName(state,o.accountId),
            money(o.result),
            o.trades,
            o.executionScore,
            o.emotionalScore,
            o.setup||'-',
            <RowActions onEdit={()=>editOperation(o)} onDelete={()=>deleteOperation(o.id)} />
          ])}
        />
      </Panel>
    </div>
  );
}

function Finance({ state, metrics, updateState }) {
  const emptyAccount = { projectId:state.projects[0]?.id || '', broker:'Apex', name:'', type:'PA', status:'Ativa', nominalBalance:50000, manualResult:0, safetyBuffer:0 };
  const emptyEval = { projectId:state.projects[0]?.id || '', broker:'Apex', name:'', status:'Em andamento', cost:'', target:3000 };

  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [evalForm, setEvalForm] = useState(emptyEval);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingEvalId, setEditingEvalId] = useState(null);

  function clearAccountForm() {
    setEditingAccountId(null);
    setAccountForm(emptyAccount);
  }

  function clearEvalForm() {
    setEditingEvalId(null);
    setEvalForm(emptyEval);
  }

  function saveAccount() {
    if (!accountForm.name) return alert('Informe o nome da conta.');
    const payload = {
      ...accountForm,
      id: editingAccountId || uid('account'),
      createdAt: accountForm.createdAt || new Date().toISOString().slice(0,10),
      nominalBalance:Number(accountForm.nominalBalance||0),
      manualResult:Number(accountForm.manualResult||0),
      safetyBuffer:Number(accountForm.safetyBuffer||0)
    };

    updateState(s => {
      if (editingAccountId) {
        const idx = s.accounts.findIndex(a => a.id === editingAccountId);
        if (idx >= 0) s.accounts[idx] = payload;
      } else {
        s.accounts.push(payload);
      }
    });
    clearAccountForm();
  }

  function saveEvaluation() {
    if (!evalForm.name) return alert('Informe o nome da avaliação.');
    const payload = {
      ...evalForm,
      id: editingEvalId || uid('eval'),
      createdAt: evalForm.createdAt || new Date().toISOString().slice(0,10),
      cost:Number(evalForm.cost||0),
      target:Number(evalForm.target||0)
    };

    updateState(s => {
      if (editingEvalId) {
        const idx = s.evaluations.findIndex(e => e.id === editingEvalId);
        if (idx >= 0) s.evaluations[idx] = payload;
      } else {
        s.evaluations.push(payload);
      }
    });
    clearEvalForm();
  }

  function editAccount(acc) {
    setEditingAccountId(acc.id);
    setAccountForm({ ...acc });
  }

  function deleteAccount(id) {
    if (!confirm('Excluir esta conta? As operações ligadas a ela também serão removidas.')) return;
    updateState(s => {
      s.accounts = s.accounts.filter(a => a.id !== id);
      s.operations = s.operations.filter(o => o.accountId !== id);
    });
  }

  function editEvaluation(ev) {
    setEditingEvalId(ev.id);
    setEvalForm({ ...ev });
  }

  function deleteEvaluation(id) {
    if (!confirm('Excluir esta avaliação? As operações ligadas a ela também serão removidas.')) return;
    updateState(s => {
      s.evaluations = s.evaluations.filter(e => e.id !== id);
      s.operations = s.operations.filter(o => o.accountId !== id);
    });
  }

  return (
    <div className="stack">
      <div className="grid two">
        <Panel title={editingAccountId ? 'Editar PA / Conta' : 'Cadastrar PA / Conta'} subtitle="Contas financiadas ou capital próprio">
          <div className="form single">
            <select value={accountForm.projectId} onChange={e=>setAccountForm({...accountForm,projectId:e.target.value})}>{state.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input placeholder="Mesa/Corretora" value={accountForm.broker} onChange={e=>setAccountForm({...accountForm,broker:e.target.value})}/>
            <input placeholder="Nome da conta" value={accountForm.name} onChange={e=>setAccountForm({...accountForm,name:e.target.value})}/>
            <select value={accountForm.type} onChange={e=>setAccountForm({...accountForm,type:e.target.value})}><option>PA</option><option>Financiada</option><option>Capital Próprio</option></select>
            <select value={accountForm.status} onChange={e=>setAccountForm({...accountForm,status:e.target.value})}><option>Ativa</option><option>Pausada</option><option>Perdida</option><option>Encerrada</option></select>
            <input type="number" placeholder="Saldo nominal" value={accountForm.nominalBalance} onChange={e=>setAccountForm({...accountForm,nominalBalance:e.target.value})}/>
            <input type="number" placeholder="Resultado manual" value={accountForm.manualResult} onChange={e=>setAccountForm({...accountForm,manualResult:e.target.value})}/>
            <input type="number" placeholder="Colchão/risco" value={accountForm.safetyBuffer} onChange={e=>setAccountForm({...accountForm,safetyBuffer:e.target.value})}/>
            <button onClick={saveAccount}><Plus size={16}/> {editingAccountId ? 'Atualizar conta' : 'Adicionar conta'}</button>
            {editingAccountId && <button className="secondary" onClick={clearAccountForm}>Cancelar</button>}
          </div>
        </Panel>

        <Panel title={editingEvalId ? 'Editar avaliação' : 'Cadastrar avaliação'} subtitle="Histórico de contas em teste">
          <div className="form single">
            <select value={evalForm.projectId} onChange={e=>setEvalForm({...evalForm,projectId:e.target.value})}>{state.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input placeholder="Mesa" value={evalForm.broker} onChange={e=>setEvalForm({...evalForm,broker:e.target.value})}/>
            <input placeholder="Nome da avaliação" value={evalForm.name} onChange={e=>setEvalForm({...evalForm,name:e.target.value})}/>
            <input type="number" placeholder="Valor pago" value={evalForm.cost} onChange={e=>setEvalForm({...evalForm,cost:e.target.value})}/>
            <input type="number" placeholder="Meta" value={evalForm.target} onChange={e=>setEvalForm({...evalForm,target:e.target.value})}/>
            <select value={evalForm.status} onChange={e=>setEvalForm({...evalForm,status:e.target.value})}><option>Em andamento</option><option>Aprovada</option><option>Reprovada</option><option>Pausada</option></select>
            <button onClick={saveEvaluation}><Plus size={16}/> {editingEvalId ? 'Atualizar avaliação' : 'Adicionar avaliação'}</button>
            {editingEvalId && <button className="secondary" onClick={clearEvalForm}>Cancelar</button>}
          </div>
        </Panel>
      </div>

      <Panel title="Contas cadastradas" subtitle="Patrimônio líquido sem valor nominal">
        <DataTable
          headers={['Projeto','Conta','Mesa','Status','Manual','Operações','Saques','Patrimônio','Ações']}
          rows={metrics.paStats.map(a=>[
            projectName(state,a.projectId),
            a.name,
            a.broker,
            a.status,
            money(a.manualResult),
            money(a.opResult),
            money(a.withdrawals),
            money(a.net),
            <RowActions onEdit={()=>editAccount(a)} onDelete={()=>deleteAccount(a.id)} />
          ])}
        />
      </Panel>

      <Panel title="Avaliações cadastradas" subtitle="Histórico separado">
        <DataTable
          headers={['Projeto','Avaliação','Mesa','Status','Custo','Meta','Ações']}
          rows={state.evaluations.map(e=>[
            projectName(state,e.projectId),
            e.name,
            e.broker,
            e.status,
            money(e.cost),
            money(e.target),
            <RowActions onEdit={()=>editEvaluation(e)} onDelete={()=>deleteEvaluation(e.id)} />
          ])}
        />
      </Panel>
    </div>
  );
}

function Analytics({ metrics }) {
  const bySetup = Object.values(metrics.operations.reduce((acc, op) => {
    const key = op.setup || 'Sem setup';
    acc[key] = acc[key] || { setup:key, result:0 };
    acc[key].result += Number(op.result || 0);
    return acc;
  }, {}));

  return (
    <div className="stack">
      <div className="kpis">
        <Kpi label="Operações" value={metrics.totalOps} sub="Lançamentos" />
        <Kpi label="Trades totais" value={metrics.totalTrades} sub="Quantidade" />
        <Kpi label="Execução" value={metrics.avgExec.toFixed(1)} sub="Média" />
        <Kpi label="Emocional" value={metrics.avgEmotion.toFixed(1)} sub="Média" />
        <Kpi label="Leitura" value={metrics.avgReading.toFixed(1)} sub="Média" />
        <Kpi label="Aprovação" value={`${Math.round(metrics.approvalRate*100)}%`} sub="Avaliações" />
      </div>
      <Panel title="Resultado por setup" subtitle="Começo do módulo de inteligência">
        <BarGraph data={bySetup} labelKey="setup" valueKey="result" />
      </Panel>
    </div>
  );
}

function SettingsPanel({ state, user, syncStatus }) {
  return (
    <div className="stack">
      <Panel title="Configurações da nuvem" subtitle="Firebase ativo">
        <div className="settingsGrid">
          <div><strong>Usuário</strong><small>{user?.email}</small></div>
          <div><strong>Status</strong><small>{syncStatus}</small></div>
          <div><strong>Última atualização</strong><small>{state.updatedAt || '-'}</small></div>
          <div><strong>Projeto Firebase</strong><small>almeida-capital-pro</small></div>
        </div>
      </Panel>
      <Panel title="Próximas integrações" subtitle="Roadmap">
        <p className="muted">Próximos módulos: Storage para prints, PWA instalável no iPad, timeline da carreira, saques detalhados e importação da planilha.</p>
      </Panel>
    </div>
  );
}

function HealthList({ accounts }) {
  return (
    <div className="healthList">
      {accounts.map(a=>(
        <div className="healthItem" key={a.id}>
          <span className={a.health === 'Saudável' ? 'dot green' : a.health === 'Atenção' ? 'dot yellow' : 'dot red'} />
          <div><strong>{a.name}</strong><small>{a.health} • {a.broker}</small></div>
          <b>{money(a.net)}</b>
        </div>
      ))}
      {!accounts.length && <Empty text="Nenhuma conta cadastrada." />}
    </div>
  );
}

function Garage({ count }) {
  return (
    <div className="garage">
      {Array.from({length:20}).map((_,i)=>(
        <div className={i < count ? 'slot active' : 'slot'} key={i}>
          {i < count ? '🟢' : '⚪'} PA{String(i+1).padStart(2,'0')}
        </div>
      ))}
    </div>
  );
}

function BarGraph({ data, labelKey, valueKey }) {
  return (
    <div className="chartBox">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={data} margin={{ left: 26 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f3357" />
          <XAxis type="number" stroke="#8da0c0" />
          <YAxis type="category" dataKey={labelKey} width={140} stroke="#8da0c0" />
          <Tooltip />
          <Bar dataKey={valueKey} fill="#2f80ed" radius={[0,8,8,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="tableWrap">
      <table>
        <thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row,i)=><tr key={i}>{row.map((c,j)=><td key={j}>{c}</td>)}</tr>)}
          {!rows.length && <tr><td colSpan={headers.length}><Empty text="Nenhum registro ainda." /></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="rowActions">
      <button className="iconBtn editBtn" onClick={onEdit} title="Editar"><Edit3 size={15}/></button>
      <button className="iconBtn deleteBtn" onClick={onDelete} title="Excluir"><Trash2 size={15}/></button>
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return <div className="kpi"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>;
}

function Panel({ title, subtitle, children }) {
  return <section className="panel"><div className="panelHeader"><div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</section>;
}

function Placeholder({ icon, title, text }) {
  return <Panel title={title} subtitle="Módulo em construção"><div className="placeholder">{icon}<h3>{title}</h3><p>{text}</p></div></Panel>;
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
function projectIcon(id) {
  if (id === 'apex20') return '🔥';
  if (id === 'mide') return '💙';
  if (id === 'tradeday') return '🟠';
  if (id === 'earn2trade') return '🟢';
  if (id === 'capital-proprio') return '📈';
  return '🎯';
}
function projectName(state, id) {
  return state.projects.find(p=>p.id===id)?.name || '-';
}
function accountName(state, id) {
  return [...state.accounts, ...state.evaluations].find(a=>a.id===id)?.name || '-';
}
function pageTitle(active) {
  const map = { dashboard:'Dashboard', workspace:'Workspace do Projeto', projects:'Projetos', operations:'Operações', finance:'Financeiro', analytics:'Analytics', panorama:'Panorama', studies:'Estudos', ai:'IA', settings:'Configurações' };
  return map[active] || 'Dashboard';
}
function pageSubtitle(active) {
  const map = { dashboard:'Visão geral da sua carreira como trader.', workspace:'Dados filtrados do projeto selecionado.', projects:'Cada projeto é um módulo independente dentro da carreira.', operations:'Central única para registrar operações e comportamento.', finance:'Contas, avaliações, patrimônio, saques e capital construído.', analytics:'Métricas para transformar dados em evolução.', panorama:'Ambiente futuro de leitura de mercado.', studies:'Seu centro de estudos, cursos e livros.', ai:'Mentoria futura baseada nos seus próprios dados.', settings:'Ajustes, backup e sincronização.' };
  return map[active] || '';
}

createRoot(document.getElementById('root')).render(<App />);
