import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8080/postos";

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, strokeWidth = 2, className = "" }) => (
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
  flame:   ["M12 2c0 6-6 8-6 13a6 6 0 0 0 12 0c0-5-6-7-6-13z","M12 12c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z"],
  plus:    "M12 5v14M5 12h14",
  edit:    ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash:   ["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"],
  search:  ["M21 21l-4.35-4.35","M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0"],
  close:   "M18 6L6 18M6 6l12 12",
  check:   "M20 6L9 17l-5-5",
  alert:   ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"],
  refresh: "M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.5M20 15a9 9 0 0 1-15 4.5",
  building:["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"],
};

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border
        ${isError ? "bg-red-950 border-red-700 text-red-200" : "bg-zinc-900 border-yellow-500 text-yellow-100"}`}
      style={{ animation: "slideUp .25s ease" }}
    >
      <Icon d={isError ? ICONS.alert : ICONS.check} size={17}
        className={isError ? "text-red-400" : "text-yellow-400"} />
      <span className="text-sm font-semibold">{toast.msg}</span>
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal({ posto, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-zinc-900 border border-red-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center shrink-0">
            <Icon d={ICONS.alert} size={22} className="text-red-400" />
          </div>
          <div>
            <p className="text-white font-bold text-base mb-1">Confirmar exclusão</p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              O posto{" "}
              <span className="text-red-300 font-semibold">"{posto.nome}"</span>{" "}
              será removido permanentemente.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-bold transition-colors"
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
        headers: { "Content-Type": "application/json" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-red-800 px-6 py-4 flex items-center justify-between"
          style={{ background: "repeating-linear-gradient(-45deg,#991b1b,#991b1b 8px,#b91c1c 8px,#b91c1c 16px)" }}>
          <div style={{ background: "rgba(0,0,0,.25)", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center">
              <Icon d={ICONS.flame} size={17} className="text-red-900" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm tracking-wide uppercase">
                {isEditing ? "Editar Posto" : "Novo Posto"}
              </p>
              <p className="text-red-300 text-xs">Corpo de Bombeiros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/30 hover:bg-black/50 text-red-200 transition-colors"
          >
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Nome do Posto{" "}
              <span className="text-red-500 normal-case tracking-normal font-normal">*obrigatório</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={set("nome")}
              maxLength={200}
              placeholder="Ex.: 1º Batalhão de Bombeiros Militares"
              className={`w-full bg-zinc-800 text-white text-sm placeholder-zinc-600 rounded-xl px-4 h-11
                border outline-none transition-all
                ${errors.nome
                  ? "border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-500"
                  : "border-zinc-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40"
                }`}
            />
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-red-400">{errors.nome || ""}</p>
              <p className={`text-xs ${form.nome.length > 180 ? "text-yellow-400" : "text-zinc-600"}`}>
                {form.nome.length}/200
              </p>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Descrição{" "}
              <span className="text-zinc-600 normal-case tracking-normal font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.descricao}
              onChange={set("descricao")}
              maxLength={250}
              rows={3}
              placeholder="Localização, jurisdição, responsável..."
              className={`w-full bg-zinc-800 text-white text-sm placeholder-zinc-600 rounded-xl px-4 py-3
                border outline-none resize-none transition-all leading-relaxed
                ${errors.descricao
                  ? "border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-500"
                  : "border-zinc-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40"
                }`}
            />
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-red-400">{errors.descricao || ""}</p>
              <p className={`text-xs ${form.descricao.length > 230 ? "text-yellow-400" : "text-zinc-600"}`}>
                {form.descricao.length}/250
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-[2] h-11 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                ${loading
                  ? "bg-red-900 text-red-400 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-600 active:scale-[0.98] text-white shadow-lg shadow-red-900/40"
                }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Icon d={ICONS.check} size={16} strokeWidth={2.5} />
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
    <tr className="border-b border-zinc-800/60">
      {[12, 38, 28].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3.5 bg-zinc-800 rounded-full animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
      <td className="px-5 py-4">
        <div className="flex gap-2 justify-end">
          <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export function CadastroPosto() {
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
      const res = await fetch(API);
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
      const res = await fetch(`${API}/${deleteTarget.id}`, { method: "DELETE" });
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
        body { font-family: 'Barlow', sans-serif; }
        .font-display { font-family: 'Barlow Condensed', sans-serif; }
        @keyframes slideUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeInRow{ from { opacity:0; transform:translateX(-4px) } to { opacity:1; transform:translateX(0) } }
        .row-anim { animation: fadeInRow .2s ease both; }
      `}</style>

      <div className="min-h-screen bg-zinc-950 text-white">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header
          className="relative overflow-hidden"
          style={{
            background: "repeating-linear-gradient(-45deg,#7f1d1d,#7f1d1d 10px,#991b1b 10px,#991b1b 20px)",
            borderBottom: "3px solid #fbbf24",
          }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Emblem */}
              <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-xl shadow-black/40 border-2 border-yellow-300">
                <Icon d={ICONS.flame} size={28} className="text-red-900" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-display text-3xl font-black tracking-widest text-white uppercase leading-none drop-shadow-lg">
                  Corpo de Bombeiros
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-px flex-1 bg-yellow-400/60" />
                  <p className="text-yellow-300 text-xs font-bold tracking-[.2em] uppercase">
                    Sistema de Gestão Operacional
                  </p>
                  <div className="h-px flex-1 bg-yellow-400/60" />
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-black/40 border border-yellow-500/30 rounded-xl px-4 py-2.5">
              <span className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #4ade80" }} />
              <span className="text-zinc-300 text-xs font-semibold uppercase tracking-widest">Online</span>
            </div>
          </div>
        </header>

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center gap-2 text-xs text-zinc-600">
            <Icon d={ICONS.building} size={13} />
            <span>Gestão</span>
            <span>/</span>
            <span className="text-zinc-400 font-semibold">Postos</span>
          </div>
        </div>

        {/* ── Main content ────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-6 py-8">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <h2 className="font-display text-4xl font-black uppercase tracking-wide leading-none text-white">
                Postos Cadastrados
              </h2>
              <p className="text-zinc-500 text-sm mt-1.5 flex items-center gap-2">
                <Icon d={ICONS.building} size={13} className="text-red-500" />
                Gerencie os postos ativos do Corpo de Bombeiros
              </p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2.5 bg-red-700 hover:bg-red-600 active:scale-95
                text-white font-black text-sm uppercase tracking-widest
                px-6 h-12 rounded-xl transition-all shadow-xl shadow-red-900/60
                border border-red-500/30 shrink-0"
            >
              <Icon d={ICONS.plus} size={18} strokeWidth={2.8} />
              Novo Posto
            </button>
          </div>

          {/* Stats + Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* Stats cards */}
            <div className="flex gap-3 shrink-0">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 flex items-center gap-3 min-w-[110px]">
                <span className="font-display text-3xl font-black text-yellow-400 leading-none">
                  {postos.length}
                </span>
                <div className="text-zinc-600 text-[11px] font-bold uppercase tracking-wider leading-tight">
                  Postos<br />Registrados
                </div>
              </div>
              {search && filtered.length !== postos.length && (
                <div className="bg-zinc-900 border border-red-900/50 rounded-xl px-5 py-3 flex items-center gap-3 min-w-[110px]">
                  <span className="font-display text-3xl font-black text-red-400 leading-none">
                    {filtered.length}
                  </span>
                  <div className="text-zinc-600 text-[11px] font-bold uppercase tracking-wider leading-tight">
                    Resultados<br />Filtrados
                  </div>
                </div>
              )}
            </div>

            {/* Search bar */}
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                <Icon d={ICONS.search} size={15} />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar posto por nome ou descrição..."
                className="w-full h-12 bg-zinc-900 border border-zinc-800
                  focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20
                  rounded-xl pl-10 pr-10 text-sm text-white placeholder-zinc-600
                  outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Icon d={ICONS.close} size={15} />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchPostos}
              disabled={loading}
              title="Recarregar lista"
              className="h-12 w-12 shrink-0 flex items-center justify-center
                bg-zinc-900 border border-zinc-800 hover:border-zinc-600
                rounded-xl text-zinc-500 hover:text-zinc-200 transition-all"
            >
              <Icon d={ICONS.refresh} size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "#111111" }} className="border-b border-zinc-800">
                  {/* Yellow left accent */}
                  <th className="w-1 p-0">
                    <div className="h-full w-1 bg-yellow-400" />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-zinc-600 w-20">ID</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-zinc-600">Nome do Posto</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-zinc-600 hidden md:table-cell">Descrição</th>
                  <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest text-zinc-600 w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <Icon d={ICONS.flame} size={30} className="text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-zinc-400 font-bold">
                            {search ? "Nenhum posto encontrado" : "Nenhum posto cadastrado"}
                          </p>
                          <p className="text-zinc-600 text-sm mt-1">
                            {search
                              ? `Sem resultados para "${search}"`
                              : `Clique em "Novo Posto" para registrar o primeiro`}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((posto, idx) => (
                    <tr
                      key={posto.id}
                      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors group row-anim"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Yellow accent bar */}
                      <td className="w-1 p-0">
                        <div className="h-full w-1 bg-transparent group-hover:bg-red-600 transition-colors" />
                      </td>

                      {/* ID */}
                      <td className="px-4 py-4">
                        <span className="font-display text-sm font-black text-red-500 bg-red-950/60 border border-red-900/50 px-2.5 py-0.5 rounded-lg">
                          #{posto.id}
                        </span>
                      </td>

                      {/* Nome */}
                      <td className="px-4 py-4">
                        <p className="text-white font-bold text-sm">{posto.nome}</p>
                        {posto.descricao && (
                          <p className="text-zinc-600 text-xs mt-0.5 md:hidden line-clamp-1">{posto.descricao}</p>
                        )}
                      </td>

                      {/* Descrição */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        {posto.descricao
                          ? <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed max-w-xs">{posto.descricao}</p>
                          : <span className="text-zinc-700 text-xs italic">Sem descrição</span>
                        }
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(posto)}
                            title="Editar posto"
                            className="w-8 h-8 flex items-center justify-center rounded-lg
                              bg-zinc-800 hover:bg-blue-950 border border-zinc-700 hover:border-blue-700
                              text-zinc-500 hover:text-blue-400 transition-all"
                          >
                            <Icon d={ICONS.edit} size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(posto)}
                            title="Remover posto"
                            className="w-8 h-8 flex items-center justify-center rounded-lg
                              bg-zinc-800 hover:bg-red-950 border border-zinc-700 hover:border-red-800
                              text-zinc-500 hover:text-red-400 transition-all"
                          >
                            <Icon d={ICONS.trash} size={14} />
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
              <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
                <p className="text-zinc-700 text-xs">
                  Exibindo <span className="text-zinc-500 font-semibold">{filtered.length}</span> de{" "}
                  <span className="text-zinc-500 font-semibold">{postos.length}</span>{" "}
                  posto{postos.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-1.5 text-zinc-700 text-xs">
                  <Icon d={ICONS.building} size={11} />
                  localhost:8080/postos
                </div>
              </div>
            )}
          </div>
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
