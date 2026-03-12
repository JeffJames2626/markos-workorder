import { useState, useEffect } from "react";

const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";
const RECIPIENT_EMAIL     = "Jeff@automatedlawnandpest.com";

const PINK = "#ee4f9a";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";

const THEMES = {
  dark:{bg:"#0d0d0d",card:"#161616",surface:"#1e1e1e",border:"#2a2a2a",muted:"#888",text:"#ffffff",subtext:"#aaaaaa",inputBg:"#1e1e1e",headerBg:"#161616",catOpen:"#1a0a11",partSel:"#1f0a15",partBg:"#1e1e1e",tipBg:"#0d0d14",tipBorder:"#2a2a3a",tipText:"#6666aa",footerBg:"#161616"},
  light:{bg:"#f4f4f5",card:"#ffffff",surface:"#f9f9f9",border:"#e0e0e0",muted:"#888",text:"#111111",subtext:"#555555",inputBg:"#ffffff",headerBg:"#ffffff",catOpen:"#fff0f7",partSel:"#fff0f7",partBg:"#f9f9f9",tipBg:"#f0f0ff",tipBorder:"#d0d0ff",tipText:"#7777bb",footerBg:"#ffffff"},
};

const BASE_CATALOG = {
  "Clocks / Controllers":{icon:"⏱",items:["Hunter X2 4-Station","Hunter X2 6-Station","Hunter X2 8-Station","Hunter X2 14-Station","Hunter WAND WiFi","Other / See Custom"]},
  "Valves":{icon:"🔧",items:['1" Irritrol 2400T','1" RB 100DV','1" Hunter PGV','24V Solenoid Repl','Diaphragm Repair Kit','Other / See Custom']},
  "Heads":{icon:"💧",items:['4" PGP-ADJ','4" PGP Ultra','4" PRS40','4" PRS30','4" PRS30 CkVlv','4" Hunter SRM (1/2")']},
  "Nozzles":{icon:"🌊",items:['MP 1000','MP 2000','MP 3000','ADJ VAN Nozzle','Fixed VAN Nozzle','Other / See Custom']},
  "Pipe":{icon:"〰",items:['1/2" Poly/ft','3/4" Poly/ft','1" Poly/ft','Funny Pipe/ft','___" PVC SCH40/ft']},
  "Fittings":{icon:"🔩",items:['Poly Coupling ___"','Poly Elbow ___"','Poly Tee ___"','Poly MIPT Adapter ___"','Poly FIPT Adapter ___"','Poly Cap / Plug ___"']},
  "Wire / Wire Nuts":{icon:"⚡",items:['18G 13 Wire/ft','Blue Wire Nut','18G 9 Wire/ft','Black Wire Nut','18G 5 Wire/ft','3M DBR-Y6 Splice Kit']},
  "Drip":{icon:"🪴",items:['1/4" Drip Tube/ft','1/4" Fittings','Micro Sprayer','Risers ___" x ___"','Drip Emitters','Drip Spray Spike']},
  "Backflows / Boxes":{icon:"📦",items:['1" Wilkins Backflow','(___") Round Box','1" Wilkins PVB','Standard Valve Box','Tape / Glue / Solder','Jumbo Valve Box']},
};

const CUSTOM_PARTS_KEY="markos_custom_parts";
const HISTORY_KEY="markos_wo_history";
const THEME_KEY="markos_theme";
const TECHS_KEY="markos_extra_techs";
const STEPS=["Job Info","Time","Parts","Notes","Review"];

const makeCss=(t)=>`
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{display:none}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  .fade-up{animation:fadeUp 0.22s ease both}
  .trow:active{transform:scale(0.98)}
  .btn:active{transform:scale(0.97)}
  .pulse{animation:pulse 1.4s ease-in-out infinite}
  input:focus,textarea:focus,select:focus{outline:none;border-color:#ee4f9a!important;box-shadow:0 0 0 3px #ee4f9a22}
  input::placeholder,textarea::placeholder{color:${t==="light"?"#bbb":"#444"}}
  option{background:${t==="light"?"#fff":"#1e1e1e"};color:${t==="light"?"#111":"#fff"}}
`;

function SLabel({children,noMargin,t}){
  const T=THEMES[t];
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:T.muted,textTransform:"uppercase",marginBottom:8,marginTop:noMargin?0:18}}>{children}</div>;
}
function RCard({title,children,T}){
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
      <div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>{title}</div>
      {children}
    </div>
  );
}
function RRow({label,value,T,accent}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${T.border}`,fontSize:13}}>
      <span style={{color:T.muted}}>{label}</span>
      <span style={{color:accent||T.text,fontWeight:500}}>{value}</span>
    </div>
  );
}

function fmtSecs(secs){
  const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;
  if(h>0)return`${h}h ${m}m`;
  if(m>0)return`${m}m ${s}s`;
  return`${s}s`;
}
function fmtHrs(secs){return secs>0?(secs/3600).toFixed(2):null;}
function fmtTime(ms){if(!ms)return"—";return new Date(ms).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}

function buildEmail(job,selected,description,repairs,timeData){
  const parts=Object.entries(selected).map(([k,qty])=>{const[cat,item]=k.split("||");return`  • ${item} (${cat}) x${qty}`;}).join("\n");
  const t=timeData;
  const timeStr=t?.billableHrs
    ?`Clock In:        ${t.clockInStr}\nClock Out:       ${t.clockOutStr}\nBillable Time:   ${t.billableHrs} hrs\nNon-Billable:    ${t.pausedHrs||"0.00"} hrs (breaks/travel)\nTotal on Site:   ${t.totalHrs} hrs`
    :"Not recorded";
  return`MARKO'S SPRINKLERS — SERVICE WORK ORDER
==========================================
Client:     ${job.client}
Address:    ${job.address}
Phone:      ${job.phone||"—"}
Tech:       ${job.tech}
Date:       ${job.date}
Zones:      ${job.zones||"—"}
Completed:  ${job.completed==="Y"?"Yes":job.completed==="N"?"Return Visit":"Partial"}

TIME ON SITE
------------
${timeStr}

DESCRIPTION
-----------
${description||"—"}

PARTS USED
----------
${parts||"None"}

ADDITIONAL REPAIRS
------------------
${repairs||"—"}
==========================================
Sent from Marko's Sprinklers Work Order App`.trim();
}

// ── ADD CUSTOM PART MODAL ───────────────────────────────────────────────────
function AddPartModal({T,theme,onSave,onClose}){
  const cats=Object.keys(BASE_CATALOG);
  const [name,setName]=useState("");
  const [cat,setCat]=useState(cats[0]);
  const inp={width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 13px",fontSize:15,color:T.text,outline:"none",fontFamily:"'DM Sans',sans-serif"};
  const valid=name.trim().length>0;
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#00000099"}} onClick={onClose}>
      <div className="fade-up" onClick={e=>e.stopPropagation()} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"16px 16px 0 0",padding:"20px 18px 32px",width:"100%",maxWidth:480}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:T.text,letterSpacing:1}}>ADD <span style={{color:PINK}}>CUSTOM PART</span></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Part Name *</div>
          <input autoFocus style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rain Bird 5000 Head"
            onKeyDown={e=>{if(e.key==="Enter"&&valid)onSave(name.trim(),cat);if(e.key==="Escape")onClose();}}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Category *</div>
          <select style={{...inp,colorScheme:theme}} value={cat} onChange={e=>setCat(e.target.value)}>
            {cats.map(c=><option key={c} value={c}>{BASE_CATALOG[c].icon} {c}</option>)}
          </select>
        </div>
        <button onClick={()=>{if(valid)onSave(name.trim(),cat);}} disabled={!valid}
          style={{width:"100%",background:valid?`linear-gradient(135deg,${PINK},#c9367e)`:"#333",color:valid?"#fff":"#555",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,cursor:valid?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>
          ＋ Add to Parts List
        </button>
      </div>
    </div>
  );
}

// ── SIGN-OFF COMPONENT ─────────────────────────────────────────────────────
function SignOff({T,theme,inp,signoffs,setSignoffs}){
  const {techSig,techDate,clientSig,clientDate}=signoffs;
  const sigStyle={...inp,fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,letterSpacing:1,padding:"14px 13px"};
  const upd=(f,v)=>setSignoffs(p=>({...p,[f]:v}));
  return(
    <RCard title="Sign-Off" T={T}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Technician Signature</div>
        <input style={sigStyle} value={techSig} onChange={e=>upd("techSig",e.target.value)} placeholder="Type full name to sign…"/>
        <div style={{marginTop:8}}>
          <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Date</div>
          <input type="date" style={{...inp,colorScheme:theme}} value={techDate} onChange={e=>upd("techDate",e.target.value)}/>
        </div>
        {techSig.trim()&&(
          <div style={{marginTop:8,padding:"8px 12px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:T.text,letterSpacing:1}}>{techSig}</span>
            <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{techDate}</span>
          </div>
        )}
      </div>
      <div style={{height:1,background:T.border,marginBottom:16}}/>
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Client Signature of Approval</div>
          <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",userSelect:"none"}}>
            <div onClick={()=>upd("clientAbsent",!signoffs.clientAbsent)}
              style={{width:18,height:18,borderRadius:4,border:`2px solid ${signoffs.clientAbsent?AMBER:T.border}`,background:signoffs.clientAbsent?AMBER:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
              {signoffs.clientAbsent&&<span style={{color:"#fff",fontSize:12,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:11,color:signoffs.clientAbsent?AMBER:T.muted,fontWeight:signoffs.clientAbsent?700:400,transition:"color 0.15s"}}>No client present</span>
          </label>
        </div>
        {signoffs.clientAbsent?(
          <div style={{background:"#1f1400",border:`1px solid ${AMBER}55`,borderRadius:8,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⚠️</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:AMBER}}>Client Not Present</div>
              <div style={{fontSize:11,color:"#a07030",marginTop:2}}>Work performed without client sign-off</div>
            </div>
          </div>
        ):(
          <>
            <input style={sigStyle} value={clientSig} onChange={e=>upd("clientSig",e.target.value)} placeholder="Client types full name to approve…"/>
            <div style={{marginTop:8}}>
              <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Date</div>
              <input type="date" style={{...inp,colorScheme:theme}} value={clientDate} onChange={e=>upd("clientDate",e.target.value)}/>
            </div>
            {clientSig.trim()&&(
              <div style={{marginTop:8,padding:"8px 12px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:T.text,letterSpacing:1}}>{clientSig}</span>
                <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{clientDate}</span>
              </div>
            )}
          </>
        )}
      </div>
    </RCard>
  );
}

// ── HISTORY SCREEN ──────────────────────────────────────────────────────────
function History({onBack,theme}){
  const T=THEMES[theme];
  const [log,setLog]=useState([]);
  const [open,setOpen]=useState(null);
  useEffect(()=>{try{const r=localStorage.getItem(HISTORY_KEY);if(r)setLog(JSON.parse(r).reverse());}catch{}},[]);
  const del=(id)=>{const u=log.filter(h=>h.id!==id);setLog(u);try{localStorage.setItem(HISTORY_KEY,JSON.stringify([...u].reverse()));}catch{}};
  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:T.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{makeCss(theme)}</style>
      <div style={{background:T.headerBg,borderBottom:`3px solid ${PINK}`,padding:"14px 18px 12px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:T.text,letterSpacing:2}}>MARKO'S <span style={{color:PINK}}>SPRINKLERS</span></div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:1.5,marginTop:2}}>WORK ORDER HISTORY</div>
          </div>
          <button onClick={onBack} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back</button>
        </div>
      </div>
      <div style={{flex:1,padding:"14px 14px 40px",overflowY:"auto"}}>
        {log.length===0?(
          <div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}>
            <div style={{fontSize:40,marginBottom:12}}>📋</div>
            <div style={{fontSize:15,fontWeight:600,color:T.subtext,marginBottom:6}}>No history yet</div>
            <div style={{fontSize:13}}>Submitted work orders appear here</div>
          </div>
        ):log.map(e=>{
          const isOpen=open===e.id;
          const pc=Object.keys(e.selected||{}).length;
          const statusColor=e.job.completed==="Y"?GREEN:e.job.completed==="N"?"#60a5fa":"#fbbf24";
          const statusBg=e.job.completed==="Y"?"#14532d":e.job.completed==="N"?"#1e3a5f":"#3d2c00";
          const statusLabel=e.job.completed==="Y"?"DONE":e.job.completed==="N"?"RETURN":"PARTIAL";
          return(
            <div key={e.id} style={{background:T.card,border:`1px solid ${isOpen?PINK:T.border}`,borderRadius:12,marginBottom:8,overflow:"hidden"}}>
              <div onClick={()=>setOpen(isOpen?null:e.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 14px",cursor:"pointer"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.text}}>{e.job.client}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{e.job.date} · {e.job.tech} · {pc} part{pc!==1?"s":""}{ e.time?.billableHrs ? ` · ${e.time.billableHrs}h billable` : "" }</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:statusBg,color:statusColor}}>{statusLabel}</div>
                  <span style={{color:isOpen?PINK:T.muted,fontSize:18}}>{isOpen?"▾":"▸"}</span>
                </div>
              </div>
              {isOpen&&(
                <div style={{borderTop:`1px solid ${T.border}`,padding:"12px 14px"}} className="fade-up">
                  {[["Address",e.job.address],["Phone",e.job.phone],["Zones",e.job.zones]].map(([k,v])=>v?(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,borderBottom:`1px solid ${T.border}`}}>
                      <span style={{color:T.muted}}>{k}</span><span style={{color:T.text}}>{v}</span>
                    </div>
                  ):null)}
                  {Object.keys(e.selected||{}).length>0&&(<>
                    <div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,marginTop:12,marginBottom:6}}>PARTS USED</div>
                    {Object.entries(e.selected).map(([k,qty])=>{const[,item]=k.split("||");return(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,borderBottom:`1px solid ${T.border}`}}>
                        <span style={{color:T.subtext}}>{item}</span><span style={{color:PINK,fontFamily:"'DM Mono',monospace",fontWeight:700}}>×{qty}</span>
                      </div>
                    );})}
                  </>)}
                  {e.description&&(<><div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,marginTop:12,marginBottom:6}}>DESCRIPTION</div><div style={{fontSize:13,color:T.subtext,lineHeight:1.5}}>{e.description}</div></>)}
                  {e.repairs&&(<><div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,marginTop:12,marginBottom:6}}>ADDITIONAL REPAIRS</div><div style={{fontSize:13,color:T.subtext,lineHeight:1.5}}>{e.repairs}</div></>)}
                  {(e.signoffs?.techSig||e.signoffs?.clientSig)&&(
                    <div style={{marginTop:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>SIGN-OFF</div>
                      {e.signoffs.techSig&&(
                        <div style={{marginBottom:8}}>
                          <div style={{fontSize:10,color:T.muted,marginBottom:3}}>Technician</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>{e.signoffs.techSig}</span>
                            <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{e.signoffs.techDate}</span>
                          </div>
                        </div>
                      )}
                      {e.signoffs.clientSig&&!e.signoffs.clientAbsent&&(
                        <div>
                          <div style={{fontSize:10,color:T.muted,marginBottom:3}}>Client</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>{e.signoffs.clientSig}</span>
                            <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{e.signoffs.clientDate}</span>
                          </div>
                        </div>
                      )}
                      {e.signoffs.clientAbsent&&(
                        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}>
                          <span style={{fontSize:16}}>⚠️</span>
                          <span style={{fontSize:12,fontWeight:700,color:AMBER}}>Client not present — no sign-off</span>
                        </div>
                      )}
                    </div>
                  )}
                  {e.time?.billableHrs&&(
                    <div style={{marginTop:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px"}}>
                      <div style={{fontSize:10,color:PINK,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>TIME ON SITE</div>
                      {[["Billable",`${e.time.billableHrs} hrs`,PINK],["Non-Billable",`${e.time.pausedHrs||"0.00"} hrs`,AMBER],["Total",`${e.time.totalHrs} hrs`,null]].map(([k,v,c])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0"}}>
                          <span style={{color:T.muted}}>{k}</span><span style={{color:c||T.text,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={()=>{if(window.confirm("Delete this work order?"))del(e.id);}} style={{marginTop:14,background:"none",border:`1px solid #3a1a1a`,color:"#c44",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>🗑 Delete Entry</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────────────────
export default function App(){
  const [theme,setTheme]=useState(()=>{try{return localStorage.getItem(THEME_KEY)||"dark"}catch{return"dark"}});
  const T=THEMES[theme];
  const toggleTheme=()=>setTheme(p=>{const n=p==="dark"?"light":"dark";try{localStorage.setItem(THEME_KEY,n);}catch{}return n;});

  const [customPartsCatalog,setCustomPartsCatalog]=useState(()=>{try{const r=localStorage.getItem(CUSTOM_PARTS_KEY);return r?JSON.parse(r):{}}catch{return{}}});
  const catalog=Object.fromEntries(Object.entries(BASE_CATALOG).map(([cat,v])=>([cat,{...v,items:[...v.items,...(customPartsCatalog[cat]||[])]}])));
  const saveCustomPart=(name,cat)=>{setCustomPartsCatalog(prev=>{const u={...prev,[cat]:[...(prev[cat]||[]),name]};try{localStorage.setItem(CUSTOM_PARTS_KEY,JSON.stringify(u));}catch{}return u;});};
  const [showAddPart,setShowAddPart]=useState(false);

  const [screen,setScreen]=useState("form");
  const [step,setStep]=useState(0);
  const [submitting,setSubmitting]=useState(false);
  const [submitStatus,setSubmitStatus]=useState(null);
  const [openCats,setOpenCats]=useState({});
  const [selected,setSelected]=useState({});
  const [job,setJob]=useState({client:"",address:"",phone:"",tech:"",date:new Date().toISOString().slice(0,10),zones:"",completed:"Y",service:""});
  const [description,setDescription]=useState("");
  const [repairs,setRepairs]=useState("");
  const today=new Date().toISOString().slice(0,10);
  const [signoffs,setSignoffs]=useState({techSig:"",techDate:today,clientSig:"",clientDate:today,clientAbsent:false});
  const [histCount,setHistCount]=useState(0);
  const [extraTechs,setExtraTechs]=useState(()=>{try{const r=localStorage.getItem(TECHS_KEY);return r?JSON.parse(r):[]}catch{return[]}});
  const [addingTech,setAddingTech]=useState(false);
  const [newTechName,setNewTechName]=useState("");

  // ── Timer state ──────────────────────────────────────────────────────────
  // States: idle | running | paused | stopped
  const [timerState,setTimerState]=useState("idle"); // idle|running|paused|stopped
  const [clockInTime,setClockInTime]=useState(null);
  const [clockOutTime,setClockOutTime]=useState(null);
  const [billableSecs,setBillableSecs]=useState(0);   // accumulated billable seconds
  const [pausedSecs,setPausedSecs]=useState(0);       // accumulated paused seconds
  const [segStart,setSegStart]=useState(null);        // start of current running/paused segment
  const [liveSecs,setLiveSecs]=useState(0);           // live ticker for current segment

  useEffect(()=>{
    if(timerState!=="running"&&timerState!=="paused")return;
    const id=setInterval(()=>setLiveSecs(Math.floor((Date.now()-segStart)/1000)),500);
    return()=>clearInterval(id);
  },[timerState,segStart]);

  const currentBillable = timerState==="running" ? billableSecs+liveSecs : billableSecs;
  const currentPaused   = timerState==="paused"  ? pausedSecs+liveSecs  : pausedSecs;
  const totalOnSite     = currentBillable+currentPaused;

  const handleClockIn=()=>{
    const now=Date.now();
    setClockInTime(now);setClockOutTime(null);
    setBillableSecs(0);setPausedSecs(0);setLiveSecs(0);
    setSegStart(now);setTimerState("running");
  };
  const handlePause=()=>{
    setBillableSecs(b=>b+Math.floor((Date.now()-segStart)/1000));
    setLiveSecs(0);setSegStart(Date.now());setTimerState("paused");
  };
  const handleResume=()=>{
    setPausedSecs(p=>p+Math.floor((Date.now()-segStart)/1000));
    setLiveSecs(0);setSegStart(Date.now());setTimerState("running");
  };
  const handleClockOut=()=>{
    const now=Date.now();
    if(timerState==="running")setBillableSecs(b=>b+Math.floor((now-segStart)/1000));
    if(timerState==="paused") setPausedSecs(p=>p+Math.floor((now-segStart)/1000));
    setClockOutTime(now);setLiveSecs(0);setTimerState("stopped");
  };
  const resetTimer=()=>{setTimerState("idle");setClockInTime(null);setClockOutTime(null);setBillableSecs(0);setPausedSecs(0);setLiveSecs(0);setSegStart(null);};

  const isActive = timerState==="running"||timerState==="paused";

  useEffect(()=>{try{const r=localStorage.getItem(HISTORY_KEY);if(r)setHistCount(JSON.parse(r).length);}catch{};},[]);

  const totalParts=Object.keys(selected).length;
  const canNext=step===0?(job.client.trim()&&job.address.trim()&&job.tech.trim()&&job.date):true;

  const togglePart=(key)=>setSelected(p=>{const n={...p};if(n[key])delete n[key];else n[key]=1;return n;});
  const setQty=(key,v)=>setSelected(p=>({...p,[key]:Math.max(1,parseInt(v)||1)}));
  const toggleCat=(cat)=>setOpenCats(p=>({...p,[cat]:!p[cat]}));

  const saveHistory=()=>{
    try{
      const r=localStorage.getItem(HISTORY_KEY);const ex=r?JSON.parse(r):[];
      const entry={id:Date.now(),submittedAt:new Date().toISOString(),job,selected,description,repairs,signoffs,
        time:{clockIn:clockInTime,clockOut:clockOutTime,billableSecs:currentBillable,pausedSecs:currentPaused,totalSecs:totalOnSite,
          billableHrs:fmtHrs(currentBillable),pausedHrs:fmtHrs(currentPaused),totalHrs:fmtHrs(totalOnSite)}};
      const up=[...ex,entry];localStorage.setItem(HISTORY_KEY,JSON.stringify(up));setHistCount(up.length);
    }catch{}
  };

  const sendEmail=async()=>{
    if(!window.emailjs){
      await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }
    await window.emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{
      to_email:RECIPIENT_EMAIL,subject:`Work Order — ${job.client} — ${job.date}`,
      message:buildEmail(job,selected,description,repairs,{billableHrs:fmtHrs(currentBillable),pausedHrs:fmtHrs(currentPaused),totalHrs:fmtHrs(totalOnSite),clockInStr:fmtTime(clockInTime),clockOutStr:fmtTime(clockOutTime)}),
      client_name:job.client,technician:job.tech,date:job.date,address:job.address,part_count:totalParts,hours_on_site:fmtHrs(currentBillable)||"—",
    });
  };

  const handleSubmit=async()=>{setSubmitting(true);saveHistory();try{await sendEmail();setSubmitStatus("success");}catch(e){console.error(e);setSubmitStatus("emailfail");}setSubmitting(false);};

  const resetAll=()=>{
    setStep(0);setSubmitStatus(null);setSelected({});setOpenCats({});
    setJob({client:"",address:"",phone:"",tech:"",date:new Date().toISOString().slice(0,10),zones:"",completed:"Y",service:""});
    setDescription("");setRepairs("");setSignoffs({techSig:"",techDate:today,clientSig:"",clientDate:today,clientAbsent:false});resetTimer();
  };

  const inp={width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 13px",fontSize:15,color:T.text,outline:"none",fontFamily:"'DM Sans',sans-serif"};

  // ── Floating pause pill (shown when timer is active on non-time steps) ───
  const showFloatingPause = isActive && step!==1;

  if(screen==="history")return <History onBack={()=>setScreen("form")} theme={theme}/>;

  if(submitStatus){
    const ok=submitStatus==="success";
    return(
      <div style={{fontFamily:"'DM Sans',sans-serif",background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{makeCss(theme)}</style>
        <div className="fade-up" style={{textAlign:"center",maxWidth:360,width:"100%"}}>
          <div style={{fontSize:64,marginBottom:16}}>{ok?"✅":"⚠️"}</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:800,color:T.text,letterSpacing:1,marginBottom:6}}>{ok?"ORDER SUBMITTED":"SAVED LOCALLY"}</div>
          <div style={{color:T.muted,fontSize:14,marginBottom:10}}>Work order for <strong style={{color:T.text}}>{job.client}</strong> recorded.</div>
          {ok&&<div style={{background:"#0a1a0a",border:`1px solid #22c55e44`,borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#86efac"}}>📧 Email sent to {RECIPIENT_EMAIL}</div>}
          {!ok&&<div style={{background:"#1a0a0a",border:`1px solid #c44`,borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#f87171"}}>⚠️ Email failed — saved to history.</div>}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,textAlign:"left",marginBottom:20}}>
            {[["Client",job.client],["Tech",job.tech],["Date",job.date],["Billable Hrs",fmtHrs(currentBillable)?`${fmtHrs(currentBillable)} hrs`:"—"],["Parts",`${totalParts} item${totalParts!==1?"s":""}`]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:13}}>
                <span style={{color:T.muted}}>{k}</span><span style={{color:T.text,fontWeight:500}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={resetAll} className="btn" style={{width:"100%",background:`linear-gradient(135deg,${PINK},#c9367e)`,color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ New Work Order</button>
            <button onClick={()=>setScreen("history")} className="btn" style={{width:"100%",background:T.surface,color:T.muted,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>View History ({histCount})</button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:T.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{makeCss(theme)}</style>
      {showAddPart&&(
        <AddPartModal T={T} theme={theme} onClose={()=>setShowAddPart(false)}
          onSave={(name,cat)=>{saveCustomPart(name,cat);setOpenCats(p=>({...p,[cat]:true}));setSelected(p=>({...p,[`${cat}||${name}`]:1}));setShowAddPart(false);}}/>
      )}

      {/* FLOATING PAUSE PILL */}
      {showFloatingPause&&(
        <div style={{position:"fixed",top:74,left:"50%",transform:"translateX(-50%)",zIndex:100,display:"flex",alignItems:"center",gap:0,borderRadius:30,overflow:"hidden",boxShadow:"0 4px 20px #0008",border:`1px solid ${timerState==="paused"?AMBER:PINK}`}}>
          <div className={timerState==="running"?"pulse":""} style={{background:timerState==="paused"?"#2a1a00":"#1a0a11",padding:"8px 14px",fontSize:13,fontWeight:700,color:timerState==="paused"?AMBER:PINK,fontFamily:"'DM Mono',monospace",letterSpacing:0.5,display:"flex",alignItems:"center",gap:6}}>
            {timerState==="paused"?"⏸":""}{timerState==="running"?"●":""} {timerState==="paused"?fmtSecs(currentPaused)+" paused":fmtSecs(currentBillable)+" billable"}
          </div>
          <button onClick={timerState==="paused"?handleResume:handlePause}
            style={{background:timerState==="paused"?AMBER:PINK,color:"#fff",border:"none",padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            {timerState==="paused"?"▶ Resume":"⏸ Pause"}
          </button>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:T.headerBg,borderBottom:`3px solid ${PINK}`,padding:"13px 18px 11px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:T.text,letterSpacing:2,lineHeight:1}}>MARKO'S <span style={{color:PINK}}>SPRINKLERS</span></div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:1.5,marginTop:2}}>SERVICE WORK ORDER</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {totalParts>0&&<div style={{background:PINK,color:"#fff",fontSize:12,fontWeight:700,padding:"4px 11px",borderRadius:20,fontFamily:"'DM Mono',monospace"}}>{totalParts} PARTS</div>}
            <button onClick={()=>setScreen("history")} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"6px 11px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>📋 {histCount}</button>
            <button onClick={toggleTheme} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 10px",fontSize:16,cursor:"pointer",lineHeight:1}}>
              {theme==="dark"?"☀️":"🌙"}
            </button>
          </div>
        </div>
        <div style={{display:"flex",gap:3,marginBottom:5}}>
          {STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?PINK:T.border,transition:"background 0.3s"}}/>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {STEPS.map((s,i)=><div key={i} style={{fontSize:9,fontWeight:700,letterSpacing:0.8,color:i===step?PINK:i<step?T.muted:T.border,textTransform:"uppercase"}}>{s}</div>)}
        </div>
      </div>

      <div style={{flex:1,padding:`${showFloatingPause?"52px":"14px"} 14px 100px`,overflowY:"auto"}}>

        {/* STEP 0 — JOB INFO */}
        {step===0&&(
          <div className="fade-up">
            <SLabel t={theme}>Job Information</SLabel>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Service Type</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {["Sprinkler Turn On","Sprinkler Adjustment","Sprinkler Repair","Sprinkler Blowout","Backflow Test"].map(s=>{
                    const sel=job.service===s;
                    return <div key={s} onClick={()=>setJob(p=>({...p,service:s}))} style={{padding:"10px 12px",borderRadius:9,cursor:"pointer",border:`2px solid ${sel?PINK:T.border}`,background:sel?"#1f0a15":T.surface,textAlign:"center",fontSize:13,fontWeight:sel?700:500,color:sel?"#fff":T.subtext,transition:"all 0.15s",userSelect:"none"}}>{s}</div>;
                  })}
                </div>
              </div>
              {[["Client Name *","client","text","Full name"],["Service Address *","address","text","Street, Spokane WA"]].map(([label,field,type,ph])=>(
                <div key={field}>
                  <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>{label}</div>
                  <input style={inp} type={type} value={job[field]} onChange={e=>setJob(p=>({...p,[field]:e.target.value}))} placeholder={ph}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Phone</div>
                <input style={inp} type="tel" value={job.phone} onChange={e=>setJob(p=>({...p,phone:e.target.value}))} placeholder="(509) 000-0000"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Technician *</div>
                <select style={{...inp,colorScheme:theme}} value={job.tech} onChange={e=>{if(e.target.value==="__add__"){setAddingTech(true);setNewTechName("");}else setJob(p=>({...p,tech:e.target.value}));}}>
                  <option value="">— Select Technician —</option>
                  {["Don","Erbie","Dylan","Josh","Jeff","Blake",...extraTechs].map(n=><option key={n} value={n}>{n}</option>)}
                  <option value="__add__">+ Add Tech</option>
                </select>
                {addingTech&&(
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <input autoFocus style={{...inp,flex:1}} value={newTechName} onChange={e=>setNewTechName(e.target.value)} placeholder="Technician name"
                      onKeyDown={e=>{if(e.key==="Enter"){const n=newTechName.trim();if(n){setExtraTechs(p=>{const u=[...p,n];try{localStorage.setItem(TECHS_KEY,JSON.stringify(u));}catch{}return u;});setJob(q=>({...q,tech:n}));}setAddingTech(false);}if(e.key==="Escape")setAddingTech(false);}}/>
                    <button onClick={()=>{const n=newTechName.trim();if(n){setExtraTechs(p=>{const u=[...p,n];try{localStorage.setItem(TECHS_KEY,JSON.stringify(u));}catch{}return u;});setJob(q=>({...q,tech:n}));}setAddingTech(false);}} style={{background:PINK,color:"#fff",border:"none",borderRadius:8,padding:"0 14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Add</button>
                    <button onClick={()=>setAddingTech(false)} style={{background:T.surface,color:T.muted,border:`1px solid ${T.border}`,borderRadius:8,padding:"0 12px",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✕</button>
                  </div>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Date *</div><input style={{...inp,colorScheme:theme}} type="date" value={job.date} onChange={e=>setJob(p=>({...p,date:e.target.value}))}/></div>
                <div><div style={{fontSize:10,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Completed?</div>
                  <select style={{...inp,colorScheme:theme}} value={job.completed} onChange={e=>setJob(p=>({...p,completed:e.target.value}))}>
                    <option value="Y">✅ Yes</option><option value="N">🔄 Return Visit</option><option value="P">⚠️ Partial</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — TIME */}
        {step===1&&(
          <div className="fade-up">
            <SLabel t={theme}>Time on Site</SLabel>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,textAlign:"center",marginBottom:12}}>

              {/* Big display */}
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:48,fontWeight:500,color:timerState==="running"?PINK:timerState==="paused"?AMBER:timerState==="stopped"?GREEN:T.text,letterSpacing:2,lineHeight:1,marginBottom:4,transition:"color 0.3s"}}>
                {fmtSecs(currentBillable||0)}
              </div>
              <div style={{fontSize:11,color:T.muted,letterSpacing:1,marginBottom:4}}>BILLABLE</div>

              {currentPaused>0&&(
                <div style={{fontSize:13,color:AMBER,fontFamily:"'DM Mono',monospace",marginBottom:4}}>
                  + {fmtSecs(currentPaused)} non-billable
                </div>
              )}

              <div style={{fontSize:11,color:T.muted,letterSpacing:1,marginBottom:20}}>
                {timerState==="running"?"● RUNNING":timerState==="paused"?"⏸ PAUSED — NOT BILLING":timerState==="stopped"?"✓ CLOCKED OUT":"TAP TO START"}
              </div>

              {/* Controls */}
              {timerState==="idle"&&(
                <button onClick={handleClockIn} className="btn" style={{width:"100%",background:`linear-gradient(135deg,${PINK},#c9367e)`,color:"#fff",border:"none",borderRadius:12,padding:"18px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>▶ Clock In</button>
              )}

              {(timerState==="running"||timerState==="paused")&&(
                <div style={{display:"flex",gap:10}}>
                  <button onClick={timerState==="paused"?handleResume:handlePause} className="btn"
                    style={{flex:1,background:timerState==="paused"?`linear-gradient(135deg,${GREEN},#16a34a)`:`linear-gradient(135deg,${AMBER},#d97706)`,color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    {timerState==="paused"?"▶ Resume":"⏸ Pause"}
                  </button>
                  <button onClick={handleClockOut} className="btn"
                    style={{flex:1,background:`linear-gradient(135deg,${GREEN},#16a34a)`,color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    ⏹ Clock Out
                  </button>
                </div>
              )}

              {timerState==="stopped"&&(
                <div style={{background:T.surface,border:`1px solid ${GREEN}44`,borderRadius:10,padding:14,marginBottom:14,textAlign:"left"}}>
                  {[["Clock In",fmtTime(clockInTime),null],["Clock Out",fmtTime(clockOutTime),null],["Billable Time",`${fmtHrs(currentBillable)} hrs`,PINK],["Non-Billable",`${fmtHrs(currentPaused)||"0.00"} hrs`,AMBER],["Total on Site",`${fmtHrs(totalOnSite)} hrs`,null]].map(([k,v,c])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:13}}>
                      <span style={{color:T.muted}}>{k}</span><span style={{color:c||T.text,fontFamily:"'DM Mono',monospace",fontWeight:c?700:400}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {timerState!=="idle"&&(
                <button onClick={resetTimer} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:timerState==="stopped"?0:12}}>
                  ↺ Reset Timer
                </button>
              )}
            </div>

            <div style={{background:T.tipBg,border:`1px solid ${T.tipBorder}`,borderRadius:10,padding:12}}>
              <div style={{fontSize:11,color:T.tipText,lineHeight:1.7}}>
                💡 <strong>Running</strong> = billable · <strong>Paused</strong> = non-billable (parts runs, lunch, travel)<br/>
                The <strong>⏸ Pause</strong> button is always visible at the top of every screen while clocked in.
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — PARTS */}
        {step===2&&(
          <div className="fade-up">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,marginTop:4}}>
              <SLabel noMargin t={theme}>Tap to select · set quantity</SLabel>
              <button onClick={()=>setShowAddPart(true)} style={{background:`linear-gradient(135deg,${PINK},#c9367e)`,color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>＋ New Part</button>
            </div>
            {Object.entries(catalog).map(([cat,{icon,items}])=>{
              const isOpen=!!openCats[cat];
              const catCount=items.filter(item=>selected[`${cat}||${item}`]).length;
              const customItems=customPartsCatalog[cat]||[];
              return(
                <div key={cat} style={{marginBottom:6}}>
                  <div className="trow" onClick={()=>toggleCat(cat)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",cursor:"pointer",userSelect:"none",background:isOpen?T.catOpen:T.card,border:`1px solid ${isOpen?PINK:T.border}`,borderRadius:isOpen?"10px 10px 0 0":10}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <span style={{fontSize:17}}>{icon}</span>
                      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:T.text,letterSpacing:1}}>{cat.toUpperCase()}</span>
                      {catCount>0&&<span style={{background:PINK,color:"#fff",fontSize:11,fontWeight:700,padding:"1px 8px",borderRadius:20}}>{catCount}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {customItems.length>0&&<span style={{fontSize:10,color:PINK,fontWeight:700,background:"#1f0a15",border:`1px solid ${PINK}44`,padding:"2px 7px",borderRadius:20}}>{customItems.length} custom</span>}
                      <span style={{color:isOpen?PINK:T.muted,fontSize:18}}>{isOpen?"▾":"▸"}</span>
                    </div>
                  </div>
                  {isOpen&&(
                    <div style={{background:T.catOpen,border:`1px solid ${PINK}44`,borderTop:"none",borderRadius:"0 0 10px 10px",padding:"6px 8px 8px"}}>
                      {items.map((item,idx)=>{
                        const key=`${cat}||${item}`;const sel=!!selected[key];
                        const isCustom=idx>=BASE_CATALOG[cat].items.length;
                        return(
                          <div key={key} className="trow" onClick={()=>togglePart(key)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px",borderRadius:8,marginBottom:4,cursor:"pointer",background:sel?T.partSel:T.partBg,border:`1.5px solid ${sel?PINK:T.border}`}}>
                            <div style={{width:22,height:22,borderRadius:5,flexShrink:0,border:`2px solid ${sel?PINK:T.muted}`,background:sel?PINK:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700}}>{sel&&"✓"}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,color:sel?T.text:T.muted,fontWeight:sel?600:400}}>{item}</div>
                              {isCustom&&<div style={{fontSize:10,color:PINK,marginTop:1}}>custom</div>}
                            </div>
                            {sel&&(
                              <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center"}}>
                                <button onClick={()=>setQty(key,(selected[key]||1)-1)} style={{width:28,height:28,background:T.surface,border:`1px solid ${T.border}`,borderRadius:"6px 0 0 6px",color:PINK,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                                <input type="number" min={1} value={selected[key]} onChange={e=>setQty(key,e.target.value)} style={{width:34,height:28,textAlign:"center",background:T.inputBg,border:`1px solid ${T.border}`,borderLeft:"none",borderRight:"none",color:T.text,fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace"}}/>
                                <button onClick={()=>setQty(key,(selected[key]||1)+1)} style={{width:28,height:28,background:T.surface,border:`1px solid ${T.border}`,borderRadius:"0 6px 6px 0",color:PINK,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 3 — NOTES */}
        {step===3&&(
          <div className="fade-up">
            <SLabel t={theme}>Number of Zones</SLabel>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:14,marginBottom:4}}>
              <select style={{...inp,colorScheme:theme}} value={job.zones} onChange={e=>setJob(p=>({...p,zones:e.target.value}))}>
                <option value="">— Unknown / not yet confirmed —</option>
                {Array.from({length:100},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <SLabel t={theme}>Description of Work</SLabel>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:14,marginBottom:14}}>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe repairs, zones serviced, issues found..." style={{...inp,resize:"vertical",minHeight:80,lineHeight:1.5}}/>
            </div>
            <SLabel t={theme}>Additional Repairs Needed</SLabel>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:14}}>
              <textarea value={repairs} onChange={e=>setRepairs(e.target.value)} placeholder="Follow-up work, parts to order, next visit notes..." style={{...inp,resize:"vertical",minHeight:72,lineHeight:1.5}}/>
            </div>
          </div>
        )}

        {/* STEP 4 — REVIEW */}
        {step===4&&(
          <div className="fade-up">
            <SLabel t={theme}>Review & Submit</SLabel>
            <RCard title="Job Details" T={T}>
              {[["Service",job.service],["Client",job.client],["Address",job.address],["Phone",job.phone],["Technician",job.tech],["Date",job.date],["Zones",job.zones],["Status",job.completed==="Y"?"✅ Completed":job.completed==="N"?"🔄 Return Visit":"⚠️ Partial"]].map(([k,v])=>v?<RRow key={k} label={k} value={v} T={T}/>:null)}
            </RCard>
            <RCard title="Time on Site" T={T}>
              {clockInTime?(
                <>
                  <RRow label="Clock In" value={fmtTime(clockInTime)} T={T}/>
                  <RRow label="Clock Out" value={clockOutTime?fmtTime(clockOutTime):"Still running…"} T={T}/>
                  <RRow label="Billable Time" value={`${fmtHrs(currentBillable)} hrs`} T={T} accent={PINK}/>
                  {currentPaused>0&&<RRow label="Non-Billable (breaks/travel)" value={`${fmtHrs(currentPaused)} hrs`} T={T} accent={AMBER}/>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",fontSize:13}}>
                    <span style={{color:T.muted}}>Total on Site</span>
                    <span style={{color:T.text,fontFamily:"'DM Mono',monospace",fontWeight:500}}>{fmtHrs(totalOnSite)} hrs</span>
                  </div>
                </>
              ):(
                <div style={{fontSize:13,color:T.muted,fontStyle:"italic"}}>No time recorded</div>
              )}
            </RCard>
            {Object.keys(selected).length>0&&(
              <RCard title={`Parts Used (${Object.keys(selected).length})`} T={T}>
                {Object.entries(selected).map(([key,qty])=>{
                  const[cat,item]=key.split("||");
                  const isCustom=(customPartsCatalog[cat]||[]).includes(item);
                  return(
                    <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                      <div>
                        <div style={{fontSize:13,color:T.text,fontWeight:500}}>{item}</div>
                        <div style={{fontSize:10,color:isCustom?PINK:T.muted}}>{isCustom?"✦ custom · ":""}{cat}</div>
                      </div>
                      <div style={{fontFamily:"'DM Mono',monospace",color:PINK,fontWeight:700,fontSize:14}}>×{qty}</div>
                    </div>
                  );
                })}
              </RCard>
            )}
            {description&&<RCard title="Description" T={T}><div style={{fontSize:13,color:T.subtext,lineHeight:1.6}}>{description}</div></RCard>}
            {repairs&&<RCard title="Additional Repairs" T={T}><div style={{fontSize:13,color:T.subtext,lineHeight:1.6}}>{repairs}</div></RCard>}
            <SignOff T={T} theme={theme} inp={inp} signoffs={signoffs} setSignoffs={setSignoffs}/>
            <div style={{background:T.tipBg,border:`1px solid ${T.tipBorder}`,borderRadius:10,padding:12,marginBottom:12}}>
              <div style={{fontSize:10,color:T.tipText,fontWeight:700,letterSpacing:1,marginBottom:4}}>📧 ON SUBMIT</div>
              <div style={{fontSize:12,color:T.muted}}>Saved to history + emailed to <span style={{color:T.subtext}}>{RECIPIENT_EMAIL}</span></div>
            </div>
            <div style={{textAlign:"center",color:T.muted,fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:1.2,padding:"4px 0 12px"}}>MARKO'S SPRINKLERS · SPOKANE, WA · markossprinklers.com</div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.footerBg,borderTop:`1px solid ${T.border}`,padding:"12px 14px",display:"flex",gap:10,zIndex:50}}>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} className="btn" style={{background:T.surface,color:T.muted,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 18px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back</button>}
        {step<STEPS.length-1?(
          <button className="btn" disabled={!canNext} onClick={()=>setStep(s=>s+1)} style={{flex:1,background:canNext?`linear-gradient(135deg,${PINK},#c9367e)`:"#1a1a1a",color:canNext?"#fff":"#444",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,cursor:canNext?"pointer":"not-allowed",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>
            {step===2&&totalParts>0?`Next — ${totalParts} Part${totalParts!==1?"s":""}`:"Next →"}
          </button>
        ):(
          <button className="btn" onClick={handleSubmit} disabled={submitting} style={{flex:1,background:submitting?"#1a1a1a":`linear-gradient(135deg,${GREEN},#16a34a)`,color:submitting?"#555":"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,cursor:submitting?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>
            {submitting?"⏳ Submitting...":"✓ Submit Work Order"}
          </button>
        )}
      </div>
    </div>
  );
}