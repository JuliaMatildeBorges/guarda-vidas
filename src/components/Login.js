import { useState } from "react"
import { useNavigate } from "react-router-dom";
import Logo from '../assets/logo-bombeiros.png';  


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const onlyDigits = (value) => value.replace(/\D/g, "").slice(0, 11);

const formatCpf = (value) => {
  const digits = onlyDigits(value);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export function Login() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: onlyDigits(cpf), senha: senha }),
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        localStorage.setItem("token", dados.token);
        localStorage.setItem("tipo", dados.tipo);
        localStorage.setItem("nome", dados.nome || "");
        localStorage.setItem("cpf", dados.cpf || "");
        navigate("/dashboard");
      } else {
        const erro = await resposta.json().catch(() => ({}));
        alert(erro.message || "CPF ou senha incorretos.");
      }
    } catch {
      alert("Erro na conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#e7e7e7ff" }}>

      {/* Barra vermelha superior */}
      <div className="w-full max-w-sm">
        <div className="h-[3px] rounded-t" style={{ background: "#C41E2A" }} />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-gray-300 rounded-b shadow-sm">

        {/* Cabeçalho */}
        <div className="px-8 pt-7 pb-6 flex flex-col items-center text-center border-b border-gray-200 bg-gray-50">
          <img src={Logo} alt="Corpo de Bombeiros Militar" className="h-20"/>  
          <h1 className="mt-3 text-base font-bold text-gray-900 tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
            Corpo de Bombeiros Militar
          </h1>
          <p className="text-xs font-semibold tracking-widest mt-1 uppercase" style={{ color: "#C41E2A" }}>
            Estado de Santa Catarina
          </p>
          <div className="mt-3 w-8 h-[1.5px]" style={{ background: "#C41E2A" }} />
          <p className="mt-3 text-xs text-gray-500 font-medium tracking-wide">
            Sistema de Controle de Postos
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={fazerLogin} className="px-8 py-6 flex flex-col gap-4">

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">
              CPF
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                placeholder="Digite seu CPF"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                inputMode="numeric"
                maxLength={14}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">
              Senha
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all placeholder-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-1 rounded text-sm font-bold text-white tracking-wide transition-colors duration-150 flex items-center justify-center gap-2"
            style={{ background: loading ? "#e0a0a4" : "#C41E2A" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#a01820" }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#C41E2A" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                </svg>
                Autenticando...
              </>
            ) : "Entrar"}
          </button>

        </form>

        {/* Rodapé */}
        <div className="px-8 py-3 border-t border-gray-200 bg-gray-100 text-center rounded-b">
          <p className="text-xs text-gray-600 font-medium">Acesso restrito a militares e servidores autorizados.</p>
          <p className="text-xs text-gray-400 mt-1">© 2026 CBMSC · Todos os direitos reservados</p>
        </div>

      </div>
    </div>
  );
}
