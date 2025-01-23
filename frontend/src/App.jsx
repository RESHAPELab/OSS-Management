import './App.css';
import LoginSignup from './pages/login-signup/LoginSignup';
import EmailVerification from './pages/login-signup/EmailVerification'
import StudentRegister from './pages/studentSignup/StudentRegister';
import ClassView from './pages/class-view/ClassView'
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
      console.log(`signed in user: `, authUser)
    }
  }, [setAuthUser ]);

  return (
    <div className="App">
      <Routes>
        <Route exact path='/login' element={authUser  ? <Home /> : <LoginSignup />} />
        <Route exact path='/' element={authUser ? (authUser.verified ? <Home /> : <EmailVerification />) : <LoginSignup /> } />
        <Route exact path='/verify' element={authUser && !authUser.verified ? <EmailVerification /> : <Home/>} />
        <Route exact path='/studentRegister' element={< StudentRegister />} />
        <Route path="/class/:classId" element={<ClassView />} />
      </Routes>
    </div>
  );
}

export default App;
