import { Autenticacao } from "./components/Autenticacao";
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
      </Routes>

    </BrowserRouter>


  );
}

export default App;
