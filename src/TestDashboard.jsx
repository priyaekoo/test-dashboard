import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  CheckCircle, XCircle, AlertCircle, Clock, Bug, LayoutDashboard,
  List, FileText, Plus, X, Search, Printer, ChevronDown, ChevronUp,
  RefreshCw, Layers
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
  // AUTENTICAÇÃO E CADASTRO
  { id:"AUTH-NEW-01", module:"Autenticação e Cadastro", title:"Tenant sem e-mail confirmado tenta logar — sistema bloqueia", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"AUTH-NEW-02", module:"Autenticação e Cadastro", title:"Login via Google OAuth redireciona para o dashboard do role correto", tipo:"Segurança", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"AUTH-NEW-03", module:"Autenticação e Cadastro", title:"Link de redefinição de senha expira após uso único", tipo:"Segurança", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"AUTH-NEW-04", module:"Autenticação e Cadastro", title:"Conta bloqueada após 3 tentativas erradas — UI exibe mensagem com tempo de desbloqueio", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"AUTH-NEW-05", module:"Autenticação e Cadastro", title:"Setup inicial salva logo, cor e label do profissional corretamente", tipo:"Funcional", prioridade:"Crítico", camadas:["E2E"], status:"pending" },
  // CLIENTE
  { id:"CL-NEW-01", module:"Cliente", title:"Cadastro com CPF duplicado — API rejeita e UI exibe erro inline no campo", tipo:"Funcional", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"CL-NEW-02", module:"Cliente", title:"Busca de paciente retorna resultado correto por nome, CPF e e-mail", tipo:"Funcional", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"CL-NEW-03", module:"Cliente", title:"Paciente inativado não aparece para novos agendamentos mas histórico permanece", tipo:"Funcional", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"CL-NEW-04", module:"Cliente", title:"Sistema registra data e hora de criação e última atualização automaticamente", tipo:"Funcional", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"CL-NEW-05", module:"Cliente", title:"Campos obrigatórios vazios — frontend não submete e backend rejeita se burlado", tipo:"Funcional", prioridade:"Médio", camadas:["Backend","Frontend"], status:"pending" },
  // PORTAL DO PACIENTE
  { id:"PP-NEW-01", module:"Portal do Paciente", title:"Paciente vê apenas seus próprios agendamentos — API bloqueia e UI não exibe links cruzados", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"PP-NEW-02", module:"Portal do Paciente", title:"Cancelamento bloqueado dentro do prazo mínimo — sistema informa o motivo", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PP-NEW-03", module:"Portal do Paciente", title:"Confirmação enviada por e-mail e SMS ao agendar ou cancelar consulta", tipo:"Funcional", prioridade:"Médio", camadas:["E2E"], status:"pending" },
  { id:"PP-NEW-04", module:"Portal do Paciente", title:"Portal legível e funcional em tela de celular", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PP-NEW-05", module:"Portal do Paciente", title:"Dados sensíveis do paciente não aparecem na URL — backend não expõe em redirect e frontend não usa query params", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  // IA — RESUMO
  { id:"IA-NEW-01", module:"IA — Resumo", title:"Resumo clínico gerado dentro do tempo limite — timeout exibido se exceder", tipo:"IA", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"IA-NEW-02", module:"IA — Resumo", title:"Falha na IA — API retorna erro tratado e UI exibe mensagem sem travar a tela", tipo:"Funcional", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  // IA — RISCO DE FALTA
  { id:"IA-NEW-03", module:"IA — Risco de Falta", title:"Paciente sem histórico exibe mensagem clara de dados insuficientes", tipo:"IA", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"IA-NEW-04", module:"IA — Risco de Falta", title:"Previsão de no-show registra se acertou ou errou após a consulta ocorrer", tipo:"IA", prioridade:"Baixo", camadas:["Backend"], status:"pending" },
  // IA — WHATSAPP
  { id:"IA-NEW-05", module:"IA — WhatsApp", title:"Mensagem WhatsApp — backend substitui variáveis, frontend exibe preview e E2E valida o envio", tipo:"IA", prioridade:"Crítico", camadas:["Backend","Frontend","E2E"], status:"pending" },
  { id:"IA-NEW-06", module:"IA — WhatsApp", title:"Gerador com contexto vazio solicita informações mínimas antes de gerar", tipo:"IA", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"IA-NEW-07", module:"IA — WhatsApp", title:"Histórico de mensagens geradas pela IA fica registrado e consultável", tipo:"Funcional", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  // ROLES — ADMIN
  { id:"ROLES-ADMIN-01", module:"Roles — Admin", title:"Admin cria usuário com role médico — outros roles não conseguem", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-02", module:"Roles — Admin", title:"Admin edita e deleta usuário — campo is_superadmin é ignorado se enviado", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-03", module:"Roles — Admin", title:"Admin cria, edita e deleta filial — outros roles recebem 403", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-04", module:"Roles — Admin", title:"Deletar profissional — agendamentos futuros ficam em estado consistente", tipo:"Funcional", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-05", module:"Roles — Admin", title:"Admin altera configurações do tenant — outros roles bloqueados na API e sem item no menu", tipo:"Segurança", prioridade:"Alto", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-ADMIN-06", module:"Roles — Admin", title:"Admin faz upload e remove logo do tenant — recepcionista não vê essa opção", tipo:"Segurança", prioridade:"Médio", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-ADMIN-07", module:"Roles — Admin", title:"Admin gerencia assinatura — todos os outros roles são bloqueados", tipo:"Segurança", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-08", module:"Roles — Admin", title:"Admin ativa integração WhatsApp — recepcionista não acessa configuração", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-09", module:"Roles — Admin", title:"Admin acessa relatórios no plano Profissional — bloqueado no Starter", tipo:"Segurança", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-10", module:"Roles — Admin", title:"Convênios disponíveis no plano Profissional — bloqueados no Starter", tipo:"Segurança", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-11", module:"Roles — Admin", title:"Admin cria template de mensagem — médico e gestor recebem 403", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-ADMIN-12", module:"Roles — Admin", title:"Sidebar do admin exibe itens exclusivos — rotas bloqueadas no backend para outros roles", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-ADMIN-13", module:"Roles — Admin", title:"Admin cria médico, médico faz login e vê apenas menus do seu role", tipo:"Segurança", prioridade:"Crítico", camadas:["E2E"], status:"pending" },
  { id:"ROLES-ADMIN-14", module:"Roles — Admin", title:"Admin exclui usuário ativo — sessão do usuário é encerrada imediatamente", tipo:"Segurança", prioridade:"Crítico", camadas:["E2E"], status:"pending" },
  { id:"ROLES-ADMIN-15", module:"Roles — Admin", title:"Admin cadastra convênio e recepcionista consegue usá-lo no agendamento", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  // ROLES — GESTOR
  { id:"ROLES-GESTOR-01", module:"Roles — Gestor", title:"Gestor visualiza agendamentos — não consegue criar nem cancelar", tipo:"Segurança", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-GESTOR-02", module:"Roles — Gestor", title:"Gestor acessa e edita prontuários — consegue assinar", tipo:"Funcional", prioridade:"Baixo", camadas:["Backend"], status:"pending" },
  { id:"ROLES-GESTOR-03", module:"Roles — Gestor", title:"Gestor tenta acessar pagamentos — API retorna 403 e item ausente no menu", tipo:"Segurança", prioridade:"Alto", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-GESTOR-04", module:"Roles — Gestor", title:"Gestor abre, comenta e fecha tickets de suporte", tipo:"Funcional", prioridade:"Baixo", camadas:["Backend"], status:"pending" },
  { id:"ROLES-GESTOR-05", module:"Roles — Gestor", title:"Gestor vê apenas as próprias notificações — não as de outros usuários", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-GESTOR-06", module:"Roles — Gestor", title:"Gestor tenta acessar relatórios — API retorna 403 e item ausente no menu em qualquer plano", tipo:"Segurança", prioridade:"Alto", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-GESTOR-07", module:"Roles — Gestor", title:"Gestor acessa resumo e gerador de mensagens via IA — retorna 200 sem restrição de role", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-GESTOR-08", module:"Roles — Gestor", title:"Gestor deleta paciente — UI exige confirmação e backend registra log de auditoria", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-GESTOR-09", module:"Roles — Gestor", title:"Importação CSV por gestor — valida formato, limite de tamanho e erros por linha", tipo:"Funcional", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-GESTOR-10", module:"Roles — Gestor", title:"Gestor não vê botões de criar ou cancelar agendamento na agenda", tipo:"Segurança", prioridade:"Crítico", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-GESTOR-11", module:"Roles — Gestor", title:"Gestor acessa tickets e notificações pela interface", tipo:"Funcional", prioridade:"Baixo", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-GESTOR-12", module:"Roles — Gestor", title:"Gestor importa CSV — interface exibe progresso e relatório de erros por linha", tipo:"Funcional", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-GESTOR-13", module:"Roles — Gestor", title:"Gestor monitora o dia inteiro sem conseguir criar agendamento nem acessar pagamentos", tipo:"Segurança", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  // ROLES — MÉDICO
  { id:"ROLES-MEDICO-01", module:"Roles — Médico", title:"Médico tenta criar agendamento — bloqueado com 403", tipo:"Segurança", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-MEDICO-02", module:"Roles — Médico", title:"Médico atualiza status do agendamento — permitido para todos os roles", tipo:"Funcional", prioridade:"Baixo", camadas:["Backend"], status:"pending" },
  { id:"ROLES-MEDICO-03", module:"Roles — Médico", title:"Médico cria e assina prontuário vinculado ao agendamento", tipo:"Funcional", prioridade:"Baixo", camadas:["Backend"], status:"pending" },
  { id:"ROLES-MEDICO-04", module:"Roles — Médico", title:"Médico abre e fecha tickets de suporte", tipo:"Funcional", prioridade:"Baixo", camadas:["Backend"], status:"pending" },
  { id:"ROLES-MEDICO-05", module:"Roles — Médico", title:"Médico vê apenas as próprias notificações — não as de outros usuários", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-MEDICO-06", module:"Roles — Médico", title:"Médico tenta acessar pagamentos — API retorna 403 e item ausente no DOM", tipo:"Segurança", prioridade:"Alto", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-07", module:"Roles — Médico", title:"Médico usa IA básica sem restrição de role — frontend controla visibilidade por plano", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-08", module:"Roles — Médico", title:"Médico acessa no-show de agendamento de outro médico — API bloqueia e UI não exibe o botão", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-09", module:"Roles — Médico", title:"Médico deleta paciente — UI exige confirmação e backend registra log de auditoria", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-10", module:"Roles — Médico", title:"Médico importa CSV de pacientes — valida limite e erros por linha", tipo:"Funcional", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-MEDICO-11", module:"Roles — Médico", title:"Botão novo agendamento não existe no DOM para o médico", tipo:"Segurança", prioridade:"Crítico", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-12", module:"Roles — Médico", title:"Médico preenche prontuário com autocomplete de CID e assina em dois passos", tipo:"Funcional", prioridade:"Baixo", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-13", module:"Roles — Médico", title:"Botões de IA bloqueados visualmente no Starter — requisição não é enviada mesmo via DevTools", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-14", module:"Roles — Médico", title:"Médico acessa tickets e notificações pela interface", tipo:"Funcional", prioridade:"Baixo", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-MEDICO-15", module:"Roles — Médico", title:"Médico conduz atendimento completo com IA — do agendamento à assinatura do prontuário", tipo:"Funcional", prioridade:"Crítico", camadas:["E2E"], status:"pending" },
  { id:"ROLES-MEDICO-16", module:"Roles — Médico", title:"Médico recebe notificação de solicitação de paciente e responde pelo sistema", tipo:"Funcional", prioridade:"Médio", camadas:["E2E"], status:"pending" },
  // ROLES — RECEPCIONISTA
  { id:"ROLES-RECEP-01", module:"Roles — Recepcionista", title:"Recepcionista cria e cancela agendamento — médico e gestor são bloqueados", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-02", module:"Roles — Recepcionista", title:"Recepcionista registra pagamento com convênio vinculado — médico não acessa", tipo:"Segurança", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-03", module:"Roles — Recepcionista", title:"Recepcionista cria, edita e deleta templates de mensagem — médico e gestor bloqueados", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-04", module:"Roles — Recepcionista", title:"Recepcionista cria campanha no plano Clínica — bloqueada nos planos inferiores", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-05", module:"Roles — Recepcionista", title:"Recepcionista envia confirmação WhatsApp — médico e gestor são bloqueados", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-06", module:"Roles — Recepcionista", title:"Recepcionista abre e comenta tickets de suporte", tipo:"Funcional", prioridade:"Baixo", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-07", module:"Roles — Recepcionista", title:"Recepcionista vê apenas as próprias notificações", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-08", module:"Roles — Recepcionista", title:"Recepcionista acessa relatórios no plano Profissional — bloqueada no Starter", tipo:"Segurança", prioridade:"Médio", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-09", module:"Roles — Recepcionista", title:"Recepcionista usa convênio cadastrado pelo admin no agendamento", tipo:"Funcional", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-10", module:"Roles — Recepcionista", title:"Importação CSV — duplicados relatados, nenhum dado sobrescrito silenciosamente", tipo:"Funcional", prioridade:"Alto", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-11", module:"Roles — Recepcionista", title:"Recepcionista acessa resumo de IA do paciente — avaliar se é intencional", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-RECEP-12", module:"Roles — Recepcionista", title:"Sidebar da recepcionista sem itens do admin — rotas /settings e /users bloqueadas no backend", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-RECEP-13", module:"Roles — Recepcionista", title:"Recepcionista cria agendamento com convênio pelo formulário", tipo:"Funcional", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-RECEP-14", module:"Roles — Recepcionista", title:"Recepcionista deleta template em uso — UI exibe aviso antes de confirmar", tipo:"Funcional", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-RECEP-15", module:"Roles — Recepcionista", title:"Recepcionista envia confirmação WhatsApp — status atualiza na tela sem reload", tipo:"Funcional", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-RECEP-16", module:"Roles — Recepcionista", title:"Importação CSV — preview com 5 linhas antes de confirmar e relatório de erros após", tipo:"Funcional", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"ROLES-RECEP-17", module:"Roles — Recepcionista", title:"Recepcionista agenda com convênio, envia confirmação e registra pagamento", tipo:"Funcional", prioridade:"Crítico", camadas:["E2E"], status:"pending" },
  { id:"ROLES-RECEP-18", module:"Roles — Recepcionista", title:"Recepcionista cria campanha com template e admin cancela antes do envio", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  // ROLES — SEGURANÇA
  { id:"ROLES-SEC-01", module:"Roles — Segurança", title:"Médico envia header X-Role: admin — backend ignora e bloqueia com 403", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-SEC-02", module:"Roles — Segurança", title:"Médico tenta ler notificação de outro usuário pelo ID — bloqueado", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-SEC-03", module:"Roles — Segurança", title:"Token do tenant A não acessa nenhum recurso do tenant B", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-SEC-04", module:"Roles — Segurança", title:"Rota sem token retorna 401 — frontend redireciona para login sem mostrar dados", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend","Frontend"], status:"pending" },
  { id:"ROLES-SEC-05", module:"Roles — Segurança", title:"Deleção de paciente gera log com actor, recurso e timestamp — exigência LGPD", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-SEC-06", module:"Roles — Segurança", title:"Anonimização LGPD gera log rastreável — dado não pode ser recuperado", tipo:"Segurança", prioridade:"Crítico", camadas:["Backend"], status:"pending" },
  { id:"ROLES-SEC-07", module:"Roles — Segurança", title:"Admin altera role de usuário — novo login reflete permissões atualizadas", tipo:"Segurança", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"ROLES-SEC-08", module:"Roles — Segurança", title:"Sessão expirada — backend invalida token e frontend redireciona para login", tipo:"Segurança", prioridade:"Alto", camadas:["Backend","Frontend"], status:"pending" },
];

const INITIAL_BUGS = [
  {
    id: "BUG-IA-01",
    title: "IA acessível via API em qualquer plano — controle de plano existe só no frontend",
    severity: "Crítico",
    module: "IA — Todos os endpoints",
    description: "POST /ai/patient-summary com token válido em tenant Starter via Postman → retorna 200. Esperado: 403.",
    status: "open",
    date: "16/04/2026",
  },
  {
    id: "BUG-IA-02",
    title: "Busca semântica em prontuários acessível nos planos Starter e Profissional via API",
    severity: "Crítico",
    module: "IA — Busca semântica",
    description: "GET /ai/medical-records/search em tenant Profissional via API direta → 200. Esperado: 403 (funcionalidade do plano Clínica).",
    status: "open",
    date: "16/04/2026",
  },
  {
    id: "BUG-IA-03",
    title: "Médico e gestor conseguem ativar e desativar o assistente WhatsApp do tenant",
    severity: "Crítico",
    module: "IA — WhatsApp assistant",
    description: "POST /ai/whatsapp-assistant/toggle com token de médico → 200. Apenas admin deveria controlar o assistente do tenant.",
    status: "open",
    date: "16/04/2026",
  },
];

const SEED_BUGS_RECEP = [
  // ── CADASTRO DE PACIENTE ──────────────────────────────────────────────────
  {
    id: "BUG-PAC-01",
    title: "Data de nascimento com ano inválido é aceita e salva, mas dado não persiste",
    severity: "Alto",
    module: "Cliente",
    description: "Preencher data de nascimento com ano inválido (ex: 9999 ou 0001) → sistema salva sem erro → ao reabrir o cadastro o campo aparece vazio. Esperado: validação impedir o envio.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-PAC-02",
    title: "Campo CPF não está sendo validado no formulário de novo paciente",
    severity: "Crítico",
    module: "Cliente",
    description: "Inserir CPF com dígitos inválidos ou sequência fictícia (ex: 111.111.111-11) → sistema aceita e salva sem erro. Esperado: validação de CPF (dígitos verificadores) com mensagem de erro.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-PAC-03",
    title: "Duplicidade de cadastro permitida — mesmo nome e CPF cadastrados duas vezes",
    severity: "Crítico",
    module: "Cliente",
    description: "Cadastrar paciente com nome e CPF já existentes → sistema salva sem aviso. Registro duplicado aparece na listagem e no banco de dados. Esperado: bloqueio com mensagem de duplicidade.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-PAC-04",
    title: "Filtro por CPF não está funcionando",
    severity: "Alto",
    module: "Cliente",
    description: "Digitar CPF de paciente existente no campo de busca → listagem não retorna o paciente. Filtros por nome e telefone funcionam normalmente.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-PAC-05",
    title: "Busca sem resultados não exibe nenhuma mensagem ao usuário",
    severity: "Médio",
    module: "Cliente",
    description: "Buscar termo inexistente na listagem de pacientes → tela fica em branco sem nenhuma mensagem de 'nenhum resultado encontrado'. Esperado: mensagem informativa.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-PAC-06",
    title: "Label do campo some ao clicar — usuário perde referência do campo",
    severity: "Médio",
    module: "Cliente",
    description: "Ao clicar em campos como 'CPF' no formulário de novo paciente, a label desaparece completamente. Sem placeholder ou label flutuante, o usuário não sabe o que está preenchendo. Afeta pelo menos o campo CPF.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-PAC-07",
    title: "Botões 'Cancelar' e 'Criar paciente' somem em telas com zoom padrão (100%)",
    severity: "Alto",
    module: "Cliente",
    description: "Com zoom do navegador em 100%, os botões de ação do modal de novo paciente ficam fora da área visível. Apenas com zoom em 80% os botões aparecem. Esperado: modal responsivo independente do zoom.",
    status: "open",
    date: "22/04/2026",
  },
  // ── DEPENDENTE ────────────────────────────────────────────────────────────
  {
    id: "BUG-DEP-01",
    title: "Duplicidade de dependente com mesmo nome e CPF não é bloqueada",
    severity: "Crítico",
    module: "Cliente",
    description: "Cadastrar dependente com nome e CPF já vinculados ao mesmo paciente → sistema permite e salva o duplicado na aplicação e no banco. Esperado: validação de duplicidade com mensagem de erro.",
    status: "open",
    date: "22/04/2026",
  },
  // ── IMPORTAÇÃO CSV ────────────────────────────────────────────────────────
  {
    id: "BUG-CSV-01",
    title: "Importação de CSV falha em todas as tentativas — erro sem identificação da linha/campo",
    severity: "Crítico",
    module: "Roles — Recepcionista",
    description: "Arquivo CSV criado conforme especificação → todas as tentativas retornam erro. Mensagem exibida: 'Erro ao validar o arquivo' sem identificar qual linha ou campo está incorreto. Dificulta a correção pelo usuário.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-CSV-02",
    title: "Mensagem de erro na importação CSV com cor invisível — texto ilegível",
    severity: "Alto",
    module: "Roles — Recepcionista",
    description: "Ao importar arquivo inválido, a mensagem de erro é exibida com uma cor de texto que não contrasta com o fundo, tornando o texto ilegível. Esperado: texto de erro em cor visível (ex: vermelho sobre fundo claro/escuro com contraste adequado).",
    status: "open",
    date: "22/04/2026",
  },
  // ── EDITAR PACIENTE ───────────────────────────────────────────────────────
  {
    id: "BUG-EDIT-01",
    title: "Editar paciente — campos obrigatórios não estão marcados como obrigatórios",
    severity: "Médio",
    module: "Cliente",
    description: "No formulário de edição de paciente, campos que deveriam ser obrigatórios (ex: nome) não apresentam indicação visual nem bloqueiam o envio quando vazios. Deve espelhar o comportamento do formulário de criação.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-EDIT-02",
    title: "Editar paciente — validação de CEP, CPF e data de nascimento não implementada",
    severity: "Alto",
    module: "Cliente",
    description: "No formulário de edição, os campos CEP, CPF e data de nascimento não possuem validação de formato/conteúdo. É possível salvar valores inválidos. Deve ter o mesmo comportamento do formulário de criação.",
    status: "open",
    date: "22/04/2026",
  },
  // ── ATENDIMENTOS ─────────────────────────────────────────────────────────
  {
    id: "BUG-ATEND-01",
    title: "Atendimentos — label dos comentários com fonte invisível",
    severity: "Médio",
    module: "Roles — Recepcionista",
    description: "Na seção de atendimentos, ao incluir um comentário, a fonte das labels não está visível (provavelmente cor igual ao fundo). O usuário não consegue ler os dados preenchidos.",
    status: "open",
    date: "22/04/2026",
  },
  // ── PRONTUÁRIOS ───────────────────────────────────────────────────────────
  {
    id: "BUG-PRONT-01",
    title: "Prontuários — modal 'Ver detalhes' não redimensiona, botões Editar e Fechar ficam invisíveis",
    severity: "Alto",
    module: "Roles — Médico",
    description: "Preencher prontuário completo e salvar → clicar em 'Ver detalhes' → modal abre sem respeitar o tamanho da tela → botões 'Editar' e 'Fechar' ficam fora da área visível. Impossível interagir sem scroll ou redimensionamento manual.",
    status: "open",
    date: "22/04/2026",
  },
  {
    id: "BUG-PRONT-02",
    title: "Prontuários — botão 'Editar' não executa nenhuma ação",
    severity: "Crítico",
    module: "Roles — Médico",
    description: "Dentro do modal de detalhes do prontuário, clicar no botão 'Editar' não abre formulário de edição nem dispara nenhuma ação visível. Funcionalidade de edição de prontuário completamente inoperante.",
    status: "open",
    date: "22/04/2026",
  },
  // ── DOCUMENTOS ────────────────────────────────────────────────────────────
  {
    id: "BUG-DOC-01",
    title: "Upload de documento PDF retorna erro JSON inesperado",
    severity: "Crítico",
    module: "Cliente",
    description: "Tentar incluir documento no formato .pdf → aplicação retorna: Unexpected token '<', \"<br /> <b>\"... is not valid JSON. Indica que o servidor retorna HTML (provavelmente erro 500) em vez de JSON. Upload de PDF completamente bloqueado.",
    status: "open",
    date: "22/04/2026",
  },
];

// Casos vinculados a testes automatizados — merged on load, nunca sobrescreve
const SEED_CASES_AUTO = [
  {
    id: "PAC-AUTO-FILTRO-NOME",
    module: "Cliente",
    title: "Filtro por nome parcial retorna pacientes correspondentes",
    tipo: "Funcional",
    prioridade: "Alto",
    camada: "E2E",
    status: "pending",
  },
];

// Casos mapeados — Módulo Pacientes | Role: recepcionista
const SEED_CASES_PACIENTES = [
  // ── TELA PRINCIPAL ────────────────────────────────────────────────────────
  { id:"PAC-TELA-FILTRO-NOME", module:"Pacientes", role:"recepcionista", title:"Tela principal | Validar filtro por nome", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-TELA-FILTRO-CPF",  module:"Pacientes", role:"recepcionista", title:"Tela principal | Validar filtro por CPF",  tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-TELA-FILTRO-TEL",  module:"Pacientes", role:"recepcionista", title:"Tela principal | Validar filtro por Telefone", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-TELA-RETORNO",     module:"Pacientes", role:"recepcionista", title:"Tela principal | Validar retorno correto dos resultados", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-TELA-VAZIO",       module:"Pacientes", role:"recepcionista", title:"Tela principal | Buscar termo inexistente retorna lista vazia", tipo:"Funcional", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-TELA-LIMPAR",      module:"Pacientes", role:"recepcionista", title:"Tela principal | Limpar busca restaura listagem original", tipo:"Funcional", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-TELA-LISTAGEM",    module:"Pacientes", role:"recepcionista", title:"Tela principal | Listagem reflete alterações (criação, edição, exclusão)", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  // ── NOVO PACIENTE — DADOS PESSOAIS ────────────────────────────────────────
  { id:"PAC-NOVO-CRIAR",       module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | Criar paciente com dados válidos e persistência no banco", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-NOVO-LISTAGEM",    module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | Novo paciente aparece na listagem", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-NOVO-OBRIGATORIO", module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | Campos obrigatórios impedem envio quando vazios", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-NOVO-CPF-INVALIDO",module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | CPF inválido exibe mensagem de erro", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-NOVO-CPF-DUPLO",   module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | CPF duplicado exibe erro ao tentar cadastrar", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-NOVO-NASC-FUTURA", module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | Data de nascimento futura não é permitida", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-NOVO-TEL-INVALIDO",module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | Telefone inválido não é aceito", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-NOVO-DUPLICIDADE", module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | Aplicação não aceita duplicidade de CPF e Nome", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-NOVO-EMAIL",       module:"Pacientes", role:"recepcionista", title:"Novo paciente | Dados Pessoais | Campo E-mail aceita apenas valores com parâmetros corretos", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  // ── NOVO PACIENTE — ENDEREÇO ──────────────────────────────────────────────
  { id:"PAC-END-SEM",          module:"Pacientes", role:"recepcionista", title:"Novo paciente | Endereço | Criar paciente sem endereço (fluxo válido)", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-END-COMPLETO",     module:"Pacientes", role:"recepcionista", title:"Novo paciente | Endereço | Criar paciente com endereço completo", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-END-PERSIST",      module:"Pacientes", role:"recepcionista", title:"Novo paciente | Endereço | Validar persistência dos dados de endereço", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-END-CEP",          module:"Pacientes", role:"recepcionista", title:"Novo paciente | Endereço | Validar comportamento ao preencher CEP", tipo:"Funcional", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-END-INVALIDO",     module:"Pacientes", role:"recepcionista", title:"Novo paciente | Endereço | Validar comportamento com dados de endereço inválidos", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  // ── NOVO DEPENDENTE ───────────────────────────────────────────────────────
  { id:"PAC-DEP-CRIAR",        module:"Pacientes", role:"recepcionista", title:"Novo dependente | Criar dependente vinculado a um paciente", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-DEP-LISTAGEM",     module:"Pacientes", role:"recepcionista", title:"Novo dependente | Dependente aparece corretamente na listagem", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-DEP-VINCULO",      module:"Pacientes", role:"recepcionista", title:"Novo dependente | Dependente não pode ser vinculado se já existe vínculo", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-DEP-SEM-RESP",     module:"Pacientes", role:"recepcionista", title:"Novo dependente | Impedir criação de dependente sem responsável", tipo:"Funcional", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-DEP-CPF-INVALIDO", module:"Pacientes", role:"recepcionista", title:"Novo dependente | CPF inválido exibe mensagem de erro", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-DEP-CPF-DUPLO",    module:"Pacientes", role:"recepcionista", title:"Novo dependente | CPF duplicado exibe erro ao tentar cadastrar", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-DEP-NASC-FUTURA",  module:"Pacientes", role:"recepcionista", title:"Novo dependente | Data de nascimento futura não é permitida", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  // ── BOTÃO AÇÃO — EDITAR PACIENTE ──────────────────────────────────────────
  { id:"PAC-EDIT-DADOS",       module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Editar todos os dados do paciente e validar persistência", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-EDIT-OBRIGATORIO", module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Campos obrigatórios impedem envio quando vazios", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-EDIT-CPF-INVALIDO",module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | CPF inválido exibe mensagem de erro", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-EDIT-CPF-DUPLO",   module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | CPF duplicado exibe erro ao tentar salvar", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-EDIT-NASC-FUTURA", module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Data de nascimento futura não é permitida", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-EDIT-TEL-INVALIDO",module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Telefone inválido não é aceito", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-EDIT-DUPLICIDADE", module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Duplicidade de CPF e Nome não é aceita", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-EDIT-EMAIL",       module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Campo E-mail aceita apenas valores com parâmetros corretos", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  { id:"PAC-EDIT-END",         module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Editar endereço completo e validar persistência", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-EDIT-CEP",         module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar | Validar comportamento ao preencher CEP na edição", tipo:"Funcional", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  // ── BOTÃO AÇÃO — EDITAR DEPENDENTE ───────────────────────────────────────
  { id:"PAC-EDITDEP-DADOS",       module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar Dependente | Editar todos os dados e validar persistência", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-EDITDEP-OBRIGATORIO", module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar Dependente | Campos obrigatórios impedem envio quando vazios", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-EDITDEP-CPF-INVALIDO",module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar Dependente | CPF inválido exibe mensagem de erro", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-EDITDEP-CPF-DUPLO",   module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar Dependente | CPF duplicado exibe erro ao tentar salvar", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-EDITDEP-NASC-FUTURA", module:"Pacientes", role:"recepcionista", title:"Botão Ação | Editar Dependente | Data de nascimento futura não é permitida", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  // ── BOTÃO AÇÃO — VER HISTÓRICO ────────────────────────────────────────────
  { id:"PAC-HIST-VER",            module:"Pacientes", role:"recepcionista", title:"Botão Ação | Ver Histórico | Levantar e validar cenários do histórico do paciente", tipo:"Funcional", prioridade:"Médio", camadas:["E2E"], status:"blocked" },
  // ── BOTÃO AÇÃO — ADICIONAR DEPENDENTE ────────────────────────────────────
  { id:"PAC-ACAO-DEP-CRIAR",        module:"Pacientes", role:"recepcionista", title:"Botão Ação | Adicionar Dependente | Criar dependente pelo botão ação", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-ACAO-DEP-OBRIGATORIO",  module:"Pacientes", role:"recepcionista", title:"Botão Ação | Adicionar Dependente | Campos obrigatórios impedem envio quando vazios", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-ACAO-DEP-CPF-INVALIDO", module:"Pacientes", role:"recepcionista", title:"Botão Ação | Adicionar Dependente | CPF inválido exibe mensagem de erro", tipo:"Interface", prioridade:"Alto", camadas:["Frontend"], status:"pending" },
  { id:"PAC-ACAO-DEP-CPF-DUPLO",    module:"Pacientes", role:"recepcionista", title:"Botão Ação | Adicionar Dependente | CPF duplicado exibe erro ao tentar cadastrar", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
  { id:"PAC-ACAO-DEP-NASC-FUTURA",  module:"Pacientes", role:"recepcionista", title:"Botão Ação | Adicionar Dependente | Data de nascimento futura não é permitida", tipo:"Interface", prioridade:"Médio", camadas:["Frontend"], status:"pending" },
  // ── BOTÃO AÇÃO — EXCLUIR ─────────────────────────────────────────────────
  { id:"PAC-EXCLUIR", module:"Pacientes", role:"recepcionista", title:"Botão Ação | Excluir | Paciente some da lista e banco registra mudança de status e timestamp", tipo:"Funcional", prioridade:"Alto", camadas:["E2E"], status:"pending" },
];

const MODULES_ORDER = [
  "Autenticação e Cadastro",
  "Cliente",
  "Pacientes",
  "Portal do Paciente",
  "IA — Resumo",
  "IA — Risco de Falta",
  "IA — WhatsApp",
  "Roles — Admin",
  "Roles — Gestor",
  "Roles — Médico",
  "Roles — Recepcionista",
  "Roles — Segurança",
];

const MODULE_ABBREV = {
  "Autenticação e Cadastro": "Auth",
  "Cliente": "Cliente",
  "Portal do Paciente": "Portal",
  "IA — Resumo": "IA·Resumo",
  "IA — Risco de Falta": "IA·Risco",
  "IA — WhatsApp": "IA·WA",
  "Roles — Admin": "Admin",
  "Roles — Gestor": "Gestor",
  "Roles — Médico": "Médico",
  "Roles — Recepcionista": "Recep.",
  "Roles — Segurança": "Segurança",
};

const STATUS_CYCLE = ["pending", "passed", "failed", "blocked"];

const STATUS_CFG = {
  pending: { label: "Pendente",  color: C.pending, bg: C.pendingBg, Icon: Clock },
  passed:  { label: "Passou ✓",  color: C.passed,  bg: C.passedBg,  Icon: CheckCircle },
  failed:  { label: "Falhou ✗",  color: C.failed,  bg: C.failedBg,  Icon: XCircle },
  blocked: { label: "Bloqueado", color: C.blocked, bg: C.blockedBg, Icon: AlertCircle },
};

const PRIO_CFG = {
  "Crítico": { color: C.critical, bg: "#2a0a0a" },
  "Alto":    { color: C.high,     bg: "#2a1200" },
  "Médio":   { color: C.medium,   bg: "#0c1a3a" },
  "Baixo":   { color: C.low,      bg: "#1a1a1a" },
};

const TIPO_CFG = {
  "Funcional": { color: "#22c55e", bg: "#052e16" },
  "Segurança": { color: "#f97316", bg: "#2a1200" },
  "IA":        { color: "#a855f7", bg: "#1a0a2a" },
  "Carga":     { color: "#06b6d4", bg: "#0a2a2a" },
  "Interface": { color: "#3b82f6", bg: "#0c1a3a" },
};

const CAMADA_CFG = {
  "Backend":  { color: "#06b6d4", bg: "#0a2a2a" },
  "Frontend": { color: "#a855f7", bg: "#1a0a2a" },
  "E2E":      { color: "#f59e0b", bg: "#2a1800" },
};

const SEV_CFG = {
  "Crítico": { color: C.critical, bg: "#2a0a0a" },
  "Alto":    { color: C.high,     bg: "#2a1200" },
  "Médio":   { color: C.medium,   bg: "#0c1a3a" },
  "Baixo":   { color: C.low,      bg: "#1a1a1a" },
};

// ── STORAGE ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "qa-dashboard-v2";

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
      display: "flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700,
      cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <Icon size={18} color={color} />
      </div>
      <div style={{ color, fontSize: 36, fontWeight: 800, lineHeight: 1, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ color: C.textMuted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── DASHBOARD VIEW ─────────────────────────────────────────────────────────
function DashboardView({ cases, bugs }) {
  const total = cases.length;
  const passed = cases.filter(c => c.status === "passed").length;
  const failed = cases.filter(c => c.status === "failed").length;
  const blocked = cases.filter(c => c.status === "blocked").length;
  const pending = cases.filter(c => c.status === "pending").length;
  const executed = passed + failed + blocked;
  const coverage = total > 0 ? Math.round((executed / total) * 100) : 0;
  const openBugs = bugs.filter(b => b.status === "open").length;

  const chartData = MODULES_ORDER.map(mod => {
    const mc = cases.filter(c => c.module === mod);
    return {
      name: MODULE_ABBREV[mod] || mod,
      Passou: mc.filter(c => c.status === "passed").length,
      Falhou: mc.filter(c => c.status === "failed").length,
      Bloqueado: mc.filter(c => c.status === "blocked").length,
      Pendente: mc.filter(c => c.status === "pending").length,
      total: mc.length,
    };
  });

  const criticalFailed = cases.filter(c => c.status === "failed" && c.prioridade === "Crítico");
  const pendingCritical = cases.filter(c => c.status === "pending" && c.prioridade === "Crítico");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatCard label="Cobertura" value={`${coverage}%`} color={coverage > 70 ? C.passed : coverage > 40 ? C.blocked : C.failed} Icon={Layers} sub={`${executed}/${total} executados`} />
        <StatCard label="Passaram" value={passed} color={C.passed} Icon={CheckCircle} sub={total > 0 ? `${Math.round(passed / total * 100)}% do total` : ""} />
        <StatCard label="Falharam" value={failed} color={C.failed} Icon={XCircle} sub={total > 0 ? `${Math.round(failed / total * 100)}% do total` : ""} />
        <StatCard label="Bloqueados" value={blocked} color={C.blocked} Icon={AlertCircle} sub={total > 0 ? `${Math.round(blocked / total * 100)}% do total` : ""} />
        <StatCard label="Pendentes" value={pending} color={C.pending} Icon={Clock} sub="não executados" />
        <StatCard label="Bugs Abertos" value={openBugs} color={openBugs > 0 ? C.failed : C.passed} Icon={Bug} sub={`${bugs.length} total`} />
      </div>

      {/* Chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 20, letterSpacing: "0.04em" }}>
          COBERTURA POR MÓDULO
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: C.text, fontWeight: 700 }}
            />
            <Bar dataKey="Passou" stackId="a" fill={C.passed} />
            <Bar dataKey="Falhou" stackId="a" fill={C.failed} />
            <Bar dataKey="Bloqueado" stackId="a" fill={C.blocked} />
            <Bar dataKey="Pendente" stackId="a" fill={C.border} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
          {[["Passou", C.passed], ["Falhou", C.failed], ["Bloqueado", C.blocked], ["Pendente", C.border]].map(([k, col]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textDim }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: col, display: "inline-block" }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: C.failed, fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <XCircle size={14} /> CRÍTICOS COM FALHA ({criticalFailed.length})
          </h3>
          {criticalFailed.length === 0
            ? <p style={{ color: C.textMuted, fontSize: 13 }}>Nenhum crítico falhou ainda 🎉</p>
            : criticalFailed.slice(0, 5).map(c => (
              <div key={c.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "monospace" }}>{c.id}</span>
                  <span style={{ color: C.text, fontSize: 12 }}>{c.title}</span>
                </div>
              </div>
            ))
          }
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: C.blocked, fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={14} /> CRÍTICOS PENDENTES ({pendingCritical.length})
          </h3>
          {pendingCritical.length === 0
            ? <p style={{ color: C.textMuted, fontSize: 13 }}>Todos os críticos foram executados ✓</p>
            : pendingCritical.slice(0, 5).map(c => (
              <div key={c.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "monospace" }}>{c.id}</span>
                  <span style={{ color: C.text, fontSize: 12 }}>{c.title}</span>
                  <Badge text={c.module.replace("Roles — ", "")} color={C.textMuted} bg={C.border} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── TEST CASES VIEW ────────────────────────────────────────────────────────
function TestCasesView({ cases, onStatusChange, onAddNote, onAddCase, onEditCase }) {
  const [search, setSearch] = useState("");
  const [filterMod, setFilterMod] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPrio, setFilterPrio] = useState("Todos");
  const [filterCamada, setFilterCamada] = useState("Todos");
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: "", module: MODULES_ORDER[0], title: "", tipo: "Funcional", prioridade: "Crítico", camada: "E2E" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    const matchMod = filterMod === "Todos" || c.module === filterMod;
    const matchStatus = filterStatus === "Todos" || c.status === filterStatus;
    const matchPrio = filterPrio === "Todos" || c.prioridade === filterPrio;
    const matchCamada = filterCamada === "Todos" || (c.camadas || []).includes(filterCamada);
    return matchSearch && matchMod && matchStatus && matchPrio && matchCamada;
  });

  const inputStyle = {
    background: C.card, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none",
    fontFamily: "inherit"
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const inp = f => ({ ...f, background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" });

  const handleSubmit = () => {
    if (!form.id.trim() || !form.title.trim()) return;
    onAddCase({ ...form, id: form.id.trim(), status: "pending" });
    setForm({ id: "", module: MODULES_ORDER[0], title: "", tipo: "Funcional", prioridade: "Crítico", camada: "E2E" });
    setShowForm(false);
  };

  const startEdit = (c, e) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditForm({ title: c.title, module: c.module, tipo: c.tipo, prioridade: c.prioridade, camada: c.camada });
    setExpandedId(c.id);
  };

  const saveEdit = (id) => {
    if (!editForm.title.trim()) return;
    onEditCase(id, editForm);
    setEditingId(null);
  };

  return (
    <div>
      {/* Header row with button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: C.blue, color: "#fff", border: "none",
          borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700,
          cursor: "pointer"
        }}>
          <Plus size={14} /> Novo Caso
        </button>
      </div>

      {/* New case form */}
      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Novo Caso de Teste</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>ID *</label>
              <input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="Ex: PAC-01" style={inp({})} />
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>MÓDULO</label>
              <select value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} style={inp({ cursor: "pointer" })}>
                {MODULES_ORDER.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>CAMADA</label>
              <select value={form.camada} onChange={e => setForm(f => ({ ...f, camada: e.target.value }))} style={inp({ cursor: "pointer" })}>
                {["Backend", "Frontend", "E2E"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TÍTULO *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Descreva o cenário de teste..." style={inp({})} />
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TIPO</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inp({ cursor: "pointer" })}>
                {["Funcional", "Segurança", "IA", "Interface", "Carga"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>PRIORIDADE</label>
              <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))} style={inp({ cursor: "pointer" })}>
                {["Crítico", "Alto", "Médio", "Baixo"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleSubmit} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Salvar Caso</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID ou título..."
            style={{ ...inputStyle, paddingLeft: 32, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <select value={filterMod} onChange={e => setFilterMod(e.target.value)} style={selectStyle}>
          <option>Todos</option>
          {MODULES_ORDER.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filterCamada} onChange={e => setFilterCamada(e.target.value)} style={selectStyle}>
          <option>Todos</option>
          {["Backend", "Frontend", "E2E"].map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option>Todos</option>
          {["pending", "passed", "failed", "blocked"].map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)} style={selectStyle}>
          <option>Todos</option>
          {["Crítico", "Alto", "Médio", "Baixo"].map(p => <option key={p}>{p}</option>)}
        </select>
        <span style={{ color: C.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{filtered.length} casos</span>
      </div>

      {/* Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.map(c => {
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} style={{
              background: isExpanded ? C.cardHover : C.card,
              border: `1px solid ${isExpanded ? C.borderLight : C.border}`,
              borderRadius: 8, overflow: "hidden", transition: "all 0.15s"
            }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", flexWrap: "wrap" }}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <span style={{ color: C.blue, fontSize: 12, fontWeight: 700, fontFamily: "monospace", minWidth: 130 }}>{c.id}</span>
                <span style={{ color: C.text, fontSize: 13, flex: 1, minWidth: 150 }}>{c.title}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <Badge text={c.prioridade} color={PRIO_CFG[c.prioridade]?.color || C.textMuted} bg={PRIO_CFG[c.prioridade]?.bg || C.border} />
                  <Badge text={c.tipo} color={TIPO_CFG[c.tipo]?.color || C.textMuted} bg={TIPO_CFG[c.tipo]?.bg || C.border} />
                  {(c.camadas || []).map(cam => <Badge key={cam} text={cam} color={CAMADA_CFG[cam]?.color || C.textMuted} bg={CAMADA_CFG[cam]?.bg || C.border} />)}
                  <StatusBtn status={c.status} onClick={e => { e.stopPropagation(); onStatusChange(c.id); }} />
                  <button onClick={e => startEdit(c, e)} style={{ background: "transparent", color: C.textMuted, border: "none", cursor: "pointer", padding: 4, borderRadius: 4, lineHeight: 0 }} title="Editar caso">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {isExpanded ? <ChevronUp size={14} color={C.textMuted} /> : <ChevronDown size={14} color={C.textMuted} />}
                </div>
              </div>
              {isExpanded && (
                <div style={{ padding: "0 16px 16px 16px", borderTop: `1px solid ${C.border}` }}>
                  {editingId === c.id ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TÍTULO</label>
                          <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={inp({})} />
                        </div>
                        <div>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>MÓDULO</label>
                          <select value={editForm.module} onChange={e => setEditForm(f => ({ ...f, module: e.target.value }))} style={inp({ cursor: "pointer" })}>
                            {MODULES_ORDER.map(m => <option key={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TIPO</label>
                          <select value={editForm.tipo} onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))} style={inp({ cursor: "pointer" })}>
                            {["Funcional", "Segurança", "IA", "Interface", "Carga"].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>PRIORIDADE</label>
                          <select value={editForm.prioridade} onChange={e => setEditForm(f => ({ ...f, prioridade: e.target.value }))} style={inp({ cursor: "pointer" })}>
                            {["Crítico", "Alto", "Médio", "Baixo"].map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>CAMADA</label>
                          <select value={editForm.camada} onChange={e => setEditForm(f => ({ ...f, camada: e.target.value }))} style={inp({ cursor: "pointer" })}>
                            {["Backend", "Frontend", "E2E"].map(cam => <option key={cam}>{cam}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                        <button onClick={() => saveEdit(c.id)} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Módulo</p>
                          <p style={{ color: C.textDim, fontSize: 13 }}>{c.module}</p>
                        </div>
                        <div style={{ flex: 1, minWidth: 100 }}>
                          <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Camadas</p>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {(c.camadas || []).map(cam => <Badge key={cam} text={cam} color={CAMADA_CFG[cam]?.color || C.textMuted} bg={CAMADA_CFG[cam]?.bg || C.border} />)}
                          </div>
                        </div>
                      </div>

                      {/* Resultado do teste automatizado */}
                      {(c.testDate || c.testError) && (
                        <div style={{
                          marginTop: 12, borderRadius: 8, padding: "12px 14px",
                          background: c.status === "passed" ? C.passedBg : C.failedBg,
                          border: `1px solid ${c.status === "passed" ? C.passed + "44" : C.failed + "44"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Último resultado automatizado
                            </span>
                            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                              {c.testDate} {c.testTime}
                            </span>
                          </div>
                          {c.testError && (
                            <pre style={{
                              marginTop: 8, fontSize: 11, color: C.failed,
                              fontFamily: "monospace", whiteSpace: "pre-wrap",
                              wordBreak: "break-all", background: "transparent", border: "none", padding: 0
                            }}>{c.testError}</pre>
                          )}
                          {c.reportUrl && (
                            <div style={{ marginTop: 8 }}>
                              <span style={{ fontSize: 11, color: C.textMuted }}>
                                Para ver o relatório completo: {" "}
                                <a href={c.reportUrl} target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 11, fontWeight: 700 }}>Ver relatório completo →</a>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: 12 }}>
                        <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notas de Execução</p>
                        <textarea
                          value={notes[c.id] || c.note || ""}
                          onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                          onBlur={e => onAddNote(c.id, e.target.value)}
                          placeholder="Descreva o resultado, ambiente, evidências..."
                          style={{
                            width: "100%", boxSizing: "border-box",
                            background: "#070d1a", border: `1px solid ${C.border}`,
                            color: C.textDim, borderRadius: 6, padding: 10,
                            fontSize: 12, fontFamily: "monospace", resize: "vertical",
                            minHeight: 70, outline: "none"
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Nenhum caso encontrado com esses filtros.</div>
        )}
      </div>
    </div>
  );
}

// ── BUGS VIEW ──────────────────────────────────────────────────────────────
function BugsView({ bugs, onAdd, onToggle, onDelete, onEdit }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", module: "Autenticação e Cadastro", severity: "Alto", description: "", status: "open" });
  const [images, setImages] = useState([]);
  const [expandedBug, setExpandedBug] = useState(null);
  const [pasteHint, setPasteHint] = useState(false);
  const [editingBugId, setEditingBugId] = useState(null);
  const [editBugForm, setEditBugForm] = useState({});
  const [filterBugMod, setFilterBugMod] = useState("Todos");
  const [filterBugStatus, setFilterBugStatus] = useState("Todos");
  const inp = f => ({ ...f, background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" });

  const addImageFromFile = (file, name) => {
    const reader = new FileReader();
    reader.onload = ev => setImages(prev => [...prev, { name, data: ev.target.result }]);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    Array.from(e.target.files).forEach(f => addImageFromFile(f, f.name));
    e.target.value = "";
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    e.preventDefault();
    imageItems.forEach((item, i) => {
      const file = item.getAsFile();
      if (file) addImageFromFile(file, `print-${Date.now()}-${i}.png`);
    });
    setPasteHint(true);
    setTimeout(() => setPasteHint(false), 2000);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: `BUG-${String(Date.now()).slice(-4)}`, date: new Date().toLocaleDateString("pt-BR"), images });
    setForm({ title: "", module: "Autenticação e Cadastro", severity: "Alto", description: "", status: "open" });
    setImages([]);
    setShowForm(false);
  };

  const startEditBug = (b) => {
    setEditingBugId(b.id);
    setEditBugForm({ title: b.title, module: b.module, severity: b.severity, description: b.description || "" });
    setExpandedBug(b.id);
  };

  const saveEditBug = (id) => {
    if (!editBugForm.title.trim()) return;
    onEdit(id, editBugForm);
    setEditingBugId(null);
  };

  const bugModules = ["Todos", ...Array.from(new Set(bugs.map(b => b.module))).sort()];
  const filteredBugs = bugs.filter(b => {
    const matchMod = filterBugMod === "Todos" || b.module === filterBugMod;
    const matchStatus = filterBugStatus === "Todos" || b.status === filterBugStatus;
    return matchMod && matchStatus;
  });
  const open = bugs.filter(b => b.status === "open");
  const resolved = bugs.filter(b => b.status === "resolved");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ color: C.failed, fontWeight: 700, fontSize: 13 }}>{open.length} abertos</span>
          <span style={{ color: C.passed, fontWeight: 700, fontSize: 13 }}>{resolved.length} resolvidos</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: C.blue, color: "#fff", border: "none",
          borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700,
          cursor: "pointer"
        }}>
          <Plus size={14} /> Registrar Bug
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filterBugMod} onChange={e => setFilterBugMod(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {bugModules.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filterBugStatus} onChange={e => setFilterBugStatus(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="Todos">Todos</option>
          <option value="open">Abertos</option>
          <option value="resolved">Resolvidos</option>
        </select>
        <span style={{ color: C.textMuted, fontSize: 12 }}>{filteredBugs.length} bug{filteredBugs.length !== 1 ? "s" : ""}</span>
      </div>

      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Novo Bug</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TÍTULO *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Descreva o bug..." style={inp({})} />
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>MÓDULO</label>
              <select value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} style={inp({ cursor: "pointer" })}>
                {MODULES_ORDER.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>SEVERIDADE</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} style={inp({ cursor: "pointer" })}>
                {["Crítico", "Alto", "Médio", "Baixo"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>DESCRIÇÃO / PASSOS PARA REPRODUZIR</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="1. Acessar...\n2. Clicar em...\n3. Observar..." style={{ ...inp({}), minHeight: 80, resize: "vertical", fontFamily: "monospace" }} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 8 }}>SCREENSHOTS / EVIDÊNCIAS</label>
              <div
                onPaste={handlePaste}
                tabIndex={0}
                style={{
                  background: C.bg, border: `1px dashed ${pasteHint ? C.passed : C.borderLight}`,
                  borderRadius: 8, padding: "14px 16px", outline: "none",
                  transition: "border-color 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: C.textMuted, fontSize: 13 }}>
                    <Plus size={14} /> Selecionar arquivo
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
                  </label>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>ou</span>
                  <span style={{
                    color: pasteHint ? C.passed : C.textMuted, fontSize: 12,
                    fontFamily: "monospace", transition: "color 0.2s"
                  }}>
                    {pasteHint ? "✓ Print colado!" : "Ctrl+V para colar print"}
                  </span>
                </div>
                {images.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {images.map((img, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={img.data} alt={img.name} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}` }} />
                        <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{
                          position: "absolute", top: -6, right: -6, background: C.failed, border: "none",
                          borderRadius: "50%", width: 18, height: 18, cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", padding: 0
                        }}>
                          <X size={10} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleSubmit} style={{ background: C.failed, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Salvar Bug</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredBugs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Nenhum bug encontrado com esses filtros.</div>}
        {filteredBugs.map(b => {
          const isExpanded = expandedBug === b.id;
          const hasImages = b.images && b.images.length > 0;
          return (
            <div key={b.id} style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${b.status === "resolved" ? C.passed : (SEV_CFG[b.severity]?.color || C.failed)}`,
              borderRadius: 8, overflow: "hidden",
              opacity: b.status === "resolved" ? 0.6 : 1
            }}>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ color: C.failed, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{b.id}</span>
                      <Badge text={b.severity} color={SEV_CFG[b.severity]?.color || C.failed} bg={SEV_CFG[b.severity]?.bg || C.failedBg} />
                      <Badge text={b.module} color={C.textMuted} bg={C.border} />
                      <span style={{ color: C.textMuted, fontSize: 11 }}>{b.date}</span>
                      {b.status === "resolved" && <Badge text="Resolvido" color={C.passed} bg={C.passedBg} />}
                      {hasImages && (
                        <button onClick={() => setExpandedBug(isExpanded ? null : b.id)} style={{
                          background: C.blueBg, color: C.blue, border: `1px solid ${C.blue}33`,
                          borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "monospace"
                        }}>
                          {b.images.length} foto{b.images.length > 1 ? "s" : ""} {isExpanded ? "▲" : "▼"}
                        </button>
                      )}
                    </div>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{b.title}</p>
                    {b.description && <p style={{ color: C.textMuted, fontSize: 12, marginTop: 4, fontFamily: "monospace", whiteSpace: "pre-line" }}>{b.description}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onToggle(b.id)} title={b.status === "open" ? "Marcar resolvido" : "Reabrir"} style={{
                      background: b.status === "open" ? C.passedBg : C.border,
                      color: b.status === "open" ? C.passed : C.textMuted,
                      border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700
                    }}>
                      {b.status === "open" ? "✓ Resolver" : "↺ Reabrir"}
                    </button>
                    <button onClick={() => startEditBug(b)} style={{ background: "transparent", color: C.textMuted, border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }} title="Editar bug">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => onDelete(b.id)} style={{ background: "transparent", color: C.textMuted, border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div style={{ padding: "0 16px 16px 16px", borderTop: `1px solid ${C.border}` }}>
                  {editingBugId === b.id ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TÍTULO</label>
                          <input value={editBugForm.title} onChange={e => setEditBugForm(f => ({ ...f, title: e.target.value }))} style={inp({})} />
                        </div>
                        <div>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>MÓDULO</label>
                          <select value={editBugForm.module} onChange={e => setEditBugForm(f => ({ ...f, module: e.target.value }))} style={inp({ cursor: "pointer" })}>
                            {MODULES_ORDER.map(m => <option key={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>SEVERIDADE</label>
                          <select value={editBugForm.severity} onChange={e => setEditBugForm(f => ({ ...f, severity: e.target.value }))} style={inp({ cursor: "pointer" })}>
                            {["Crítico", "Alto", "Médio", "Baixo"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>DESCRIÇÃO</label>
                          <textarea value={editBugForm.description} onChange={e => setEditBugForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp({}), minHeight: 70, resize: "vertical", fontFamily: "monospace" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setEditingBugId(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                        <button onClick={() => saveEditBug(b.id)} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
                      </div>
                    </div>
                  ) : hasImages && (
                    <>
                      <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 8px" }}>Screenshots</p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {b.images.map((img, i) => (
                          <a key={i} href={img.data} target="_blank" rel="noreferrer" title={img.name}>
                            <img src={img.data} alt={img.name} style={{
                              height: 120, maxWidth: 200, objectFit: "cover",
                              borderRadius: 8, border: `1px solid ${C.border}`,
                              cursor: "zoom-in"
                            }} />
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── REPORT VIEW ────────────────────────────────────────────────────────────
function ReportView({ cases, bugs }) {
  const total = cases.length;
  const passed = cases.filter(c => c.status === "passed").length;
  const failed = cases.filter(c => c.status === "failed").length;
  const blocked = cases.filter(c => c.status === "blocked").length;
  const pending = cases.filter(c => c.status === "pending").length;
  const executed = passed + failed + blocked;
  const coverage = total > 0 ? Math.round(executed / total * 100) : 0;
  const openBugs = bugs.filter(b => b.status === "open").length;
  const today = new Date().toLocaleDateString("pt-BR");

  const modStats = MODULES_ORDER.map(mod => {
    const mc = cases.filter(c => c.module === mod);
    return {
      mod, total: mc.length,
      passed: mc.filter(c => c.status === "passed").length,
      failed: mc.filter(c => c.status === "failed").length,
      blocked: mc.filter(c => c.status === "blocked").length,
      pending: mc.filter(c => c.status === "pending").length,
    };
  });

  const go = coverage >= 80 && failed === 0 && blocked === 0;
  const warn = coverage >= 50 && failed <= 2;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: 0 }}>Relatório de Testes</h2>
        <button onClick={() => window.print()} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.blue, color: "#fff", border: "none",
          borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer"
        }}>
          <Printer size={14} /> Imprimir / Salvar PDF
        </button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>PROJETO</p>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>Sistema de Gestão de Clínica / Consultório</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>DATA DO RELATÓRIO</p>
            <p style={{ color: C.text, fontSize: 14 }}>{today}</p>
          </div>
        </div>
        <div style={{
          background: go ? C.passedBg : warn ? C.blockedBg : C.failedBg,
          border: `1px solid ${go ? C.passed : warn ? C.blocked : C.failed}`,
          borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10
        }}>
          {go ? <CheckCircle size={18} color={C.passed} /> : warn ? <AlertCircle size={18} color={C.blocked} /> : <XCircle size={18} color={C.failed} />}
          <span style={{ color: go ? C.passed : warn ? C.blocked : C.failed, fontWeight: 800, fontSize: 14 }}>
            {go ? "✅ APTO PARA PRODUÇÃO — Todos os critérios atendidos"
              : warn ? "⚠ CONDICIONAL — Ajustes necessários antes do go-live"
              : "🚫 NÃO APTO — Cobertura insuficiente ou falhas críticas pendentes"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          ["Total", total, C.blue],
          ["Passaram", passed, C.passed],
          ["Falharam", failed, C.failed],
          ["Bloqueados", blocked, C.blocked],
          ["Pendentes", pending, C.pending],
          ["Bugs Abertos", openBugs, openBugs > 0 ? C.failed : C.passed],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ color, fontSize: 28, fontWeight: 800, fontFamily: "monospace" }}>{val}</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: C.textDim, fontSize: 13, fontWeight: 700 }}>Cobertura Geral</span>
          <span style={{ color: coverage > 70 ? C.passed : coverage > 40 ? C.blocked : C.failed, fontSize: 20, fontWeight: 800, fontFamily: "monospace" }}>{coverage}%</span>
        </div>
        <div style={{ background: C.border, borderRadius: 8, height: 12, overflow: "hidden" }}>
          <div style={{ width: `${coverage}%`, height: "100%", background: coverage > 70 ? C.passed : coverage > 40 ? C.blocked : C.failed, borderRadius: 8, transition: "width 0.5s" }} />
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Resultado por Módulo</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Módulo", "Total", "Passou", "Falhou", "Bloqueado", "Pendente", "Cobertura"].map(h => (
                <th key={h} style={{ color: C.textMuted, textAlign: h === "Módulo" ? "left" : "center", padding: "6px 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modStats.map(s => {
              const cov = s.total > 0 ? Math.round((s.passed + s.failed + s.blocked) / s.total * 100) : 0;
              return (
                <tr key={s.mod} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ color: C.text, padding: "10px 8px", fontWeight: 600 }}>{s.mod}</td>
                  <td style={{ color: C.textDim, textAlign: "center", padding: "10px 8px" }}>{s.total}</td>
                  <td style={{ color: C.passed, textAlign: "center", padding: "10px 8px", fontWeight: 700 }}>{s.passed}</td>
                  <td style={{ color: s.failed > 0 ? C.failed : C.textMuted, textAlign: "center", padding: "10px 8px", fontWeight: s.failed > 0 ? 700 : 400 }}>{s.failed}</td>
                  <td style={{ color: s.blocked > 0 ? C.blocked : C.textMuted, textAlign: "center", padding: "10px 8px", fontWeight: s.blocked > 0 ? 700 : 400 }}>{s.blocked}</td>
                  <td style={{ color: C.textMuted, textAlign: "center", padding: "10px 8px" }}>{s.pending}</td>
                  <td style={{ textAlign: "center", padding: "10px 8px" }}>
                    <span style={{ color: cov > 70 ? C.passed : cov > 40 ? C.blocked : C.failed, fontWeight: 700, fontFamily: "monospace" }}>{cov}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {bugs.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bugs Encontrados ({bugs.length})</h3>
          {bugs.map(b => (
            <div key={b.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.failed, fontFamily: "monospace", fontSize: 12, minWidth: 90, fontWeight: 700 }}>{b.id}</span>
              <Badge text={b.severity} color={SEV_CFG[b.severity]?.color || C.failed} bg={SEV_CFG[b.severity]?.bg || C.failedBg} />
              <span style={{ color: C.text, fontSize: 13, flex: 1 }}>{b.title}</span>
              <Badge text={b.status === "resolved" ? "Resolvido" : "Aberto"} color={b.status === "resolved" ? C.passed : C.failed} bg={b.status === "resolved" ? C.passedBg : C.failedBg} />
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
    loadData().then(async data => {
      // Bugs: merge seed sem sobrescrever
      const storedBugs = data?.bugs || INITIAL_BUGS;
      const storedBugIds = new Set(storedBugs.map(b => b.id));
      const mergedBugs = [...storedBugs, ...SEED_BUGS_RECEP.filter(b => !storedBugIds.has(b.id))];

      // Cases: merge seeds sem sobrescrever
      const storedCases = data?.cases || INITIAL_CASES;
      const storedCaseIds = new Set(storedCases.map(c => c.id));
      let mergedCases = [
        ...storedCases,
        ...SEED_CASES_AUTO.filter(c => !storedCaseIds.has(c.id)),
        ...SEED_CASES_PACIENTES.filter(c => !storedCaseIds.has(c.id)),
      ];

      // Aplica resultados dos testes automatizados — só atualiza status, nunca substitui dados
      try {
        const res = await fetch('/test-results.json');
        if (res.ok) {
          const results = await res.json();
          mergedCases = mergedCases.map(c => {
            const r = results[c.id];
            if (!r) return c;
            if (typeof r === 'string') return { ...c, status: r };
            return { ...c, status: r.status, testError: r.error, testDate: r.date, testTime: r.time, reportUrl: r.reportUrl };
          });
        }
      } catch {}

      setCases(mergedCases);
      setBugs(mergedBugs);
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

  const handleAddCase = useCallback((newCase) => {
    setCases(prev => [...prev, newCase]);
  }, []);

  const handleEditCase = useCallback((id, updated) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  }, []);

  const handleAddBug = useCallback((bug) => {
    setBugs(prev => [bug, ...prev]);
  }, []);

  const handleEditBug = useCallback((id, updated) => {
    setBugs(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  }, []);

  const handleToggleBug = useCallback((id) => {
    setBugs(prev => prev.map(b => b.id === id ? { ...b, status: b.status === "open" ? "resolved" : "open" } : b));
  }, []);

  const handleDeleteBug = useCallback((id) => {
    setBugs(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleReset = () => {
    if (!window.confirm("Resetar todos os testes para Pendente? Bugs serão mantidos.")) return;
    setCases(prev => prev.map(c => ({ ...c, status: "pending", note: "" })));
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "cases",     label: "Casos de Teste", Icon: List },
    { id: "bugs",      label: "Bugs", Icon: Bug },
    { id: "report",    label: "Relatório", Icon: FileText },
  ];

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textMuted, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
          Carregando dados...
        </div>
      </div>
    );
  }

  const openBugsCount = bugs.filter(b => b.status === "open").length;
  const failedCount = cases.filter(c => c.status === "failed").length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif", color: C.text }}>
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
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", display: "flex", alignItems: "center", height: 56, gap: 24,
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>QA</span>
          <span style={{ color: C.textMuted, fontSize: 15 }}>Dashboard</span>
        </div>

        <nav style={{ display: "flex", gap: 2, flex: 1 }}>
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setView(id)} style={{
              display: "flex", alignItems: "center", gap: 7,
              background: view === id ? C.blueBg : "transparent",
              color: view === id ? C.blue : C.textMuted,
              border: view === id ? `1px solid ${C.blue}33` : "1px solid transparent",
              borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: view === id ? 700 : 500,
              cursor: "pointer", transition: "all 0.15s"
            }}>
              <Icon size={14} />
              {label}
              {id === "bugs" && openBugsCount > 0 && (
                <span style={{ background: C.failed, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800, marginLeft: 2 }}>{openBugsCount}</span>
              )}
              {id === "cases" && failedCount > 0 && (
                <span style={{ background: C.failed, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800, marginLeft: 2 }}>{failedCount}</span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={handleReset} title="Resetar todos os casos para Pendente" style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", color: C.textMuted,
          border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "6px 12px", fontSize: 12, cursor: "pointer"
        }}>
          <RefreshCw size={13} /> Resetar
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 24px", maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
            {view === "dashboard" && "Visão Geral"}
            {view === "cases" && `Casos de Teste (${cases.length})`}
            {view === "bugs" && `Bugs (${bugs.length})`}
            {view === "report" && "Relatório para o Cliente"}
          </h1>
          {view === "cases" && <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>Clique no status para avançar → Pendente → Passou → Falhou → Bloqueado → Pendente</p>}
        </div>

        {view === "dashboard" && <DashboardView cases={cases} bugs={bugs} />}
        {view === "cases"     && <TestCasesView cases={cases} onStatusChange={handleStatusChange} onAddNote={handleAddNote} onAddCase={handleAddCase} onEditCase={handleEditCase} />}
        {view === "bugs"      && <BugsView bugs={bugs} onAdd={handleAddBug} onToggle={handleToggleBug} onDelete={handleDeleteBug} onEdit={handleEditBug} />}
        {view === "report"    && <ReportView cases={cases} bugs={bugs} />}
      </div>
    </div>
  );
}
