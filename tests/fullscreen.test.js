import test from 'node:test';
import assert from 'node:assert/strict';
import { createFullscreenController } from '../dist/fullscreen.js';

function eventTarget(){
  const listeners=new Map();
  return {
    addEventListener(type,listener){
      if(!listeners.has(type))listeners.set(type,[]);
      listeners.get(type).push(listener);
    },
    dispatch(type,properties={}){
      const event={defaultPrevented:false,propagationStopped:false,
        preventDefault(){this.defaultPrevented=true;},
        stopPropagation(){this.propagationStopped=true;},...properties};
      for(const listener of listeners.get(type)||[])listener(event);
      return event;
    }
  };
}
function classList(){
  const names=new Set();
  return {contains:name=>names.has(name),toggle(name,enabled){if(enabled)names.add(name);else names.delete(name);}};
}
function fixture(){
  const doc={...eventTarget(),body:{classList:classList()},fullscreenElement:null,webkitFullscreenElement:null};
  const view=doc.defaultView={scrollX:12,scrollY:240,scrollTo(x,y){this.scrollX=x;this.scrollY=y;}};
  const element=()=>({...eventTarget(),isConnected:true,focus(){doc.activeElement=this;}});
  const previous=element(), canvas=element(), button={...element(),dataset:{},attributes:{},setAttribute(name,value){this.attributes[name]=value;}};
  const frame={ownerDocument:doc,classList:classList(),querySelector:selector=>selector==='canvas'?canvas:null};
  doc.activeElement=previous;
  const changes=[],announcements=[];
  let exits=0;
  const controller=createFullscreenController({frame,button,onChange:value=>changes.push(value),onExit:()=>exits++,announce:message=>announcements.push(message)});
  return {doc,view,frame,canvas,button,previous,changes,announcements,controller,get exits(){return exits;},
    native(active,prefixed=false){doc[prefixed?'webkitFullscreenElement':'fullscreenElement']=active?frame:null;doc.dispatch(prefixed?'webkitfullscreenchange':'fullscreenchange');}};
}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('fullscreen button provides a full-window fallback and restores focus and scrolling',()=>{
  const f=fixture();
  assert.equal(f.button.attributes['aria-label'],'Enter fullscreen');
  const click=f.button.dispatch('click');
  assert.equal(click.defaultPrevented,true);
  assert.equal(click.propagationStopped,true);
  assert.equal(f.controller.isActive(),true);
  assert.equal(f.frame.classList.contains('is-fullscreen'),true);
  assert.equal(f.doc.body.classList.contains('game-fullscreen'),true);
  assert.equal(f.button.attributes['aria-pressed'],'true');
  assert.equal(f.button.attributes['aria-label'],'Exit fullscreen');
  assert.equal(f.doc.activeElement,f.canvas);
  f.view.scrollTo(0,0);
  f.button.dispatch('click');
  assert.equal(f.controller.isActive(),false);
  assert.equal(f.frame.classList.contains('is-fullscreen'),false);
  assert.equal(f.doc.body.classList.contains('game-fullscreen'),false);
  assert.equal(f.doc.activeElement,f.previous);
  assert.deepEqual([f.view.scrollX,f.view.scrollY],[12,240]);
  assert.deepEqual(f.changes,[true,false]);
  assert.equal(f.exits,1);
});

test('Escape exits fallback and cannot also reach the game pause shortcut',()=>{
  const f=fixture();f.controller.toggle();
  const escape=f.doc.dispatch('keydown',{code:'Escape'});
  assert.equal(escape.defaultPrevented,true);
  assert.equal(escape.propagationStopped,true);
  assert.equal(f.controller.isActive(),false);
  const outside=f.doc.dispatch('keydown',{code:'Escape'});
  assert.equal(outside.defaultPrevented,false);
  assert.equal(outside.propagationStopped,false);
});

test('native permission rejection or a synchronous API error retains a usable fallback',async()=>{
  for(const request of [()=>Promise.reject(new Error('Permission denied')),()=>{throw new Error('Unavailable');}]){
    const f=fixture();f.frame.requestFullscreen=request;
    f.controller.toggle();await settle();
    assert.equal(f.controller.isActive(),true);
    assert.equal(f.frame.classList.contains('is-fullscreen'),true);
    f.controller.exit();assert.equal(f.controller.isActive(),false);
  }
});

test('native fullscreen request runs synchronously and browser Escape restores the page',async()=>{
  const f=fixture();let requested=0;
  f.frame.requestFullscreen=function(){assert.equal(this,f.frame);requested++;return Promise.resolve();};
  f.controller.toggle();assert.equal(requested,1);
  f.native(true);await settle();
  const escape=f.doc.dispatch('keydown',{code:'Escape'});
  assert.equal(escape.defaultPrevented,false,'the browser must retain its native Escape action');
  assert.equal(escape.propagationStopped,true);
  assert.equal(f.controller.isActive(),true,'the browser event confirms when fullscreen ended');
  f.native(false);
  assert.equal(f.controller.isActive(),false);
  assert.equal(f.exits,1);
});

test('cancelling while native entry is pending exits a later successful native entry',async()=>{
  const f=fixture(),entry=deferred();let exitCalls=0;
  f.frame.requestFullscreen=()=>entry.promise;
  f.doc.exitFullscreen=()=>{exitCalls++;f.native(false);return Promise.resolve();};
  f.controller.toggle();f.controller.exit();
  assert.equal(f.controller.isActive(),false);
  f.native(true);entry.resolve();await settle();
  assert.equal(exitCalls,1);
  assert.equal(f.doc.fullscreenElement,null);
  assert.equal(f.controller.isActive(),false);
  assert.deepEqual(f.changes,[true,false]);
});

test('reopening during a delayed entry keeps the latest choice without a second request',async()=>{
  const f=fixture(),entry=deferred();let requests=0;
  f.frame.requestFullscreen=()=>{requests++;return entry.promise;};
  f.controller.toggle();f.controller.toggle();f.controller.toggle();
  f.native(true);entry.resolve();await settle();
  assert.equal(requests,1);
  assert.equal(f.controller.isActive(),true);
  assert.equal(f.doc.fullscreenElement,f.frame);
});

test('reopening while native exit is pending leaves a full-window game',async()=>{
  const f=fixture(),exit=deferred();
  f.frame.requestFullscreen=()=>Promise.resolve();
  f.doc.exitFullscreen=()=>exit.promise;
  f.controller.toggle();f.native(true);await settle();
  f.controller.toggle();f.controller.toggle();
  f.native(false);exit.resolve();await settle();
  assert.equal(f.controller.isActive(),true);
  assert.equal(f.frame.classList.contains('is-fullscreen'),true);
  f.controller.exit();assert.equal(f.controller.isActive(),false);
});

test('a failed native exit keeps its exit control and explains the browser escape route',async()=>{
  const f=fixture();f.frame.requestFullscreen=()=>Promise.resolve();
  f.doc.exitFullscreen=()=>Promise.reject(new Error('Denied'));
  f.controller.toggle();f.native(true);await settle();
  f.controller.exit();await settle();
  assert.equal(f.controller.isActive(),true);
  assert.equal(f.button.attributes['aria-label'],'Exit fullscreen');
  assert.equal(f.announcements.at(-1),'Use Escape to exit fullscreen.');
  f.native(false);assert.equal(f.controller.isActive(),false);
});

test('prefixed promise-less fullscreen APIs also synchronize browser-driven exits',async()=>{
  const f=fixture();let requests=0;
  f.frame.webkitRequestFullscreen=()=>{requests++;};
  f.controller.toggle();assert.equal(requests,1);
  await settle();f.native(true,true);
  assert.equal(f.controller.isActive(),true);
  f.native(false,true);assert.equal(f.controller.isActive(),false);
});

test('reopening during a delayed promise-less native exit keeps the latest choice',async()=>{
  const f=fixture();
  f.frame.webkitRequestFullscreen=()=>{};
  f.doc.webkitExitFullscreen=()=>{};
  f.controller.toggle();f.native(true,true);await settle();
  f.controller.toggle();await settle();
  f.controller.toggle();f.native(false,true);
  assert.equal(f.controller.isActive(),true);
  assert.equal(f.frame.classList.contains('is-fullscreen'),true);
});
