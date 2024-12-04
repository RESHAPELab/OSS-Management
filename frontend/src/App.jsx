import './App.css';
import LoginSignup from './pages/login-signup/LoginSignup';
import EmailVerification from './pages/login-signup/EmailVerification'
import StudentRegister from './pages/studentSignup/StudentRegister';
import Home from './pages/home/Home'
import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from 'react';
import { useAuthContext } from './context/AuthContext';


const App = () => {
  const { authUser , setAuthUser  } = useAuthContext(); 
  
  useEffect(() => {
    const storedUser  = localStorage.getItem("professor");
    if (storedUser ) {
      setAuthUser (JSON.parse(storedUser));
      console.log(storedUser)
    }
  }, [setAuthUser ]);

  return (
    <div className="App">
      <Routes>
        <Route path='/login' element={authUser  ? <Home /> : <LoginSignup />} />
        <Route path='/' element={authUser && authUser.verified ? <Home /> : <EmailVerification />} />
        <Route path='/verify' element={authUser && !authUser.verified ? <EmailVerification /> : <Home/>} />
        <Route path='/studentRegister' element={< StudentRegister />} />
      </Routes>
    </div>
  );
}

export default App;
