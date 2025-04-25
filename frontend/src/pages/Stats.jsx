// Stats.jsx  –  glass cards + white text
import { API_BASE } from "../config";
import React,{useState,useEffect,useMemo} from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

/* colours & labels ------------------------------------------------- */
const TYPE_COLORS = {
  Gehalt:"#10B981", Miete:"#EF4444", Streaming:"#EC4899",
  Versicherung:"#3B82F6", Leasing:"#F59E0B", Sonstiges:"#6B7280",
};
const TYPE_LABEL = {
  Gehalt:"Salary", Miete:"Rent", Streaming:"Streaming",
  Versicherung:"Insurance", Leasing:"Leasing", Sonstiges:"Others",
};

export default function Stats(){
  const [contracts,setContracts]=useState([]);
  const [salary,setSalary]=useState(0);
  const [fix,setFix]=useState(0);
  const [avail,setAvail]=useState(0);
  const [error,setErr]=useState(""); const [loading,setLd]=useState(true);

  const API=API_BASE;
  const authHeader=useMemo(()=>({Authorization:`Bearer ${localStorage.getItem("token")}`}),[]);

  useEffect(()=>{
    (async()=>{
      try{
        setLd(true); setErr("");
        const r=await fetch(`${API}/contracts/`,{headers:authHeader});
        if(!r.ok) throw new Error("Error loading data");
        const now=new Date();
        const data=(await r.json()).filter(c=>!c.end_date||new Date(c.end_date)>=now);
        setContracts(data);
        const sal=data.filter(c=>c.contract_type==="Gehalt")
                      .reduce((s,c)=>s+Number(c.amount),0);
        const fixed=data.reduce((s,c)=>{
          if(c.contract_type==="Gehalt") return s;
          const v=Number(c.amount);
          return s + (c.payment_interval==="jährlich"?v/12:v);
        },0);
        setSalary(sal); setFix(fixed); setAvail(sal-fixed);
      }catch(e){ setErr(e.message) } finally{ setLd(false) }
    })();
  },[API,authHeader]);

  /* chart data */
  const chartData=useMemo(()=>{
    const map=Object.fromEntries(Object.keys(TYPE_COLORS).map(k=>[k,0]));
    contracts.forEach(c=>{
      let v=Number(c.amount);
      if(c.contract_type!=="Gehalt"&&c.payment_interval==="jährlich") v/=12;
      const key=TYPE_COLORS[c.contract_type]?c.contract_type:"Sonstiges";
      map[key]+=v;
    });
    return Object.entries(map).filter(([,v])=>v>0)
      .map(([name,value])=>({name,value}));
  },[contracts]);

  const total=chartData.reduce((s,e)=>s+e.value,0);
  const legend=(val,entry)=>`${TYPE_LABEL[val]}: ${((entry.payload.value/total)*100).toFixed(0)}%`;

  const cur=localStorage.getItem(`currency_${localStorage.getItem("currentEmail")}`)||"€";

  return(
    <main className="container mx-auto pt-24 p-6 animate-fadeIn">
      <h1 className="text-3xl font-semibold text-white mb-6">Statistics</h1>

      {loading?(
        <div className="text-center text-white/70 py-10">Loading…</div>
      ):error?(
        <div className="glass-card p-4 text-red-300">{error}</div>
      ):(
        <div className="grid lg:grid-cols-2 gap-8">
          {/* overview card */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-medium mb-4 text-white">Overview</h2>
            <ul className="space-y-2 text-lg text-white/90">
              <li><b>Income:</b> {salary.toFixed(2)} {cur}</li>
              <li><b>Fixed / month:</b> {fix.toFixed(2)} {cur}</li>
              <li><b>Available:</b> {avail.toFixed(2)} {cur}</li>
            </ul>
          </div>

          {/* donut */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-medium mb-4 text-white">Distribution by type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" paddingAngle={6}
                >
                  {chartData.map(e=>(
                    <Cell key={e.name} fill={TYPE_COLORS[e.name]}/>
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{background:"rgba(0,0,0,.7)",border:"none",color:"#fff"}}
                  formatter={v=>`${v.toFixed(2)} ${cur}`}
                />
                <Legend
                  iconType="circle" layout="horizontal" verticalAlign="bottom"
                  formatter={legend} wrapperStyle={{paddingTop:10,color:"#fff"}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </main>
  );
}
