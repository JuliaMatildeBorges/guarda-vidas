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
        <div className="bg-gray-100 h-screen flex items-center justify-center">
            <div className="flex items-center flex-col bg-white p-8 rounded shadow-md">
                <input
                    type="text"
                    name="usuario"
                    placeholder="Digite o seu usuario"
                    onChange={(e) => setUsuario(e.target.value)}
                    className="mb-4 p-2 border border-gray-300 rounded" />

                <input
                    type="password"
                    name="senha"
                    placeholder="Digite sua senha"
                    onChange={(e) => setSenha(e.target.value)}
                    className="mb-4 p-2 border border-gray-300 rounded" />

                <button onClick={fazerLogin}>Entrar</button>
            </div>
        </div>
    )

}