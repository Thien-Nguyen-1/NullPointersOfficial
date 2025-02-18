import React from 'react';
import{ BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/SignUp';
import Welcome from './components/Welcome';
import './App.css';

// 

function App() {
  return (
    <Router>
      <Routes>
        <Route path = "/" element = {<Welcome />} />
        <Route path = "/login" element = {<Login />} />
        <Route path = "/signup" element = {<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;