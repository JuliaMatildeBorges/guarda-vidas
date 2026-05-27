import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const statusMeta = {
    VERDE: { label: "No horário", color: "#16a34a", bg: "#dcfce7" },
    AMARELO: { label: "Irregular", color: "#ca8a04", bg: "#fef9c3" },
    VERMELHO: { label: "Pendente", color: "#dc2626", bg: "#fee2e2" },
};

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function hora(valor) {
    if (!valor) return "--:--";
    return new Date(valor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ status }) {
    const meta = statusMeta[status] || statusMeta.VERMELHO;
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
            style={{ background: meta.bg, color: meta.color }}
        >
            <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
            {meta.label}
        </span>
    );
}

function FotoPreview({ foto, onDelete }) {
    if (!foto) {
        return (
            <div className="aspect-[4/3] border border-gray-300 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                Sem foto
            </div>
        );
    }
    return (
        <div className="aspect-[4/3] border border-gray-300 rounded overflow-hidden relative bg-gray-100">
            <img src={`${API_URL}${foto.url}`} alt={foto.nome} className="w-full h-full object-cover" />
            {onDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(foto.id)}
                    className="absolute right-1.5 bottom-1.5 bg-red-600 text-white text-[11px] font-bold rounded px-2 py-1 border-0 cursor-pointer"
                >
                    Excluir
                </button>
            )}
        </div>
    );
}

function AdminPostoCard({ item, onDeletePhoto, abaAtiva }) {
    const dados = item[abaAtiva];

    const borderStatus = {
        VERDE: "#16a34a",
        AMARELO: "#ca8a04",
        VERMELHO: "#dc2626",
    };

    return (
        <article
            className="bg-white rounded shadow-sm overflow-hidden"
            style={{ border: `2px solid ${borderStatus[dados.status] || "#e5e7eb"}` }}
        >
            {/* Barra colorida superior */}
            <div className="h-[3px]" style={{ background: borderStatus[dados.status] || "#e5e7eb" }} />

            <div className="p-4">
                <header className="flex justify-between items-start gap-3 mb-4">
                    <div>
                        <p className="text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-0.5">Posto</p>
                        <h2 className="text-base font-bold text-gray-900 m-0" style={{ fontFamily: "'Georgia', serif" }}>
                            {item.posto}
                        </h2>
                    </div>
                    <StatusPill status={dados.status} />
                </header>

                <div className="border border-blue-200 rounded bg-blue-50/40 p-3" style={{ boxShadow: "inset 3px 0 0 #2563eb" }}>
                    <div className="flex justify-between items-center gap-2 mb-1">
                        <div>
                            <p className="text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-0.5">
                                {abaAtiva === "checkin" ? "Entrada" : "Saída"}
                            </p>
                            <strong className="text-gray-900 text-sm">{hora(dados.horario)}</strong>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-1">{dados.usuario || "Nenhum registro hoje"}</p>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {(dados.fotos?.length ? dados.fotos : [null]).map((foto, index) => (
                            <FotoPreview
                                key={foto?.id || index}
                                foto={foto}
                                onDelete={foto ? onDeletePhoto : null}
                            />
                        ))}
                    </div>

                    {abaAtiva === "checkout" && dados.horario && (
                        <div className="grid grid-cols-2 gap-1.5 mt-3">
                            {[
                                ["Prev. manhã", dados.prevencoesManha ?? 0],
                                ["Prev. tarde", dados.prevencoesTarde ?? 0],
                                ["Água-viva manhã", dados.lesoesAguaVivaManha ?? 0],
                                ["Água-viva tarde", dados.lesoesAguaVivaTarde ?? 0],
                            ].map(([label, valor]) => (
                                <div key={label} className="bg-white border border-gray-200 rounded px-2 py-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                                    <p className="text-sm font-bold text-gray-800">{valor}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

function GuardaVidasPanel({ postos, showToast }) {
    const [postoId, setPostoId] = useState("");
    const [acao, setAcao] = useState("checkin");
    const [fotos, setFotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        prevencoesManha: "",
        prevencoesTarde: "",
        lesoesAguaVivaManha: "",
        lesoesAguaVivaTarde: "",
    });

    const postoSelecionado = useMemo(
        () => postos.find((posto) => String(posto.id) === String(postoId)),
        [postos, postoId]
    );

    const selecionarFotos = (event) => {
        const arquivos = Array.from(event.target.files || []);
        if (arquivos.length > 3) {
            showToast("Envie no máximo 3 fotos por ação.", "error");
            event.target.value = "";
            setFotos([]);
            return;
        }
        setFotos(arquivos);
    };

    const enviar = async () => {
        if (!postoId) return showToast("Selecione um posto.", "error");
        if (!fotos.length) return showToast("Selecione ao menos uma foto.", "error");

        const body = new FormData();
        body.append("postoId", postoId);
        fotos.forEach((foto) => body.append("fotos", foto));

        if (acao === "checkout") {
            const vazio = Object.values(form).some((valor) => valor === "");
            if (vazio) return showToast("Preencha todos os campos antes da foto de saída.", "error");
            Object.entries(form).forEach(([campo, valor]) => body.append(campo, valor));
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/check/${acao === "checkin" ? "in" : "out"}`, {
                method: "POST",
                headers: authHeaders(),
                body,
            });

            if (!res.ok) {
                const erro = await res.json().catch(() => ({}));
                throw new Error(erro.message || "Erro ao registrar check.");
            }

            const dados = await res.json();
            showToast(`${acao === "checkin" ? "Checkin" : "Checkout"} registrado: ${statusMeta[dados.status]?.label || "ok"}.`);
            setFotos([]);
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="px-4 py-8 max-w-xl mx-auto">
            {/* Barra vermelha superior */}
            <div className="h-[3px] rounded-t" style={{ background: "#C41E2A" }} />

            <div className="bg-white border border-gray-300 rounded-b shadow-sm">
                {/* Cabeçalho do painel */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-gray-50">
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "#C41E2A" }}>
                        Operação diária
                    </p>
                    <h1 className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: "'Georgia', serif" }}>
                        Registro de presença
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Checkin até 08:00 · Checkout regular somente após 19:00</p>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Posto */}
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">
                            Posto
                        </label>
                        <select
                            value={postoId}
                            onChange={(e) => setPostoId(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
                        >
                            <option value="">Escolha um posto</option>
                            {postos.map((posto) => (
                                <option key={posto.id} value={posto.id}>{posto.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Segmented checkin/checkout */}
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">
                            Ação
                        </label>
                        <div className="grid grid-cols-2 border border-gray-300 rounded overflow-hidden">
                            {["checkin", "checkout"].map((op) => (
                                <button
                                    key={op}
                                    type="button"
                                    onClick={() => setAcao(op)}
                                    className={`h-10 text-sm font-bold border-0 cursor-pointer transition-colors ${
                                        acao === op
                                            ? "text-white"
                                            : "bg-white text-gray-700"
                                    }`}
                                    style={acao === op ? { background: "#C41E2A" } : {}}
                                >
                                    {op === "checkin" ? "Checkin" : "Checkout"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Campos extras de checkout */}
                    {acao === "checkout" && (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ["prevencoesManha", "Prevenções manhã"],
                                ["prevencoesTarde", "Prevenções tarde"],
                                ["lesoesAguaVivaManha", "Água-viva manhã"],
                                ["lesoesAguaVivaTarde", "Água-viva tarde"],
                            ].map(([campo, label]) => (
                                <div key={campo}>
                                    <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">
                                        {label}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form[campo]}
                                        onChange={(e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }))}
                                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Fotos */}
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">
                            Fotos ({fotos.length}/3)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={selecionarFotos}
                            className="w-full text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded px-3 py-2.5 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all"
                        />
                    </div>

                    {/* Botão */}
                    <button
                        type="button"
                        onClick={enviar}
                        disabled={loading}
                        className="w-full py-2.5 mt-1 rounded text-sm font-bold text-white tracking-wide transition-colors duration-150 flex items-center justify-center gap-2"
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
                                Registrando...
                            </>
                        ) : `Registrar ${acao === "checkin" ? "checkin" : "checkout"}`}
                    </button>

                    {postoSelecionado && (
                        <p className="text-xs text-gray-500 text-center">Posto selecionado: <strong>{postoSelecionado.nome}</strong></p>
                    )}
                </div>
            </div>
        </main>
    );
}

export function Dashboard() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [postos, setPostos] = useState([]);
    const [checks, setChecks] = useState([]);
    const [toast, setToast] = useState(null);
    const [abaAdmin, setAbaAdmin] = useState("checkin");

    const showToast = useCallback((msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3200);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("tipo");
        navigate("/");
    }, [navigate]);

    const carregarPostos = useCallback(async () => {
        const res = await fetch(`${API_URL}/postos`, { headers: authHeaders() });
        if (res.ok) setPostos(await res.json());
    }, []);

    const carregarChecks = useCallback(async () => {
        const res = await fetch(`${API_URL}/check/status-hoje`, { headers: authHeaders() });
        if (res.ok) setChecks(await res.json());
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((dados) => {
                setUsuario(dados);
                localStorage.setItem("tipo", dados.tipo);
            })
            .catch(logout);
    }, [logout]);

    useEffect(() => { carregarPostos(); }, [carregarPostos]);

    useEffect(() => {
        if (usuario?.tipo === "ADMIN") carregarChecks();
    }, [usuario, carregarChecks]);

    const excluirFoto = async (id) => {
        const res = await fetch(`${API_URL}/arquivos/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        if (res.ok) {
            showToast("Foto excluída.");
            carregarChecks();
        } else {
            showToast("Não foi possível excluir a foto.", "error");
        }
    };

    if (!usuario) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#e7e7e7" }}>
                <p className="text-sm text-gray-500 font-medium">Validando credenciais...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: "#e7e7e7" }}>
            {/* Topbar */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-300 shadow-sm">
                {/* Linha vermelha no topo */}
                <div className="h-[3px]" style={{ background: "#C41E2A" }} />
                <div className="flex items-center justify-between px-6 py-3">
                    <div>
                        <div className="font-bold text-gray-900 tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
                            Sistema CBMSC
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {usuario.email}
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="font-semibold" style={{ color: "#C41E2A" }}>
                                {usuario.tipo === "ADMIN" ? "Administrador" : "Salva-vidas"}
                            </span>
                        </div>
                    </div>
                    <nav className="flex items-center gap-2">
                        {usuario.tipo === "ADMIN" && (
                            <Link
                                to="/cadastro-posto"
                                className="border border-gray-300 bg-white text-gray-700 rounded px-3 py-2 text-xs font-bold tracking-wide no-underline hover:border-gray-400 transition-colors"
                            >
                                Postos
                            </Link>
                        )}
                        <button
                            onClick={logout}
                            className="border border-gray-300 bg-white text-gray-700 rounded px-3 py-2 text-xs font-bold tracking-wide cursor-pointer hover:border-gray-400 transition-colors"
                        >
                            Sair
                        </button>
                    </nav>
                </div>
            </header>

            {usuario.tipo === "ADMIN" ? (
                <main className="px-4 py-6 max-w-6xl mx-auto">
                    {/* Header admin */}
                    <div className="mb-1">
                        <div className="h-[3px] rounded-t w-full" style={{ background: "#C41E2A" }} />
                    </div>
                    <div className="bg-white border border-gray-300 rounded-b shadow-sm mb-5">
                        <div className="px-6 pt-5 pb-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "#C41E2A" }}>
                                    Acompanhamento diário
                                </p>
                                <h1 className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: "'Georgia', serif" }}>
                                    Checks dos postos
                                </h1>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Segmented tabs */}
                                <div className="grid grid-cols-2 border border-gray-300 rounded overflow-hidden">
                                    {["checkin", "checkout"].map((aba) => (
                                        <button
                                            key={aba}
                                            type="button"
                                            onClick={() => setAbaAdmin(aba)}
                                            className={`h-9 px-4 text-xs font-bold border-0 cursor-pointer transition-colors ${
                                                abaAdmin === aba ? "text-white" : "bg-white text-gray-700"
                                            }`}
                                            style={abaAdmin === aba ? { background: "#C41E2A" } : {}}
                                        >
                                            {aba === "checkin" ? "Checkin" : "Checkout"}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={carregarChecks}
                                    className="h-9 px-4 rounded text-xs font-bold text-white border-0 cursor-pointer transition-colors"
                                    style={{ background: "#C41E2A" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#a01820"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#C41E2A"; }}
                                >
                                    Atualizar
                                </button>
                            </div>
                        </div>

                        {/* Rodapé do cabeçalho */}
                        <div className="px-6 py-2 bg-gray-100 border-b border-gray-200">
                            <p className="text-xs text-gray-500">
                                {checks.length} posto{checks.length !== 1 ? "s" : ""} monitorado{checks.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* Grid de cards */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                        {checks.map((item) => (
                            <AdminPostoCard
                                key={item.postoId}
                                item={item}
                                abaAtiva={abaAdmin}
                                onDeletePhoto={excluirFoto}
                            />
                        ))}
                    </div>
                </main>
            ) : (
                <GuardaVidasPanel postos={postos} showToast={showToast} />
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed right-5 bottom-5 z-20 px-4 py-3 rounded shadow-lg text-sm font-bold text-white ${
                        toast.type === "error" ? "" : ""
                    }`}
                    style={{ background: toast.type === "error" ? "#991b1b" : "#162033" }}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
