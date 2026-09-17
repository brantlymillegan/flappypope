const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const MIX = { music: .60, effects: 1.50 };

export class Chiptune {
  constructor() {
    this.context=null;this.enabled=true;this.paused=false;this.step=0;this.beat=0;this.voices=new Set();this.track=null;
  }
  setTrack(track) {
    this.hush();this.track=track;this.step=0;this.beat=0;
    const pitches=track.melody.map(note=>note[0]).filter(pitch=>pitch!==null);
    this.transpose=pitches.reduce((sum,pitch)=>sum+pitch,0)/pitches.length<70?12:0;
    if(this.context)this.nextNote=this.context.currentTime+.06;
  }
  async unlock() {
    if(!this.enabled)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    if(!this.context){
      this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.26;this.master.connect(this.context.destination);
      this.nextNote=this.context.currentTime+.06;
      this.timer=window.setInterval(()=>this.schedule(),80);
    }
    if(this.context.state==='suspended')await this.context.resume();
    this.schedule();
  }
  note(midi,time,length,type='square',volume=.10,endMidi=null,channel='effects',hold=.65){
    if(!this.context||!this.enabled||this.paused)return;
    volume*=MIX[channel];
    const oscillator=this.context.createOscillator(),gain=this.context.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(hz(midi),time);
    if(endMidi!==null)oscillator.frequency.exponentialRampToValueAtTime(hz(endMidi),time+length);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.008);
    gain.gain.setValueAtTime(volume,time+Math.max(.008,length*hold));gain.gain.exponentialRampToValueAtTime(.0001,time+length);
    oscillator.connect(gain);gain.connect(this.master);oscillator.start(time);oscillator.stop(time+length+.01);
    this.voices.add(oscillator);oscillator.onended=()=>{this.voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  }
  schedule(){
    if(!this.context||this.context.state!=='running'||!this.enabled||this.paused||!this.track)return;
    const now=this.context.currentTime;
    if(this.nextNote<now-.2)this.nextNote=now+.04;
    while(this.nextNote<now+.18){
      const [pitch,beats]=this.track.melody[this.step];
      const duration=beats*60/this.track.tempo;
      if(pitch!==null){
        const lead=pitch+this.transpose;
        this.note(lead,this.nextNote,duration*.86,'square',.09,null,'music');
        if(Number.isInteger(this.beat)){
          // Octave accompaniment works with both modal chant and major-key hymns.
          this.note(lead-24,this.nextNote,Math.min(duration*.85,.7),'triangle',.19,null,'music');
          this.note(lead-12,this.nextNote+.025,Math.min(duration*.55,.35),'triangle',.055,null,'music');
        }
      }
      this.beat+=beats;this.nextNote+=duration;this.step=(this.step+1)%this.track.melody.length;
    }
  }
  hush(){for(const oscillator of this.voices){try{oscillator.stop();}catch{}}this.voices.clear();}
  setEnabled(enabled){
    if(this.enabled===enabled)return;
    this.enabled=enabled;
    if(!enabled)this.hush();
    else{if(this.context)this.nextNote=this.context.currentTime+.05;void this.unlock().catch(()=>{});}
  }
  setPaused(paused){
    if(this.paused===paused)return;
    this.paused=paused;
    if(paused)this.hush();else if(this.context)this.nextNote=this.context.currentTime+.05;
  }
  flap(character='pope'){
    if(!this.context||!this.enabled||this.paused)return;
    const t=this.context.currentTime;
    switch(character){
      case 'bell':
        // Inharmonic, quickly fading overtones give the strike a metallic ring.
        for(const [ratio,volume,length] of [[1,.25,.52],[2.756,.065,.33],[5.404,.025,.18]]){
          this.note(76+12*Math.log2(ratio),t,length,'sine',volume,null,'effects',0);
        }
        break;
      case 'angel':
        this.note(84,t,.10,'triangle',.18,88);
        this.note(91,t+.035,.15,'sine',.10,null,'effects',0);
        this.note(96,t+.075,.12,'sine',.055,null,'effects',0);
        break;
      case 'friar':
        // A bright downward clack stays audible above the hymn, even on small speakers.
        this.note(71,t,.13,'square',.24,59,'effects',.38);
        this.note(90,t,.055,'triangle',.12,78,'effects',.20);
        break;
      default:
        this.note(72,t,.085,'square',.14,79);
        this.note(60,t,.075,'triangle',.10,67);
    }
  }
  point(){if(!this.context)return;const t=this.context.currentTime;this.note(84,t,.1,'square',.14);this.note(88,t+.08,.16,'square',.12);}
  wah(midi,time,length,endMidi){
    if(!this.context||!this.enabled||this.paused)return;
    const oscillator=this.context.createOscillator(),filter=this.context.createBiquadFilter(),gain=this.context.createGain();
    const vibrato=this.context.createOscillator(),depth=this.context.createGain();
    const volume=.30*MIX.effects;
    // A brassy chip voice opens into "waa", then droops like a sad trombone.
    oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(hz(midi+1),time);
    oscillator.frequency.exponentialRampToValueAtTime(hz(midi),time+.065);
    oscillator.frequency.setValueAtTime(hz(midi),time+length*.48);
    oscillator.frequency.exponentialRampToValueAtTime(hz(endMidi),time+length);
    filter.type='lowpass';filter.Q.value=2;
    filter.frequency.setValueAtTime(420,time);
    filter.frequency.exponentialRampToValueAtTime(1800,time+.085);
    filter.frequency.exponentialRampToValueAtTime(650,time+length*.65);
    filter.frequency.exponentialRampToValueAtTime(260,time+length);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.035);
    gain.gain.setValueAtTime(volume,time+length*.72);
    gain.gain.exponentialRampToValueAtTime(.0001,time+length);
    vibrato.type='sine';vibrato.frequency.setValueAtTime(6,time);
    vibrato.frequency.linearRampToValueAtTime(8,time+length);
    depth.gain.setValueAtTime(0,time);depth.gain.setValueAtTime(0,time+length*.25);
    depth.gain.linearRampToValueAtTime(length>.7?85:16,time+length*.8);
    vibrato.connect(depth);depth.connect(oscillator.detune);
    oscillator.connect(filter);filter.connect(gain);gain.connect(this.master);
    for(const voice of [oscillator,vibrato]){this.voices.add(voice);voice.start(time);voice.stop(time+length+.02);}
    oscillator.onended=()=>{this.voices.delete(oscillator);oscillator.disconnect();filter.disconnect();gain.disconnect();};
    vibrato.onended=()=>{this.voices.delete(vibrato);vibrato.disconnect();depth.disconnect();};
  }
  bump(){
    if(!this.context||!this.enabled||this.paused)return;
    const t=this.context.currentTime+.01;
    this.hush();this.nextNote=t+2.5;
    // Three distinct syllables: waah, waa, waaaaaaah.
    for(const [pitch,offset,length,endPitch] of [[62,0,.36,60],[58,.43,.40,56],[53,.91,1.35,46]]){
      this.wah(pitch,t+offset,length,endPitch);
      this.note(pitch-12,t+offset,length,'triangle',.08,endPitch-12);
    }
  }
}
