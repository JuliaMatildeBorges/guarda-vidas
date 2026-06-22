import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = (process.env.REACT_APP_API_URL || process.env.REACT_APP_API || "http://localhost:8080").replace(/^['"]|['"]$/g, "");

/**
 * Componente de cabeçalho reutilizável do Sistema CBMSC.
 * Apresenta informações do usuário logado (nome, CPF e nível de acesso), 
 * links de navegação condicionados ao tipo de usuário (Admin/Salva-vidas)
 * e o controle de logout.
 */
export function Header({ usuario: propUsuario, onLogout }) {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(propUsuario || null);

    const logout = useCallback(() => {
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("tipo");
            localStorage.removeItem("nome");
            localStorage.removeItem("cpf");
            navigate("/");
        }
    }, [navigate, onLogout]);

    useEffect(() => {
        if (propUsuario) {
            setUsuario(propUsuario);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        fetch(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((dados) => {
                setUsuario(dados);
                localStorage.setItem("tipo", dados.tipo);
                localStorage.setItem("nome", dados.nome || "");
                localStorage.setItem("cpf", dados.cpf || "");
            })
            .catch(() => {
                logout();
            });
    }, [propUsuario, navigate, logout]);

    if (!usuario) {
        return (
            <header className="sticky top-0 z-10 bg-white border-b border-gray-300 shadow-sm h-[65px] flex items-center justify-between px-6">
                <div className="h-[3px] absolute top-0 left-0 w-full" style={{ background: "#C41E2A" }} />
                <div className="text-xs text-gray-400 font-semibold">Carregando informações do usuário...</div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-10 bg-white border-b border-gray-300 shadow-sm">
            {/* Linha vermelha no topo */}
            <div className="h-[3px]" style={{ background: "#C41E2A" }} />
            <div className="flex items-center justify-between px-6 py-3">
                <div>
                    <div className="font-bold text-gray-900 tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
                        Sistema CBMSC
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        {usuario.nome || "Usuário"}
                        {usuario.cpf && (
                            <>
                                <span className="mx-1.5 text-gray-300">·</span>
                                {usuario.cpf}
                            </>
                        )}
                        <span className="mx-1.5 text-gray-300">·</span>
                        <span className="font-semibold" style={{ color: "#C41E2A" }}>
                            {usuario.tipo === "ADMIN" ? "Administrador" : "Salva-vidas"}
                        </span>
                    </div>
                </div>
                <nav className="flex items-center gap-2">
                    <Link
                        to="/dashboard"
                        className="border border-gray-300 bg-white text-gray-700 rounded px-3 py-2 text-xs font-bold tracking-wide no-underline hover:border-gray-400 transition-colors"
                    >
                        Painel
                    </Link>
                    {usuario.tipo === "ADMIN" && (
                        <>
                            <Link
                                to="/cadastro-posto"
                                className="border border-gray-300 bg-white text-gray-700 rounded px-3 py-2 text-xs font-bold tracking-wide no-underline hover:border-gray-400 transition-colors"
                            >
                                Postos
                            </Link>
                            <Link
                                to="/cadastro-usuario"
                                className="border border-gray-300 bg-white text-gray-700 rounded px-3 py-2 text-xs font-bold tracking-wide no-underline hover:border-gray-400 transition-colors"
                            >
                                Usuários
                            </Link>
                        </>
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
    );
}
