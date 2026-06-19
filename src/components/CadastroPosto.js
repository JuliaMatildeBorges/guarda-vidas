import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "./Header";

const API_URL = (process.env.REACT_APP_API_URL || process.env.REACT_APP_API || "http://localhost:8080").replace(/^['"]|['"]$/g, "");
const API = `${API_URL}/postos`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, strokeWidth = 1.5, className = "" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} d={p} />)
      : <path d={d} />}
  </svg>
);

const ICONS = {
  flame:    ["M12 2c0 6-6 8-6 13a6 6 0 0 0 12 0c0-5-6-7-6-13z", "M12 12c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z"],
  plus:     "M12 5v14M5 12h14",
  edit:     ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash:    ["M3 6h18", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", "M10 11v6M14 11v6", "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"],
  search:   ["M21 21l-4.35-4.35", "M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0"],
  close:    "M18 6L6 18M6 6l12 12",
  check:    "M20 6L9 17l-5-5",
  alert:    ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  refresh:  "M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.5M20 15a9 9 0 0 1-15 4.5",
  building: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
};

// ── Toast ──────────────────────────────────────────────────────────────────
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
      <Icon d={isError ? ICONS.alert : ICONS.check} size={16}
        className={isError ? "text-red-500" : "text-green-500"} />
      {toast.msg}
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal({ posto, onConfirm, onCancel }) {
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
              O posto <span className="font-semibold text-gray-700">"{posto.nome}"</span> será removido permanentemente.
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
            onMouseEnter={e => e.currentTarget.style.background = "#a01820"}
            onMouseLeave={e => e.currentTarget.style.background = "#C41E2A"}
          >
            Sim, remover
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form Modal ─────────────────────────────────────────────────────────────
function FormModal({ editData, onClose, onSaved, showToast }) {
  const isEditing = !!editData?.id;
  const [form, setForm]     = useState({ nome: editData?.nome || "", descricao: editData?.descricao || "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "O campo nome deve ser preenchido.";
    else if (form.nome.length > 200) e.nome = "Máximo de 200 caracteres.";
    if (form.descricao.length > 250) e.descricao = "Máximo de 250 caracteres.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const url    = isEditing ? `${API}/${editData.id}` : API;
      const method = isEditing ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      showToast(isEditing ? "Posto atualizado!" : "Posto criado com sucesso!");
      onSaved();
    } catch {
      showToast("Erro ao salvar. Verifique o servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-gray-200 rounded shadow-lg w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon d={ICONS.building} size={18} className="text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isEditing ? "Editar Posto" : "Novo Posto"}
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

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-600">
              Nome do Posto <span className="normal-case tracking-normal font-normal text-red-500">*obrigatório</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={set("nome")}
              maxLength={200}
              placeholder="Ex.: 1º Batalhão de Bombeiros Militares"
              className={`w-full pl-4 pr-4 py-2.5 text-sm text-gray-900 bg-gray-100 border rounded
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

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-600">
              Descrição <span className="normal-case tracking-normal font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={form.descricao}
              onChange={set("descricao")}
              maxLength={250}
              rows={3}
              placeholder="Localização, jurisdição, responsável..."
              className={`w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-100 border rounded
                focus:outline-none focus:bg-white resize-none transition-all placeholder-gray-400 leading-relaxed
                ${errors.descricao
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                }`}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-red-500">{errors.descricao || ""}</p>
              <p className={`text-xs ${form.descricao.length > 230 ? "text-amber-500" : "text-gray-400"}`}>
                {form.descricao.length}/250
              </p>
            </div>
          </div>

          {/* Actions */}
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Icon d={ICONS.check} size={15} />
                  {isEditing ? "Salvar Alterações" : "Criar Posto"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[10, 35, 30].map((w, i) => (
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

// ── Main ───────────────────────────────────────────────────────────────────
export function CadastroPosto() {
  const tipoUsuario = localStorage.getItem("tipo");
  const [postos, setPostos]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [modalOpen, setModalOpen]       = useState(false);
  const [editData, setEditData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchPostos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setPostos(await res.json());
    } catch {
      showToast("Erro ao carregar postos. Verifique o servidor.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchPostos(); }, [fetchPostos]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/${deleteTarget.id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      showToast("Posto removido com sucesso.");
      setDeleteTarget(null);
      fetchPostos();
    } catch {
      showToast("Erro ao remover o posto.", "error");
    }
  };

  const openNew    = () => { setEditData(null); setModalOpen(true); };
  const openEdit   = (p) => { setEditData(p);   setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditData(null); };

  const filtered = postos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.descricao || "").toLowerCase().includes(search.toLowerCase())
  );

  if (tipoUsuario !== "ADMIN") {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div className="min-h-screen" style={{ background: "#e7e7e7" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <Header />


        {/* ── Main content ────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-6 py-8">

          {/* Card wrapper */}
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Postos Cadastrados</h2>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Icon d={ICONS.building} size={12} className="text-gray-400" />
                  Gerencie os postos ativos do Corpo de Bombeiros
                </p>
              </div>
              <button
                onClick={openNew}
                className="flex items-center gap-2 text-sm font-semibold text-white px-5 h-9 rounded transition-colors shrink-0"
                style={{ background: "#C41E2A" }}
                onMouseEnter={e => e.currentTarget.style.background = "#a01820"}
                onMouseLeave={e => e.currentTarget.style.background = "#C41E2A"}
              >
                <Icon d={ICONS.plus} size={16} />
                Novo Posto
              </button>
            </div>

            {/* Search + stats */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Icon d={ICONS.search} size={14} />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou descrição..."
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

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                <span>
                  <span className="font-semibold text-gray-800">{filtered.length}</span>
                  {search && filtered.length !== postos.length
                    ? ` de ${postos.length} postos`
                    : ` posto${postos.length !== 1 ? "s" : ""}`}
                </span>
                <button
                  onClick={fetchPostos}
                  disabled={loading}
                  title="Recarregar"
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <Icon d={ICONS.refresh} size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-20">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">Descrição</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-400 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <Icon d={ICONS.building} size={22} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium text-sm">
                            {search ? "Nenhum posto encontrado" : "Nenhum posto cadastrado"}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {search
                              ? `Sem resultados para "${search}"`
                              : `Clique em "Novo Posto" para registrar o primeiro`}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((posto) => (
                    <tr
                      key={posto.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                          #{posto.id}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-gray-900 font-medium">{posto.nome}</p>
                        {posto.descricao && (
                          <p className="text-gray-400 text-xs mt-0.5 md:hidden line-clamp-1">{posto.descricao}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {posto.descricao
                          ? <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed max-w-xs">{posto.descricao}</p>
                          : <span className="text-gray-300 text-xs italic">Sem descrição</span>
                        }
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(posto)}
                            title="Editar"
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-gray-400 hover:text-blue-500 transition-all"
                          >
                            <Icon d={ICONS.edit} size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(posto)}
                            title="Remover"
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

            {/* Footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                Exibindo {filtered.length} de {postos.length} posto{postos.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Page footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 CBMSC · Todos os direitos reservados
          </p>
        </main>
      </div>

      {/* Overlays */}
      {modalOpen && (
        <FormModal
          editData={editData}
          onClose={closeModal}
          onSaved={() => { closeModal(); fetchPostos(); }}
          showToast={showToast}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          posto={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <Toast toast={toast} />
    </>
  );
}
