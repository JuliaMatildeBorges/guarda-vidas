import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"

export function Dashboard() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);


    const [postos, setPostos] = useState([]);

    
    useEffect(() => {
        fetch("http://localhost:8080/posto")
            .then((response) => response.json())
            .then((data) => setPostos(data));
    }, []);


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
                <h1>Postos</h1>

                {postos.map((posto) => (
                    <div key={posto.id}>
                        <h2>{posto.nome}</h2>

                        <Link to={`/posto/${posto.id}`}>
                            Acessar
                        </Link>
                    </div>
                ))}


            </div>
        </div >
    )
}