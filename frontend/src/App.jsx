import './App.css';
import LoginSignup from './pages/login-signup/LoginSignup';
import EmailVerification from './pages/login-signup/EmailVerification'
import Home from './pages/home/Home'
import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from 'react';
import { useAuthContext } from './context/AuthContext';


const App = () => {
  // const { authUser , setAuthUser  } = useAuthContext(); 
  
  // useEffect(() => {
  //   const storedUser  = localStorage.getItem("professor");
  //   if (storedUser ) {
  //     setAuthUser (JSON.parse(storedUser ));
  //     console.log(storedUser)
  //   }
  // }, [setAuthUser ]);


  return (
    <div className="App">
      {/* <Routes>
        <Route path='/' element={authUser ? <Home /> : <Navigate to='login' />} />
        <Route path='/login' element={authUser  ? <Navigate to='/' /> : <LoginSignup />} />
      </Routes> */}
      <LoginSignup />
    </div>
  );
}

export default App;
