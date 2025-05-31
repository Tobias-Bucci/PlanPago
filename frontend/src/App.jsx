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
import Terms from "./pages/Terms";
import Landing from "./pages/Landing";
import ImpersonateConfirm from "./pages/ImpersonateConfirm";
import Impressum from "./pages/Impressum";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookieConsent from "./components/CookieConsent";

function App() {
  return (
    <BrowserRouter>
      <div className="App text-white">
        <NavBar />
        <CookieConsent />
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

          <Route path="/terms" element={<Terms />} />

          <Route
            path="/users/admin/impersonate-confirm/:token"
            element={<ImpersonateConfirm />}
          />

          <Route path="/imprint" element={<Impressum />} />
          <Route path="/privacypolicy" element={<PrivacyPolicy />} />

          <Route path="/" element={<Landing />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
