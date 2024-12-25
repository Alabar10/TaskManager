// src/LogIn/login.js
import React, { useState } from 'react';
import TextWrapper from '../../TextWrapper';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import './login.css';



const Login = () => {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
   
  


const handleLogin=()=>{
  if (email === '' || password === '') {
    Alert.alert('Error', 'Please fill in both fields.');
  } else {
    Alert.alert('Success', `Logged in with email: ${email}`);
  }
};
return (
  <div className="container">
    <h1 className="heading">Login Page</h1>

    <input
      className="input"
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <input
      className="input"
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <button className="button" onClick={handleLogin}>
      Log In
    </button>
  </div>
);
};

export default Login;
