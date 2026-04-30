import { Autenticacao } from "./components/Autenticacao";
import { CadastroPosto } from "./components/CadastroPosto";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";



function App() {
 return (


    <BrowserRouter>
    
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/dashboard' element={
          <Autenticacao>
            < Dashboard />  
          </Autenticacao>
        } />
        <Route path='/cadastro-posto' element={
          <Autenticacao>
            < CadastroPosto />  
          </Autenticacao>
        } />  
      </Routes>

    </BrowserRouter>


  );
}

export default App;
