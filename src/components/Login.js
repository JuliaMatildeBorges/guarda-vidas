import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";


    export function Login(){    
    const navigate = useNavigate()
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");


    const fazerLogin = async( e) => {

        e.preventDefault();
        
        try {

            const resposta = await fetch('https://dummyjson.com/auth/login', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: usuario,
                    password: senha
                })
            })

            if(resposta.ok){
                const dados =  await resposta.json(); 
                localStorage.setItem('token', dados.accessToken)
                alert('Login realizado com sucesso!')
                navigate('/dashboard')
            } else {
                alert('Usuario e/ou senha incorretos. Verifique e tente novamente.')
            }

        } catch {
            alert('Erro na conexão com o servidor')
        }

    }

    return (
<div className="min-h-screen bg-gray-100 flex items-center justify-center">
  <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
    
    {/* Header */}
    <div className="bg-blue-900 text-white text-center py-6">
      <h1 className="text-xl font-semibold tracking-wide">
        Sistema CBMSC
      </h1>
      <p className="text-sm text-gray-200 mt-1">
        Acesso ao painel
      </p>
    </div>

    {/* Formulário */}
    <div className="p-8 flex flex-col gap-4">
      <input
        type="text"
        name="usuario"
        placeholder="Usuário"
        onChange={(e) => setUsuario(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 transition"
      />

      <input
        type="password"
        name="senha"
        placeholder="Senha"
        onChange={(e) => setSenha(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 transition"
      />

      <button
        onClick={fazerLogin}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg transition duration-200"
      >
        Entrar
      </button>
    </div>

    {/* Rodapé */}
    <div className="bg-gray-50 text-center py-3 text-sm text-gray-500">
      © 2026 - Sistema de Controle de Postos CBMSC. Todos os direitos reservados. 
    </div>
  </div>
</div>
    )

}