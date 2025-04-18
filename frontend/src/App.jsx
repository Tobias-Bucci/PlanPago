// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ContractForm from "./pages/ContractForm";
import ProtectedRoute from "./ProtectedRoute";
import Stats from "./pages/Stats";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <Stats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/new"
          element={
            <ProtectedRoute>
              <ContractForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:id/edit"
          element={
            <ProtectedRoute>
              <ContractForm isEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adminpanel"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Fallback auf Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
