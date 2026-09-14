const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function game(){
 let now=0;
 const timers=[],events=[],els=new Map();
 const drawing=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function el(id){if(!els.has(id))els.set(id,{id,hidden:!['intro'].includes(id),textContent:'',width:400,height:400,href:'https://locabo.online/lp/locv198_02/index.html',classList:{add(){},remove(){},toggle(){}},style:{},listeners:{},getContext(){return drawing},getBoundingClientRect(){return{left:0,top:0,width:400,height:440}},addEventListener(n,f){this.listeners[n]=f},setPointerCapture(){},focus(){},querySelector(){return el('bridge-label')},querySelectorAll(){return[]}});return els.get(id)}
 const context={performance:{now:()=>now},console,Math,Set,Image:class{},ResizeObserver:class{observe(){}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},localStorage:{getItem(){return 0},setItem(){}},devicePixelRatio:1,requestAnimationFrame(){},setInterval(f,ms){timers.push({f,ms});return timers.length},setTimeout(f,ms){timers.push({f,ms});return timers.length},clearInterval(){},clearTimeout(){},document:{hidden:false,getElementById:el,querySelector:s=>el(s),querySelectorAll(){return[]},addEventListener(n,f){this[n]=f}},window:{innerWidth:400,innerHeight:700,dispatchEvent(e){events.push(e)}}};
 vm.createContext(context);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 const run=code=>vm.runInContext(code,context);
 run("ready=true;$('intro').hidden=true;reset()");
 return {run,els,context,events,timers,time:v=>{now=v},el};
}
test('40 seconds expires at low frame rate, independent of physics time',()=>{
 const g=game();for(let t=1000;t<=40000;t+=1000){g.time(t);g.run(`loop(${t})`)}
 assert.equal(g.run('roundLeft'),0);assert.equal(g.run('ended'),true);assert.equal(g.el('transition').hidden,false);
 assert.equal(g.events.filter(e=>e.detail.event==='locabo_game_complete').length,1);
 g.run('updateRoundClock()');assert.equal(g.events.filter(e=>e.detail.event==='locabo_game_complete').length,1);
});
test('timer ends even with no rendered frames',()=>{
 const g=game();g.time(40001);g.timers.find(t=>t.ms===100).f();assert.equal(g.run('ended'),true);
});
test('pause time is excluded and replay receives a fresh 40 seconds',()=>{
 const g=game();g.time(8000);g.run('setPaused(true)');assert.equal(g.run('roundLeft'),32);
 g.time(30000);g.run('updateRoundClock()');assert.equal(g.run('roundLeft'),32);
 g.run('setPaused(false)');g.time(35000);g.run('updateRoundClock()');assert.equal(g.run('roundLeft'),27);
 g.run('reset()');g.time(36000);g.run('updateRoundClock()');assert.equal(g.run('roundLeft'),39);
});
test('first drop retains tutorial; actual merge clears it and scores',()=>{
 const g=game();g.run('drop()');assert.notEqual(g.el('hint').textContent,'');
 assert.equal(g.run('firstMerge'),false);g.run('merge(bodies[0],bodies[2])');
 assert.equal(g.run('score'),20);assert.equal(g.el('hint').textContent,'');
 assert.equal(g.events.filter(e=>e.detail.event==='locabo_first_interaction').length,1);
 assert.equal(g.events.filter(e=>e.detail.event==='locabo_first_merge').length,1);
});
test('cancelled pointer does not drop a dish',()=>{
 const g=game();const c=g.el('game');c.listeners.pointerdown({pointerId:1,clientX:200});c.listeners.pointercancel();c.listeners.pointerup({pointerId:1,clientX:200});assert.equal(g.run('bodies.length'),2);
});
test('book pauses time and returns to play',()=>{
 const g=game();g.time(3000);g.run('openBook(3)');assert.equal(g.run('paused'),true);assert.equal(g.el('book').hidden,false);
 g.time(13000);g.el('bookclose').onclick();g.time(14000);g.run('updateRoundClock()');assert.equal(g.run('roundLeft'),36);
});
test('CTA exits, normal browser link, replay, and host analytics are usable',()=>{
 const g=game();g.el('viewproduct').onclick();assert.equal(g.el('result').hidden,false);assert.equal(g.run('ended'),true);
 let prevented=false;g.el('.end-buy').listeners.click({currentTarget:g.el('.end-buy'),preventDefault(){prevented=true}});assert.equal(prevented,false);
 let opened;g.context.window.mraid={open:u=>{opened=u}};g.el('.end-buy').listeners.click({currentTarget:g.el('.end-buy'),preventDefault(){prevented=true}});assert.equal(opened,g.el('.end-buy').href);assert.equal(prevented,true);
 g.el('again').onclick();assert.equal(g.run('roundLeft'),40);assert.equal(g.el('result').hidden,true);
 assert.ok(g.events.some(e=>e.detail.event==='locabo_cta_click'));assert.ok(g.events.some(e=>e.detail.event==='locabo_replay'));
 assert.match(html,/class="end-buy"[^>]+target="_self"/);
});
test('landscape and hidden-page interruptions pause without consuming time',()=>{
 const g=game();g.time(4000);g.context.window.innerWidth=700;g.context.window.innerHeight=400;g.run('resize()');assert.equal(g.run('paused'),true);
 g.time(14000);g.context.window.innerWidth=400;g.context.window.innerHeight=700;g.run('resize()');assert.equal(g.run('paused'),false);
 g.time(15000);g.run('updateRoundClock()');assert.equal(g.run('roundLeft'),35);
 g.context.document.hidden=true;g.context.document.visibilitychange();assert.equal(g.run('paused'),true);assert.equal(g.el('menu').hidden,false);
});
