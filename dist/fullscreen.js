// Native fullscreen where available; a full-window game everywhere else.
export function createFullscreenController({frame,button,onChange=()=>{},onExit=()=>{},announce=()=>{}}){
  const doc=frame.ownerDocument, view=doc.defaultView;
  let active=false, wanted=false, entering=false, exiting=false, wasNative=false;
  let savedScroll={x:0,y:0}, savedFocus=null;
  const nativeElement=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
  const ownsNative=()=>nativeElement()===frame;

  function updateButton(){
    const label=active?'Exit fullscreen':'Enter fullscreen';
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',label);
    button.title=label;
    button.dataset.fullscreen=active?'exit':'enter';
  }
  function setActive(next){
    if(next===active)return;
    if(next){
      savedScroll={x:view.scrollX,y:view.scrollY};
      savedFocus=doc.activeElement;
    }
    active=next;
    frame.classList.toggle('is-fullscreen',active);
    doc.body.classList.toggle('game-fullscreen',active);
    updateButton();
    if(active){
      frame.querySelector('canvas')?.focus({preventScroll:true});
    }else{
      const target=savedFocus?.isConnected&&savedFocus!==doc.body?savedFocus:button;
      target.focus?.({preventScroll:true});
      view.scrollTo(savedScroll.x,savedScroll.y);
    }
    onChange(active);
    if(!active)onExit();
  }
  function leaveNative(){
    if(exiting)return;
    const leave=doc.exitFullscreen||doc.webkitExitFullscreen;
    if(!leave){wanted=true;announce('Use Escape to exit fullscreen.');return;}
    exiting=true;
    let result;
    try{result=leave.call(doc);}catch(error){result=Promise.reject(error);}
    Promise.resolve(result).then(()=>{
      if(!ownsNative()){
        wasNative=false;
        if(!wanted)setActive(false);
      }
    }).catch(()=>{
      exiting=false;
      if(ownsNative()){
        wanted=true;
        announce('Use Escape to exit fullscreen.');
      }else if(!wanted)setActive(false);
    }).finally(()=>{
      // Older WebKit returns no promise; its change event can arrive later.
      // Preserve the pending exit until the browser actually leaves fullscreen.
      if(!ownsNative())exiting=false;
    });
  }
  function enter(){
    wanted=true;
    setActive(true);
    if(ownsNative()||entering||exiting)return;
    const request=frame.requestFullscreen||frame.webkitRequestFullscreen;
    if(!request)return;
    entering=true;
    let result;
    // Call during the original click, before any await loses user activation.
    try{result=request.call(frame);}catch(error){result=Promise.reject(error);}
    Promise.resolve(result).then(()=>{
      if(ownsNative()){
        wasNative=true;
        if(!wanted)leaveNative();
      }
    }).catch(()=>{
      // Browsers without permission still get the full-window layout.
      if(wanted)setActive(true);
    }).finally(()=>{entering=false;});
  }
  function exit(){
    wanted=false;
    if(ownsNative())leaveNative();
    else setActive(false);
  }
  function toggle(){if(wanted)exit();else enter();}
  function nativeChanged(){
    if(ownsNative()){
      wasNative=true;
      if(wanted)setActive(true);
      else leaveNative();
    }else if(wasNative){
      wasNative=false;
      const requestedExit=exiting;
      exiting=false;
      // A second click can reopen the full-window layout while a native exit
      // is settling. Keep that newest choice instead of closing it again.
      if(requestedExit&&wanted)return;
      wanted=false;
      setActive(false);
    }
  }
  button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();toggle();
  });
  doc.addEventListener('fullscreenchange',nativeChanged);
  doc.addEventListener('webkitfullscreenchange',nativeChanged);
  doc.addEventListener('keydown',event=>{
    if(event.code!=='Escape'||!active)return;
    // Let the browser's Escape action close native fullscreen, but never flap
    // or toggle the game's pause state with that same key.
    event.stopPropagation();
    if(!ownsNative()){event.preventDefault();exit();}
  },true);
  updateButton();
  return {isActive:()=>active,toggle,exit};
}
