import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"

export function Dashboard() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);


    const logout = () => {
        localStorage.removeItem('token')
        alert("Bye")
        navigate("/")

    }

    useEffect(() => {

        const token = localStorage.getItem('token')
        fetch('https://dummyjson.com/auth/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(resposta => {
                if (resposta.ok) {
                    return resposta.json()
                }
                throw new Error('Token inválido')
            })
            .then(dadosUsuario => {
                setUsuario(dadosUsuario)
            })
            .catch(erro => {
                alert("Sessão expirada. Faça login novamente.")
                logout()
            })
    }, [])

    if (!usuario) {
        return <p>Validando credenciais de segurança.....</p>
    }

    return (
        <div>
            <div>
                <nav>
                    <Link to="/" onClick={logout}>Logout</Link>
                    <Link to="/cadastro-posto">Cadastrar Posto</Link>
                </nav>
            </div>
            
        <div className="bg-gray-100 h-screen flex items-center justify-center">
            <div className="flex grid grid-cols-3 gap-4">
                <button className="bg-red-500 p-2 border border-gray-500 rounded-xl w-50 text-white hover hover:bg-red-800">POSTO 1</button>
                <button>POSTO 2</button>
                <button>POSTO 3</button>
                <button>POSTO 4</button>
                <button>POSTO 5</button>
            </div>
        </div>
        </div>
    )
}