import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  CheckCircle, XCircle, AlertCircle, Clock, Bug, LayoutDashboard,
  List, FileText, Plus, X, Search, Printer, ChevronDown, ChevronUp,
  RefreshCw, AlertTriangle, Layers, Edit2, Trash2
} from "lucide-react";

// ── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  bg: "#070d1a",
  card: "#0d1526",
  cardHover: "#111d33",
  border: "#1a2540",
  borderLight: "#243050",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  passed: "#22c55e",
  passedBg: "#052e16",
  failed: "#ef4444",
  failedBg: "#2a0a0a",
  blocked: "#f59e0b",
  blockedBg: "#2a1800",
  pending: "#475569",
  pendingBg: "#0f172a",
  blue: "#3b82f6",
  blueBg: "#0c1a3a",
  purple: "#a855f7",
  purpleBg: "#1a0a2a",
  critical: "#ef4444",
  high: "#f97316",
  medium: "#3b82f6",
  low: "#64748b",
};

// ── INITIAL DATA ───────────────────────────────────────────────────────────
const INITIAL_CASES = [
  // CLIENTE
  { id:"CL-01", module:"Cliente", title:"Cadastrar novo cliente com todos campos obrigatórios", tipo:"Funcional", prioridade:"Crítico", obs:"Nome, CPF/CNPJ, e-mail, telefone", status:"pending" },
  { id:"CL-02", module:"Cliente", title:"Impedir cadastro com CPF/CNPJ já existente", tipo:"Funcional", prioridade:"Crítico", obs:"CPF/CNPJ duplicado", status:"pending" },
  { id:"CL-03", module:"Cliente", title:"Validar formato do campo e-mail antes de salvar", tipo:"Funcional", prioridade:"Alto", obs:"Ex: sem @, sem domínio", status:"pending" },
  { id:"CL-04", module:"Cliente", title:"Editar dados de cliente já cadastrado", tipo:"Funcional", prioridade:"Alto", obs:"Telefone, endereço", status:"pending" },
  { id:"CL-05", module:"Cliente", title:"Visualizar histórico de consultas do cliente", tipo:"Funcional", prioridade:"Alto", obs:"Listagem com data, médico, status", status:"pending" },
  { id:"CL-06", module:"Cliente", title:"Inativar cliente sem excluí-lo do sistema", tipo:"Funcional", prioridade:"Médio", obs:"Status: Ativo / Inativo", status:"pending" },
  { id:"CL-07", module:"Cliente", title:"Busca por nome, CPF e e-mail", tipo:"Funcional", prioridade:"Alto", obs:"Busca parcial e completa", status:"pending" },
  { id:"CL-08", module:"Cliente", title:"Restringir acesso a dados sem autenticação", tipo:"Segurança", prioridade:"Crítico", obs:"Redirecionar sem login", status:"pending" },
  { id:"CL-09", module:"Cliente", title:"Exibir mensagem de erro em campos obrigatórios vazios", tipo:"Funcional", prioridade:"Médio", obs:"Mensagem inline no campo", status:"pending" },
  { id:"CL-10", module:"Cliente", title:"Registrar data/hora de criação e atualização", tipo:"Funcional", prioridade:"Médio", obs:"Metadados de auditoria", status:"pending" },
  // ADMIN
  { id:"AD-01", module:"Administrador", title:"Login com e-mail e senha válidos", tipo:"Segurança", prioridade:"Crítico", obs:"Credenciais válidas e inválidas", status:"pending" },
  { id:"AD-02", module:"Administrador", title:"Bloquear conta após 3 tentativas inválidas", tipo:"Segurança", prioridade:"Crítico", obs:"Bloqueio de 15 min", status:"pending" },
  { id:"AD-03", module:"Administrador", title:"Visualizar todos os módulos no dashboard", tipo:"Funcional", prioridade:"Crítico", obs:"Dashboard completo", status:"pending" },
  { id:"AD-04", module:"Administrador", title:"Criar e gerenciar outros usuários", tipo:"Funcional", prioridade:"Alto", obs:"Perfis: Admin, Atendente, Médico", status:"pending" },
  { id:"AD-05", module:"Administrador", title:"Configurar parâmetros gerais do sistema", tipo:"Funcional", prioridade:"Alto", obs:"Horários, especialidades", status:"pending" },
  { id:"AD-06", module:"Administrador", title:"Visualizar relatórios e indicadores", tipo:"Funcional", prioridade:"Alto", obs:"Consultas, faltas, receita", status:"pending" },
  { id:"AD-07", module:"Administrador", title:"Exportar relatórios em PDF ou Excel", tipo:"Funcional", prioridade:"Médio", obs:"Pelo menos um formato", status:"pending" },
  { id:"AD-08", module:"Administrador", title:"Visualizar logs de ações dos usuários", tipo:"Segurança", prioridade:"Médio", obs:"Quem fez, o quê, quando", status:"pending" },
  { id:"AD-09", module:"Administrador", title:"Gerenciar agendamentos de todos os médicos", tipo:"Funcional", prioridade:"Crítico", obs:"Ver, criar, cancelar consultas", status:"pending" },
  { id:"AD-10", module:"Administrador", title:"Preservar registros ao deletar usuário", tipo:"Funcional", prioridade:"Alto", obs:"Histórico do paciente intacto", status:"pending" },
  { id:"AD-11", module:"Administrador", title:"Sessão expirar após inatividade", tipo:"Segurança", prioridade:"Médio", obs:"Padrão: 30 min", status:"pending" },
  // PORTAL
  { id:"PP-01", module:"Portal do Paciente", title:"Paciente acessa portal com suas credenciais", tipo:"Segurança", prioridade:"Crítico", obs:"CPF + data nasc. ou senha", status:"pending" },
  { id:"PP-02", module:"Portal do Paciente", title:"Visualizar próximos agendamentos", tipo:"Funcional", prioridade:"Crítico", obs:"Data, hora, médico, especialidade", status:"pending" },
  { id:"PP-03", module:"Portal do Paciente", title:"Cancelar consulta com antecedência mínima", tipo:"Funcional", prioridade:"Alto", obs:"Ex: 24h de antecedência", status:"pending" },
  { id:"PP-04", module:"Portal do Paciente", title:"Visualizar histórico de consultas anteriores", tipo:"Funcional", prioridade:"Alto", obs:"Últimas X consultas", status:"pending" },
  { id:"PP-05", module:"Portal do Paciente", title:"Exibir orientações pré-consulta", tipo:"Funcional", prioridade:"Médio", obs:"Texto configurável por consulta", status:"pending" },
  { id:"PP-06", module:"Portal do Paciente", title:"Atualizar dados de contato no portal", tipo:"Funcional", prioridade:"Médio", obs:"Telefone, endereço, e-mail", status:"pending" },
  { id:"PP-07", module:"Portal do Paciente", title:"Portal responsivo em dispositivos móveis", tipo:"Interface", prioridade:"Alto", obs:"Mobile-first ou responsivo", status:"pending" },
  { id:"PP-08", module:"Portal do Paciente", title:"Dados sensíveis não expostos na URL", tipo:"Segurança", prioridade:"Crítico", obs:"Nenhum dado em query string", status:"pending" },
  { id:"PP-09", module:"Portal do Paciente", title:"Confirmação por e-mail/SMS ao cancelar ou agendar", tipo:"Funcional", prioridade:"Médio", obs:"Ao menos um canal", status:"pending" },
  { id:"PP-10", module:"Portal do Paciente", title:"Acesso exclusivo ao próprio cadastro", tipo:"Segurança", prioridade:"Crítico", obs:"Não ver dados de terceiros", status:"pending" },
  // IA - Risco de Falta
  { id:"IA-RF-01", module:"IA — Risco de Falta", title:"Calcular e exibir risco de falta antes da consulta", tipo:"IA", prioridade:"Crítico", obs:"Exibir: Baixo / Médio / Alto", status:"pending" },
  { id:"IA-RF-02", module:"IA — Risco de Falta", title:"Considerar histórico de faltas no cálculo", tipo:"IA", prioridade:"Crítico", obs:"Mínimo de X registros", status:"pending" },
  { id:"IA-RF-03", module:"IA — Risco de Falta", title:"Exibir mensagem para pacientes sem histórico", tipo:"IA", prioridade:"Alto", obs:"Não exibir risco default", status:"pending" },
  { id:"IA-RF-04", module:"IA — Risco de Falta", title:"Exibir data/hora de quando o risco foi gerado", tipo:"IA", prioridade:"Médio", obs:"Transparência da previsão", status:"pending" },
  { id:"IA-RF-05", module:"IA — Risco de Falta", title:"Registrar se previsão foi acertada ou não", tipo:"IA", prioridade:"Baixo", obs:"Retroalimentação do modelo", status:"pending" },
  // IA - Resumo
  { id:"IA-RC-01", module:"IA — Resumo", title:"Gerar resumo clínico antes de cada consulta", tipo:"IA", prioridade:"Crítico", obs:"Acionado pelo médico ou automático", status:"pending" },
  { id:"IA-RC-02", module:"IA — Resumo", title:"Incluir histórico de queixas, diagnósticos e medicamentos", tipo:"IA", prioridade:"Crítico", obs:"Dados do próprio sistema", status:"pending" },
  { id:"IA-RC-03", module:"IA — Resumo", title:"Gerar resumo em até X segundos", tipo:"IA", prioridade:"Alto", obs:"Definir SLA aceitável (ex: 10s)", status:"pending" },
  { id:"IA-RC-04", module:"IA — Resumo", title:"Médico pode editar ou descartar o resumo gerado", tipo:"IA", prioridade:"Alto", obs:"Resumo não deve ser read-only", status:"pending" },
  { id:"IA-RC-05", module:"IA — Resumo", title:"Em falha, exibir erro sem travar o sistema", tipo:"IA", prioridade:"Crítico", obs:"Fallback gracioso", status:"pending" },
  // IA - WhatsApp
  { id:"IA-WA-01", module:"IA — WhatsApp", title:"Gerar mensagem WhatsApp a partir do contexto", tipo:"IA", prioridade:"Crítico", obs:"Nome, data, médico, consulta", status:"pending" },
  { id:"IA-WA-02", module:"IA — WhatsApp", title:"Mensagem gerada com variáveis corretas", tipo:"IA", prioridade:"Crítico", obs:"Validar preenchimento das variáveis", status:"pending" },
  { id:"IA-WA-03", module:"IA — WhatsApp", title:"Usuário pode editar a mensagem antes de enviar", tipo:"IA", prioridade:"Alto", obs:"Campo editável", status:"pending" },
  { id:"IA-WA-04", module:"IA — WhatsApp", title:"Exibir pré-visualização antes do envio", tipo:"IA", prioridade:"Médio", obs:"Preview formatado", status:"pending" },
  { id:"IA-WA-05", module:"IA — WhatsApp", title:"Solicitar informações mínimas se contexto vazio", tipo:"IA", prioridade:"Alto", obs:"Validação do input do usuário", status:"pending" },
  { id:"IA-WA-06", module:"IA — WhatsApp", title:"Registrar histórico de mensagens enviadas", tipo:"Funcional", prioridade:"Médio", obs:"Para auditoria e reuso", status:"pending" },
  // CARGA & PERFORMANCE
  { id:"CP-01", module:"Carga & Performance", title:"100 usuários simultâneos no portal do paciente", tipo:"Carga", prioridade:"Crítico", obs:"Tempo de resposta < 2s sob carga", status:"pending" },
  { id:"CP-02", module:"Carga & Performance", title:"50 agendamentos simultâneos sem conflito", tipo:"Carga", prioridade:"Crítico", obs:"Sem duplicidade de horário", status:"pending" },
  { id:"CP-03", module:"Carga & Performance", title:"Login concorrente de 30 admins", tipo:"Carga", prioridade:"Alto", obs:"Sem falha de autenticação", status:"pending" },
  { id:"CP-04", module:"Carga & Performance", title:"Geração de resumo IA com 20 req. simultâneas", tipo:"Carga", prioridade:"Crítico", obs:"SLA: todas < 15s", status:"pending" },
  { id:"CP-05", module:"Carga & Performance", title:"Envio em massa de mensagens WhatsApp", tipo:"Carga", prioridade:"Alto", obs:"Fila sem perda de mensagens", status:"pending" },
  { id:"CP-06", module:"Carga & Performance", title:"Busca de clientes com base de 10.000 registros", tipo:"Carga", prioridade:"Alto", obs:"Resposta < 1s", status:"pending" },
  { id:"CP-07", module:"Carga & Performance", title:"Dashboard admin com dados de 6 meses carregados", tipo:"Carga", prioridade:"Médio", obs:"Sem timeout no carregamento", status:"pending" },
  { id:"CP-08", module:"Carga & Performance", title:"Exportação de relatório PDF com 1.000+ registros", tipo:"Carga", prioridade:"Médio", obs:"Gerado em < 30s", status:"pending" },
  { id:"CP-09", module:"Carga & Performance", title:"Sistema mantém estabilidade em pico de 200 req/min", tipo:"Carga", prioridade:"Crítico", obs:"Taxa de erro < 1%", status:"pending" },
  { id:"CP-10", module:"Carga & Performance", title:"Tempo de recuperação após pico de carga", tipo:"Carga", prioridade:"Alto", obs:"Normalizar em < 60s", status:"pending" },
];

const MODULES_ORDER = ["Cliente","Administrador","Portal do Paciente","IA — Risco de Falta","IA — Resumo","IA — WhatsApp","Carga & Performance"];
const STATUS_CYCLE = ["pending","passed","failed","blocked"];

const STATUS_CFG = {
  pending:  { label:"Pendente",   color: C.pending,  bg: C.pendingBg,  Icon: Clock },
  passed:   { label:"Passou ✓",   color: C.passed,   bg: C.passedBg,   Icon: CheckCircle },
  failed:   { label:"Falhou ✗",   color: C.failed,   bg: C.failedBg,   Icon: XCircle },
  blocked:  { label:"Bloqueado",  color: C.blocked,  bg: C.blockedBg,  Icon: AlertCircle },
};

const PRIO_CFG = {
  "Crítico": { color: C.critical, bg: "#2a0a0a" },
  "Alto":    { color: C.high,     bg: "#2a1200" },
  "Médio":   { color: C.medium,   bg: "#0c1a3a" },
  "Baixo":   { color: C.low,      bg: "#1a1a1a" },
};

const TIPO_CFG = {
  "Funcional": { color:"#22c55e", bg:"#052e16" },
  "Segurança": { color:"#f97316", bg:"#2a1200" },
  "IA":        { color:"#a855f7", bg:"#1a0a2a" },
  "Carga":     { color:"#06b6d4", bg:"#0a2a2a" },
  "Interface": { color:"#3b82f6", bg:"#0c1a3a" },
};

const SEV_CFG = {
  "Crítico": { color: C.critical, bg:"#2a0a0a" },
  "Alto":    { color: C.high,     bg:"#2a1200" },
  "Médio":   { color: C.medium,   bg:"#0c1a3a" },
  "Baixo":   { color: C.low,      bg:"#1a1a1a" },
};

// ── STORAGE ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "qa-dashboard-v1";

async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function saveData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { console.error("Storage error", e); }
}

// ── BADGE ──────────────────────────────────────────────────────────────────
function Badge({ text, color, bg }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}33`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11,
      fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap",
      fontFamily: "monospace"
    }}>{text}</span>
  );
}

// ── STATUS BUTTON ──────────────────────────────────────────────────────────
function StatusBtn({ status, onClick }) {
  const cfg = STATUS_CFG[status];
  return (
    <button onClick={onClick} title="Clique para avançar status" style={{
      display:"flex", alignItems:"center", gap:5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700,
      cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s",
      fontFamily: "monospace"
    }}>
      <cfg.Icon size={13} />
      {cfg.label}
    </button>
  );
}

// ── STAT CARD ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color, Icon, sub }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "20px 24px",
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 8 }}>
        <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 600, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</span>
        <Icon size={18} color={color} />
      </div>
      <div style={{ color, fontSize: 36, fontWeight: 800, lineHeight:1, fontFamily:"monospace" }}>{value}</div>
      {sub && <div style={{ color: C.textMuted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── DASHBOARD VIEW ─────────────────────────────────────────────────────────
function DashboardView({ cases, bugs }) {
  const total = cases.length;
  const passed = cases.filter(c=>c.status==="passed").length;
  const failed = cases.filter(c=>c.status==="failed").length;
  const blocked = cases.filter(c=>c.status==="blocked").length;
  const pending = cases.filter(c=>c.status==="pending").length;
  const executed = passed + failed + blocked;
  const coverage = total > 0 ? Math.round((executed / total) * 100) : 0;
  const openBugs = bugs.filter(b=>b.status==="open").length;

  const chartData = MODULES_ORDER.map(mod => {
    const modCases = cases.filter(c=>c.module===mod);
    const modTotal = modCases.length;
    const modPassed = modCases.filter(c=>c.status==="passed").length;
    const modFailed = modCases.filter(c=>c.status==="failed").length;
    const modBlocked = modCases.filter(c=>c.status==="blocked").length;
    const modPending = modCases.filter(c=>c.status==="pending").length;
    return {
      name: mod.replace("IA — ","IA·").replace("Portal do Paciente","Portal").replace("Administrador","Admin"),
      Passou: modPassed, Falhou: modFailed, Bloqueado: modBlocked, Pendente: modPending, total: modTotal,
    };
  });

  const criticalFailed = cases.filter(c=>c.status==="failed" && c.prioridade==="Crítico");
  const pendingCritical = cases.filter(c=>c.status==="pending" && c.prioridade==="Crítico");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 24 }}>
      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap: 16 }}>
        <StatCard label="Cobertura" value={`${coverage}%`} color={coverage > 70 ? C.passed : coverage > 40 ? C.blocked : C.failed} Icon={Layers} sub={`${executed}/${total} executados`} />
        <StatCard label="Passaram" value={passed} color={C.passed} Icon={CheckCircle} sub={total>0?`${Math.round(passed/total*100)}% do total`:""} />
        <StatCard label="Falharam" value={failed} color={C.failed} Icon={XCircle} sub={total>0?`${Math.round(failed/total*100)}% do total`:""} />
        <StatCard label="Bloqueados" value={blocked} color={C.blocked} Icon={AlertCircle} sub={total>0?`${Math.round(blocked/total*100)}% do total`:""} />
        <StatCard label="Pendentes" value={pending} color={C.pending} Icon={Clock} sub="não executados" />
        <StatCard label="Bugs Abertos" value={openBugs} color={openBugs>0?C.failed:C.passed} Icon={Bug} sub={`${bugs.length} total`} />
      </div>

      {/* Chart */}
      <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
        <h3 style={{ color: C.text, fontSize:14, fontWeight:700, marginBottom:20, letterSpacing:"0.04em" }}>
          COBERTURA POR MÓDULO
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12 }}
              labelStyle={{ color: C.text, fontWeight:700 }}
            />
            <Bar dataKey="Passou" stackId="a" fill={C.passed} radius={[0,0,0,0]} />
            <Bar dataKey="Falhou" stackId="a" fill={C.failed} />
            <Bar dataKey="Bloqueado" stackId="a" fill={C.blocked} />
            <Bar dataKey="Pendente" stackId="a" fill={C.border} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", gap:20, marginTop:12, flexWrap:"wrap" }}>
          {[["Passou",C.passed],["Falhou",C.failed],["Bloqueado",C.blocked],["Pendente",C.border]].map(([k,col])=>(
            <span key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color: C.textDim }}>
              <span style={{ width:12, height:12, borderRadius:2, background:col, display:"inline-block" }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Critical failures */}
        <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <h3 style={{ color: C.failed, fontSize:13, fontWeight:700, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            <XCircle size={14} /> CRÍTICOS COM FALHA ({criticalFailed.length})
          </h3>
          {criticalFailed.length === 0
            ? <p style={{ color: C.textMuted, fontSize:13 }}>Nenhum crítico falhou ainda 🎉</p>
            : criticalFailed.slice(0,5).map(c=>(
              <div key={c.id} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:10, marginBottom:10 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ color: C.textMuted, fontSize:11, fontFamily:"monospace" }}>{c.id}</span>
                  <span style={{ color: C.text, fontSize:12 }}>{c.title}</span>
                </div>
              </div>
            ))
          }
        </div>
        {/* Pending critical */}
        <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <h3 style={{ color: C.blocked, fontSize:13, fontWeight:700, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            <Clock size={14} /> CRÍTICOS PENDENTES ({pendingCritical.length})
          </h3>
          {pendingCritical.length === 0
            ? <p style={{ color: C.textMuted, fontSize:13 }}>Todos os críticos foram executados ✓</p>
            : pendingCritical.slice(0,5).map(c=>(
              <div key={c.id} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:10, marginBottom:10 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ color: C.textMuted, fontSize:11, fontFamily:"monospace" }}>{c.id}</span>
                  <span style={{ color: C.text, fontSize:12 }}>{c.title}</span>
                  <Badge text={c.module.split("—")[0].trim()} color={C.textMuted} bg={C.border} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── GHERKIN DISPLAY ────────────────────────────────────────────────────────
function GherkinDisplay({ text }) {
  if (!text || !text.trim()) {
    return (
      <p style={{ color: C.textMuted, fontSize: 12, fontStyle: "italic", fontFamily: "monospace" }}>
        Cenário Gherkin não definido. Clique em Editar para adicionar.
      </p>
    );
  }
  const getLineStyle = (line) => {
    const t = line.trimStart();
    if (/^(Feature:|Funcionalidade:)/i.test(t)) return { color: "#3b82f6", fontWeight: 700 };
    if (/^(Scenario:|Scenario Outline:|Cenário:|Esquema do Cenário:|Background:|Contexto:)/i.test(t)) return { color: "#a855f7", fontWeight: 700 };
    if (/^(Given |Dado |Dada |Dados )/i.test(t)) return { color: "#22c55e" };
    if (/^(When |Quando )/i.test(t)) return { color: "#f59e0b" };
    if (/^(Then |Então |Entao )/i.test(t)) return { color: "#06b6d4" };
    if (/^(And |E |But |Mas )/i.test(t)) return { color: "#94a3b8" };
    if (/^(Examples:|Exemplos:)/i.test(t)) return { color: "#f97316", fontWeight: 700 };
    if (t.startsWith("|")) return { color: "#e2e8f0" };
    if (t.startsWith("#")) return { color: "#475569", fontStyle: "italic" };
    return { color: "#64748b" };
  };
  return (
    <pre style={{
      background: "#050c18", border: `1px solid ${C.border}`,
      borderRadius: 6, padding: 12, fontSize: 12,
      fontFamily: "IBM Plex Mono, monospace", lineHeight: 1.8,
      overflowX: "auto", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word"
    }}>
      {text.split("\n").map((line, i) => (
        <span key={i} style={getLineStyle(line)}>{line}{"\n"}</span>
      ))}
    </pre>
  );
}

// ── CASE FORM MODAL ────────────────────────────────────────────────────────
function CaseFormModal({ initial, onSave, onCancel }) {
  const isNew = !initial;
  const [form, setForm] = useState(initial ? { ...initial } : {
    module: "Cliente", title: "", tipo: "Funcional",
    prioridade: "Alto", obs: "", gherkin: "", status: "pending"
  });
  const inp = {
    background: C.card, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "8px 12px", fontSize: 13,
    fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box"
  };
  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 24
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.borderLight}`,
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 700,
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
          {isNew ? "Novo Caso de Teste" : `Editar — ${initial.id}`}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TÍTULO *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título do caso de teste..." style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>MÓDULO</label>
              <select value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                {MODULES_ORDER.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TIPO</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                {["Funcional","Segurança","IA","Carga","Interface"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>PRIORIDADE</label>
              <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                {["Crítico","Alto","Médio","Baixo"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>DADO / OBSERVAÇÃO</label>
            <input value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              placeholder="Dados de entrada, critérios, observações..." style={inp} />
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>CENÁRIO GHERKIN</label>
            <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 6 }}>
              Use: <span style={{ color: "#3b82f6" }}>Feature:</span> · <span style={{ color: "#a855f7" }}>Scenario:</span> · <span style={{ color: "#22c55e" }}>Given</span> · <span style={{ color: "#f59e0b" }}>When</span> · <span style={{ color: "#06b6d4" }}>Then</span> · <span style={{ color: "#94a3b8" }}>And</span>
            </p>
            <textarea
              value={form.gherkin || ""}
              onChange={e => setForm(f => ({ ...f, gherkin: e.target.value }))}
              placeholder={"Feature: Módulo XYZ\n\n  Scenario: Nome do cenário\n    Given que o usuário está autenticado\n    When o usuário realiza a ação\n    Then o sistema deve exibir o resultado esperado"}
              style={{ ...inp, minHeight: 180, resize: "vertical", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, lineHeight: 1.7 }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onCancel} style={{
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.textMuted, borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer"
          }}>Cancelar</button>
          <button onClick={handleSave} style={{
            background: C.blue, color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>{isNew ? "Criar Caso" : "Salvar Alterações"}</button>
        </div>
      </div>
    </div>
  );
}

// ── TEST CASES VIEW ────────────────────────────────────────────────────────
function TestCasesView({ cases, onStatusChange, onAddNote, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterMod, setFilterMod] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPrio, setFilterPrio] = useState("Todos");
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [modal, setModal] = useState(null); // null | "new" | {case object for edit}

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    const matchMod = filterMod === "Todos" || c.module === filterMod;
    const matchStatus = filterStatus === "Todos" || c.status === filterStatus;
    const matchPrio = filterPrio === "Todos" || c.prioridade === filterPrio;
    return matchSearch && matchMod && matchStatus && matchPrio;
  });

  const inputStyle = {
    background: C.card, border:`1px solid ${C.border}`, color: C.text,
    borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none",
    fontFamily:"inherit"
  };
  const selectStyle = { ...inputStyle, cursor:"pointer" };

  return (
    <div>
      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color: C.textMuted }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por ID ou título..."
            style={{ ...inputStyle, paddingLeft:32, width:"100%", boxSizing:"border-box" }}
          />
        </div>
        <select value={filterMod} onChange={e=>setFilterMod(e.target.value)} style={selectStyle}>
          <option>Todos</option>
          {MODULES_ORDER.map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={selectStyle}>
          <option>Todos</option>
          {["pending","passed","failed","blocked"].map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <select value={filterPrio} onChange={e=>setFilterPrio(e.target.value)} style={selectStyle}>
          <option>Todos</option>
          {["Crítico","Alto","Médio","Baixo"].map(p=><option key={p}>{p}</option>)}
        </select>
        <span style={{ color: C.textMuted, fontSize:12, whiteSpace:"nowrap" }}>{filtered.length} casos</span>
      </div>

      {/* Table */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {filtered.map(c => {
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} style={{
              background: isExpanded ? C.cardHover : C.card,
              border:`1px solid ${isExpanded ? C.borderLight : C.border}`,
              borderRadius:8, overflow:"hidden", transition:"all 0.15s"
            }}>
              <div
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", cursor:"pointer", flexWrap:"wrap" }}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <span style={{ color: C.blue, fontSize:12, fontWeight:700, fontFamily:"monospace", minWidth:70 }}>{c.id}</span>
                <span style={{ color: C.text, fontSize:13, flex:1, minWidth:150 }}>{c.title}</span>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <Badge text={c.prioridade} color={PRIO_CFG[c.prioridade]?.color||C.textMuted} bg={PRIO_CFG[c.prioridade]?.bg||C.border} />
                  <Badge text={c.tipo} color={TIPO_CFG[c.tipo]?.color||C.textMuted} bg={TIPO_CFG[c.tipo]?.bg||C.border} />
                  <StatusBtn status={c.status} onClick={e=>{e.stopPropagation();onStatusChange(c.id);}} />
                  {isExpanded ? <ChevronUp size={14} color={C.textMuted}/> : <ChevronDown size={14} color={C.textMuted}/>}
                </div>
              </div>
              {isExpanded && (
                <div style={{ padding:"0 16px 16px 16px", borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <p style={{ color: C.textMuted, fontSize:11, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Módulo</p>
                      <p style={{ color: C.textDim, fontSize:13 }}>{c.module}</p>
                    </div>
                    <div style={{ flex:2, minWidth:200 }}>
                      <p style={{ color: C.textMuted, fontSize:11, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Dado / Observação</p>
                      <p style={{ color: C.textDim, fontSize:13 }}>{c.obs}</p>
                    </div>
                  </div>
                  <div style={{ marginTop:12 }}>
                    <p style={{ color: C.textMuted, fontSize:11, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Notas de Execução</p>
                    <textarea
                      value={notes[c.id] || c.note || ""}
                      onChange={e => setNotes(n=>({...n, [c.id]: e.target.value}))}
                      onBlur={e => onAddNote(c.id, e.target.value)}
                      placeholder="Descreva o resultado, ambiente, evidências..."
                      style={{
                        width:"100%", boxSizing:"border-box",
                        background:"#070d1a", border:`1px solid ${C.border}`,
                        color: C.textDim, borderRadius:6, padding:10,
                        fontSize:12, fontFamily:"monospace", resize:"vertical",
                        minHeight:70, outline:"none"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:40, color: C.textMuted }}>Nenhum caso encontrado com esses filtros.</div>
        )}
      </div>
    </div>
  );
}

// ── BUGS VIEW ──────────────────────────────────────────────────────────────
function BugsView({ bugs, onAdd, onToggle, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", module:"Cliente", severity:"Alto", description:"", status:"open" });
  const inp = f => ({ ...f, background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"8px 12px", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: `BUG-${String(Date.now()).slice(-4)}`, date: new Date().toLocaleDateString("pt-BR") });
    setForm({ title:"", module:"Cliente", severity:"Alto", description:"", status:"open" });
    setShowForm(false);
  };

  const open = bugs.filter(b=>b.status==="open");
  const resolved = bugs.filter(b=>b.status==="resolved");

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ display:"flex", gap:16 }}>
          <span style={{ color: C.failed, fontWeight:700, fontSize:13 }}>{open.length} abertos</span>
          <span style={{ color: C.passed, fontWeight:700, fontSize:13 }}>{resolved.length} resolvidos</span>
        </div>
        <button onClick={()=>setShowForm(!showForm)} style={{
          display:"flex", alignItems:"center", gap:6,
          background: C.blue, color:"#fff", border:"none",
          borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700,
          cursor:"pointer"
        }}>
          <Plus size={14} /> Registrar Bug
        </button>
      </div>

      {showForm && (
        <div style={{ background: C.card, border:`1px solid ${C.borderLight}`, borderRadius:12, padding:20, marginBottom:20 }}>
          <h3 style={{ color: C.text, fontSize:14, fontWeight:700, marginBottom:16 }}>Novo Bug</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ color: C.textMuted, fontSize:11, display:"block", marginBottom:4 }}>TÍTULO *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Descreva o bug..." style={inp({})} />
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize:11, display:"block", marginBottom:4 }}>MÓDULO</label>
              <select value={form.module} onChange={e=>setForm(f=>({...f,module:e.target.value}))} style={inp({cursor:"pointer"})}>
                {MODULES_ORDER.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize:11, display:"block", marginBottom:4 }}>SEVERIDADE</label>
              <select value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))} style={inp({cursor:"pointer"})}>
                {["Crítico","Alto","Médio","Baixo"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ color: C.textMuted, fontSize:11, display:"block", marginBottom:4 }}>DESCRIÇÃO / PASSOS PARA REPRODUZIR</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="1. Acessar...\n2. Clicar em...\n3. Observar..." style={{ ...inp({}), minHeight:80, resize:"vertical", fontFamily:"monospace" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setShowForm(false)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted, borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer" }}>Cancelar</button>
            <button onClick={handleSubmit} style={{ background:C.failed, color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Salvar Bug</button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {bugs.length === 0 && <div style={{ textAlign:"center", padding:40, color: C.textMuted }}>Nenhum bug registrado ainda. 🎉</div>}
        {bugs.map(b => (
          <div key={b.id} style={{
            background: b.status==="resolved" ? C.card : C.card,
            border:`1px solid ${b.status==="resolved" ? C.border : C.border}`,
            borderLeft:`3px solid ${b.status==="resolved" ? C.passed : (SEV_CFG[b.severity]?.color||C.failed)}`,
            borderRadius:8, padding:"14px 16px",
            opacity: b.status==="resolved" ? 0.6 : 1
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:6 }}>
                  <span style={{ color: C.failed, fontSize:11, fontFamily:"monospace", fontWeight:700 }}>{b.id}</span>
                  <Badge text={b.severity} color={SEV_CFG[b.severity]?.color||C.failed} bg={SEV_CFG[b.severity]?.bg||C.failedBg} />
                  <Badge text={b.module.replace("IA — ","IA·")} color={C.textMuted} bg={C.border} />
                  <span style={{ color: C.textMuted, fontSize:11 }}>{b.date}</span>
                  {b.status==="resolved" && <Badge text="Resolvido" color={C.passed} bg={C.passedBg} />}
                </div>
                <p style={{ color: C.text, fontSize:13, fontWeight:600, margin:0 }}>{b.title}</p>
                {b.description && <p style={{ color: C.textMuted, fontSize:12, marginTop:4, fontFamily:"monospace", whiteSpace:"pre-line" }}>{b.description}</p>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>onToggle(b.id)} title={b.status==="open"?"Marcar resolvido":"Reabrir"} style={{
                  background: b.status==="open" ? C.passedBg : C.border,
                  color: b.status==="open" ? C.passed : C.textMuted,
                  border:"none", borderRadius:6, padding:"6px 10px", cursor:"pointer", fontSize:12, fontWeight:700
                }}>
                  {b.status==="open" ? "✓ Resolver" : "↺ Reabrir"}
                </button>
                <button onClick={()=>onDelete(b.id)} style={{ background:"transparent", color:C.textMuted, border:"none", cursor:"pointer", padding:6, borderRadius:6 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REPORT VIEW ────────────────────────────────────────────────────────────
function ReportView({ cases, bugs }) {
  const total = cases.length;
  const passed = cases.filter(c=>c.status==="passed").length;
  const failed = cases.filter(c=>c.status==="failed").length;
  const blocked = cases.filter(c=>c.status==="blocked").length;
  const pending = cases.filter(c=>c.status==="pending").length;
  const executed = passed + failed + blocked;
  const coverage = total > 0 ? Math.round(executed/total*100) : 0;
  const openBugs = bugs.filter(b=>b.status==="open").length;
  const today = new Date().toLocaleDateString("pt-BR");

  const modStats = MODULES_ORDER.map(mod => {
    const mc = cases.filter(c=>c.module===mod);
    return {
      mod, total:mc.length,
      passed:mc.filter(c=>c.status==="passed").length,
      failed:mc.filter(c=>c.status==="failed").length,
      blocked:mc.filter(c=>c.status==="blocked").length,
      pending:mc.filter(c=>c.status==="pending").length,
    };
  });

  const go = coverage >= 80 && failed === 0 && blocked === 0;
  const warn = coverage >= 50 && failed <= 2;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ color: C.text, fontSize:18, fontWeight:800, margin:0 }}>Relatório de Testes</h2>
        <button onClick={()=>window.print()} style={{
          display:"flex", alignItems:"center", gap:8,
          background: C.blue, color:"#fff", border:"none",
          borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer"
        }}>
          <Printer size={14} /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* Header */}
      <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          <div>
            <p style={{ color: C.textMuted, fontSize:11, marginBottom:4 }}>PROJETO</p>
            <p style={{ color: C.text, fontSize:14, fontWeight:700 }}>Sistema de Gestão de Clínica / Consultório</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize:11, marginBottom:4 }}>DATA DO RELATÓRIO</p>
            <p style={{ color: C.text, fontSize:14 }}>{today}</p>
          </div>
        </div>
        <div style={{
          background: go ? C.passedBg : warn ? C.blockedBg : C.failedBg,
          border:`1px solid ${go ? C.passed : warn ? C.blocked : C.failed}`,
          borderRadius:8, padding:"12px 16px", display:"flex", alignItems:"center", gap:10
        }}>
          {go ? <CheckCircle size={18} color={C.passed}/> : warn ? <AlertCircle size={18} color={C.blocked}/> : <XCircle size={18} color={C.failed}/>}
          <span style={{ color: go ? C.passed : warn ? C.blocked : C.failed, fontWeight:800, fontSize:14 }}>
            {go ? "✅ APTO PARA PRODUÇÃO — Todos os critérios atendidos"
              : warn ? "⚠ CONDICIONAL — Ajustes necessários antes do go-live"
              : "🚫 NÃO APTO — Cobertura insuficiente ou falhas críticas pendentes"}
          </span>
        </div>
      </div>

      {/* Summary numbers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:20 }}>
        {[
          ["Total", total, C.blue],
          ["Passaram", passed, C.passed],
          ["Falharam", failed, C.failed],
          ["Bloqueados", blocked, C.blocked],
          ["Pendentes", pending, C.pending],
          ["Bugs Abertos", openBugs, openBugs>0?C.failed:C.passed],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ color, fontSize:28, fontWeight:800, fontFamily:"monospace" }}>{val}</div>
            <div style={{ color:C.textMuted, fontSize:11, marginTop:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Coverage bar */}
      <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ color: C.textDim, fontSize:13, fontWeight:700 }}>Cobertura Geral</span>
          <span style={{ color: coverage>70?C.passed:coverage>40?C.blocked:C.failed, fontSize:20, fontWeight:800, fontFamily:"monospace" }}>{coverage}%</span>
        </div>
        <div style={{ background: C.border, borderRadius:8, height:12, overflow:"hidden" }}>
          <div style={{ width:`${coverage}%`, height:"100%", background: coverage>70?C.passed:coverage>40?C.blocked:C.failed, borderRadius:8, transition:"width 0.5s" }} />
        </div>
      </div>

      {/* Per module */}
      <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <h3 style={{ color: C.text, fontSize:13, fontWeight:700, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.06em" }}>Resultado por Módulo</h3>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr>
              {["Módulo","Total","Passou","Falhou","Bloqueado","Pendente","Cobertura"].map(h=>(
                <th key={h} style={{ color:C.textMuted, textAlign:h==="Módulo"?"left":"center", padding:"6px 8px", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modStats.map(s=>{
              const cov = s.total>0?Math.round((s.passed+s.failed+s.blocked)/s.total*100):0;
              return (
                <tr key={s.mod} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ color:C.text, padding:"10px 8px", fontWeight:600 }}>{s.mod}</td>
                  <td style={{ color:C.textDim, textAlign:"center", padding:"10px 8px" }}>{s.total}</td>
                  <td style={{ color:C.passed, textAlign:"center", padding:"10px 8px", fontWeight:700 }}>{s.passed}</td>
                  <td style={{ color:s.failed>0?C.failed:C.textMuted, textAlign:"center", padding:"10px 8px", fontWeight:s.failed>0?700:400 }}>{s.failed}</td>
                  <td style={{ color:s.blocked>0?C.blocked:C.textMuted, textAlign:"center", padding:"10px 8px", fontWeight:s.blocked>0?700:400 }}>{s.blocked}</td>
                  <td style={{ color:C.textMuted, textAlign:"center", padding:"10px 8px" }}>{s.pending}</td>
                  <td style={{ textAlign:"center", padding:"10px 8px" }}>
                    <span style={{ color:cov>70?C.passed:cov>40?C.blocked:C.failed, fontWeight:700, fontFamily:"monospace" }}>{cov}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bug summary */}
      {bugs.length > 0 && (
        <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <h3 style={{ color: C.text, fontSize:13, fontWeight:700, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.06em" }}>Bugs Encontrados ({bugs.length})</h3>
          {bugs.map(b=>(
            <div key={b.id} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:C.failed, fontFamily:"monospace", fontSize:12, minWidth:70, fontWeight:700 }}>{b.id}</span>
              <Badge text={b.severity} color={SEV_CFG[b.severity]?.color||C.failed} bg={SEV_CFG[b.severity]?.bg||C.failedBg} />
              <span style={{ color:C.text, fontSize:13, flex:1 }}>{b.title}</span>
              <Badge text={b.status==="resolved"?"Resolvido":"Aberto"} color={b.status==="resolved"?C.passed:C.failed} bg={b.status==="resolved"?C.passedBg:C.failedBg} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [cases, setCases] = useState(null);
  const [bugs, setBugs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData().then(data => {
      if (data) {
        setCases(data.cases || INITIAL_CASES);
        setBugs(data.bugs || []);
      } else {
        setCases(INITIAL_CASES);
        setBugs([]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (cases !== null && bugs !== null) {
      saveData({ cases, bugs });
    }
  }, [cases, bugs]);

  const handleStatusChange = useCallback((id) => {
    setCases(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(c.status) + 1) % STATUS_CYCLE.length];
      return { ...c, status: nextStatus };
    }));
  }, []);

  const handleAddNote = useCallback((id, note) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, note } : c));
  }, []);

  const handleAddBug = useCallback((bug) => {
    setBugs(prev => [bug, ...prev]);
  }, []);

  const handleToggleBug = useCallback((id) => {
    setBugs(prev => prev.map(b => b.id === id ? { ...b, status: b.status==="open"?"resolved":"open" } : b));
  }, []);

  const handleDeleteBug = useCallback((id) => {
    setBugs(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleReset = () => {
    if (!window.confirm("Resetar todos os testes para Pendente? Bugs serão mantidos.")) return;
    setCases(prev => prev.map(c=>({...c, status:"pending", note:""})));
  };

  const navItems = [
    { id:"dashboard", label:"Dashboard", Icon: LayoutDashboard },
    { id:"cases",     label:"Casos de Teste", Icon: List },
    { id:"bugs",      label:"Bugs", Icon: Bug },
    { id:"report",    label:"Relatório", Icon: FileText },
  ];

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color: C.textMuted, fontSize:14, display:"flex", alignItems:"center", gap:10 }}>
          <RefreshCw size={18} style={{ animation:"spin 1s linear infinite" }} />
          Carregando dados...
        </div>
      </div>
    );
  }

  const openBugsCount = bugs.filter(b=>b.status==="open").length;
  const failedCount = cases.filter(c=>c.status==="failed").length;

  return (
    <div style={{ background: C.bg, minHeight:"100vh", fontFamily:"'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          nav, button { display: none !important; }
          body { background: white !important; color: black !important; }
        }
        textarea:focus, input:focus, select:focus { border-color: ${C.blue} !important; }
      `}</style>

      {/* Top bar */}
      <div style={{
        background: C.card, borderBottom:`1px solid ${C.border}`,
        padding:"0 24px", display:"flex", alignItems:"center", height:56, gap:24,
        position:"sticky", top:0, zIndex:100
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, background: C.blue, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Layers size={16} color="#fff" />
          </div>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:"-0.02em" }}>QA</span>
          <span style={{ color: C.textMuted, fontSize:15 }}>Dashboard</span>
        </div>

        <nav style={{ display:"flex", gap:2, flex:1 }}>
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setView(id)} style={{
              display:"flex", alignItems:"center", gap:7,
              background: view===id ? C.blueBg : "transparent",
              color: view===id ? C.blue : C.textMuted,
              border: view===id ? `1px solid ${C.blue}33` : "1px solid transparent",
              borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:view===id?700:500,
              cursor:"pointer", transition:"all 0.15s", position:"relative"
            }}>
              <Icon size={14} />
              {label}
              {id==="bugs" && openBugsCount>0 && (
                <span style={{ background:C.failed, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:800, marginLeft:2 }}>{openBugsCount}</span>
              )}
              {id==="cases" && failedCount>0 && (
                <span style={{ background:C.failed, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:800, marginLeft:2 }}>{failedCount}</span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={handleReset} title="Resetar todos os casos para Pendente" style={{
          display:"flex", alignItems:"center", gap:6,
          background:"transparent", color:C.textMuted,
          border:`1px solid ${C.border}`, borderRadius:8,
          padding:"6px 12px", fontSize:12, cursor:"pointer"
        }}>
          <RefreshCw size={13} /> Resetar
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 24px", maxWidth:1300, margin:"0 auto" }}>
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color: C.text, letterSpacing:"-0.02em" }}>
            {view==="dashboard" && "Visão Geral"}
            {view==="cases" && `Casos de Teste (${cases.length})`}
            {view==="bugs" && `Bugs (${bugs.length})`}
            {view==="report" && "Relatório para o Cliente"}
          </h1>
          {view==="cases" && <p style={{ color:C.textMuted, fontSize:13, marginTop:4 }}>Clique no status para avançar → Pendente → Passou → Falhou → Bloqueado → Pendente</p>}
        </div>

        {view==="dashboard" && <DashboardView cases={cases} bugs={bugs} />}
        {view==="cases"     && <TestCasesView cases={cases} onStatusChange={handleStatusChange} onAddNote={handleAddNote} />}
        {view==="bugs"      && <BugsView bugs={bugs} onAdd={handleAddBug} onToggle={handleToggleBug} onDelete={handleDeleteBug} />}
        {view==="report"    && <ReportView cases={cases} bugs={bugs} />}
      </div>
    </div>
  );
}
