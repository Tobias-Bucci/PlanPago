// Register.jsx  –  glass-morphism edition
import { API_BASE } from "../config";
import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

/* identical helper used in Login */
const cacheProfile = async (token)=>{
  try{
    const r = await fetch(`${API_BASE}/users/me`,{
      headers:{Authorization:`Bearer ${token}`},
    });
    if(!r.ok) return;
    const me = await r.json();
    localStorage.setItem("currentEmail", me.email);
    localStorage.setItem(`country_${me.email}`,  me.country  || "");
    localStorage.setItem(`currency_${me.email}`, me.currency || "EUR");
  }catch{/* silent */}
};

export default function Register(){
  const [step, setStep]   = useState(1);
  const [email,setEmail]  = useState("");
  const [pw,   setPw]     = useState("");
  const [temp,setTemp]    = useState("");
  const [code,setCode]    = useState("");
  const [err, setErr]     = useState("");
  const [ld,  setLd]      = useState(false);

  const navigate = useNavigate();
  const API      = API_BASE;

  /* create account + request 2-FA code ----------------------- */
  const handleRegister = async (e)=>{
    e.preventDefault();
    setErr(""); setLd(true);
    try{
      const r = await fetch(`${API}/users/`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password:pw}),
      });
      if(r.status!==201){
        const d = await r.json();
        throw new Error(d.detail||"Registration failed");
      }

      /* immediately trigger code */
      const form = new URLSearchParams({username:email,password:pw});
      const login1 = await fetch(`${API}/users/login`,{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:form.toString(),
      });
      if(!login1.ok) throw new Error("Code request failed");
      const {temp_token}=await login1.json();
      setTemp(temp_token); setStep(2);
    }catch(e){ setErr(e.message) }
    finally   { setLd(false) }
  };

  /* confirm 2-FA code ---------------------------------------- */
  const handleVerify = async (e)=>{
    e.preventDefault();
    setErr(""); setLd(true);
    try{
      const r = await fetch(`${API}/users/verify-code`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({temp_token:temp, code}),
      });
      if(!r.ok) throw new Error("Invalid code");
      const {access_token}=await r.json();
      localStorage.setItem("token",access_token);
      await cacheProfile(access_token);
      navigate("/dashboard",{replace:true});
    }catch(e){ setErr(e.message) }
    finally   { setLd(false) }
  };

  /* ── JSX ─────────────────────────────────────────── */
  return(
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 animate-pop">
        <h2 className="text-2xl font-semibold text-center mb-6 tracking-wide">
          {step===1?"Register":"Confirm"}
        </h2>

        {err && (
          <div className="mb-4 p-3 bg-red-600/20 text-red-300 rounded-lg">
            {err}
          </div>
        )}

        {/* step 1 form */}
        {step===1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="email"
              placeholder="E-mail"
              className="frosted-input"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="frosted-input"
              value={pw}
              onChange={e=>setPw(e.target.value)}
              required
            />
            <button className="btn-primary w-full" disabled={ld}>
              {ld?"Please wait…":"Register"}
            </button>
            <p className="text-center text-sm text-white/80">
              Already have an account?{" "}
              <NavLink to="/login" className="underline text-white">
                Log in
              </NavLink>
            </p>
          </form>
        )}

        {/* step 2 form */}
        {step===2 && (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder="6-digit code"
              className="frosted-input"
              value={code}
              onChange={e=>setCode(e.target.value)}
              required
            />
            <button className="btn-accent w-full" disabled={ld}>
              {ld?"Validating…":"Confirm"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
