import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";

env.allowLocalModels = false;
env.useBrowserCache = true;

const $=s=>document.querySelector(s);
const chat=$("#chat"), form=$("#form"), input=$("#input"), send=$("#send");
const state={messages:[],pipe:null,model:$("#model").value};

function save(){localStorage.setItem("yaman_ai_messages",JSON.stringify(state.messages));}
function load(){try{state.messages=JSON.parse(localStorage.getItem("yaman_ai_messages")||"[]")}catch{}}
function escapeText(s){return s}
function render(){
  if(!state.messages.length){chat.innerHTML=`<div class="welcome"><div class="hero-logo">Y</div><h1>أهلاً بك في Yaman AI</h1><p>مساعد ذكاء اصطناعي يعمل محليًا في المتصفح عند توفر WebGPU.</p><div class="cards"><button data-prompt="اشرح لي الذكاء الاصطناعي بطريقة بسيطة">اشرح لي الذكاء الاصطناعي</button><button data-prompt="ساعدني في كتابة فكرة مشروع">فكرة مشروع</button><button data-prompt="علمني Python من الصفر">تعلم Python</button></div></div>`;return}
  chat.innerHTML=state.messages.map(m=>`<div class="message ${m.role==='user'?'user':'ai'}"><div class="bubble">${escapeText(m.content)}</div></div>`).join("");
  chat.scrollTop=chat.scrollHeight;
}
async function getModel(){
  if(state.pipe) return state.pipe;
  $("#status").textContent="جاري تحميل النموذج…";
  $("#downloadState").textContent="تحميل أول مرة قد يستغرق بعض الوقت";
  send.disabled=true;
  try{
    state.pipe=await pipeline("text-generation",state.model,{device:"webgpu",dtype:"q4"});
    $("#status").textContent="متصل محليًا";
    $("#downloadState").textContent="النموذج جاهز";
    return state.pipe;
  }catch(e){
    $("#status").textContent="تعذر تشغيل WebGPU";
    $("#downloadState").textContent="جرّب متصفحًا يدعم WebGPU";
    state.pipe=null;
    throw e;
  }finally{send.disabled=false}
}
async function ask(text){
  state.messages.push({role:"user",content:text}); save(); render();
  const p=await getModel();
  const messages=[{role:"system",content:"أنت Yaman AI، مساعد مفيد ومختصر. أجب بالعربية إذا كان المستخدم عربيًا، وبأسلوب واضح."},...state.messages.slice(-10)];
  const out=await p(messages,{max_new_tokens:256,temperature:.7,do_sample:true});
  let answer=out?.[0]?.generated_text;
  if(Array.isArray(answer)) answer=answer.at(-1)?.content||"";
  if(typeof answer!=="string") answer=String(answer||"لم أستطع توليد إجابة.");
  state.messages.push({role:"assistant",content:answer});save();render();
}
form.addEventListener("submit",async e=>{
 e.preventDefault();const text=input.value.trim();if(!text||send.disabled)return;
 input.value="";document.body.classList.add("loading");send.disabled=true;
 try{await ask(text)}catch(e){state.messages.push({role:"assistant",content:"تعذر تشغيل النموذج محليًا. تأكد أن المتصفح يدعم WebGPU وأن الإنترنت متاح لتحميل النموذج في المرة الأولى."});save();render()}
 finally{document.body.classList.remove("loading");send.disabled=false}
});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-prompt]");if(b){input.value=b.dataset.prompt;form.requestSubmit()}});
$("#newChat").onclick=()=>{state.messages=[];save();render()};
$("#clear").onclick=()=>{if(confirm("مسح المحادثة؟")){state.messages=[];save();render()}};
$("#menu").onclick=()=>$(".sidebar").classList.toggle("open");
$("#model").onchange=()=>{state.model=$("#model").value;state.pipe=null;$("#downloadState").textContent="لم يتم تحميل النموذج"};
load();render();