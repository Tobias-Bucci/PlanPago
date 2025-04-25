import { API_BASE } from "../config";
import React,{useState,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import CountryAutoComplete from "../utils/CountryAutoComplete";

export default function Profile(){
  /* state */
  const [email,setEmail]           = useState("");
  const [oldPw,setOldPw]           = useState("");
  const [newPw,setNewPw]           = useState("");
  const [country,setCountry]       = useState("");
  const [currency,setCurrency]     = useState("EUR");
  const [emailRem,setEmailRem]     = useState(true);
  const [msg,setMsg]               = useState("");
  const [tmp,setTmp]               = useState("");
  const [code,setCode]             = useState("");

  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const API      = API_BASE;

  /* load profile */
  useEffect(()=>{
    (async()=>{
      const r = await fetch(`${API}/users/me`,{headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok) return navigate("/login");
      const me = await r.json();
      setEmail(me.email);
      setCountry(me.country||"");
      setCurrency(me.currency||"EUR");
      setEmailRem(me.email_reminders_enabled);
      localStorage.setItem("currentEmail",me.email);
    })();
  },[API,navigate,token]);

  /* request / confirm change */
  const requestChange=async e=>{
    e.preventDefault(); setMsg("");
    try{
      const body={old_password:oldPw};
      if(email) body.email=email;
      if(newPw) body.password=newPw;
      const r=await fetch(`${API}/users/me`,{
        method:"PATCH",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify(body),
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.detail||"Error");
      setTmp(d.temp_token); setMsg("Code sent – confirm below.");
    }catch(err){setMsg("Error: "+err.message);}
  };
  const confirmChange=async e=>{
    e.preventDefault(); setMsg("");
    try{
      const r=await fetch(`${API}/users/me/confirm`,{
        method:"PATCH",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({temp_token:tmp,code}),
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.detail||"Invalid code");
      localStorage.setItem("currentEmail",d.email);
      setEmail(d.email); setTmp(""); setCode(""); setOldPw(""); setNewPw("");
      setMsg("Profile updated.");
    }catch(err){setMsg("Error: "+err.message);}
  };

  /* save settings */
  const saveSettings=async ()=>{
    setMsg("");
    try{
      const r=await fetch(`${API}/users/me/settings`,{
        method:"PATCH",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({country,currency,email_reminders_enabled:emailRem}),
      });
      if(!r.ok){
        const d=await r.json().catch(()=>({}));
        throw new Error(d.detail||"Error");
      }
      localStorage.setItem(`country_${email}`,country);
      localStorage.setItem(`currency_${email}`,currency);
      setMsg("Settings saved.");
    }catch(err){setMsg("Error: "+err.message);}
  };

  /* delete */
  const delAccount=async ()=>{
    if(!window.confirm("Delete account permanently?")) return;
    await fetch(`${API}/users/me`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
    localStorage.clear(); navigate("/register");
  };

  /* UI */
  return(
    <main className="container mx-auto pt-24 p-6 space-y-8">
      <h1 className="text-3xl font-semibold text-white">Settings</h1>

      {msg && <div className="glass-card p-4 text-emerald-200">{msg}</div>}

      {/* change email / pw */}
      {tmp ? (
        <form onSubmit={confirmChange} className="glass-card p-6 space-y-4 animate-pop">
          <h2 className="text-xl font-medium text-white">Confirm code</h2>
          <input className="frosted-input" placeholder="6-digit code"
                 value={code} onChange={e=>setCode(e.target.value)} required/>
          <button className="btn-accent w-full">Confirm</button>
        </form>
      ) : (
        <form onSubmit={requestChange} className="glass-card p-6 space-y-4 animate-pop">
          <h2 className="text-xl font-medium text-white">Change profile</h2>
          <input className="frosted-input" type="email" placeholder="E-mail"
                 value={email} onChange={e=>setEmail(e.target.value)} required/>
          <input className="frosted-input" type="password" placeholder="Current password"
                 value={oldPw} onChange={e=>setOldPw(e.target.value)} required/>
          <input className="frosted-input" type="password" placeholder="New password (optional)"
                 value={newPw} onChange={e=>setNewPw(e.target.value)}/>
          <button className="btn-primary w-full">Request change</button>
        </form>
      )}

      {/* personal settings */}
      <section className="glass-card p-6 space-y-4 animate-pop">
        <h2 className="text-xl font-medium text-white">Personal settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <CountryAutoComplete value={country} onChange={setCountry}/>
          <select className="frosted-input" value={currency} onChange={e=>setCurrency(e.target.value)}>
            <option>EUR</option><option>USD</option><option>CHF</option><option>GBP</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-white/90">
          <input type="checkbox" checked={emailRem}
                 onChange={e=>setEmailRem(e.target.checked)}
                 className="h-5 w-5 rounded"/>
          Enable e-mail reminders
        </label>
        <div className="text-right">
          <button onClick={saveSettings} className="btn-primary">Save</button>
        </div>
      </section>

      <button onClick={delAccount}
              className="btn-accent bg-red-600 hover:bg-red-700 w-full">
        Delete account
      </button>
    </main>
  );
}
