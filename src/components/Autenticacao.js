import { Navigate } from "react-router-dom";

export function Autenticacao({children}){
    const estaLogado = localStorage.getItem("token")
    if(!estaLogado) {
        return <Navigate to= "/"/>
    }

    return children;
}