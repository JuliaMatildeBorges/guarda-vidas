// ─────────────────────────────────────────────────────────────────────────────
// CadastroUsuario.jsx
//
// ESTRUTURA GERAL:
//   • Layout/estrutura visual → herdado do componente de listagem (tabela)
//   • Campos e validações    → herdados do componente de formulário (CPF, perfil etc.)
//
// ROTAS / PERMISSÕES:
//   Apenas usuários com tipo "ADMIN" podem acessar. Demais são redirecionados
//   para /dashboard via <Navigate>.
//
// API:
//   Base URL definida em REACT_APP_API_URL (fallback: http://localhost:8080).
//   Endpoint de usuários: /usuarios
//   Autenticação via Bearer token armazenado em localStorage ("token").
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "./Header";
import { readApiErrorMessage, safeErrorMessage } from "../utils/errorMessages";

// ── Configuração de API ───────────────────────────────────────────────────────
// Remove aspas extras que possam vir de variáveis de ambiente mal formatadas.
const API_URL = (
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API ||
  "http://localhost:8080"
).replace(/^['"]|['"]$/g, "");

const API = `${API_URL}/usuarios`;

/** Retorna headers de autenticação padrão para todas as chamadas protegidas. */
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Utilitários de CPF ────────────────────────────────────────────────────────

/** Remove tudo que não for dígito e limita a 11 caracteres. */
const onlyDigits = (value) => value.replace(/\D/g, "").slice(0, 11);

/**
 * Aplica máscara visual ao CPF: 000.000.000-00
 * A máscara é apenas para exibição; o backend recebe somente os dígitos.
 */
const formatCpf = (value) => {
  const digits = onlyDigits(value);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

/**
 * Valida CPF pelos dois dígitos verificadores (algoritmo oficial).
 * Rejeita sequências repetidas (ex.: 111.111.111-11).
 */
const isValidCpf = (value) => {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base, factor) => {
    const total = base
      .split("")
      .reduce((sum, num, idx) => sum + Number(num) * (factor - idx), 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const first = calcDigit(cpf.slice(0, 9), 10);
  const second = calcDigit(cpf.slice(0, 9) + first, 11);
  return cpf === `${cpf.slice(0, 9)}${first}${second}`;
};

// ── Ícones SVG inline ─────────────────────────────────────────────────────────
// Centraliza todos os paths SVG para facilitar adição/remoção de ícones.
// Para adicionar um novo ícone: inclua uma entrada em ICONS e use <Icon d={ICONS.novoIcone} />.
const Icon = ({ d, size = 18, strokeWidth = 1.5, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} d={p} />)
      : <path d={d} />}
  </svg>
);

const ICONS = {
  plus: "M12 5v14M5 12h14",
  edit: ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash: ["M3 6h18", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", "M10 11v6M14 11v6", "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"],
  search: ["M21 21l-4.35-4.35", "M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0"],
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  alert: ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  refresh: "M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.5M20 15a9 9 0 0 1-15 4.5",
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
};

// ── Toast (notificação temporária) ────────────────────────────────────────────
// Exibido no canto inferior direito por ~3,2 s (controlado em showToast).
// type: "success" | "error"
function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded shadow-lg border text-sm font-medium
        ${isError
          ? "bg-white border-red-300 text-red-700"
          : "bg-white border-green-300 text-green-700"
        }`}
      style={{ animation: "slideUp .2s ease" }}
    >
      <Icon
        d={isError ? ICONS.alert : ICONS.check}
        size={16}
        className={isError ? "text-red-500" : "text-green-500"}
      />
      {toast.msg}
    </div>
  );
}

// ── Modal de confirmação de exclusão ──────────────────────────────────────────
// Exibido antes de deletar um usuário. Passa o objeto `usuario` para mostrar
// o nome na mensagem de confirmação.
function ConfirmModal({ usuario, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-gray-200 rounded shadow-lg w-full max-w-sm p-6">
        <div className="flex gap-3 mb-5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <Icon d={ICONS.alert} size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold text-sm mb-1">Confirmar exclusão</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              O usuário{" "}
              <span className="font-semibold text-gray-700">"{usuario.nome}"</span>{" "}
              será removido permanentemente.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-9 rounded text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-9 rounded text-sm font-semibold text-white transition-colors"
            style={{ background: "#C41E2A" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#a01820")}
            onMouseLeave={e => (e.currentTarget.style.background = "#C41E2A")}
          >
            Sim, remover
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de criação / edição ─────────────────────────────────────────────────
// Detecta automaticamente se está em modo edição pelo campo `editData.id`.
//
// Campos:
//   • nome           — obrigatório, máx. 200 chars
//   • cpf            — obrigatório, máscara visual, validado pelo algoritmo de dígitos verificadores
//   • senha          — obrigatório (apenas na criação; na edição é opcional — ajuste se necessário)
//   • confirmarSenha — deve ser igual à senha
//   • perfil         — USUARIO | ADMIN
//
// O CPF é enviado ao backend SEM a máscara (somente dígitos).
function FormModal({ editData, onClose, onSaved, showToast }) {
  const isEditing = !!editData?.id;

  // Estado do formulário — inicializa com os dados existentes ao editar.
  const [form, setForm] = useState({
    nome: editData?.nome || "",
    cpf: editData?.cpf ? formatCpf(editData.cpf) : "",
    senha: "",
    confirmarSenha: "",
    perfil: editData?.perfil || "USUARIO",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Derivados do CPF recalculados a cada render 
  const cpfDigits = onlyDigits(form.cpf);
  const cpfCompleto = cpfDigits.length === 11;
  const cpfValido = useMemo(() => isValidCpf(form.cpf), [form.cpf]);

  // ── Validação local ─────────────────────────────────────────────────────────
  // Retorna objeto { campo: "mensagem de erro" }. Se vazio, o form é válido.
  const validate = () => {
    const e = {};

    if (!form.nome.trim()) e.nome = "O campo nome deve ser preenchido.";
    else if (form.nome.length > 200) e.nome = "Máximo de 200 caracteres.";

    if (!cpfCompleto) e.cpf = "Informe todos os 11 dígitos do CPF.";
    else if (!cpfValido) e.cpf = "CPF inválido. Verifique os números informados.";

    // Senha só é obrigatória na criação. Na edição, deixe em branco para não alterar.
    if (!isEditing || form.senha) {
      if (!form.senha) {
        e.senha = "A senha é obrigatória.";
      }
      if (!form.confirmarSenha) {
        e.confirmarSenha = "A confirmação de senha deve ser preenchida.";
      }
      else if (form.senha !== form.confirmarSenha) {
        e.confirmarSenha = "A senha e a confirmação de senha não conferem.";
      }
    }
    return e;
  };

  // ── Submissão ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const url = isEditing ? `${API}/${editData.id}` : API;
      const method = isEditing ? "PUT" : "POST";

      // Monta o payload removendo a confirmação de senha e enviando CPF sem máscara.
      const payload = {
        nome: form.nome,
        cpf: cpfDigits,          // apenas dígitos — sem máscara
        perfil: form.perfil,
        ...(form.senha ? { senha: form.senha } : {}), // envia senha só se preenchida
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Não foi possível salvar o usuário."));
      }

      showToast(isEditing ? "Usuário atualizado!" : "Usuário criado com sucesso!");
      onSaved();
    } catch (err) {
      showToast(safeErrorMessage(err.message, "Erro ao salvar. Verifique o servidor."), "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Handler genérico de campos ──────────────────────────────────────────────
  // Para o CPF aplica a máscara; para os demais usa o valor direto.
  const set = (field) => (e) => {
    const value = field === "cpf" ? formatCpf(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
    setErrors(er => ({ ...er, [field]: undefined })); // limpa erro ao editar o campo
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-gray-200 rounded shadow-lg w-full max-w-md overflow-hidden">

        {/* ── Cabeçalho do modal ───────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon d={ICONS.user} size={18} className="text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isEditing ? "Editar usuário" : "Novo usuário"}
              </p>
              <p className="text-xs text-gray-400">Corpo de Bombeiros Militar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>

        {/* ── Corpo do modal ───────────────────────────────────────────────── */}
        <div className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">

          {/* Campo: Nome */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-600">
              Nome{" "}
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={set("nome")}
              maxLength={200}
              placeholder="Nome completo do usuário"
              className={`w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-100 border rounded
                focus:outline-none focus:bg-white transition-all placeholder-gray-400
                ${errors.nome
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                }`}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-red-500">{errors.nome || ""}</p>
              <p className={`text-xs ${form.nome.length > 180 ? "text-amber-500" : "text-gray-400"}`}>
                {form.nome.length}/200
              </p>
            </div>
          </div>

          {/* Campo: CPF (com máscara visual e validação em tempo real) */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-600">
              CPF{" "}
            </label>
            <input
              type="text"
              value={form.cpf}
              onChange={set("cpf")}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              // Borda muda para verde/vermelho ao completar os 11 dígitos
              className={`w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-100 border rounded
                focus:outline-none focus:bg-white transition-all placeholder-gray-400
                ${errors.cpf
                  ? "border-red-400 focus:ring-2 focus:ring-red-100"
                  : cpfCompleto
                    ? cpfValido
                      ? "border-green-500 focus:ring-2 focus:ring-green-100"
                      : "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                }`}
            />
            {/* Feedback inline de CPF (só aparece quando completo) */}
            {cpfCompleto && !errors.cpf && (
              <p
                className="text-xs mt-1 font-semibold"
                style={{ color: cpfValido ? "#16a34a" : "#dc2626" }}
              >
                {cpfValido ? "CPF válido." : "CPF inválido. Verifique os números informados."}
              </p>
            )}
            {errors.cpf && (
              <p className="text-xs mt-1 text-red-500">{errors.cpf}</p>
            )}
          </div>

          {/* Campos: Senha e Confirmação (lado a lado em telas maiores) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-600">
                Senha{" "}
                {/* Na edição, senha é opcional (deixar em branco = não altera) */}
                {isEditing
                  ? <span className="normal-case tracking-normal font-normal text-gray-400">(opcional)</span>
                  : <span className="normal-case tracking-normal font-normal text-red-500"></span>
                }
              </label>
              <input
                type="password"
                value={form.senha}
                onChange={set("senha")}
                placeholder={isEditing ? "Deixe em branco para manter" : ""}
                className={`w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-100 border rounded
                  focus:outline-none focus:bg-white transition-all placeholder-gray-400
                  ${errors.senha
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  }`}
              />
              {errors.senha && <p className="text-xs mt-1 text-red-500">{errors.senha}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-600">
                Confirmar senha
              </label>
              <input
                type="password"
                value={form.confirmarSenha}
                onChange={set("confirmarSenha")}
                className={`w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-100 border rounded
                  focus:outline-none focus:bg-white transition-all placeholder-gray-400
                  ${errors.confirmarSenha
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  }`}
              />
              {errors.confirmarSenha && (
                <p className="text-xs mt-1 text-red-500">{errors.confirmarSenha}</p>
              )}
            </div>
          </div>

          {/* Campo: Perfil */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-600">
              Perfil
            </label>
            <select
              value={form.perfil}
              onChange={set("perfil")}
              className="w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded
                focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
            >
              {/* Adicione novos perfis aqui conforme necessário */}
              <option value="USUARIO">Usuário comum</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* ── Ações ────────────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] h-10 rounded text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
              style={{ background: loading ? "#e0a0a4" : "#C41E2A" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#a01820"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#C41E2A"; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Icon d={ICONS.check} size={15} />
                  {isEditing ? "Salvar Alterações" : "Criar usuário"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Linha de esqueleto (loading da tabela) ────────────────────────────────────
// Exibe 4 linhas animadas enquanto os dados são carregados.
// Ajuste o array de larguras se alterar o número de colunas da tabela.
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[10, 20, 20, 15].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
      <td className="px-4 py-3.5">
        <div className="flex gap-2 justify-end">
          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function CadastroUsuario() {
  const tipoUsuario = localStorage.getItem("tipo");

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);   // null = criação, objeto = edição
  const [deleteTarget, setDeleteTarget] = useState(null);   // usuário aguardando confirmação de exclusão
  const [toast, setToast] = useState(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  // Exibe notificação por 3,2 s e depois a remove automaticamente.
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Busca de usuários ───────────────────────────────────────────────────────
  // useCallback garante referência estável para uso no useEffect sem loops.
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setUsuarios(await res.json());
    } catch {
      showToast("Erro ao carregar usuários. Verifique o servidor.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Carrega a lista ao montar o componente.
  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  // ── Exclusão ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      showToast("Usuário removido com sucesso.");
      setDeleteTarget(null);
      fetchUsuarios();
    } catch {
      showToast("Erro ao remover o usuário.", "error");
    }
  };

  // ── Controle do modal ───────────────────────────────────────────────────────
  const openNew = () => { setEditData(null); setModalOpen(true); };
  const openEdit = (u) => { setEditData(u); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditData(null); };

  // ── Filtro de busca ─────────────────────────────────────────────────────────
  // Filtra por nome, CPF (parcial, sem máscara) e perfil.
  const filtered = usuarios.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nome.toLowerCase().includes(q) ||
      (u.cpf || "").includes(onlyDigits(q)) ||
      (u.perfil || "").toLowerCase().includes(q)
    );
  });

  // ── Proteção de rota ────────────────────────────────────────────────────────
  // Deve ficar APÓS todos os hooks para não violar as regras do React.
  if (tipoUsuario !== "ADMIN") {
    return <Navigate to="/dashboard" />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Animação do Toast */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div className="min-h-screen" style={{ background: "#e7e7e7" }}>

        <Header />

        <main className="max-w-5xl mx-auto px-6 py-8">

          {/* ── Card principal ─────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">

            {/* Cabeçalho do card */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Usuários Cadastrados</h2>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Icon d={ICONS.user} size={12} className="text-gray-400" />
                  Gerencie os usuários ativos do Corpo de Bombeiros
                </p>
              </div>
              <button
                onClick={openNew}
                className="flex items-center gap-2 text-sm font-semibold text-white px-5 h-9 rounded transition-colors shrink-0"
                style={{ background: "#C41E2A" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#a01820")}
                onMouseLeave={e => (e.currentTarget.style.background = "#C41E2A")}
              >
                <Icon d={ICONS.plus} size={16} />
                Novo Usuário
              </button>
            </div>

            {/* Barra de busca + contador + botão de reload */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center">
              {/* Campo de busca */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Icon d={ICONS.search} size={14} />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome, CPF ou perfil..."
                  className="w-full h-9 bg-gray-100 border border-gray-300 rounded pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400
                    focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Icon d={ICONS.close} size={13} />
                  </button>
                )}
              </div>

              {/* Contador e botão de recarregar */}
              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                <span>
                  <span className="font-semibold text-gray-800">{filtered.length}</span>
                  {search && filtered.length !== usuarios.length
                    ? ` de ${usuarios.length} usuários`
                    : ` usuário${usuarios.length !== 1 ? "s" : ""}`}
                </span>
                <button
                  onClick={fetchUsuarios}
                  disabled={loading}
                  title="Recarregar lista"
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <Icon d={ICONS.refresh} size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* ── Tabela de usuários ─────────────────────────────────────────── */}
            {/*
              Colunas: ID | Nome | CPF | Perfil | Ações
              CPF e Perfil ficam ocultos em mobile (hidden md:table-cell).
              Para remover uma coluna: delete o <th> e o <td> correspondentes
              e ajuste os widths no SkeletonRow.
            */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-20">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">CPF</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">Perfil</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-400 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* Estado de carregamento */}
                {loading ? (
                  Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)

                  /* Estado vazio */
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <Icon d={ICONS.user} size={22} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium text-sm">
                            {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {search
                              ? `Sem resultados para "${search}"`
                              : `Clique em "Novo Usuário" para registrar o primeiro`}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  /* Linhas de dados */
                ) : (
                  filtered.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                          #{usuario.id}
                        </span>
                      </td>

                      {/* Nome */}
                      <td className="px-4 py-3.5">
                        <p className="text-gray-900 font-medium">{usuario.nome}</p>
                        {/* Em mobile, exibe CPF abaixo do nome */}
                        {usuario.cpf && (
                          <p className="text-gray-400 text-xs mt-0.5 md:hidden">
                            {formatCpf(usuario.cpf)}
                          </p>
                        )}
                      </td>

                      {/* CPF — formatado apenas na exibição */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {usuario.cpf
                          ? <p className="text-gray-500 text-sm font-mono">{formatCpf(usuario.cpf)}</p>
                          : <span className="text-gray-300 text-xs italic">Não informado</span>
                        }
                      </td>

                      {/* Perfil — badge colorido */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {usuario.perfil === "ADMIN" ? (
                          <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                            Usuário
                          </span>
                        )}
                      </td>

                      {/* Ações: editar e excluir */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(usuario)}
                            title="Editar usuário"
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-gray-400 hover:text-blue-500 transition-all"
                          >
                            <Icon d={ICONS.edit} size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(usuario)}
                            title="Remover usuário"
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Icon d={ICONS.trash} size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Rodapé do card — exibido só quando há resultados */}
            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                Exibindo {filtered.length} de {usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Rodapé da página */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 CBMSC · Todos os direitos reservados
          </p>
        </main>
      </div>

      {/* ── Overlays (renderizados fora do fluxo principal) ─────────────────── */}

      {/* Modal de criação / edição */}
      {modalOpen && (
        <FormModal
          editData={editData}
          onClose={closeModal}
          onSaved={() => { closeModal(); fetchUsuarios(); }}
          showToast={showToast}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <ConfirmModal
          usuario={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast de feedback */}
      <Toast toast={toast} />
    </>
  );
}
