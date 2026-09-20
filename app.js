const MUSCLES = ["Chest","Back","Shoulders","Biceps","Triceps","Quads","Hamstrings","Glutes","Calves","Core","Full Body"];
const STOCK = [
  {n:"Dumbbell Bench Press", t:"dumbbell", m:"Chest"},
  {n:"Incline Dumbbell Press", t:"dumbbell", m:"Chest"},
  {n:"Dumbbell Fly", t:"dumbbell", m:"Chest"},
  {n:"Dumbbell Pullover", t:"dumbbell", m:"Chest"},
  {n:"Chest Press Machine", t:"machine", m:"Chest"},
  {n:"Pec Deck / Chest Fly Machine", t:"machine", m:"Chest"},
  {n:"Incline Chest Press Machine", t:"machine", m:"Chest"},
  {n:"Cable Chest Fly", t:"machine", m:"Chest"},
  {n:"Dumbbell Row", t:"dumbbell", m:"Back"},
  {n:"Single-Arm Dumbbell Row", t:"dumbbell", m:"Back"},
  {n:"Lat Pulldown", t:"machine", m:"Back"},
  {n:"Seated Cable Row", t:"machine", m:"Back"},
  {n:"Assisted Pull-Up", t:"machine", m:"Back"},
  {n:"Cable Face Pull", t:"machine", m:"Back"},
  {n:"Dumbbell Shoulder Press", t:"dumbbell", m:"Shoulders"},
  {n:"Dumbbell Lateral Raise", t:"dumbbell", m:"Shoulders"},
  {n:"Dumbbell Rear Delt Fly", t:"dumbbell", m:"Shoulders"},
  {n:"Arnold Press", t:"dumbbell", m:"Shoulders"},
  {n:"Shoulder Press Machine", t:"machine", m:"Shoulders"},
  {n:"Lateral Raise Machine", t:"machine", m:"Shoulders"},
  {n:"Dumbbell Bicep Curl", t:"dumbbell", m:"Biceps"},
  {n:"Dumbbell Hammer Curl", t:"dumbbell", m:"Biceps"},
  {n:"Incline Dumbbell Curl", t:"dumbbell", m:"Biceps"},
  {n:"Bicep Curl Machine", t:"machine", m:"Biceps"},
  {n:"Cable Bicep Curl", t:"machine", m:"Biceps"},
  {n:"Dumbbell Overhead Tricep Ext", t:"dumbbell", m:"Triceps"},
  {n:"Dumbbell Kickback", t:"dumbbell", m:"Triceps"},
  {n:"Dumbbell Skull Crusher", t:"dumbbell", m:"Triceps"},
  {n:"Tricep Pushdown", t:"machine", m:"Triceps"},
  {n:"Overhead Cable Extension", t:"machine", m:"Triceps"},
  {n:"Goblet Squat", t:"dumbbell", m:"Quads"},
  {n:"Dumbbell Lunge", t:"dumbbell", m:"Quads"},
  {n:"Dumbbell Step-Up", t:"dumbbell", m:"Quads"},
  {n:"Leg Press", t:"machine", m:"Quads"},
  {n:"Leg Extension", t:"machine", m:"Quads"},
  {n:"Hack Squat Machine", t:"machine", m:"Quads"},
  {n:"Smith Machine Squat", t:"machine", m:"Quads"},
  {n:"Dumbbell Romanian Deadlift", t:"dumbbell", m:"Hamstrings"},
  {n:"Lying Leg Curl", t:"machine", m:"Hamstrings"},
  {n:"Seated Leg Curl", t:"machine", m:"Hamstrings"},
  {n:"Dumbbell Hip Thrust", t:"dumbbell", m:"Glutes"},
  {n:"Hip Abduction Machine", t:"machine", m:"Glutes"},
  {n:"Hip Adduction Machine", t:"machine", m:"Glutes"},
  {n:"Glute Kickback Machine", t:"machine", m:"Glutes"},
  {n:"Dumbbell Calf Raise", t:"dumbbell", m:"Calves"},
  {n:"Standing Calf Raise Machine", t:"machine", m:"Calves"},
  {n:"Seated Calf Raise", t:"machine", m:"Calves"},
  {n:"Dumbbell Side Bend", t:"dumbbell", m:"Core"},
  {n:"Weighted Crunch", t:"dumbbell", m:"Core"},
  {n:"Cable Crunch", t:"machine", m:"Core"},
  {n:"Ab Machine", t:"machine", m:"Core"},
  {n:"Dumbbell Thruster", t:"dumbbell", m:"Full Body"},
  {n:"Dumbbell Clean", t:"dumbbell", m:"Full Body"},
  {n:"Smith Machine Deadlift", t:"machine", m:"Full Body"}
].map((e,i)=>({id:"s"+i, custom:false, ...e}));

const store = {
  get(k, fb){ try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function state() {
  return {
    unit: store.get("il_unit","kg"),
    custom: store.get("il_custom",[]),
    workouts: store.get("il_workouts",[]),
    routines: store.get("il_routines",[]),
    session: store.get("il_session", null),
    restSec: store.get("il_rest", 90)
  };
}
function allExercises(){ return [...STOCK, ...state().custom]; }
function saveSession(s){ store.set("il_session", s); }

let libType = "all", libMuscle = "all", libQ = "";
let timerLeft = 0, timerId = null, timerTotal = 90;
const $ = (id) => document.getElementById(id);

function showView(name){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("active", b.dataset.view===name));
  $("view-"+name).classList.add("active");
  if(name==="home") renderHome();
  if(name==="library") renderLibrary();
  if(name==="workout") renderWorkout();
  if(name==="history") renderHistory();
  if(name==="progress") renderProgress();
}
function toggleUnit(){
  const u = state().unit === "kg" ? "lb" : "kg";
  store.set("il_unit", u);
  $("unitBtn").textContent = u.toUpperCase();
  showView(document.querySelector(".view.active").id.replace("view-",""));
}
function todayStr(){
  return new Date().toLocaleDateString(undefined,{weekday:"short", day:"numeric", month:"short"});
}
function renderHome(){
  const s = state();
  const weekAgo = Date.now() - 7*864e5;
  const recent = s.workouts.filter(w => w.ts >= weekAgo);
  const sets = recent.reduce((a,w)=>a+w.exercises.reduce((b,e)=>b+e.sets.filter(x=>x.done).length,0),0);
  const sess = s.session;
  $("view-home").innerHTML = `
    <div class="stats">
      <div class="card stat"><b>${recent.length}</b><span class="tiny">Sessions / 7d</span></div>
      <div class="card stat"><b>${sets}</b><span class="tiny">Sets / 7d</span></div>
      <div class="card stat"><b>${s.routines.length}</b><span class="tiny">Templates</span></div>
    </div>
    ${sess && sess.exercises.length ? `
      <div class="card">
        <div class="tiny">Workout in progress</div>
        <div class="ex-name" style="margin:4px 0 10px">${sess.name || "Open session"} · ${sess.exercises.length} moves</div>
        <button class="btn" onclick="showView('workout')">Resume</button>
      </div>` : `
      <button class="btn" onclick="startFresh()">Start empty workout</button>
      <div style="height:8px"></div>
    `}
    <div class="tiny" style="margin:14px 0 8px">Templates</div>
    ${s.routines.length===0 ? `<div class="card empty">No saved routines yet. Build a session and tap Save as template.</div>` :
      s.routines.map(r => `
        <div class="card">
          <div class="row space">
            <div>
              <div class="ex-name">${esc(r.name)}</div>
              <div class="tiny">${r.exercises.length} exercises</div>
            </div>
            <div class="row">
              <button class="btn sm" onclick="startRoutine('${r.id}')">Load</button>
              <button class="btn sm ghost" onclick="deleteRoutine('${r.id}')">✕</button>
            </div>
          </div>
        </div>`).join("")}
    <div class="tiny" style="margin:14px 0 8px">Quick add from gear</div>
    <button class="btn ghost" onclick="showView('library')">Browse dumbbells & machines</button>
  `;
}
function renderLibrary(){
  const list = allExercises().filter(e => {
    if(libType!=="all" && e.t!==libType) return false;
    if(libMuscle!=="all" && e.m!==libMuscle) return false;
    if(libQ && !e.n.toLowerCase().includes(libQ.toLowerCase())) return false;
    return true;
  });
  $("view-library").innerHTML = `
    <input placeholder="Search exercises…" value="${esc(libQ)}" oninput="libQ=this.value;renderLibrary()" />
    <div class="chips">
      ${[["all","All"],["dumbbell","Dumbbells"],["machine","Machines"]].map(([k,l])=>
        `<button class="chip ${libType===k?"on":""}" onclick="libType='${k}';renderLibrary()">${l}</button>`).join("")}
    </div>
    <div class="chips">
      <button class="chip ${libMuscle==="all"?"on":""}" onclick="libMuscle='all';renderLibrary()">All muscles</button>
      ${MUSCLES.map(m=>`<button class="chip ${libMuscle===m?"on":""}" onclick="libMuscle='${m}';renderLibrary()">${m}</button>`).join("")}
    </div>
    <button class="btn ghost" style="margin-bottom:10px" onclick="openAddExercise()">+ Custom exercise</button>
    ${list.map(e => `
      <div class="card">
        <div class="row space">
          <div class="grow">
            <div class="ex-name">${esc(e.n)}</div>
            <div class="row" style="gap:6px;margin-top:6px">
              <span class="tag ${e.t==="dumbbell"?"db":"mc"}">${e.t}</span>
              <span class="tag">${e.m}</span>
              ${e.custom?`<span class="tag">custom</span>`:""}
            </div>
          </div>
          <button class="btn sm" onclick="addToSession('${e.id}')">Add</button>
        </div>
        ${e.custom?`<button class="tiny" style="margin-top:8px;color:var(--warn)" onclick="deleteCustom('${e.id}')">Remove custom</button>`:""}
      </div>`).join("") || `<div class="empty">No matches.</div>`}
  `;
}
function ensureSession(){
  let s = state().session;
  if(!s){
    s = { id: uid(), name: "Workout", ts: Date.now(), exercises: [], notes:"" };
    saveSession(s);
  }
  return s;
}
function startFresh(){
  saveSession({ id: uid(), name: "Workout", ts: Date.now(), exercises: [], notes:"" });
  showView("workout");
}
function startRoutine(id){
  const r = state().routines.find(x=>x.id===id);
  if(!r) return;
  saveSession({
    id: uid(), name: r.name, ts: Date.now(),
    exercises: r.exercises.map(e => ({...e, sets: defaultSets()}))
  });
  showView("workout");
}
function addToSession(exId){
  const ex = allExercises().find(e=>e.id===exId);
  if(!ex) return;
  const s = ensureSession();
  s.exercises.push({ eid: ex.id, n: ex.n, t: ex.t, m: ex.m, sets: defaultSets(), note:"" });
  saveSession(s);
  showView("workout");
}
function defaultSets(){
  return [1,2,3].map(i=>({id:uid(), w:"", r:"", done:false}));
}
function renderWorkout(){
  const s = state().session || ensureSession();
  const unit = state().unit;
  $("view-workout").innerHTML = `
    <input value="${esc(s.name)}" onchange="renameSession(this.value)" placeholder="Session name" />
    <div class="row space" style="margin:10px 0">
      <span class="tiny">${s.exercises.length} exercises</span>
      <div class="row" style="gap:6px">
        <button class="btn sm ghost" onclick="openRestPref()">Rest ${state().restSec}s</button>
        <button class="btn sm ghost" onclick="showView('library')">+ Move</button>
      </div>
    </div>
    ${s.exercises.length===0 ? `<div class="card empty">Add dumbbells or machines from Gear.</div>` :
      s.exercises.map((ex,i)=>`
        <div class="card">
          <div class="row space">
            <div>
              <div class="ex-name">${esc(ex.n)}</div>
              <div class="tiny">${ex.t} · ${ex.m}</div>
            </div>
            <button class="btn icon ghost" onclick="removeMove(${i})">✕</button>
          </div>
          <div class="set-grid tiny" style="margin-top:10px"><div>#</div><div>${unit.toUpperCase()}</div><div>REPS</div><div></div></div>
          ${ex.sets.map((st,si)=>`
            <div class="set-grid ${st.done?"done":""}">
              <div class="muted">${si+1}</div>
              <input inputmode="decimal" value="${esc(st.w)}" onchange="editSet(${i},${si},'w',this.value)" />
              <input inputmode="numeric" value="${esc(st.r)}" onchange="editSet(${i},${si},'r',this.value)" />
              <button class="btn icon ${st.done?"":"ghost"}" onclick="toggleSet(${i},${si})">${st.done?"✓":"○"}</button>
            </div>`).join("")}
          <div class="row" style="margin-top:8px;gap:8px">
            <button class="btn sm ghost grow" onclick="addSet(${i})">+ Set</button>
            <button class="btn sm ghost" onclick="startTimer()">Rest</button>
          </div>
        </div>`).join("")}
    <textarea placeholder="Session notes" onchange="noteSession(this.value)">${esc(s.notes||"")}</textarea>
    <div style="height:10px"></div>
    <button class="btn" onclick="finishWorkout()">Save workout</button>
    <div style="height:8px"></div>
    <button class="btn ghost" onclick="saveAsRoutine()">Save as template</button>
    <div style="height:8px"></div>
    <button class="btn ghost warn" onclick="discardSession()">Discard</button>
  `;
}
function renameSession(n){ const s=ensureSession(); s.name=n; saveSession(s); }
function noteSession(n){ const s=ensureSession(); s.notes=n; saveSession(s); }
function editSet(i,si,k,v){ const s=ensureSession(); s.exercises[i].sets[si][k]=v; saveSession(s); }
function addSet(i){ const s=ensureSession(); s.exercises[i].sets.push({id:uid(),w:"",r:"",done:false}); saveSession(s); renderWorkout(); }
function removeMove(i){ const s=ensureSession(); s.exercises.splice(i,1); saveSession(s); renderWorkout(); }
function toggleSet(i,si){
  const s=ensureSession();
  const st=s.exercises[i].sets[si];
  st.done=!st.done;
  saveSession(s);
  renderWorkout();
  if(st.done) startTimer();
}
function finishWorkout(){
  const s = state().session;
  if(!s || !s.exercises.length){ alert("Nothing to save."); return; }
  const w = {...s, ts: Date.now(), finished:true};
  const all = state().workouts;
  all.unshift(w);
  store.set("il_workouts", all);
  updatePRs(w);
  saveSession(null);
  showView("history");
}
function discardSession(){
  if(!confirm("Discard this session?")) return;
  saveSession(null);
  renderWorkout();
}
function saveAsRoutine(){
  const s = ensureSession();
  if(!s.exercises.length) return;
  const name = prompt("Template name", s.name || "My routine");
  if(!name) return;
  const r = { id: uid(), name, exercises: s.exercises.map(e=>({eid:e.eid,n:e.n,t:e.t,m:e.m})) };
  const list = state().routines; list.unshift(r);
  store.set("il_routines", list);
  alert("Template saved.");
  renderHome();
}
function deleteRoutine(id){
  store.set("il_routines", state().routines.filter(r=>r.id!==id));
  renderHome();
}
function renderHistory(){
  const unit = state().unit;
  const ws = state().workouts;
  $("view-history").innerHTML = `
    <div class="tiny" style="margin-bottom:8px">${ws.length} saved sessions</div>
    ${ws.length===0?`<div class="card empty">Finish a workout to see it here.</div>`:
      ws.map(w=>`
        <div class="card">
          <div class="row space">
            <div>
              <div class="ex-name">${esc(w.name)}</div>
              <div class="tiny">${new Date(w.ts).toLocaleString()}</div>
            </div>
            <button class="btn sm ghost" onclick="deleteWorkout('${w.id}')">✕</button>
          </div>
          ${w.exercises.map(e=>{
            const done = e.sets.filter(x=>x.done && x.w && x.r);
            const best = done.reduce((m,x)=> Math.max(m, Number(x.w)||0), 0);
            return `<div class="row space" style="margin-top:8px">
              <div class="grow"><div>${esc(e.n)}</div><div class="tiny">${done.length} sets</div></div>
              <div class="tiny">${best? best+" "+unit : "—"}</div>
            </div>`;
          }).join("")}
          ${w.notes?`<div class="muted" style="margin-top:8px;font-size:13px">${esc(w.notes)}</div>`:""}
        </div>`).join("")}
  `;
}
function deleteWorkout(id){
  if(!confirm("Delete this session?")) return;
  store.set("il_workouts", state().workouts.filter(w=>w.id!==id));
  renderHistory();
}
function updatePRs(w){
  const prs = store.get("il_prs", {});
  w.exercises.forEach(e=>{
    e.sets.filter(s=>s.done).forEach(s=>{
      const load = Number(s.w)||0, reps=Number(s.r)||0;
      if(!load || !reps) return;
      const est = load * (1+reps/30);
      const cur = prs[e.n] || {w:0,r:0,est:0,ts:0};
      if(est > (cur.est||0) || load > cur.w){
        prs[e.n] = {w:load,r:reps,est,ts:Date.now(),unit:state().unit};
      }
    });
  });
  store.set("il_prs", prs);
}
function renderProgress(){
  const prs = store.get("il_prs", {});
  const names = Object.keys(prs).sort();
  const workouts = state().workouts;
  $("view-progress").innerHTML = `
    <div class="tiny" style="margin-bottom:8px">Best estimated loads</div>
    ${names.length===0?`<div class="card empty">PRs appear after you log completed sets.</div>`:
      names.map(n=>{
        const p = prs[n];
        const hist = [];
        workouts.slice().reverse().forEach(w=>{
          w.exercises.filter(e=>e.n===n).forEach(e=>{
            e.sets.filter(s=>s.done && s.w).forEach(s=> hist.push(Number(s.w)||0));
          });
        });
        const max = Math.max(...hist, p.w, 1);
        return `<div class="card">
          <div class="row space">
            <div class="ex-name">${esc(n)}</div>
            <div><b>${p.w}</b> <span class="tiny">${p.unit||state().unit} × ${p.r}</span></div>
          </div>
          <div class="bar"><i style="width:${Math.min(100,(p.w/max)*100)}%"></i></div>
          <div class="tiny" style="margin-top:6px">${hist.length} logged working sets</div>
        </div>`;
      }).join("")}
  `;
}
function openAddExercise(){
  $("sheet").innerHTML = `
    <div class="grab"></div>
    <h2 style="margin-bottom:10px">Custom exercise</h2>
    <input id="cxn" placeholder="Name" />
    <div style="height:8px"></div>
    <select id="cxt">
      <option value="dumbbell">Dumbbell</option>
      <option value="machine">Weight machine</option>
    </select>
    <div style="height:8px"></div>
    <select id="cxm">${MUSCLES.map(m=>`<option>${m}</option>`).join("")}</select>
    <div style="height:12px"></div>
    <button class="btn" onclick="saveCustom()">Add to library</button>
  `;
  $("modal").classList.add("show");
}
function saveCustom(){
  const n = $("cxn").value.trim();
  if(!n) return;
  const list = state().custom;
  list.push({id:uid(), n, t:$("cxt").value, m:$("cxm").value, custom:true});
  store.set("il_custom", list);
  closeModal();
  renderLibrary();
}
function deleteCustom(id){
  store.set("il_custom", state().custom.filter(e=>e.id!==id));
  renderLibrary();
}
function openRestPref(){
  $("sheet").innerHTML = `
    <div class="grab"></div>
    <h2 style="margin-bottom:10px">Default rest</h2>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      ${[45,60,90,120,180].map(s=>`<button class="btn sm ghost" onclick="setRest(${s})">${s}s</button>`).join("")}
    </div>
  `;
  $("modal").classList.add("show");
}
function setRest(s){ store.set("il_rest", s); closeModal(); renderWorkout(); }
function closeModal(){ $("modal").classList.remove("show"); }
$("modal").addEventListener("click", e => { if(e.target.id==="modal") closeModal(); });
function startTimer(){
  timerTotal = state().restSec;
  timerLeft = timerTotal;
  $("timer").classList.add("show");
  tick();
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
}
function tick(){
  const m = Math.floor(timerLeft/60), s = String(timerLeft%60).padStart(2,"0");
  const el = $("clock");
  el.textContent = `${m}:${s}`;
  el.classList.toggle("warn", timerLeft<=10);
  if(timerLeft<=0){
    clearInterval(timerId);
    if(navigator.vibrate) navigator.vibrate([200,80,200]);
    return;
  }
  timerLeft--;
}
function adjustTimer(d){ timerLeft = Math.max(0, timerLeft+d); tick(); }
function skipTimer(){ clearInterval(timerId); $("timer").classList.remove("show"); }
function uid(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4); }
function esc(s){ return String(s??"").replace(/[&<>"']/g, c=>({"&":"&","<":"<",">":">","\"":""","'":"&#39;"}[c])); }
$("dateLabel").textContent = todayStr();
$("unitBtn").textContent = state().unit.toUpperCase();
renderHome();
