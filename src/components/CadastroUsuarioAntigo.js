import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "./Header";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const onlyDigits = (value) => value.replace(/\D/g, "").slice(0, 11);

const formatCpf = (value) => {
  const digits = onlyDigits(value);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const isValidCpf = (value) => {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (base, factor) => {
    const total = base.split("").reduce((sum, number, index) => sum + Number(number) * (factor - index), 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const first = digit(cpf.slice(0, 9), 10);
  const second = digit(cpf.slice(0, 9) + first, 11);
  return cpf === `${cpf.slice(0, 9)}${first}${second}`;
};

export function CadastroUsuario() {
  const tipoUsuario = localStorage.getItem("tipo");
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    senha: "",
    confirmarSenha: "",
    perfil: "USUARIO",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const cpfDigits = onlyDigits(form.cpf);
  const cpfCompleto = cpfDigits.length === 11;
  const cpfValido = useMemo(() => isValidCpf(form.cpf), [form.cpf]);

  if (tipoUsuario !== "ADMIN") {
    return <Navigate to="/dashboard" />;
  }

  const set = (field) => (event) => {
    const value = field === "cpf" ? formatCpf(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  };

  const salvar = async (event) => {
    event.preventDefault();

    if (!cpfValido) {
      setFeedback({ type: "error", message: "CPF inválido. Verifique os números informados e tente novamente." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          cpf: cpfDigits,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Não foi possível cadastrar o usuário.");
      }

      setForm({ nome: "", cpf: "", senha: "", confirmarSenha: "", perfil: "USUARIO" });
      setFeedback({ type: "success", message: "Usuário cadastrado com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#e7e7e7" }}>
      <Header />

      <main className="px-4 py-8 max-w-2xl mx-auto">
        <div className="h-[3px] rounded-t" style={{ background: "#C41E2A" }} />
        <section className="bg-white border border-gray-300 rounded-b shadow-sm">
          <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-gray-50">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "#C41E2A" }}>
              Administração
            </p>
            <h1 className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: "'Georgia', serif" }}>
              Cadastro de usuários
            </h1>
            <p className="text-xs text-gray-500 mt-1">CPF será salvo apenas com números. A máscara aparece somente na tela.</p>
          </div>

          <form onSubmit={salvar} className="px-6 py-5 grid gap-4">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">Nome</label>
              <input
                value={form.nome}
                onChange={set("nome")}
                required
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">CPF</label>
              <input
                value={form.cpf}
                onChange={set("cpf")}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                required
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:bg-white focus:ring-2"
                style={{
                  borderColor: cpfCompleto ? (cpfValido ? "#16a34a" : "#dc2626") : undefined,
                  boxShadow: cpfCompleto ? `0 0 0 2px ${cpfValido ? "#dcfce7" : "#fee2e2"}` : undefined,
                }}
              />
              {cpfCompleto && (
                <p className="text-xs mt-2 font-semibold" style={{ color: cpfValido ? "#16a34a" : "#dc2626" }}>
                  {cpfValido ? "CPF válido." : "CPF inválido. Verifique os números informados e tente novamente."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">Senha</label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={set("senha")}
                  required
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">Confirmar senha</label>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={set("confirmarSenha")}
                  required
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5 text-gray-700">Perfil</label>
              <select
                value={form.perfil}
                onChange={set("perfil")}
                required
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100"
              >
                <option value="USUARIO">Usuário comum</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {feedback && (
              <div
                className="px-4 py-3 rounded text-sm font-bold"
                style={{
                  background: feedback.type === "error" ? "#fee2e2" : "#dcfce7",
                  color: feedback.type === "error" ? "#991b1b" : "#166534",
                }}
              >
                {feedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded text-sm font-bold text-white tracking-wide"
              style={{ background: loading ? "#e0a0a4" : "#C41E2A" }}
            >
              {loading ? "Salvando..." : "Cadastrar usuário"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
