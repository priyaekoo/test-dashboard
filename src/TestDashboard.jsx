import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "./firebase";
import { ref as dbRef, set as dbSet, onValue } from "firebase/database";
import {
  CheckCircle, XCircle, Clock, Bug, LayoutDashboard,
  ChevronRight, Plus, X, MessageSquare, Upload,
  Edit2, Trash2, RefreshCw, Layers, ChevronDown, ChevronUp
} from "lucide-react";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#070d1a", card: "#0d1526", cardHover: "#111d33",
  border: "#1a2540", borderLight: "#243050",
  text: "#e2e8f0", textMuted: "#64748b", textDim: "#94a3b8",
  passed: "#22c55e", passedBg: "#052e16",
  failed: "#ef4444", failedBg: "#2a0a0a",
  pending: "#475569", pendingBg: "#0f172a",
  blue: "#3b82f6", blueBg: "#0c1a3a",
  purple: "#a855f7", purpleBg: "#1a0a2a",
  amber: "#f59e0b", amberBg: "#2a1800",
};

const MANUAL_STATUS_CYCLE = ["pendente", "aguarda", "passou", "falhou"];
const MANUAL_STATUS_CFG = {
  pendente: { label: "Pendente",         color: C.pending, bg: C.pendingBg, Icon: Clock },
  aguarda:  { label: "Aguarda resposta", color: C.amber,   bg: C.amberBg,  Icon: MessageSquare },
  passou:   { label: "Passou ✓",         color: C.passed,  bg: C.passedBg,  Icon: CheckCircle },
  falhou:   { label: "Falhou ✗",         color: C.failed,  bg: C.failedBg,  Icon: XCircle },
};
const TIPO_CFG = {
  "Validação de campo": { color: "#3b82f6", bg: "#0c1a3a" },
  "Regra de negócio":   { color: "#f59e0b", bg: "#2a1800" },
  "Interface":          { color: "#a855f7", bg: "#1a0a2a" },
  "Funcional":          { color: "#22c55e", bg: "#052e16" },
};
const SEV_CFG = {
  "Crítico": { color: "#ef4444", bg: "#2a0a0a" },
  "Alto":    { color: "#f97316", bg: "#2a1200" },
  "Médio":   { color: "#3b82f6", bg: "#0c1a3a" },
  "Baixo":   { color: "#64748b", bg: "#1a1a1a" },
};
const TIPOS = ["Validação de campo", "Regra de negócio", "Interface", "Funcional"];
const STORAGE_KEY = "qa-dashboard-v3";

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_ROLES = [
  {
    id: "recepcionista", label: "Recepcionista", color: "#3b82f6",
    funcionalidades: [
      {
        id: "f-cadastro-paciente", label: "Cadastro de Paciente",
        e2e: [
          { id: "PAC-E2E-01", title: "Cadastrar novo paciente com dados válidos e verificar persistência", status: "pendente" },
          { id: "PAC-E2E-02", title: "Editar paciente existente e confirmar atualização na listagem", status: "pendente" },
          { id: "PAC-E2E-03", title: "Inativar paciente e validar ausência em novos agendamentos", status: "pendente" },
          { id: "PAC-E2E-04", title: "Buscar paciente por nome, CPF e e-mail", status: "pendente" },
        ],
        manual: [
          { id: "MT-PAC-01", contexto: "Formulário novo paciente", title: "Campo Nome — obrigatório — bloqueia envio se vazio", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-02", contexto: "Formulário novo paciente", title: "Campo CPF — formato inválido exibe erro inline", tipo: "Validação de campo", status: "falhou", bugId: "BUG-AUTO-MT-PAC-02", images: [], note: "" },
          { id: "MT-PAC-03", contexto: "Formulário novo paciente", title: "Campo CPF — duplicado bloqueia cadastro com mensagem de erro", tipo: "Validação de campo", status: "falhou", bugId: "BUG-AUTO-MT-PAC-03", images: [], note: "" },
          { id: "MT-PAC-04", contexto: "Formulário novo paciente", title: "Campo Data de Nascimento — data futura é rejeitada com mensagem", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-05", contexto: "Formulário novo paciente", title: "Campo Data de Nascimento — ano inválido (ex: 9999) é rejeitado e não persiste", tipo: "Validação de campo", status: "falhou", bugId: "BUG-AUTO-MT-PAC-05", images: [], note: "" },
          { id: "MT-PAC-06", contexto: "Formulário novo paciente", title: "Campo Telefone — formato inválido exibe erro inline", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-07", contexto: "Formulário novo paciente", title: "Campo E-mail — formato inválido exibe erro inline", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-08", contexto: "Formulário novo paciente", title: "Campo E-mail — não obrigatório — envia sem preencher", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-09", contexto: "Formulário novo paciente", title: "Labels dos campos não somem ao clicar — usuário mantém referência visual", tipo: "Interface", status: "falhou", bugId: "BUG-AUTO-MT-PAC-09", images: [], note: "" },
          { id: "MT-PAC-10", contexto: "Formulário novo paciente", title: "Botões 'Cancelar' e 'Criar paciente' visíveis com zoom do navegador em 100%", tipo: "Interface", status: "falhou", bugId: "BUG-AUTO-MT-PAC-10", images: [], note: "" },
          { id: "MT-PAC-11", contexto: "Tela principal", title: "Busca por CPF retorna o paciente correto na listagem", tipo: "Funcional", status: "falhou", bugId: "BUG-AUTO-MT-PAC-11", images: [], note: "" },
          { id: "MT-PAC-12", contexto: "Tela principal", title: "Busca sem resultados exibe mensagem informativa ao usuário", tipo: "Funcional", status: "falhou", bugId: "BUG-AUTO-MT-PAC-12", images: [], note: "" },
          { id: "MT-PAC-13", contexto: "Tela principal", title: "Limpar filtros restaura a listagem completa de pacientes", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-14", contexto: "Tela principal", title: "Validar filtro por \"nome\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-15", contexto: "Tela principal", title: "Validar filtro por \"Telefone\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-16", contexto: "Tela principal", title: "Validar retorno correto dos resultados", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-17", contexto: "Tela principal", title: "Validar que a listagem reflete alterações (criação, edição, exclusão)", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-18", contexto: "Novo paciente > Dados Pessoais", title: "Criar paciente com dados válidos e persistência de dados no banco de dados", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-19", contexto: "Novo paciente > Dados Pessoais", title: "Validar que o novo paciente aparece na listagem", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-20", contexto: "Novo paciente > Dados Pessoais", title: "Campos obrigatórios impedem envio quando vazios", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-21", contexto: "Novo paciente > Dados Pessoais", title: "Aplicação não aceita duplicidade de CPF e Nome", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-22", contexto: "Novo paciente > Dados Pessoais", title: "Validar campo E-mail somente com formatos válidos com os parâmetros corretos", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-PAC-23", contexto: "Novo paciente > Dados Pessoais", title: "Ao incluir um paciente menor de idade, a aplicação deve solicitar o vínculo de um responsável", tipo: "Regra de negócio", status: "aguarda", bugId: null, images: [], note: "", comments: [] },
          { id: "MT-END-01", contexto: "Novo paciente > Endereço", title: "Criar paciente sem endereço (fluxo válido)", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-END-02", contexto: "Novo paciente > Endereço", title: "Criar paciente com endereço completo", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-END-03", contexto: "Novo paciente > Endereço", title: "Validar persistência dos dados de endereço", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-END-04", contexto: "Novo paciente > Endereço", title: "Validar comportamento ao preencher CEP (quando aplicável)", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-END-05", contexto: "Novo paciente > Endereço", title: "Validar comportamento com dados inválidos", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-DEP-01", contexto: "Dependente", title: "Dependente com mesmo nome e CPF não é aceito — duplicidade bloqueada", tipo: "Validação de campo", status: "falhou", bugId: "BUG-AUTO-MT-DEP-01", images: [], note: "" },
          { id: "MT-DEP-02", contexto: "Novo dependente", title: "Criar dependente vinculado a um paciente", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-DEP-03", contexto: "Novo dependente", title: "Validar que o dependente aparece corretamente", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-DEP-04", contexto: "Novo dependente", title: "Validar que um dependente não pode ser vinculado se já existir vínculo", tipo: "Regra de negócio", status: "aguarda", bugId: null, images: [], note: "", comments: [] },
          { id: "MT-DEP-05", contexto: "Novo dependente", title: "Impedir criação de dependente sem responsável", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-DEP-06", contexto: "Novo dependente", title: "CPF inválido exibe mensagem de erro", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-DEP-07", contexto: "Novo dependente", title: "CPF duplicado exibe erro ao tentar cadastrar", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-DEP-08", contexto: "Novo dependente", title: "Data de nascimento futura não é permitida", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-ACO-01", contexto: "Botão Ação", title: "Editar todos os dados de um paciente e validar a persistência dos dados na tela e no banco de dados", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-ACO-02", contexto: "Botão Ação", title: "Editar todos os dados de um dependente e validar a persistência dos dados na tela e no banco de dados", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
        ],
        bugs: [
          { id: "BUG-AUTO-MT-PAC-02", title: "[AUTO] Campo CPF — formato inválido exibe erro inline", severity: "Crítico", status: "open", mtId: "MT-PAC-02", images: [], comments: [], date: "22/04/2026", description: "Inserir CPF com dígitos inválidos (ex: 111.111.111-11) → sistema aceita e salva sem erro. Esperado: validação de CPF com mensagem de erro." },
          { id: "BUG-AUTO-MT-PAC-03", title: "[AUTO] Campo CPF — duplicado bloqueia cadastro com mensagem de erro", severity: "Crítico", status: "open", mtId: "MT-PAC-03", images: [], comments: [], date: "22/04/2026", description: "Cadastrar paciente com CPF já existente → sistema salva sem aviso. Registro duplicado aparece na listagem." },
          { id: "BUG-AUTO-MT-PAC-05", title: "[AUTO] Campo Data de Nascimento — ano inválido não persiste", severity: "Alto", status: "open", mtId: "MT-PAC-05", images: [], comments: [], date: "22/04/2026", description: "Preencher data de nascimento com ano inválido (ex: 9999) → sistema salva sem erro → ao reabrir o campo aparece vazio." },
          { id: "BUG-AUTO-MT-PAC-09", title: "[AUTO] Labels dos campos somem ao clicar", severity: "Médio", status: "open", mtId: "MT-PAC-09", images: [], comments: [], date: "22/04/2026", description: "Ao clicar em campos como CPF no formulário, a label desaparece completamente." },
          { id: "BUG-AUTO-MT-PAC-10", title: "[AUTO] Botões somem em zoom 100%", severity: "Alto", status: "open", mtId: "MT-PAC-10", images: [], comments: [], date: "22/04/2026", description: "Com zoom em 100%, os botões do modal ficam fora da área visível. Visíveis apenas com zoom em 80%." },
          { id: "BUG-AUTO-MT-PAC-11", title: "[AUTO] Filtro por CPF não funciona", severity: "Alto", status: "open", mtId: "MT-PAC-11", images: [], comments: [], date: "22/04/2026", description: "Digitar CPF existente no campo de busca → listagem não retorna o paciente." },
          { id: "BUG-AUTO-MT-PAC-12", title: "[AUTO] Busca sem resultados não exibe mensagem", severity: "Médio", status: "open", mtId: "MT-PAC-12", images: [], comments: [], date: "22/04/2026", description: "Buscar termo inexistente → tela fica em branco sem mensagem informativa." },
          { id: "BUG-AUTO-MT-DEP-01", title: "[AUTO] Dependente duplicado não é bloqueado", severity: "Crítico", status: "open", mtId: "MT-DEP-01", images: [], comments: [], date: "22/04/2026", description: "Cadastrar dependente com nome e CPF já vinculados ao mesmo paciente → sistema permite e salva o duplicado." },
        ],
      },
      {
        id: "f-financeiro", label: "Financeiro",
        e2e: [
          { id: "FIN-E2E-01", title: "Registrar pagamento com dados válidos e verificar persistência", status: "pendente" },
          { id: "FIN-E2E-02", title: "Editar pagamento existente e confirmar atualização", status: "pendente" },
          { id: "FIN-E2E-03", title: "Filtrar pagamentos por paciente e limpar filtro", status: "pendente" },
        ],
        manual: [
          { id: "MT-FIN-01", contexto: "Formulário pagamento", title: "Campo Valor — máscara monetária é aplicada durante a digitação", tipo: "Validação de campo", status: "falhou", bugId: "BUG-AUTO-MT-FIN-01", images: [], note: "" },
          { id: "MT-FIN-02", contexto: "Formulário pagamento", title: "Campo Valor — valor estourante (ex: 9999999999) não quebra a aplicação", tipo: "Validação de campo", status: "falhou", bugId: "BUG-AUTO-MT-FIN-02", images: [], note: "" },
          { id: "MT-FIN-03", contexto: "Formulário pagamento", title: "Campo Data — ao editar pagamento o campo retorna com a data preenchida", tipo: "Validação de campo", status: "falhou", bugId: "BUG-AUTO-MT-FIN-03", images: [], note: "" },
          { id: "MT-FIN-04", contexto: "Formulário pagamento", title: "Campo Valor — obrigatório — bloqueia envio se vazio", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-05", contexto: "Tela principal", title: "Filtro por nome de paciente — limpar filtro restaura a listagem completa", tipo: "Funcional", status: "falhou", bugId: "BUG-AUTO-MT-FIN-05", images: [], note: "" },
          { id: "MT-FIN-06", contexto: "Tela principal", title: "Registro criado aparece na listagem com todos os dados corretos", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-07", contexto: "Regras", title: "Pagamento com status 'pago' pode ser editado?", tipo: "Regra de negócio", status: "aguarda", bugId: null, images: [], note: "", comments: [] },
          { id: "MT-FIN-08", contexto: "Regras", title: "Pagamento com status 'pago' pode ser excluído?", tipo: "Regra de negócio", status: "aguarda", bugId: null, images: [], note: "", comments: [] },
          { id: "MT-FIN-09", contexto: "Regras", title: "Ao selecionar convênio como forma de pagamento — campo convênio se torna obrigatório?", tipo: "Regra de negócio", status: "aguarda", bugId: null, images: [], note: "", comments: [] },
          { id: "MT-FIN-10", contexto: "Novo pagamento", title: "Inclusão de um novo pagamento com sucesso — verificar persistência dos dados — validar no banco de dados", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-11", contexto: "Novo pagamento", title: "Validar valor negativo no campo \"Valor\"", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-12", contexto: "Novo pagamento", title: "Validar campos obrigatórios", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-13", contexto: "Novo pagamento", title: "Validar campo \"Vencimento\" ao incluir uma data e salvar", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-14", contexto: "Novo pagamento", title: "Validar todos os filtros da tela principal", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-15", contexto: "Novo pagamento", title: "Validar exclusão", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-16", contexto: "Layout", title: "Validar comportamento da tela na abertura do modal", tipo: "Interface", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-17", contexto: "Edição", title: "Edição de dados do campo \"data vencimento\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-18", contexto: "Edição", title: "Edição de dados do paciente", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-19", contexto: "Edição", title: "Edição de dados do status ao mudar o status do pagamento", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-20", contexto: "Edição", title: "Edição de dados do campo \"forma de pagamento\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-21", contexto: "Tela principal", title: "Editar os campos de pagamento e validar o comportamento sendo refletido na tela principal", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-22", contexto: "Filtros", title: "Validar filtro por paciente", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-23", contexto: "Filtros", title: "Validar filtro por todos os status (Pendente, pago, parcial e reembolso)", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-24", contexto: "Filtros", title: "Validar filtro por todas as formas (dinheiro, cartão de crédito, cartão de débito, pix, convênio e outros)", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-25", contexto: "Filtros", title: "Validar filtro por data", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-26", contexto: "Tela principal", title: "Validar a consistência dos dados nos campos \"Total geral\", \"Recebimento\" e pendente", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-27", contexto: "Tela principal", title: "Ao modificar um pagamento do status pendente para pago, verificar se o valor soma no campo \"Recebidos\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-28", contexto: "Tela principal", title: "Ao excluir um pagamento, validar que o campo Recebido altera o valor", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-FIN-29", contexto: "Tela principal", title: "Validar a ação do botão relatórios", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
        ],
        bugs: [
          { id: "BUG-AUTO-MT-FIN-01", title: "[AUTO] Campo Valor sem máscara monetária", severity: "Alto", status: "open", mtId: "MT-FIN-01", images: [], comments: [], date: "22/04/2026", description: "Campo valor no formulário de pagamento não aplica máscara monetária." },
          { id: "BUG-AUTO-MT-FIN-02", title: "[AUTO] Valor estourante quebra a aplicação", severity: "Crítico", status: "open", mtId: "MT-FIN-02", images: [], comments: [], date: "22/04/2026", description: "Inserir valor extremamente alto → aplicação quebra ou comportamento inesperado." },
          { id: "BUG-AUTO-MT-FIN-03", title: "[AUTO] Campo Data retorna vazio ao editar pagamento", severity: "Crítico", status: "open", mtId: "MT-FIN-03", images: [], comments: [], date: "22/04/2026", description: "Abrir edição de pagamento existente → campo data aparece vazio mesmo com data salva." },
          { id: "BUG-AUTO-MT-FIN-05", title: "[AUTO] Filtro por nome não restaura listagem ao limpar", severity: "Alto", status: "open", mtId: "MT-FIN-05", images: [], comments: [], date: "22/04/2026", description: "Aplicar filtro por nome e limpar → listagem não volta ao estado original." },
        ],
      },
      {
        id: "f-convenio", label: "Convênio",
        e2e: [],
        manual: [
          { id: "MT-CON-01", contexto: "Tela Principal", title: "Validar os filtros da tela \"nome e código\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-02", contexto: "Tela Principal", title: "Validar os filtros por \"todos, ativos e inativos\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-03", contexto: "Novo convênio", title: "Inclusão de um novo convênio com sucesso preenchendo todos os campos", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-04", contexto: "Novo convênio", title: "Validar campos obrigatórios", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-05", contexto: "Novo convênio", title: "Validar máscaras dos campos \"valor, telefone e email\"", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-06", contexto: "Novo convênio", title: "Incluir um novo convênio com o status inativo e salvar com sucesso", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-07", contexto: "Novo convênio", title: "Editar os dados de um convênio com sucesso", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-08", contexto: "Novo convênio", title: "Excluir um convênio", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-CON-09", contexto: "Regras", title: "Regra de negócio a confirmar — campo e-mail não é obrigatório?", tipo: "Regra de negócio", status: "aguarda", bugId: null, images: [], note: "", comments: [] },
        ],
        bugs: [],
      },
      {
        id: "f-relatorio-financeiro", label: "Relatório Financeiro",
        e2e: [],
        manual: [
          { id: "MT-RF-01", contexto: "Relatório Financeiro", title: "Validar dados do dashboard se bate com o valor da tela de financeiro", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RF-02", contexto: "Relatório Financeiro", title: "Validar filtros de período", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RF-03", contexto: "Relatório Financeiro", title: "Verificar por Profissional", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RF-04", contexto: "Relatório Financeiro", title: "Validar filtros dos atalhos", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
        ],
        bugs: [],
      },
      {
        id: "f-relatorio-geral", label: "Geral — Relatórios",
        e2e: [],
        manual: [
          { id: "MT-RG-01", contexto: "Geral", title: "Validar filtros por \"nome, status e entidades\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RG-02", contexto: "Novo relatório", title: "Criar novo relatório por \"agendamento\" — \"analítico e sintético\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RG-03", contexto: "Novo relatório", title: "Criar novo relatório por \"pacientes\" — \"analítico e sintético\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RG-04", contexto: "Novo relatório", title: "Criar novo relatório por \"pagamentos\" — \"analítico e sintético\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RG-05", contexto: "Novo relatório", title: "Criar novo relatório por \"prontuários\" — \"analítico e sintético\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RG-06", contexto: "Novo relatório", title: "Criar novo relatório por \"agendamento\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RG-07", contexto: "Novo relatório", title: "Validar botão de ação \"Baixar\"", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-RG-08", contexto: "Regras", title: "Validar botão de ação \"encaminhar por e-mail\" — verificar se vai rodar local ou será necessário em produção", tipo: "Regra de negócio", status: "aguarda", bugId: null, images: [], note: "", comments: [] },
        ],
        bugs: [],
      },
      {
        id: "f-whatsapp", label: "WhatsApp",
        e2e: [],
        manual: [],
        bugs: [],
      },
      {
        id: "f-solicitacoes", label: "Solicitações",
        e2e: [],
        manual: [],
        bugs: [],
      },
      {
        id: "f-meus-tickets", label: "Meus Tickets",
        e2e: [],
        manual: [
          { id: "MT-TKT-01", contexto: "Meus Tickets", title: "Criar um novo ticket com sucesso", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-TKT-02", contexto: "Meus Tickets", title: "Validar todos os campos obrigatórios", tipo: "Validação de campo", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-TKT-03", contexto: "Meus Tickets", title: "Validar que ao abrir um novo ticket o perfil super adm vai receber a solicitação do ticket", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
          { id: "MT-TKT-04", contexto: "Meus Tickets", title: "Validar a inclusão do anexo", tipo: "Funcional", status: "pendente", bugId: null, images: [], note: "" },
        ],
        bugs: [],
      },
    ],
  },
  { id: "administrador", label: "Administrador", color: "#a855f7", funcionalidades: [] },
  { id: "medico",        label: "Médico",         color: "#22c55e", funcionalidades: [] },
  { id: "gestor",        label: "Gestor",          color: "#f59e0b", funcionalidades: [] },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function saveData(data) {
  try { await dbSet(dbRef(db, STORAGE_KEY), data); }
  catch (e) { console.error("Firebase save error", e); }
}

// ─── PURE HELPERS ─────────────────────────────────────────────────────────────
function updateFunc(roles, roleId, funcId, updater) {
  return roles.map(r => r.id !== roleId ? r : {
    ...r,
    funcionalidades: r.funcionalidades.map(f => f.id !== funcId ? f : updater(f)),
  });
}

function genManualId(funcLabel, existingCount, index = 0) {
  const prefix = funcLabel.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 3);
  return `MT-${prefix}-${String(existingCount + index + 1).padStart(2, "0")}`;
}

function genFuncId(label) {
  return `f-${label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
}

function parseImport(text) {
  return text.split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("-"))
    .map(l => {
      const parts = l.split("|").map(p => p.trim());
      if (parts.length >= 3) return { contexto: `${parts[0]} > ${parts[1]}`, title: parts.slice(2).join(" | ").trim() };
      if (parts.length === 2) return { contexto: parts[0], title: parts[1] };
      return { contexto: "", title: l };
    })
    .filter(l => l.title.length > 0);
}

function detectTipo(title) {
  const t = title.toLowerCase();
  if (t.endsWith("?") || t.includes("pode ser") || t.includes("validar regra") || t.includes("regra de negócio")) return "Regra de negócio";
  if (t.match(/inválid|obrigatório|impedem|não é aceito|não é permitid|duplicad|duplicidad|exibe mensagem|exibe erro|parâmetros corretos/)) return "Validação de campo";
  if (t.match(/some ao|label.*some|botão.*some|zoom/)) return "Interface";
  return "Funcional";
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const inp = (extra = {}) => ({
  background: C.card, border: `1px solid ${C.border}`, color: C.text,
  borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box", ...extra,
});

function Badge({ text, color, bg }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}33`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11,
      fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap", fontFamily: "monospace",
    }}>{text}</span>
  );
}

function ManualStatusBtn({ status, onClick }) {
  const cfg = MANUAL_STATUS_CFG[status];
  return (
    <button onClick={onClick} title="Clique para avançar status" style={{
      display: "flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`,
      borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700,
      cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace",
    }}>
      <cfg.Icon size={13} />{cfg.label}
    </button>
  );
}

function Modal({ title, onClose, children, width = 600 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 24, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ImageArea({ images, onChange }) {
  const addFile = (file) => {
    const reader = new FileReader();
    reader.onload = ev => onChange([...images, { name: file.name, data: ev.target.result }]);
    reader.readAsDataURL(file);
  };
  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []).filter(i => i.type.startsWith("image/"));
    items.forEach((item, i) => { const f = item.getAsFile(); if (f) addFile(f); });
    if (items.length) e.preventDefault();
  };
  return (
    <div>
      <div
        onPaste={handlePaste} tabIndex={0}
        style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: "12px 16px", cursor: "text", outline: "none", color: C.textMuted, fontSize: 12, marginBottom: 8 }}
      >
        Cole screenshots aqui (Ctrl+V) ou use o botão abaixo
      </div>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.blueBg, color: C.blue, border: `1px solid ${C.blue}33`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
        <Upload size={12} /> Adicionar imagem
        <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => Array.from(e.target.files).forEach(addFile)} />
      </label>
      {images.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img.data} alt={img.name} style={{ height: 60, width: 80, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}` }} />
              <button onClick={() => onChange(images.filter((_, j) => j !== i))} style={{ position: "absolute", top: -4, right: -4, background: C.failed, border: "none", borderRadius: "50%", width: 16, height: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={10} color="#fff" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
function DashboardView({ roles, onNavigate }) {
  const allFuncs = roles.flatMap(r => r.funcionalidades);
  const allManual = allFuncs.flatMap(f => f.manual);
  const allBugs = allFuncs.flatMap(f => f.bugs);
  const allE2E = allFuncs.flatMap(f => f.e2e);
  const openBugs = allBugs.filter(b => b.status === "open").length;
  const criticals = allBugs.filter(b => b.status === "open" && b.severity === "Crítico").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          ["Funcionalidades", allFuncs.length, C.blue],
          ["Testes E2E", allE2E.length, C.amber],
          ["Bugs abertos", openBugs, openBugs > 0 ? C.failed : C.passed],
          ["Críticos", criticals, criticals > 0 ? C.failed : C.passed],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
            <div style={{ color, fontSize: 34, fontWeight: 800, fontFamily: "monospace" }}>{val}</div>
          </div>
        ))}
      </div>

      <h2 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Roles</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {roles.map(role => {
          const bugs = role.funcionalidades.flatMap(f => f.bugs).filter(b => b.status === "open").length;
          const crits = role.funcionalidades.flatMap(f => f.bugs).filter(b => b.status === "open" && b.severity === "Crítico").length;
          const e2e = role.funcionalidades.flatMap(f => f.e2e).length;
          return (
            <div key={role.id} onClick={() => onNavigate({ page: "role", roleId: role.id })}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${role.color}`, borderRadius: 10, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
            >
              <span style={{ color: role.color, fontWeight: 700, fontSize: 14, minWidth: 130 }}>{role.label}</span>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{role.funcionalidades.length} funcionalidades</span>
              <span style={{ color: C.amber, fontSize: 12 }}>{e2e} E2E</span>
              {bugs > 0 && <Badge text={`${bugs} bug${bugs !== 1 ? "s" : ""}`} color={C.failed} bg={C.failedBg} />}
              {crits > 0 && <Badge text={`${crits} crítico${crits !== 1 ? "s" : ""}`} color={C.failed} bg={C.failedBg} />}
              <ChevronRight size={16} color={C.textMuted} style={{ marginLeft: "auto" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROLE VIEW ────────────────────────────────────────────────────────────────
function RoleView({ role, onNavigate, onAddFunc, onDeleteFunc }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const allBugs = role.funcionalidades.flatMap(f => f.bugs);
  const openBugs = allBugs.filter(b => b.status === "open").length;
  const criticals = allBugs.filter(b => b.status === "open" && b.severity === "Crítico").length;
  const allE2E = role.funcionalidades.flatMap(f => f.e2e).length;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAddFunc(role.id, newLabel.trim());
    setNewLabel(""); setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          ["Funcionalidades", role.funcionalidades.length, C.blue],
          ["Testes E2E", allE2E, C.amber],
          ["Bugs abertos", openBugs, openBugs > 0 ? C.failed : C.passed],
          ["Críticos", criticals, criticals > 0 ? C.failed : C.passed],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
            <div style={{ color, fontSize: 34, fontWeight: 800, fontFamily: "monospace" }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Funcionalidades</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.blueBg, color: C.blue, border: `1px solid ${C.blue}33`, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} /> Nova Funcionalidade
        </button>
      </div>

      {showAdd && (
        <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 16, marginBottom: 16, display: "flex", gap: 10 }}>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="Nome da funcionalidade..." style={{ ...inp(), flex: 1 }} autoFocus />
          <button onClick={handleAdd} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Criar</button>
          <button onClick={() => setShowAdd(false)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
        </div>
      )}

      {role.funcionalidades.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.textMuted, border: `1px dashed ${C.border}`, borderRadius: 10 }}>
          Nenhuma funcionalidade cadastrada. Clique em "Nova Funcionalidade" para começar.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {role.funcionalidades.map(func => {
          const bugs = func.bugs.filter(b => b.status === "open").length;
          const crits = func.bugs.filter(b => b.status === "open" && b.severity === "Crítico").length;
          const manual = func.manual.length;
          const failed = func.manual.filter(m => m.status === "falhou").length;
          return (
            <div key={func.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, cursor: "pointer", position: "relative" }}
              onClick={() => onNavigate({ page: "func", roleId: role.id, funcId: func.id })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <span style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>{func.label}</span>
                <button onClick={e => { e.stopPropagation(); if (window.confirm(`Excluir "${func.label}"?`)) onDeleteFunc(role.id, func.id); }}
                  style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge text={`${func.e2e.length} E2E`} color={C.amber} bg={C.amberBg} />
                <Badge text={`${manual} manuais`} color={C.blue} bg={C.blueBg} />
                {bugs > 0 && <Badge text={`${bugs} bug${bugs !== 1 ? "s" : ""}`} color={C.failed} bg={C.failedBg} />}
                {crits > 0 && <Badge text="crítico" color={C.failed} bg={C.failedBg} />}
                {failed > 0 && <Badge text={`${failed} falhou`} color={C.failed} bg={C.failedBg} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── E2E TAB ──────────────────────────────────────────────────────────────────
function E2ETab({ e2e }) {
  if (e2e.length === 0) return (
    <div style={{ textAlign: "center", padding: 48, color: C.textMuted, border: `1px dashed ${C.border}`, borderRadius: 10 }}>
      Nenhum caso E2E cadastrado para esta funcionalidade.
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {e2e.map(c => {
        const scfg = c.status === "passou" ? { color: C.passed, bg: C.passedBg }
          : c.status === "falhou" ? { color: C.failed, bg: C.failedBg }
          : { color: C.pending, bg: C.pendingBg };
        return (
          <div key={c.id} style={{ background: C.card, border: `1px solid ${c.status === "falhou" ? C.failed + "44" : c.status === "passou" ? C.passed + "33" : C.border}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: C.amber, fontSize: 11, fontFamily: "monospace", fontWeight: 700, minWidth: 110 }}>{c.id}</span>
            <span style={{ color: C.text, fontSize: 13, flex: 1 }}>{c.title}</span>
            {c.testDate && <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "monospace" }}>{c.testDate} {c.testTime}</span>}
            <span style={{ background: scfg.bg, color: scfg.color, border: `1px solid ${scfg.color}44`, borderRadius: 4, padding: "2px 10px", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
              {c.status === "passou" ? "Passou ✓" : c.status === "falhou" ? "Falhou ✗" : "Pendente"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MANUAL TAB ───────────────────────────────────────────────────────────────
function CreateEditManualModal({ func, item, onSave, onClose }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    contexto: item?.contexto || "",
    title: item?.title || "",
    tipo: item?.tipo || "Validação de campo",
    note: item?.note || "",
    images: item?.images || [],
  });
  const save = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };
  return (
    <Modal title={isEdit ? "Editar Teste Manual" : "Novo Teste Manual"} onClose={onClose} width={640}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>CONTEXTO</label>
            <input value={form.contexto} onChange={e => setForm(f => ({ ...f, contexto: e.target.value }))} placeholder="Ex: Tela principal" style={inp()} />
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TIPO</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inp({ cursor: "pointer" })}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>TÍTULO *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="O que este teste valida..." style={inp()} autoFocus />
        </div>
        <div>
          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>NOTAS</label>
          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Pré-condições, passos, observações..." style={{ ...inp(), minHeight: 70, resize: "vertical", fontFamily: "monospace" }} />
        </div>
        <div>
          <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 8 }}>SCREENSHOTS</label>
          <ImageArea images={form.images} onChange={imgs => setForm(f => ({ ...f, images: imgs }))} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

function ImportModal({ func, onImport, onClose }) {
  const [text, setText] = useState("");
  const parsed = parseImport(text);
  const existingTitles = new Set(func.manual.map(m => m.title.toLowerCase().trim()));

  const withMeta = parsed.map((p, i) => ({
    ...p,
    tipo: detectTipo(p.title),
    isDuplicate: existingTitles.has(p.title.toLowerCase().trim()),
    id: genManualId(func.label, func.manual.length, i),
  }));
  const newCases = withMeta.filter(c => !c.isDuplicate);
  const dupeCount = withMeta.length - newCases.length;

  const handleImport = () => {
    if (newCases.length === 0) return;
    onImport(newCases.map(p => ({
      id: p.id, contexto: p.contexto, title: p.title, tipo: p.tipo,
      status: p.tipo === "Regra de negócio" ? "aguarda" : "pendente",
      bugId: null, images: [], note: "", comments: [],
    })));
    onClose();
  };

  return (
    <Modal title="Importar em lote" onClose={onClose} width={720}>
      <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 4 }}>
        Formato: <code style={{ background: C.bg, padding: "2px 6px", borderRadius: 4, color: C.amber }}>Contexto | Título</code> ou <code style={{ background: C.bg, padding: "2px 6px", borderRadius: 4, color: C.amber }}>A | B | Título</code>
      </p>
      <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 16 }}>Linhas começando com <code style={{ background: C.bg, padding: "1px 4px", borderRadius: 3, color: C.textDim }}>-</code> são ignoradas. Tipo detectado automaticamente por palavra-chave.</p>
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: C.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>CENÁRIOS</label>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder={"Tela principal | validar filtro por \"nome\"\nNovo paciente | Dados Pessoais | CPF inválido exibe mensagem de erro\nNovo paciente | Dados Pessoais | Pagamento com status pago pode ser alterado?"}
          style={{ ...inp(), minHeight: 160, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} autoFocus />
      </div>
      {withMeta.length > 0 && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 16, maxHeight: 260, overflowY: "auto" }}>
          <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Preview — {newCases.length} novo{newCases.length !== 1 ? "s" : ""}
            {dupeCount > 0 && <span style={{ color: C.amber, marginLeft: 8 }}>· {dupeCount} duplicado{dupeCount !== 1 ? "s" : ""} (ignorado{dupeCount !== 1 ? "s" : ""})</span>}
          </p>
          {withMeta.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${C.border}`, opacity: p.isDuplicate ? 0.4 : 1 }}>
              <span style={{ color: C.textMuted, fontSize: 10, fontFamily: "monospace", minWidth: 90 }}>{p.id}</span>
              {p.contexto && <Badge text={p.contexto} color={C.textMuted} bg={C.border} />}
              <Badge text={p.tipo} color={TIPO_CFG[p.tipo]?.color || C.textMuted} bg={TIPO_CFG[p.tipo]?.bg || C.border} />
              {p.tipo === "Regra de negócio" && <span style={{ color: C.amber, fontSize: 10, fontFamily: "monospace", whiteSpace: "nowrap" }}>→ aguarda</span>}
              <span style={{ color: p.isDuplicate ? C.textMuted : C.text, fontSize: 12, flex: 1 }}>
                {p.isDuplicate && "⚠ "}{p.title}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
        <button onClick={handleImport} disabled={newCases.length === 0}
          style={{ background: newCases.length > 0 ? C.blue : C.border, color: newCases.length > 0 ? "#fff" : C.textMuted, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: newCases.length > 0 ? "pointer" : "default" }}>
          Importar {newCases.length > 0 ? `${newCases.length} caso${newCases.length !== 1 ? "s" : ""}` : ""}
        </button>
      </div>
    </Modal>
  );
}

function ManualTab({ func, onStatusChange, onAddCases, onEditCase, onDeleteCase, onAddComment }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [expandedComments, setExpandedComments] = useState(() =>
    new Set(func.manual.filter(m => m.status === "aguarda").map(m => m.id))
  );
  const [commentText, setCommentText] = useState({});

  const stats = func.manual.reduce((a, m) => { a[m.status] = (a[m.status] || 0) + 1; return a; }, {});
  const filteredManual = filterStatus ? func.manual.filter(m => m.status === filterStatus) : func.manual;
  const contexts = [...new Set(filteredManual.map(m => m.contexto || "Sem contexto"))];

  const handleSaveCreate = (form) => {
    const newCase = {
      id: genManualId(func.label, func.manual.length),
      ...form,
      status: form.tipo === "Regra de negócio" ? "aguarda" : "pendente",
      bugId: null,
      comments: [],
    };
    onAddCases([newCase]);
    setShowCreate(false);
  };

  const handleSaveEdit = (form) => {
    onEditCase(editingCase.id, form);
    setEditingCase(null);
  };

  const toggleComments = (id) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submitComment = (mtId) => {
    const text = (commentText[mtId] || "").trim();
    if (!text) return;
    onAddComment(mtId, { text, author: "QA", date: new Date().toLocaleDateString("pt-BR") });
    setCommentText(p => ({ ...p, [mtId]: "" }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { key: null,       label: "Todos",     count: func.manual.length, color: C.textMuted, bg: C.card,       border: C.border },
            { key: "passou",   label: "Passaram",  count: stats.passou  || 0, color: C.passed,    bg: C.passedBg,   border: C.passed },
            { key: "falhou",   label: "Falharam",  count: stats.falhou  || 0, color: C.failed,    bg: C.failedBg,   border: C.failed },
            { key: "aguarda",  label: "Aguardam",  count: stats.aguarda || 0, color: C.amber,     bg: C.amberBg,    border: C.amber },
            { key: "pendente", label: "Pendentes", count: stats.pendente|| 0, color: C.pending,   bg: C.pendingBg,  border: C.pending },
          ].map(({ key, label, count, color, bg, border }) => {
            const active = filterStatus === key;
            return (
              <button key={String(key)} onClick={() => setFilterStatus(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: active ? bg : "transparent",
                  color: active ? color : C.textMuted,
                  border: `1px solid ${active ? border + "66" : C.border}`,
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: active ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                {label}
                <span style={{ background: active ? color + "22" : C.border, color: active ? color : C.textMuted, borderRadius: 10, padding: "0px 6px", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowImport(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
            <Upload size={14} /> Importar em lote
          </button>
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.blueBg, color: C.blue, border: `1px solid ${C.blue}33`, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={14} /> Novo teste
          </button>
        </div>
      </div>

      {func.manual.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: C.textMuted, border: `1px dashed ${C.border}`, borderRadius: 10 }}>
          Nenhum teste manual cadastrado. Use "Novo teste" ou "Importar em lote".
        </div>
      ) : filteredManual.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: C.textMuted, border: `1px dashed ${C.border}`, borderRadius: 10 }}>
          Nenhum caso encontrado para o filtro selecionado.
        </div>
      ) : (
        contexts.map(ctx => {
          const cases = filteredManual.filter(m => (m.contexto || "Sem contexto") === ctx);
          return (
            <div key={ctx} style={{ marginBottom: 20 }}>
              <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
                {ctx} <span style={{ color: C.border, fontWeight: 400 }}>— {cases.length} caso{cases.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {cases.map(mc => {
                  const isExpanded = expandedComments.has(mc.id);
                  const commentCount = mc.comments?.length || 0;
                  const borderColor = mc.status === "falhou" ? C.failed : mc.status === "passou" ? C.passed : mc.status === "aguarda" ? C.amber : C.border;
                  return (
                    <div key={mc.id} style={{
                      background: C.card,
                      border: `1px solid ${borderColor + (mc.status === "falhou" ? "55" : mc.status === "passou" ? "33" : mc.status === "aguarda" ? "44" : "")}`,
                      borderLeft: `3px solid ${borderColor}`,
                      borderRadius: 8, overflow: "hidden",
                    }}>
                      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ color: C.blue, fontSize: 11, fontFamily: "monospace", fontWeight: 700, minWidth: 100 }}>{mc.id}</span>
                        <Badge text={mc.tipo} color={TIPO_CFG[mc.tipo]?.color || C.textMuted} bg={TIPO_CFG[mc.tipo]?.bg || C.border} />
                        <span style={{ color: C.text, fontSize: 13, flex: 1, minWidth: 200 }}>{mc.title}</span>
                        {mc.images?.length > 0 && <span style={{ color: C.textMuted, fontSize: 11 }}>📎 {mc.images.length}</span>}
                        {mc.bugId && (
                          <span style={{ color: C.purple, background: C.purpleBg, border: `1px solid ${C.purple}33`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                            ⚡ {mc.bugId}
                          </span>
                        )}
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button onClick={() => toggleComments(mc.id)} title="Comentários" style={{ display: "flex", alignItems: "center", gap: 4, background: isExpanded ? C.amberBg : "transparent", color: commentCount > 0 ? C.amber : C.textMuted, border: `1px solid ${isExpanded ? C.amber + "44" : C.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>
                            <MessageSquare size={11} /> {commentCount}
                          </button>
                          <ManualStatusBtn status={mc.status} onClick={() => onStatusChange(mc.id)} />
                          <button onClick={() => setEditingCase(mc)} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 4 }} title="Editar"><Edit2 size={13} /></button>
                          <button onClick={() => { if (window.confirm("Excluir este teste?")) onDeleteCase(mc.id); }} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 4 }} title="Excluir"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 14px", background: C.bg }}>
                          {commentCount > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              {(mc.comments || []).map((c, i) => (
                                <div key={i} style={{ background: C.card, borderRadius: 6, padding: "8px 12px", marginBottom: 6, borderLeft: `2px solid ${C.amber}` }}>
                                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                                    <span style={{ color: C.amber, fontSize: 11, fontWeight: 700 }}>{c.author}</span>
                                    <span style={{ color: C.textMuted, fontSize: 11 }}>{c.date}</span>
                                  </div>
                                  <p style={{ color: C.textDim, fontSize: 13, margin: 0 }}>{c.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              value={commentText[mc.id] || ""}
                              onChange={e => setCommentText(p => ({ ...p, [mc.id]: e.target.value }))}
                              onKeyDown={e => e.key === "Enter" && submitComment(mc.id)}
                              placeholder="Adicionar comentário..."
                              style={{ ...inp(), flex: 1 }}
                            />
                            <button onClick={() => submitComment(mc.id)} style={{ background: C.amber, color: "#000", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                              Enviar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {showCreate && <CreateEditManualModal func={func} onSave={handleSaveCreate} onClose={() => setShowCreate(false)} />}
      {showImport && <ImportModal func={func} onImport={onAddCases} onClose={() => setShowImport(false)} />}
      {editingCase && <CreateEditManualModal func={func} item={editingCase} onSave={handleSaveEdit} onClose={() => setEditingCase(null)} />}
    </div>
  );
}

// ─── BUGS TAB ─────────────────────────────────────────────────────────────────
function BugsTab({ bugs, onResolve, onAddComment }) {
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState({});
  const open = bugs.filter(b => b.status === "open");
  const resolved = bugs.filter(b => b.status === "resolved");

  const submitComment = (bugId) => {
    const text = (commentText[bugId] || "").trim();
    if (!text) return;
    onAddComment(bugId, { text, author: "QA", date: new Date().toLocaleDateString("pt-BR") });
    setCommentText(p => ({ ...p, [bugId]: "" }));
  };

  const renderBug = (b) => {
    const isExpanded = expandedId === b.id;
    return (
      <div key={b.id} style={{ background: C.card, border: `1px solid ${C.purple}44`, borderLeft: `3px solid ${b.status === "resolved" ? C.passed : (SEV_CFG[b.severity]?.color || C.failed)}`, borderRadius: 8, overflow: "hidden", opacity: b.status === "resolved" ? 0.65 : 1, marginBottom: 8 }}>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ color: C.purple, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{b.id}</span>
                <Badge text={b.severity} color={SEV_CFG[b.severity]?.color || C.failed} bg={SEV_CFG[b.severity]?.bg || C.failedBg} />
                <span style={{ color: C.textMuted, fontSize: 11 }}>{b.date}</span>
                {b.status === "resolved" && <Badge text="Resolvido" color={C.passed} bg={C.passedBg} />}
                <span style={{ color: C.purple, background: C.purpleBg, border: `1px solid ${C.purple}33`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>⚡ {b.mtId}</span>
              </div>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{b.title}</p>
              {b.description && <p style={{ color: C.textMuted, fontSize: 12, marginTop: 6, fontFamily: "monospace", whiteSpace: "pre-line" }}>{b.description}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => onResolve(b.id)} style={{ background: b.status === "open" ? C.passedBg : C.border, color: b.status === "open" ? C.passed : C.textMuted, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                {b.status === "open" ? "✓ Resolver" : "↺ Reabrir"}
              </button>
              <button onClick={() => setExpandedId(isExpanded ? null : b.id)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px" }}>
            {b.images?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Screenshots</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {b.images.map((img, i) => (
                    <a key={i} href={img.data} target="_blank" rel="noreferrer">
                      <img src={img.data} alt={img.name} style={{ height: 80, width: 120, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}` }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <MessageSquare size={12} /> Comentários ({b.comments?.length || 0})
              </p>
              {(b.comments || []).map((c, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 6, padding: "8px 12px", marginBottom: 6, borderLeft: `2px solid ${C.blue}` }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: C.blue, fontSize: 11, fontWeight: 700 }}>{c.author}</span>
                    <span style={{ color: C.textMuted, fontSize: 11 }}>{c.date}</span>
                  </div>
                  <p style={{ color: C.textDim, fontSize: 13, margin: 0 }}>{c.text}</p>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={commentText[b.id] || ""} onChange={e => setCommentText(p => ({ ...p, [b.id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && submitComment(b.id)}
                  placeholder="Adicionar comentário..." style={{ ...inp(), flex: 1 }} />
                <button onClick={() => submitComment(b.id)} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enviar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (bugs.length === 0) return (
    <div style={{ textAlign: "center", padding: 48, color: C.textMuted, border: `1px dashed ${C.border}`, borderRadius: 10 }}>
      Nenhum bug registrado. Bugs aparecem automaticamente quando um teste manual é marcado como "Falhou".
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <span style={{ color: C.failed, fontWeight: 700, fontSize: 13 }}>{open.length} abertos</span>
        <span style={{ color: C.passed, fontWeight: 700, fontSize: 13 }}>{resolved.length} resolvidos</span>
      </div>
      {open.map(renderBug)}
      {resolved.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Resolvidos</p>
          {resolved.map(renderBug)}
        </div>
      )}
    </div>
  );
}

// ─── FUNC VIEW ────────────────────────────────────────────────────────────────
function FuncView({ role, func, onManualStatus, onAddManual, onEditManual, onDeleteManual, onResolveBug, onAddComment, onAddManualComment }) {
  const [tab, setTab] = useState("manual");
  const openBugs = func.bugs.filter(b => b.status === "open").length;
  const failedManual = func.manual.filter(m => m.status === "falhou").length;

  const tabs = [
    { id: "e2e",    label: "Testes E2E",    count: func.e2e.length },
    { id: "manual", label: "Testes Manuais", count: func.manual.length, badge: failedManual },
    { id: "bugs",   label: "Bugs",           count: func.bugs.length,   badge: openBugs },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", color: tab === t.id ? C.blue : C.textMuted,
            border: "none", borderBottom: `2px solid ${tab === t.id ? C.blue : "transparent"}`,
            padding: "10px 16px", fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
            cursor: "pointer", marginBottom: -1,
          }}>
            {t.label}
            <span style={{ background: t.badge > 0 ? C.failedBg : C.border, color: t.badge > 0 ? C.failed : C.textMuted, borderRadius: 10, padding: "1px 7px", fontSize: 11, fontFamily: "monospace" }}>
              {t.count}
            </span>
            {t.badge > 0 && <span style={{ background: C.failed, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === "e2e"    && <E2ETab e2e={func.e2e} />}
      {tab === "manual" && <ManualTab func={func} onStatusChange={onManualStatus} onAddCases={onAddManual} onEditCase={onEditManual} onDeleteCase={onDeleteManual} onAddComment={onAddManualComment} />}
      {tab === "bugs"   && <BugsTab bugs={func.bugs} onResolve={onResolveBug} onAddComment={onAddComment} />}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ roles, nav, onNavigate }) {
  return (
    <div style={{ width: 220, background: C.card, borderRight: `1px solid ${C.border}`, height: "100vh", position: "sticky", top: 0, flexShrink: 0, overflowY: "auto" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Layers size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>QA Dashboard</span>
      </div>

      <div style={{ padding: "12px 8px" }}>
        <div style={{ padding: "4px 8px 8px", color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Visão Geral</div>
        <button onClick={() => onNavigate({ page: "dashboard" })} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          background: nav.page === "dashboard" ? C.blueBg : "transparent",
          color: nav.page === "dashboard" ? C.blue : C.textDim,
          border: nav.page === "dashboard" ? `1px solid ${C.blue}33` : "1px solid transparent",
          borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: nav.page === "dashboard" ? 700 : 400,
          cursor: "pointer", textAlign: "left",
        }}>
          <LayoutDashboard size={15} /> Dashboard
        </button>

        <div style={{ padding: "12px 8px 6px", color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 8 }}>Roles</div>
        {roles.map(role => {
          const isActive = nav.roleId === role.id;
          const openBugs = role.funcionalidades.flatMap(f => f.bugs).filter(b => b.status === "open").length;
          return (
            <button key={role.id} onClick={() => onNavigate({ page: "role", roleId: role.id })} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              background: isActive ? `${role.color}15` : "transparent",
              color: isActive ? role.color : C.textDim,
              border: isActive ? `1px solid ${role.color}33` : "1px solid transparent",
              borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: isActive ? 700 : 400,
              cursor: "pointer", textAlign: "left", marginBottom: 2,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: role.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{role.label}</span>
              {openBugs > 0 && <span style={{ background: C.failed, color: "#fff", borderRadius: 10, padding: "1px 5px", fontSize: 10, fontWeight: 800 }}>{openBugs}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [roles, setRoles] = useState(null);
  const [nav, setNav] = useState({ page: "dashboard" });
  const [loading, setLoading] = useState(true);
  const isRemoteUpdate = useRef(false);
  const isMigrating = useRef(false);
  const testResultsCache = useRef(null);

  useEffect(() => {
    const firebaseRef = dbRef(db, STORAGE_KEY);

    const applyRoles = async (rawRoles) => {
      let r = rawRoles || INITIAL_ROLES;
      try {
        if (!testResultsCache.current) {
          const res = await fetch("/test-results.json");
          if (res.ok) testResultsCache.current = await res.json();
        }
        if (testResultsCache.current) {
          const results = testResultsCache.current;
          r = r.map(role => ({
            ...role,
            funcionalidades: role.funcionalidades.map(func => ({
              ...func,
              e2e: func.e2e.map(c => {
                const result = results[c.id];
                if (!result) return c;
                if (typeof result === "string") return { ...c, status: result };
                return { ...c, status: result.status, testError: result.error, testDate: result.date, testTime: result.time };
              }),
            })),
          }));
        }
      } catch {}
      isRemoteUpdate.current = true;
      setRoles(r);
      setLoading(false);
    };

    const unsubscribe = onValue(firebaseRef, async (snapshot) => {
      const data = snapshot.val();

      if (!data && !isMigrating.current) {
        isMigrating.current = true;
        try {
          const local = localStorage.getItem(STORAGE_KEY);
          if (local) {
            const parsed = JSON.parse(local);
            await dbSet(firebaseRef, parsed);
            return; // onValue will fire again with the migrated data
          }
        } catch {}
      }

      await applyRoles(data?.roles ?? null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (roles !== null) {
      if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
      saveData({ roles });
    }
  }, [roles]);

  const handleAddFunc = useCallback((roleId, label) => {
    setRoles(prev => prev.map(r => r.id !== roleId ? r : {
      ...r,
      funcionalidades: [...r.funcionalidades, { id: genFuncId(label), label, e2e: [], manual: [], bugs: [] }],
    }));
  }, []);

  const handleDeleteFunc = useCallback((roleId, funcId) => {
    setRoles(prev => prev.map(r => r.id !== roleId ? r : {
      ...r,
      funcionalidades: r.funcionalidades.filter(f => f.id !== funcId),
    }));
  }, []);

  const handleManualStatus = useCallback((roleId, funcId, mtId) => {
    setRoles(prev => updateFunc(prev, roleId, funcId, func => {
      const mt = func.manual.find(m => m.id === mtId);
      if (!mt) return func;
      const idx = MANUAL_STATUS_CYCLE.indexOf(mt.status);
      const next = MANUAL_STATUS_CYCLE[(idx + 1) % MANUAL_STATUS_CYCLE.length];
      let manual, bugs = [...func.bugs];

      if (next === "falhou") {
        const bugId = `BUG-AUTO-${mtId}`;
        if (!bugs.find(b => b.id === bugId)) {
          bugs = [...bugs, {
            id: bugId, title: `[AUTO] ${mt.title}`, severity: "Médio",
            status: "open", mtId, images: [...(mt.images || [])],
            comments: [], date: new Date().toLocaleDateString("pt-BR"),
            description: `Gerado automaticamente do teste manual ${mtId}.${mt.note?.trim() ? `\n\nNotas do caso de teste:\n${mt.note.trim()}` : ""}`,
          }];
        }
        manual = func.manual.map(m => m.id === mtId ? { ...m, status: next, bugId } : m);
      } else {
        if (mt.status === "falhou" && mt.bugId) bugs = bugs.filter(b => b.id !== mt.bugId);
        manual = func.manual.map(m => m.id === mtId ? { ...m, status: next, bugId: null } : m);
      }
      return { ...func, manual, bugs };
    }));
  }, []);

  const handleAddManual = useCallback((roleId, funcId, cases) => {
    setRoles(prev => updateFunc(prev, roleId, funcId, func => ({
      ...func, manual: [...func.manual, ...cases],
    })));
  }, []);

  const handleEditManual = useCallback((roleId, funcId, mtId, form) => {
    setRoles(prev => updateFunc(prev, roleId, funcId, func => ({
      ...func, manual: func.manual.map(m => m.id === mtId ? { ...m, ...form } : m),
    })));
  }, []);

  const handleDeleteManual = useCallback((roleId, funcId, mtId) => {
    setRoles(prev => updateFunc(prev, roleId, funcId, func => {
      const mt = func.manual.find(m => m.id === mtId);
      const bugs = mt?.bugId ? func.bugs.filter(b => b.id !== mt.bugId) : func.bugs;
      return { ...func, manual: func.manual.filter(m => m.id !== mtId), bugs };
    }));
  }, []);

  const handleResolveBug = useCallback((roleId, funcId, bugId) => {
    setRoles(prev => updateFunc(prev, roleId, funcId, func => ({
      ...func, bugs: func.bugs.map(b => b.id !== bugId ? b : { ...b, status: b.status === "open" ? "resolved" : "open" }),
    })));
  }, []);

  const handleAddComment = useCallback((roleId, funcId, bugId, comment) => {
    setRoles(prev => updateFunc(prev, roleId, funcId, func => ({
      ...func, bugs: func.bugs.map(b => b.id !== bugId ? b : { ...b, comments: [...(b.comments || []), comment] }),
    })));
  }, []);

  const handleAddManualComment = useCallback((roleId, funcId, mtId, comment) => {
    setRoles(prev => updateFunc(prev, roleId, funcId, func => ({
      ...func, manual: func.manual.map(m => m.id !== mtId ? m : { ...m, comments: [...(m.comments || []), comment] }),
    })));
  }, []);

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.textMuted, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> Carregando...
      </div>
    </div>
  );

  const currentRole = roles.find(r => r.id === nav.roleId);
  const currentFunc = currentRole?.funcionalidades.find(f => f.id === nav.funcId);

  const breadcrumb = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
      <button onClick={() => setNav({ page: "dashboard" })} style={{ background: "none", border: "none", color: nav.page === "dashboard" ? C.text : C.textMuted, cursor: "pointer", fontSize: 13, padding: 0, fontWeight: nav.page === "dashboard" ? 700 : 400 }}>
        Dashboard
      </button>
      {currentRole && <>
        <ChevronRight size={14} color={C.textMuted} />
        <button onClick={() => setNav({ page: "role", roleId: currentRole.id })} style={{ background: "none", border: "none", color: nav.page === "role" ? currentRole.color : C.textMuted, cursor: "pointer", fontSize: 13, padding: 0, fontWeight: nav.page === "role" ? 700 : 400 }}>
          {currentRole.label}
        </button>
      </>}
      {currentFunc && <>
        <ChevronRight size={14} color={C.textMuted} />
        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{currentFunc.label}</span>
      </>}
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'IBM Plex Sans','Segoe UI',system-ui,sans-serif", color: C.text, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea:focus, input:focus, select:focus { border-color: ${C.blue} !important; }
        button:hover { opacity: 0.9; }
      `}</style>

      <Sidebar roles={roles} nav={nav} onNavigate={setNav} />

      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        {breadcrumb}

        {nav.page === "dashboard" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.02em" }}>Visão Geral</h1>
            <DashboardView roles={roles} onNavigate={setNav} />
          </>
        )}

        {nav.page === "role" && currentRole && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.02em", color: currentRole.color }}>{currentRole.label}</h1>
            <RoleView
              role={currentRole}
              onNavigate={setNav}
              onAddFunc={handleAddFunc}
              onDeleteFunc={handleDeleteFunc}
            />
          </>
        )}

        {nav.page === "func" && currentRole && currentFunc && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.02em" }}>{currentFunc.label}</h1>
            <FuncView
              role={currentRole}
              func={currentFunc}
              onManualStatus={(mtId) => handleManualStatus(nav.roleId, nav.funcId, mtId)}
              onAddManual={(cases) => handleAddManual(nav.roleId, nav.funcId, cases)}
              onEditManual={(mtId, form) => handleEditManual(nav.roleId, nav.funcId, mtId, form)}
              onDeleteManual={(mtId) => handleDeleteManual(nav.roleId, nav.funcId, mtId)}
              onResolveBug={(bugId) => handleResolveBug(nav.roleId, nav.funcId, bugId)}
              onAddComment={(bugId, comment) => handleAddComment(nav.roleId, nav.funcId, bugId, comment)}
              onAddManualComment={(mtId, comment) => handleAddManualComment(nav.roleId, nav.funcId, mtId, comment)}
            />
          </>
        )}
      </div>
    </div>
  );
}
