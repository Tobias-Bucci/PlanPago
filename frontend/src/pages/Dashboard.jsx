// Dashboard.jsx  –  glass contract table
import { API_BASE } from "../config";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Edit3, Trash2 } from "lucide-react";

export default function Dashboard() {
  const [contracts,setContracts]=useState([]);
  const [msg,setMsg]   =useState("");
  const [err,setErr]   =useState("");
  const [loading,setLd]=useState(true);
  const [currency,setCur]=useState("€");
  const navigate = useNavigate();

  const API = API_BASE;
  const authHeader = useMemo(()=>{
    const t = localStorage.getItem("token");
    return { Authorization:`Bearer ${t}` };
  },[]);

  /* load & enrich contracts ---------------------------------- */
  const loadContracts = useCallback(async ()=>{
    setLd(true); setErr("");
    try{
      const r = await fetch(`${API}/contracts/`,{headers:authHeader});
      if(!r.ok) throw new Error("Error loading contracts");
      const list = await r.json();
      const withFiles = await Promise.all(list.map(async c=>{
        const fr = await fetch(`${API}/contracts/${c.id}/files`,{headers:authHeader});
        const files = fr.ok ? await fr.json() : [];
        return {...c, files};
      }));
      setContracts(withFiles);
    }catch(e){ setErr(e.message) }
    finally   { setLd(false) }
  },[API,authHeader]);

  useEffect(()=>{
    const mail = localStorage.getItem("currentEmail");
    setCur(localStorage.getItem(`currency_${mail}`)||"€");
    loadContracts();
  },[loadContracts]);

  /* helpers --------------------------------------------------- */
  const deleteContract = async (id)=>{
    if(!window.confirm("Delete this contract permanently?")) return;
    try{
      const r = await fetch(`${API}/contracts/${id}`,{
        method:"DELETE", headers:authHeader,
      });
      if(!r.ok) throw new Error("Deletion failed");
      setMsg("Contract deleted"); loadContracts();
    }catch(e){ setErr(e.message) }
  };

  const deleteFile = async (cid,fid)=>{
    if(!window.confirm("Delete this attachment?")) return;
    try{
      const r = await fetch(`${API}/contracts/${cid}/files/${fid}`,{
        method:"DELETE", headers:authHeader,
      });
      if(!r.ok) throw new Error("Attachment could not be deleted");
      setMsg("Attachment deleted"); loadContracts();
    }catch(e){ setErr(e.message) }
  };

  /* ————————————————— JSX ————————————————— */
  const today = new Date();
  return (
    <main className="container mx-auto pt-24 p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-white">Overview</h1>
        <button
          onClick={()=>navigate("/contracts/new")}
          className="btn-accent rounded-full p-3"
          title="New contract"
        >
          <PlusCircle size={24}/>
        </button>
      </div>

      {msg && <div className="glass-card mb-4 p-3 text-green-200">{msg}</div>}
      {err && <div className="glass-card mb-4 p-3 text-red-300">{err}</div>}

      {loading ? (
        <div className="text-center py-10 text-white/70">Loading contracts…</div>
      ) : contracts.length===0 ? (
        <div className="text-center py-10 text-white/70">No contracts available.</div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="min-w-full text-white/90">
            <thead className="text-white uppercase text-sm bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Start</th>
                <th className="px-6 py-3 text-left">End</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Files</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c,idx)=>{
                const end=new Date(c.end_date||"");
                const expired=end && end<today;
                return (
                  <React.Fragment key={c.id}>
                    <tr className={expired?"opacity-50":"hover:bg-white/5"}>
                      <td className="px-6 py-4">{c.name}</td>
                      <td className="px-6 py-4">{c.contract_type}</td>
                      <td className="px-6 py-4">{new Date(c.start_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{c.end_date?end.toLocaleDateString():"-"}</td>
                      <td className="px-6 py-4">{c.amount} {currency}</td>
                      <td className="px-6 py-4">
                        <span className={expired?"text-red-400":"text-emerald-300"}>
                          {expired?"Expired":c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        {c.files.map(f=>(
                          <div key={f.id} className="relative">
                            <a href={`${API}${f.url}`} target="_blank" rel="noopener noreferrer">
                              {f.url.endsWith(".pdf")
                                ? <span className="text-2xl">📄</span>
                                : <img src={`${API}${f.url}`} alt={f.original_filename}
                                       className="h-10 w-10 rounded object-cover"/>}
                            </a>
                            <button
                              onClick={()=>deleteFile(c.id,f.id)}
                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px]"
                            >×</button>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={()=>navigate(`/contracts/${c.id}/edit`,{state:{contract:c}})}
                          className="btn-primary p-2"
                        >
                          <Edit3 size={18}/>
                        </button>
                        <button
                          onClick={()=>deleteContract(c.id)}
                          className="btn-accent bg-red-600 hover:bg-red-700 p-2"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                    {idx<contracts.length-1 && (
                      <tr><td colSpan="8"><div className="border-b border-white/10"/></td></tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
