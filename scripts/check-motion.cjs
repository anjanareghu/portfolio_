const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
process.chdir(require('node:path').join(__dirname, '..'));
const html = fs.readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'unique HTML IDs');
for (const [, path] of html.matchAll(/(?:src|href|data-image)="([^"]+)"/g)) {
  if (!/^(https?:|mailto:|#)/.test(path)) assert.ok(fs.existsSync(path.split(/[?#]/)[0]), `asset exists: ${path}`);
  if (path.startsWith('#')) assert.ok(ids.includes(path.slice(1)), `anchor exists: ${path}`);
}
for (const file of fs.readdirSync('.').filter(f => f.endsWith('.js'))) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });

class Element {
  constructor() {
    this.events = {}; this.attrs = {}; this.children = []; this.dataset = {}; this.hidden = false;
    this.offsetWidth = 280; this.offsetHeight = 800; this.style = { setProperty(k,v) { this[k]=v; }, getPropertyValue(k) { return this[k] || ''; }, removeProperty(k) { delete this[k]; } };
    const values = new Set();
    this.classList = { add: (...xs) => xs.forEach(x=>values.add(x)), remove: (...xs) => xs.forEach(x=>values.delete(x)), contains: x=>values.has(x), toggle(x,on) { if(on ?? !values.has(x)) values.add(x); else values.delete(x); } };
  }
  addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
  dispatchEvent(event) { for (const fn of this.events[event.type] || []) fn(event); }
  setAttribute(k,v) { this.attrs[k]=v; } removeAttribute(k) { delete this.attrs[k]; } getAttribute(k) { return this.attrs[k]; }
  append(...children) { for(const child of children){ if(child.parent) child.parent.children.splice(child.parent.children.indexOf(child),1); this.children.push(child);child.parent=this; } } after(child) { this.sibling=child; }
  get firstChild() { return this.children[0] || null; }
  get parentElement() { return this.parent; }
  insertBefore(child) { this.append(child); }
  closest() { return this.scene || null; }
  contains(e) { return e === this || this.children.some(child=>child.contains(e)); }
  getBoundingClientRect() { return { top:100, left:50, width:580, height:440, bottom:540, right:630 }; }
  focus() { this.focused = true; } querySelectorAll() { return []; }
  querySelector(selector) { return this.queries?.[selector] || null; }
}
async function scenario({reduced=false, repeat=false, fontPending=false, skip=false, noMotion=false, storageBlocked=false}={}) {
  let clock=0, id=0, frames=new Map(), timers=new Map(), storage={'anjana:introduced:v2':repeat?'1':null};
  const root=new Element(), body=new Element(), doc=new Element();
  root.scrollHeight=9500;
  const sections=[[900,1300],[2200,1300],[3500,700],[4200,4300],[8500,1000]].map(([top,height])=>{
    const section=new Element();
    section.getBoundingClientRect=()=>({top:top-context.scrollY,height});
    return section;
  });
  const home=new Element(), work=new Element(), loader=new Element(), count=new Element(), skipButton=new Element(), title=new Element();
  const contact=new Element(), about=new Element();
  about.getBoundingClientRect=()=>({top:1600-context.scrollY,height:650});
  work.getBoundingClientRect=()=>({top:3500-context.scrollY,height:2000});
  contact.getBoundingClientRect=()=>({top:8500-context.scrollY,height:1000});
  const characterAnchors = [[1600,650,'about'],[2250,1250,'work'],[3500,700,'research'],[4200,1200,'experience'],[5400,3100,'recognition'],[8500,1000,'contact']].map(([top,height,name])=>{
    const section=new Element(), anchor=new Element(); section.id=name;
    section.getBoundingClientRect=()=>({top:top-context.scrollY,bottom:top+height-context.scrollY,right:1400,height});
    anchor.getBoundingClientRect=()=>({top:top+65-context.scrollY,left:1210,width:132,height:132});
    anchor.scene=section; section.append(anchor); return anchor;
  });
  const stage=new Element(), canvas=new Element(), visual=new Element(), toggle=new Element();
  visual.append(stage,toggle);
  const scene=new Element();scene.offsetHeight=780;
  home.queries={'.hero-scene':scene};visual.scene=scene;
  home.getBoundingClientRect=()=>({top:100-context.scrollY});
  scene.getBoundingClientRect=()=>({top:root.classList.contains('opening-pinned')?Math.max(0,100-context.scrollY):100-context.scrollY});
  visual.getBoundingClientRect=()=>({top:scene.getBoundingClientRect().top+80,left:400,width:580,height:440,bottom:scene.getBoundingClientRect().top+520});
  const text=data=>Object.assign(new Element(),{nodeType:3,data,length:data.length});
  const period=new Element();period.append(text('.'));title.append(text('Anjana B'),period);
  const workHeading=new Element();workHeading.getBoundingClientRect=()=>({top:1700-context.scrollY+(parseFloat(workHeading.style['--heading-y'])||0)});
  canvas.getContext=()=>null;
  const protectedElements=[home,new Element(),new Element()];
  loader.queries={'.intro-count':count,button:skipButton}; loader.append(skipButton);
  const statement=new Element(), phrases=[new Element(),new Element(),new Element()];
  phrases.forEach((p,i)=>{p.dataset={image:'assets/remind.svg',alt:'Project artwork',project:'Project',tab:'tab-'+i};p.attrs.href='#work';statement.append(p);});
  statement.querySelectorAll=()=>phrases;
  doc.documentElement=root; doc.body=body; doc.activeElement=body; doc.hidden=false;
  doc.fonts={ready:fontPending ? new Promise(()=>{}) : Promise.resolve()};
  doc.querySelector=s=>({'.intro-screen':loader,'.about-profile p':statement}[s] || null);
  doc.querySelectorAll=s=>s==='.character-anchor'?characterAnchors:s==='main section h2'?[workHeading]:s.includes('main > section')?sections:s.includes('data-intro-inert')?protectedElements.filter(e=>'data-intro-inert' in e.attrs):s.includes('.site-header')?protectedElements:[];
  doc.createElement=()=>new Element();
  doc.elementFromPoint=()=>null;
  doc.createTreeWalker=source=>{const nodes=[];const walk=e=>{if(e.nodeType===3)nodes.push(e);else e.children.forEach(walk);};walk(source);let i=-1;return{nextNode(){this.currentNode=nodes[++i];return this.currentNode;}};};
  doc.createRange=()=>({setStart(node,index){this.index=index;},setEnd(){},getBoundingClientRect(){return{left:50+this.index*30};}});
  doc.getElementById=s=>({home,work,contact,about,'hero-title':title,'character-stage':stage,sculpture:canvas,'hero-visual':visual,'motion-toggle':toggle}[s] || null);
  const reduceQuery=new Element(); reduceQuery.matches=reduced;
  const fineQuery=new Element(); fineQuery.matches=true;
  const coarseQuery=new Element(); coarseQuery.matches=false;
  const context={document:doc,console,Promise,Element,Float32Array,NodeFilter:{SHOW_TEXT:4},innerWidth:1440,innerHeight:1000,scrollY:0,location:{hash:''},
    matchMedia:q=>q.includes('reduced-motion')?reduceQuery:q.includes('coarse')?coarseQuery:fineQuery,
    sessionStorage:{getItem(k){if(storageBlocked) throw Error('blocked');return storage[k];},setItem(k,v){storage[k]=v;}},
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:i=>frames.delete(i),
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:clock+delay});return id;},clearTimeout:i=>timers.delete(i),
    Event:class{constructor(type){this.type=type;}}, CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
    ResizeObserver:class{observe(){}},MutationObserver:class{observe(){}},
  };
  const win=new Element(); context.addEventListener=win.addEventListener.bind(win); context.window=context;
  vm.createContext(context);
  const run=file=>vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  const advance=async duration=>{for(let end=clock+duration;clock<end;){clock+=16;await Promise.resolve();for(const [key,t] of [...timers])if(t.at<=clock){timers.delete(key);t.fn();}const tick=[...frames.values()];frames.clear();for(const fn of tick)fn(clock);}};
  run('motion-boot.js');
  const shouldIntro=!reduced&&!repeat&&!storageBlocked;
  assert.equal(root.classList.contains('intro-pending'),shouldIntro);
  run('motion-control.js');
  run('character.js');
  if(!noMotion)run('motion.js');
  if(shouldIntro&&!noMotion)assert.equal(stage.style.opacity,'0','counter is alone before landing');
  if(skip)skipButton.dispatchEvent({type:'click'});
  await advance(2600);
  assert.ok(!root.classList.contains('intro-pending'),'intro released');
  assert.ok(protectedElements.every(e=>!e.inert),'page not left inert');
  if(shouldIntro&&!skip&&!noMotion)assert.equal(count.textContent,'100','readiness reached 100');
  assert.ok(!stage.style.clipPath,'character mask cleared');
  if(!noMotion){
    const pose0=stage.style.transform;
    context.scrollY=300;win.dispatchEvent({type:'scroll'});await advance(50);
    const glyphs=title.children[1].children;
    assert.equal(glyphs.length,9,'each name character has a motion layer');
    const scrollValue=home.style['--hero-copy-y'];
    const characterPose=stage.style.transform;
    const letterPose=glyphs[0].style['--letter-y'];
    await advance(300);
    if(!reduced)assert.equal(stage.style.transform,characterPose,'stopped scroll freezes the opening path');
    context.scrollY=0;win.dispatchEvent({type:'scroll'});await advance(50);
    context.scrollY=300;win.dispatchEvent({type:'scroll'});await advance(50);
    assert.equal(home.style['--hero-copy-y'],scrollValue,'scroll animation is reversible and deterministic');
    if(!reduced){
      assert.equal(stage.style.transform,characterPose,'reverse scrolling restores the exact character pose');
      assert.equal(glyphs[0].style['--letter-y'],letterPose,'reverse scrolling restores letter positions');
      assert.notEqual(glyphs[0].style['--letter-y'],glyphs[1].style['--letter-y'],'individual letters move at different rates');
      assert.ok(root.classList.contains('opening-pinned'),'desktop opening has a scroll runway');
    }
    if(!reduced)assert.notEqual(stage.style.transform,pose0,'character moves with scroll');
    if(!reduced){
      let heldPose;
      assert.equal(parseFloat(stage.style.width),264,'hero character is 40 percent smaller than its former 440px stage');
      for(const position of [100,200,450,800,1050,1500]){
        context.scrollY=position;win.dispatchEvent({type:'scroll'});await advance(50);
        const transform=stage.style.transform;
        const scale=Number(transform.match(/scale\(([\d.]+)\)/)[1]);
        assert.ok(scale>0&&scale<=1,`character never grows beyond its smaller hero size at ${position}`);
        if(position===100)heldPose=transform;
        if(position===200)assert.equal(transform,heldPose,'letters move before the character reframes');
        if(position===1500){
          const x=Number(transform.match(/translate3d\(([-\d.]+)px/)[1]);
          assert.ok(x+132-scale*132>1100,'About accent remains in reserved right margin');
          assert.ok(x+132+scale*132<1440,'About accent remains fully inside viewport');
        }
      }
      context.scrollY=2950;win.dispatchEvent({type:'scroll'});await advance(50);
      assert.ok(Number(stage.style.opacity)>0,'character stays present beside project content');
      assert.ok(Number(stage.style.transform.match(/scale\(([\d.]+)\)/)[1])*264<=180,'project character stays subtle');
    }
    let previousX=null;
    for(const position of [1000,2200,3500,4200,5800,7200,8500]){
      context.scrollY=position;win.dispatchEvent({type:'scroll'});await advance(50);
      if(!reduced){
        assert.ok(Number(stage.style.opacity)>0,`character present across every major section at ${position}`);
        assert.ok(stage.classList.contains('character-travelling'));
        assert.equal(stage.parentElement,body,'travelling canvas escapes the sticky stacking context');
        assert.ok(!/NaN|Infinity/.test(stage.style.transform));
        const x=Number(stage.style.transform.match(/translate3d\(([-\d.]+)px/)[1]);
        const scale=Number(stage.style.transform.match(/scale\(([\d.]+)\)/)[1]);
        if(position>=2200)assert.ok(x+132+scale*132<=1440,'section character stays inside viewport');
        previousX=x;
      }
    }
    if(!reduced){
      assert.ok(toggle.classList.contains('is-docked'),'pause control remains available');
      toggle.dispatchEvent({type:'click'});
      await advance(50);
      assert.ok(root.classList.contains('motion-disabled'),'global motion control disables decorative systems');
      assert.ok(!root.classList.contains('opening-pinned'),'global pause releases opening pin');
      assert.ok(!stage.classList.contains('character-travelling'),'pause returns to static hero');
      assert.equal(stage.parentElement,visual,'paused character restores its original parent');
      toggle.dispatchEvent({type:'click'});await advance(50);
      assert.ok(stage.classList.contains('character-travelling'),'resume restores scroll route');
      context.innerHeight=768;win.dispatchEvent({type:'resize'});await advance(50);
      assert.ok(!root.classList.contains('opening-pinned'),'shorter laptop avoids clipping a pinned hero');
      assert.ok(root.classList.contains('character-scenes'),'laptop retains large character scenes without pinning');
      context.innerHeight=1000;win.dispatchEvent({type:'resize'});await advance(50);
    }
    phrases[0].dispatchEvent({type:'focus'});await advance(50);
    assert.ok(phrases[0].classList.contains('is-active'),'keyboard preview opens');
    phrases[1].dispatchEvent({type:'focus'});await advance(50);
    assert.ok(!phrases[0].classList.contains('is-active')&&phrases[1].classList.contains('is-active'),'preview switches');
    doc.dispatchEvent({type:'keydown',key:'Escape'});
    assert.ok(!phrases[1].classList.contains('is-active'),'Escape dismisses preview');
    fineQuery.matches=false;fineQuery.dispatchEvent({type:'change'});
    assert.ok(!root.classList.contains('opening-pinned'),'touch removes the pinned runway');
    assert.ok(!root.classList.contains('character-scenes'),'touch restores the compact reading layout');
    let prevented=false;phrases[0].dispatchEvent({type:'click',preventDefault(){prevented=true;}});
    assert.ok(prevented,'touch opens inline preview');
    assert.equal(phrases[0].getAttribute('aria-expanded'),'true');
    reduceQuery.matches=true;reduceQuery.dispatchEvent({type:'change'});await advance(50);
    assert.ok(!root.classList.contains('motion-ready'),'live reduced-motion preference removes scrolling effects');
    assert.ok(!root.classList.contains('opening-pinned'),'reduced motion removes pinning');
  }
}
(async()=>{
  for(const options of [{},{fontPending:true},{repeat:true},{reduced:true},{skip:true},{noMotion:true},{storageBlocked:true}])await scenario(options);
  console.log('PASS: syntax/assets, intro/fallbacks, reversible scroll, smaller recurring character in every section, viewport bounds, global pause/resume, keyboard previews, touch and reduced motion.');
})().catch(error=>{console.error(error);process.exitCode=1;});
