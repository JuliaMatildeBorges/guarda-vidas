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
        <span className="status-pill" style={{ background: meta.bg, color: meta.color }}>
            <span className="dot" style={{ background: meta.color }} />
            {meta.label}
        </span>
    );
}

function FotoPreview({ foto, onDelete }) {
    if (!foto) {
        return <div className="foto placeholder">Sem foto</div>;
    }

    return (
        <div className="foto">
            <img src={`${API_URL}${foto.url}`} alt={foto.nome} />
            {onDelete && (
                <button type="button" className="delete-photo" onClick={() => onDelete(foto.id)}>
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
            className="posto-card"
            style={{
                border: `2px solid ${borderStatus[dados.status] || "#e5e7eb"}`
            }}
        >
            <header>
                <div>
                    <p className="eyebrow">Posto</p>
                    <h2>{item.posto}</h2>
                </div>

                <StatusPill status={dados.status} />
            </header>

            <section className="check-panel active">
                <div className="check-head">
                    <div>
                        <p className="eyebrow">
                            {abaAtiva === "checkin" ? "Entrada" : "Saída"}
                        </p>

                        <strong>{hora(dados.horario)}</strong>
                    </div>
                </div>

                <p className="muted">
                    {dados.usuario || "Nenhum registro hoje"}
                </p>

                <div className="photos">
                    {(dados.fotos?.length ? dados.fotos : [null]).map((foto, index) => (
                        <FotoPreview
                            key={foto?.id || index}
                            foto={foto}
                            onDelete={foto ? onDeletePhoto : null}
                        />
                    ))}
                </div>

                {abaAtiva === "checkout" && dados.horario && (
                    <div className="metrics">
                        <span>Prev. manhã: {dados.prevencoesManha ?? 0}</span>
                        <span>Prev. tarde: {dados.prevencoesTarde ?? 0}</span>
                        <span>Água-viva manhã: {dados.lesoesAguaVivaManha ?? 0}</span>
                        <span>Água-viva tarde: {dados.lesoesAguaVivaTarde ?? 0}</span>
                    </div>
                )}
            </section>
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
        <main className="page">
            <section className="operator-panel">
                <div>
                    <p className="eyebrow">Operação diária</p>
                    <h1>Selecione o posto e registre sua presença</h1>
                    <p className="muted">Checkin até 08:00. Checkout regular somente após 19:00.</p>
                </div>

                <div className="field">
                    <label>Posto</label>
                    <select value={postoId} onChange={(e) => setPostoId(e.target.value)}>
                        <option value="">Escolha um posto</option>
                        {postos.map((posto) => (
                            <option key={posto.id} value={posto.id}>{posto.nome}</option>
                        ))}
                    </select>
                </div>

                <div className="segmented">
                    <button className={acao === "checkin" ? "selected" : ""} onClick={() => setAcao("checkin")}>Checkin</button>
                    <button className={acao === "checkout" ? "selected" : ""} onClick={() => setAcao("checkout")}>Checkout</button>
                </div>

                {acao === "checkout" && (
                    <div className="form-grid">
                        {[
                            ["prevencoesManha", "Prevenções de manhã"],
                            ["prevencoesTarde", "Prevenções de tarde"],
                            ["lesoesAguaVivaManha", "Lesões água-viva manhã"],
                            ["lesoesAguaVivaTarde", "Lesões água-viva tarde"],
                        ].map(([campo, label]) => (
                            <div className="field" key={campo}>
                                <label>{label}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form[campo]}
                                    onChange={(e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }))}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="field">
                    <label>Fotos ({fotos.length}/3)</label>
                    <input type="file" accept="image/*" multiple onChange={selecionarFotos} />
                </div>

                <button className="primary" onClick={enviar} disabled={loading}>
                    {loading ? "Registrando..." : `Registrar ${acao === "checkin" ? "checkin" : "checkout"}`}
                </button>

                {postoSelecionado && <p className="muted">Posto selecionado: {postoSelecionado.nome}</p>}
            </section>
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

    useEffect(() => {
        carregarPostos();
    }, [carregarPostos]);

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

    if (!usuario) return <p className="loading">Validando credenciais...</p>;

    return (
        <>
            <style>{`
                body { margin: 0; background: #f5f7fb; color: #162033; font-family: Arial, sans-serif; }
                .topbar { height: 64px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 10; }
                .brand { font-weight: 800; letter-spacing: .02em; }
                .nav { display: flex; gap: 12px; align-items: center; }
                .nav a, .nav button { border: 1px solid #d8dee9; background: #fff; color: #162033; border-radius: 8px; padding: 9px 12px; text-decoration: none; font-weight: 700; cursor: pointer; }
                .page { padding: 28px; max-width: 1180px; margin: 0 auto; }
                .admin-header, .operator-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 22px; box-shadow: 0 8px 28px rgba(15,23,42,.06); }
                .admin-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 18px; }
                h1, h2 { margin: 0; }
                h1 { font-size: 26px; }
                h2 { font-size: 20px; }
                .eyebrow { margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 800; }
                .muted { color: #64748b; font-size: 14px; }
                .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; }
                .posto-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; }
                .posto-card header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
                .focus-tag { background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 800; }
                .checks-grid { display: grid; gap: 12px; }
                .check-panel { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
                .check-panel.active { border-color: #2563eb; box-shadow: inset 4px 0 0 #2563eb; }
                .check-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
                .status-pill { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 800; white-space: nowrap; }
                .dot { width: 8px; height: 8px; border-radius: 999px; }
                .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
                .foto { aspect-ratio: 4 / 3; border: 1px solid #dbe2ea; border-radius: 8px; overflow: hidden; position: relative; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: 700; }
                .foto img { width: 100%; height: 100%; object-fit: cover; }
                .delete-photo { position: absolute; right: 6px; bottom: 6px; border: 0; background: #dc2626; color: #fff; border-radius: 6px; padding: 5px 7px; font-size: 11px; cursor: pointer; }
                .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 10px; color: #475569; font-size: 13px; }
                .operator-panel { max-width: 720px; margin: 0 auto; display: grid; gap: 18px; }
                .field { display: grid; gap: 7px; }
                label { font-size: 13px; font-weight: 800; color: #334155; }
                select, input { min-height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 15px; background: #fff; }
                input[type="file"] { padding: 10px; }
                .segmented { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
                .segmented button { height: 44px; border: 0; background: #fff; font-weight: 800; cursor: pointer; }
                .segmented button.selected { background: #1d4ed8; color: #fff; }
                .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                .primary { height: 48px; border: 0; background: #facc15; color: #1f2937; border-radius: 8px; font-weight: 900; cursor: pointer; }
                .primary:disabled { opacity: .6; cursor: wait; }
                .toast { position: fixed; right: 22px; bottom: 22px; background: #0f172a; color: #fff; padding: 14px 16px; border-radius: 8px; font-weight: 800; box-shadow: 0 10px 30px rgba(15,23,42,.25); z-index: 20; }
                .toast.error { background: #991b1b; }
                .loading { padding: 30px; }
                @media (max-width: 720px) {
                    .topbar, .admin-header { align-items: flex-start; flex-direction: column; height: auto; padding: 16px; }
                    .page { padding: 16px; }
                    .cards, .form-grid { grid-template-columns: 1fr; }
                    .photos { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>

            <header className="topbar">
                <div>
                    <div className="brand">Sistema CBMSC</div>
                    <div className="muted">{usuario.email} · {usuario.tipo === "ADMIN" ? "Administrador" : "Salva-vidas"}</div>
                </div>
                <nav className="nav">
                    {usuario.tipo === "ADMIN" && <Link to="/cadastro-posto">Postos</Link>}
                    <button onClick={logout}>Sair</button>
                </nav>
            </header>

            {usuario.tipo === "ADMIN" ? (
                <main className="page">
                    <section className="admin-header">
                        <div>
                            <p className="eyebrow">Acompanhamento diário</p>
                            <h1>Checks dos postos</h1>
                        </div>

                        <div className="admin-actions">
                            <div className="segmented admin-tabs">
                                <button
                                    className={abaAdmin === "checkin" ? "selected" : ""}
                                    onClick={() => setAbaAdmin("checkin")}
                                >
                                    Checkin
                                </button>

                                <button
                                    className={abaAdmin === "checkout" ? "selected" : ""}
                                    onClick={() => setAbaAdmin("checkout")}
                                >
                                    Checkout
                                </button>
                            </div>

                            <button className="primary" onClick={carregarChecks}>
                                Atualizar
                            </button>
                        </div>
                    </section>
                    <section className="cards">
                        {checks.map((item) => (
                            <AdminPostoCard
                                key={item.postoId}
                                item={item}
                                abaAtiva={abaAdmin}
                                onDeletePhoto={excluirFoto}
                            />
                        ))}
                    </section>
                </main>
            ) : (
                <GuardaVidasPanel postos={postos} showToast={showToast} />
            )}

            {toast && <div className={`toast ${toast.type === "error" ? "error" : ""}`}>{toast.msg}</div>}
        </>
    );
}
