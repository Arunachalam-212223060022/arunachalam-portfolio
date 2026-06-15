// @ts-nocheck
'use client';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import DomeGallery from './DomeGallery';

const galleryImages = [
  { src: "/images/gallery/gallery_01.jpg", alt: "SAKEC Hackathon - 2nd Runner-Up" },
  { src: "/images/gallery/gallery_02.jpg", alt: "SAKEC ChipMonk Hackathon 2026" },
  { src: "/images/gallery/gallery_03.jpg", alt: "Hardware Debug Session" },
  { src: "/images/gallery/gallery_04.jpg", alt: "Project Presentation" },
  { src: "/images/gallery/gallery_05.jpg", alt: "FFT Hardware Demo" },
  { src: "/images/gallery/gallery_06.jpg", alt: "Innovus Power Grid" },
  { src: "/images/gallery/gallery_07.jpg", alt: "Innovus Floorplan" },
  { src: "/images/gallery/gallery_08.jpg", alt: "AMD Spartan-7 FPGA Board" },
  { src: "/images/gallery/gallery_09.jpg", alt: "FPGA Board Active Run" },
  { src: "/images/gallery/gallery_10.jpg", alt: "Place and Route Detail" },
  { src: "/images/gallery/gallery_11.jpg", alt: "3D Die View" },
];

export default function PortfolioScript() {
  useEffect(() => {
    // ============================================================================
    // 0. THEME ENGINE LOGIC
    // ============================================================================
    const themeHues = {
        'cyan': { p: 185, a: 156 },
        'green': { p: 156, a: 185 },
        'amber': { p: 40, a: 15 },
        'blue': { p: 215, a: 185 }
    };
    
    function getThemeHues() {
        const t = localStorage.getItem('portfolio-theme') || 'cyan';
        return themeHues[t] || themeHues['cyan'];
    }
    
    function setTheme(theme) {
        localStorage.setItem('portfolio-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.t-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.t === theme) btn.classList.add('active');
        });
    }
    
    const savedTheme = localStorage.getItem('portfolio-theme') || 'cyan';
    setTheme(savedTheme);
    
    document.querySelectorAll('.t-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.t));
    });
    
    // ============================================================================
    // 1. SILICON SUBSTRATE (BACKGROUND SIMULATION)
    // ============================================================================
    // Gallery Modal - lazy mount DomeGallery on open
    const galleryModal = document.getElementById('gallery-modal');
    const galleryDomeMount = document.getElementById('gallery-dome-mount');
    let galleryRoot: any = null;

    function openGalleryModal() {
      if (!galleryModal || !galleryDomeMount) return;
      galleryModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (!galleryRoot) {
        galleryRoot = createRoot(galleryDomeMount);
        galleryRoot.render(
          <DomeGallery
            images={galleryImages}
            fit={0.72}
            minRadius={320}
            maxRadius={700}
            padFactor={0.08}
            overlayBlurColor="#04060e"
            grayscale={false}
            segments={26}
            dragDampening={0.92}
            dragSensitivity={14}
            maxVerticalRotationDeg={35}
            enlargeTransitionMs={320}
            imageBorderRadius="6px"
            openedImageBorderRadius="8px"
            openedImageWidth="480px"
            openedImageHeight="340px"
          />
        );
      }
    }
    function closeGalleryModal() {
      if (!galleryModal) return;
      galleryModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    window.openGalleryModal = openGalleryModal;
    window.closeGalleryModal = closeGalleryModal;

    // Close gallery modal on backdrop click
    if (galleryModal) {
      galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) closeGalleryModal();
      });
    }

    // Scroll reveal
    const revealEls = document.querySelectorAll('.project-card, .cert-card, .ach-card, .skill-card, .exp-entry, .timeline-item');
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('reveal-el', 'revealed'); }
        else { e.target.classList.add('reveal-el'); e.target.classList.remove('revealed'); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => { el.classList.add('reveal-el'); revealObs.observe(el); });

    const canvas = document.getElementById('c') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reticle = document.getElementById('reticle') as HTMLElement | null;
    
    let W, H, hexes = [], particles = [], trails = [];
    const numParticles = 60;
    const R = 22;
    const HW = Math.sqrt(3) * R;
    const RH = 1.5 * R;
    let mouse = { x: -9999, y: -9999, px: -9999, py: -9999, down: false };
    let rafId = null;
    
    class Particle {
      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0) this.x = W;
        if (this.x > W) this.x = 0;
        if (this.y < 0) this.y = H;
        if (this.y > H) this.y = 0;
      }
    }
    
    class Trail{
      constructor(x,y,hue){
        this.x=x;this.y=y;this.hue=hue;this.life=1;
        this.size=Math.random()*3+2; 
        this.vx=(Math.random()-0.5)*3;
        this.vy=(Math.random()-0.5)*3-1;
        this.gravity=0.08;
      }
      update(){this.x+=this.vx;this.vy+=this.gravity;this.y+=this.vy;this.life-=0.04;return this.life>0;}
      draw(){
        ctx.fillStyle=`hsla(${this.hue},100%,70%,${this.life*0.8})`;
        const s = this.size * this.life;
        ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
      }
    }
    
    class Hex{
      constructor(x,y,col,row){
        this.x=x;this.y=y;this.col=col;this.row=row;
        this.intensity=0;
        this.activeHue=getThemeHues().p; 
        this.activeGlitchX=0;
        this.activeGlitchY=0;
        this.scale=1;this.targetScale=1;
        
        const cx = W / 2;
        const cy = H / 2;
        const normX = (this.x - cx) / cx;
        const normY = (this.y - cy) / cy;
        const distFromCenter = Math.sqrt(normX*normX + normY*normY);
        
        let brokenProb = 0.45; 
        if (distFromCenter < 0.5) { brokenProb = 0.98; } 
        else if (distFromCenter < 0.9) { brokenProb = 0.98 - ((distFromCenter - 0.5) / 0.4 * 0.53); }
        
        this.broken=Math.random()<brokenProb;
    
        const dTL = Math.hypot(this.x, this.y);
        const dTR = Math.hypot(W - this.x, this.y);
        const dBL = Math.hypot(this.x, H - this.y);
        const dBR = Math.hypot(W - this.x, H - this.y);
        const minCorner = Math.min(dTL, dTR, dBL, dBR);
        const cornerRadius = Math.min(W, H) * 0.45; 
        
        this.isCorrupted = false;
        if (minCorner < cornerRadius) {
            if (Math.random() < (1 - (minCorner / cornerRadius)) * 0.85) {
                this.isCorrupted = true;
                this.broken = false; 
            }
        }
    
        this.dim=Math.random()<0.08&&!this.broken&&!this.isCorrupted;
        this.glitch=0;this.scanLine=Math.random();
        this.innerRing=Math.random()<0.06&&!this.broken&&!this.isCorrupted;
      }
    
      getIdleGlow(t){ return (Math.sin(this.col*0.18-t*0.0008+this.row*0.12)*0.5+0.5)*0.04; }
    
      update(t){
        const dx=mouse.x-this.x,dy=mouse.y-this.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const influence=R*3.2;
        const hues = getThemeHues();
        
        if(dist<influence&&!this.broken){
          const raw=1-(dist/influence);
          const ease=raw*raw*(3-2*raw);
          const ti=ease*0.95;
          
          if(ti>this.intensity) this.intensity=ti;
          
          if(this.isCorrupted) {
              if(Math.random() < 0.35) { 
                 this.activeHue = Math.random() < 0.5 ? 5 : 45; 
                 this.activeGlitchX = (Math.random() - 0.5) * 8;
                 this.activeGlitchY = (Math.random() - 0.5) * 8;
              } else {
                 this.activeHue = 22; 
                 this.activeGlitchX = 0;
                 this.activeGlitchY = 0;
              }
          } else {
              if(Math.random() < 0.25) { 
                 this.activeHue = Math.random() < 0.5 ? hues.a : hues.a + 40; 
                 this.activeGlitchX = (Math.random() - 0.5) * 14;
                 this.activeGlitchY = (Math.random() - 0.5) * 14;
              } else {
                 this.activeHue = hues.p; 
                 this.activeGlitchX = 0;
                 this.activeGlitchY = 0;
              }
          }
          this.targetScale=1+ease*0.12;
        }else{
          this.intensity*=0.82;
          if(this.intensity<0.001)this.intensity=0;
          this.targetScale=1;
          this.activeGlitchX=0;
          this.activeGlitchY=0;
          this.activeHue=this.isCorrupted ? 22 : hues.p;
        }
        
        this.scale+=(this.targetScale-this.scale)*0.3;
        if(this.intensity===0&&Math.random()<0.0012){this.glitch=(Math.random()-0.5)*14;}
        else{this.glitch*=0.65;}
        
        if(mouse.down&&dist<R*1.8&&!this.broken&&Math.random()<0.4){
            trails.push(new Trail(this.x + this.activeGlitchX, this.y + this.activeGlitchY, this.activeHue));
        }
      }
    
      draw(t){
        const vis=R*0.88;
        const idle=this.getIdleGlow(t);
        ctx.save();
        
        const I = this.intensity;
        const H = this.activeHue;
        const gX = I > 0.01 ? this.activeGlitchX : 0;
        const gY = I > 0.01 ? this.activeGlitchY : 0;
    
        ctx.translate(this.x+this.glitch, this.y);
        ctx.scale(this.scale,this.scale);
    
        const hexPath=()=>{
          ctx.beginPath();
          for(let i=0;i<6;i++){
            const a=(Math.PI/3)*i-Math.PI/2;
            i===0?ctx.moveTo(vis*Math.cos(a),vis*Math.sin(a)):ctx.lineTo(vis*Math.cos(a),vis*Math.sin(a));
          }
          ctx.closePath();
        };
    
        if(I>0.01){
          hexPath();
          ctx.fillStyle = '#060812'; 
          ctx.fill();
    
          ctx.translate(gX, gY);
          hexPath();
          ctx.shadowBlur=12*I;
          ctx.shadowColor=`hsla(${H},100%,50%,${I})`;
          ctx.fillStyle=`hsla(${H},100%,50%,${I*0.95})`;
          ctx.fill();
          ctx.strokeStyle=`hsla(${H},100%,90%,${I})`;
          ctx.lineWidth=1.5;
          ctx.stroke();
    
          if(Math.abs(gX)>2){
            ctx.translate(-gX*2, -gY*0.5); 
            hexPath();
            ctx.shadowBlur=0;
            const hues = getThemeHues();
            const ghostH = this.isCorrupted ? 0 : hues.a; 
            ctx.fillStyle=`hsla(${ghostH},100%,60%,${I*0.4})`;
            ctx.fill();
          }
          
        }else if(this.isCorrupted){
          hexPath();ctx.shadowBlur=0;
          ctx.fillStyle='rgba(20, 6, 2, 0.95)'; 
          ctx.fill();
          ctx.strokeStyle=`rgba(255, 80, 0, ${0.4 + Math.random()*0.2})`; 
          ctx.lineWidth=1.2;
          ctx.stroke();
    
          ctx.save();
          ctx.clip();
          ctx.beginPath();
          const offset = (t * 0.02 + this.x) % 15; 
          for(let i = -vis*2; i < vis*2; i+=5.5) {
              ctx.moveTo(i + offset, -vis);
              ctx.lineTo(i + offset - vis, vis);
          }
          ctx.strokeStyle = 'rgba(255, 60, 0, 0.35)'; 
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }else if(this.broken){
          hexPath();ctx.shadowBlur=0;
          if(Math.abs(this.glitch)>0.5){
            ctx.strokeStyle='rgba(255,40,60,0.7)';
            ctx.fillStyle='rgba(255,30,50,0.02)'; 
            ctx.lineWidth=0.8;
          }
          else{
            ctx.strokeStyle='rgba(30,40,55,0.18)';
            ctx.fillStyle='rgba(0,0,0,0)'; 
            ctx.lineWidth=0.4;
          }
          ctx.fill();ctx.stroke();
        }else if(this.dim){
          hexPath();ctx.shadowBlur=0;
          ctx.strokeStyle='rgba(40,60,90,0.15)';
          ctx.fillStyle='rgba(8,10,20,0.6)'; 
          ctx.lineWidth=0.4;
          ctx.fill();ctx.stroke();
        }else{
          hexPath();
          ctx.shadowBlur=idle*60;ctx.shadowColor=`rgba(80,140,220,${idle*4})`;
          ctx.strokeStyle=`rgba(60,90,140,${0.15+idle*3})`;ctx.lineWidth=0.7;
          ctx.fillStyle=`rgb(10, 14, 28)`; 
          ctx.fill();
          ctx.fillStyle=`rgba(20, 30, 50, ${idle})`; 
          ctx.fill();
          ctx.stroke();
          if(this.innerRing){ctx.save();ctx.scale(0.55,0.55);hexPath();ctx.strokeStyle='rgba(80,130,200,0.12)';ctx.lineWidth=0.5;ctx.stroke();ctx.restore();}
        }
        ctx.restore();
      }
    }
    
    function buildGrid(){
      hexes=[];
      particles=[];
      const cols=Math.ceil(W/HW)+3,rows=Math.ceil(H/RH)+3;
      for(let r=-1;r<rows;r++){
        for(let c=-1;c<cols;c++){
          const xOff=(r%2!==0)?HW/2:0;
          hexes.push(new Hex(c*HW+xOff,r*RH,c,r));
        }
      }
      for(let i=0;i<numParticles;i++) particles.push(new Particle());
    }
    
    function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;buildGrid();}
    
    function animate(ts){
      rafId = requestAnimationFrame(animate);
      
      ctx.fillStyle='#060812';ctx.fillRect(0,0,W,H);
      const hues = getThemeHues();
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hues.a}, 100%, 50%, 0.4)`; 
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 15000) { 
            const alpha = 1 - Math.sqrt(distSq) / 122.47; 
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${hues.a}, 100%, 50%, ${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        const mDx = mouse.x - particles[i].x;
        const mDy = mouse.y - particles[i].y;
        const mDistSq = mDx * mDx + mDy * mDy;
        if (mDistSq < 20000) {
          const alpha = 1 - Math.sqrt(mDistSq) / 141.42; 
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${hues.p}, 100%, 50%, ${alpha * 0.5})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    
      for(let i=0;i<hexes.length;i++){
        hexes[i].update(ts);
        hexes[i].draw(ts);
      }
      
      trails=trails.filter(p=>{p.update();p.draw();return p.life>0;});
      
      if(reticle){
          reticle.style.left=mouse.x+'px';
          reticle.style.top=mouse.y+'px';
          reticle.style.opacity=(mouse.x>0&&mouse.x<W)?'1':'0';
      }
    }
    
    const onResize = () => resize();
    const onMouseMove = e=>{mouse.px=mouse.x;mouse.py=mouse.y;mouse.x=e.clientX;mouse.y=e.clientY;};
    const onMouseDown = ()=>mouse.down=true;
    const onMouseUp = ()=>mouse.down=false;
    const onMouseLeave = ()=>{mouse.x=-9999;mouse.y=-9999; if(reticle) reticle.style.opacity='0';};
    
    window.addEventListener('resize',onResize);
    window.addEventListener('mousemove',onMouseMove);
    window.addEventListener('mousedown',onMouseDown);
    window.addEventListener('mouseup',onMouseUp);
    window.addEventListener('mouseleave',onMouseLeave);
    
    resize();
    requestAnimationFrame(animate);
    
    // ============================================================================
    // 2. VANILLA TILT SYSTEM
    // ============================================================================
    document.querySelectorAll('.tilt-card').forEach(el => {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rx = -(y - cy) / 20; 
            const ry = (x - cx) / 20;
            el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
    
    // ============================================================================
    // 3. TEXT SCRAMBLE ANIMATION
    // ============================================================================
    const roles = ["RTL DESIGN ENGINEER", "FPGA DEVELOPER", "RISC-V ENTHUSIAST", "PHYSICAL DESIGN LEARNER", "SEMICONDUCTOR ENGINEER"];
    let roleIdx = 0;
    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>';
    
    function scrambleText(element, newText) {
        if(!element) return;
        let iteration = 0;
        clearInterval(element.scrambleInterval);
        element.scrambleInterval = setInterval(() => {
            element.innerText = newText.split('').map((char, index) => {
                if (index < iteration) return newText[index];
                return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            }).join('');
            if (iteration >= newText.length) clearInterval(element.scrambleInterval);
            iteration += 1/2; 
        }, 30);
    }
    
    const roleEl = document.getElementById('hero-role-text');
    let roleInterval = null;
    if(roleEl) {
        scrambleText(roleEl, roles[0]);
        roleInterval = setInterval(() => {
            roleIdx = (roleIdx + 1) % roles.length;
            scrambleText(roleEl, roles[roleIdx]);
        }, 4000);
    }
    
    
    // ============================================================================
    // 4. RTL FLOW INTERACTIVE LOGIC
    // ============================================================================
    const flowData=[
      {id:'rtl',name:'RTL Design',tools:['Verilog','SystemVerilog'],inputs:'Architecture Specs',outputs:'Synthesizable RTL',desc:'Writing cycle-accurate behavioural HDL code. Implementing FSMs, data paths, and control logic for targeted architectures.', challenge:'Meeting 200MHz pipeline constraints.', solution:'Retiming and adding pipeline registers.', result:'Achieved target Fmax without massive latency overhead.'},
      {id:'sim',name:'Simulation',tools:['VCS','Verdi','XSim'],inputs:'RTL, Testbenches',outputs:'VCD/FSDB Waveforms',desc:'Functional verification via self-checking testbenches. Ensuring the design meets all corner-case architectural specifications.', challenge:'Finding hidden CDC bugs.', solution:'Systematic corner-case assertion writing.', result:'100% Functional Coverage.'},
      {id:'synth',name:'Synthesis',tools:['Cadence Genus','Design Compiler'],inputs:'RTL, Liberty (.lib), SDC',outputs:'Gate-level Netlist (.v)',desc:'Translating RTL to technology-specific logic gates. Targeting PPA (Power, Performance, Area) optimizations for specified tech nodes.', challenge:'High dynamic power.', solution:'Clock gating synthesis constraints.', result:'15% power reduction.'},
      {id:'sta',name:'Pre-layout STA',tools:['PrimeTime','Vivado Timing'],inputs:'Netlist, SDC, SPEF',outputs:'Setup/Hold Timing Reports',desc:'Static Timing Analysis. Identifying and resolving setup and hold violations before physical implementation begins.', challenge:'Setup violations on critical path.', solution:'Logic restructuring and SDC refinement.', result:'Zero setup violations.'},
      {id:'fp',name:'Floorplan',tools:['Cadence Innovus'],inputs:'Netlist, LEF, DEF',outputs:'Die/Core Area, Power Grid',desc:'Defining die size, core utilization, macro placement, I/O ring setup, and robust power (VDD/VSS) network design.', challenge:'IR Drop issues.', solution:'Enhanced power stripe sizing and VSS meshes.', result:'Robust PDN grid.'},
      {id:'place',name:'Placement',tools:['Innovus','IC Compiler'],inputs:'Floorplan DEF',outputs:'Placed Standard Cells',desc:'Congestion-aware placement of standard logic cells. Insertion of decoupling capacitors and filler cells.', challenge:'High routing congestion at macro corners.', solution:'Cell padding and partial blockages.', result:'Congestion dropped below 0.5%.'},
      {id:'cts',name:'CTS',tools:['Innovus CTS'],inputs:'Placed DEF, SDC',outputs:'Clock Tree Network',desc:'Clock Tree Synthesis. Minimizing clock skew and insertion delay via strategic buffer and inverter placement.', challenge:'Clock skew > 200ps.', solution:'Custom buffer lists and CTS routing rules.', result:'Skew minimized to 45ps.'},
      {id:'route',name:'Routing',tools:['NanoRoute'],inputs:'CTS DEF',outputs:'Routed DEF, DRC Reports',desc:'Global and detailed routing connecting all macros and standard cells. Resolving Antenna, Shorts, and spacing DRC violations.', challenge:'Metal3/Metal4 antenna violations.', solution:'Antenna diode insertion and layer hopping.', result:'DRC clean routing.'},
      {id:'so',name:'Signoff',tools:['PrimeTime','Calibre'],inputs:'Routed DEF, GDSII',outputs:'Clean GDSII Tapeout',desc:'Final Signoff verification including LVS (Layout Vs Schematic), DRC, and final exhaustive timing closure. Tape-out ready.', challenge:'Hold violations after routing extraction.', solution:'ECO buffer sizing.', result:'Tape-out ready silicon.'}
    ];
    
    const fn=document.getElementById('flow-nodes');
    const fd=document.getElementById('flow-detail');
    
    if(fn) {
        flowData.forEach((s,i)=>{
          const node=document.createElement('div');node.className='flow-node';
          node.innerHTML=`<div class="flow-node-box" id="fn-${s.id}"><span class="flow-node-num">0${i+1}</span><span class="flow-node-name">${s.name}</span></div>`;
          fn.appendChild(node);
          if(i<flowData.length-1){
            const a=document.createElement('span');a.className='flow-arrow';a.textContent='›';fn.appendChild(a);
          }
          
          node.querySelector('.flow-node-box').addEventListener('click',()=>{
            document.querySelectorAll('.flow-node-box').forEach(b=>b.classList.remove('active'));
            node.querySelector('.flow-node-box').classList.add('active');
            
            fd.innerHTML=`
              <div class="fd-title">${s.name}</div>
              <div class="fd-desc">${s.desc}</div>
              
              <div class="fd-grid">
                <div style="display:flex; flex-direction:column; gap:16px;">
                   <div>
                     <span class="fd-label">Required Inputs</span>
                     <div class="fd-box">${s.inputs}</div>
                   </div>
                   <div>
                     <span class="fd-label">Generated Outputs</span>
                     <div class="fd-box fd-box-out">${s.outputs}</div>
                   </div>
                   <div>
                     <span class="fd-label">Tools Executed</span>
                     <div style="display:flex; gap:8px; flex-wrap:wrap;">
                       ${s.tools.map(t=>`<span class="tag">${t}</span>`).join('')}
                     </div>
                   </div>
                </div>
                
                <div style="display:flex; flex-direction:column;">
                   <span class="fd-label">Execution Insights</span>
                   <div class="fd-challenge-box">
                     <strong style="color:#FF2850; font-family:'Share Tech Mono', monospace; font-size:0.8rem; text-transform:uppercase;">Challenge</strong><br>
                     <span style="color:#E8EDF5; font-size:0.95rem;">${s.challenge}</span>
                   </div>
                   <div class="fd-solution-box">
                     <strong style="color:var(--accent-alt); font-family:'Share Tech Mono', monospace; font-size:0.8rem; text-transform:uppercase;">Solution & Result</strong><br>
                     <span style="color:#E8EDF5; font-size:0.95rem;">${s.solution} ${s.result}</span>
                   </div>
                </div>
              </div>
            `;
            
            fd.classList.remove('show');
            void fd.offsetWidth; 
            fd.classList.add('show');
          });
        });
        setTimeout(()=>{const fb=document.getElementById('fn-rtl');if(fb){fb.click();}},500);
    }
    
    // ============================================================================
    // 5. PROJECT PREVIEW MODAL SYSTEM
    // ============================================================================
    const projectData = {
        'riscv': {
            title: 'RISC-V Soft-Core SoC + ASIC Flow',
            status: 'TAPE-OUT READY',
            visualId: 'visual-riscv',
            overview: 'End-to-end implementation of a 32-bit RISC-V (RV32I) 5-stage pipelined processor. Integrated with AMBA/APB interconnect, UART, SPI, and GPIO peripherals. Successfully driven through the complete Cadence ASIC Physical Design flow from behavioral synthesis to signoff.',
            features: ['Cycle-Accurate 5-Stage Pipeline', 'Custom AMBA/APB Bus Interconnect', 'Peripheral Subsystem (UART, SPI)', 'Full GDSII Physical Design Flow'],
            metrics: [
                { l: 'Target Freq', v: '200 MHz' },
                { l: 'Node', v: '90nm GSCLIB' },
                { l: 'Hold Vio.', v: 'Zero' },
                { l: 'Coverage', v: '100%' }
            ],
            tech: ['Verilog', 'SystemVerilog', 'Cadence Innovus', 'Genus', 'PrimeTime'],
            github: 'https://github.com/Arunachalam-212223060022/riscv_soc',
            gallery: [
                { type: 'svg', contentId: 'visual-riscv', caption: 'Architecture' }
            ]
        },
        'seap1': {
            title: 'Edge-Analytics IP Core (SEAP-1)',
            status: 'SILICON VERIFIED',
            visualId: 'visual-seap1',
            overview: 'A highly optimized 5-stage pipelined edge inference engine deployed on Spartan-7. Designed for minimal area footprint while maintaining deterministic real-time processing speeds. Selected as Finalist project for SAKEC x ChipMonk hackathon.',
            features: ['Low-Latency Neural Inference', 'Resource-Optimized DSP Slicing', 'Deterministic Execution Path', 'Zero Timing Violations'],
            metrics: [
                { l: 'Latency', v: '6.8 µs' },
                { l: 'FPGA Util.', v: '<5%' },
                { l: 'Vectors', v: '69/69 Pass' },
                { l: 'Target', v: 'Spartan-7' }
            ],
            tech: ['Verilog', 'Xilinx Vivado', 'XSim', 'PYNQ'],
            github: 'https://github.com/Arunachalam-212223060022/rtl_edge_analytic_SEAP1',
            gallery: [
                { type: 'svg', contentId: 'visual-seap1', caption: 'MAC Accelerator' }
            ]
        },
        'cnn': {
            title: 'HW-Accelerated CNN Inference',
            status: 'PROTOTYPED',
            visualId: 'visual-cnn',
            overview: 'Hardware/Software co-design for AI acceleration. The ARM Cortex-A9 delegates heavy matrix computations to custom FPGA fabric via AXI-HP DMA, achieving massive performance improvements over purely software-based CPU execution.',
            features: ['HW/SW Co-Design Architecture', 'AXI-HP Direct Memory Access', 'Matrix Math Acceleration Block', 'Power Optimized Profiling'],
            metrics: [
                { l: 'Speedup', v: '6.6x' },
                { l: 'Inference', v: '150 ms' },
                { l: 'Power', v: '~2x Reduction' },
                { l: 'Interface', v: 'AXI4' }
            ],
            tech: ['Vitis HLS', 'C++', 'Zynq-7020', 'AXI4'],
            github: 'https://github.com/Arunachalam-212223060022/CNN-Accelerator',
            gallery: [
                { type: 'svg', contentId: 'visual-cnn', caption: 'HW/SW Dataflow' }
            ]
        }
    };
    
    const modalEl = document.getElementById('project-modal');
    let currentGallery = [];
    let currentSlide = 0;
    
    function renderSlide() {
        if(currentGallery.length === 0) return;
        const item = currentGallery[currentSlide];
        const container = document.getElementById('m-carousel-slides');
        
        const slideDiv = document.createElement('div');
        slideDiv.className = 'm-carousel-slide active';
        
        if(item.type === 'svg') {
            const srcEl = document.getElementById(item.contentId);
            if(srcEl) slideDiv.innerHTML = srcEl.innerHTML;
        }
        
        if(container) {
            container.innerHTML = '';
            container.appendChild(slideDiv);
        }
        const capEl = document.getElementById('m-caption');
        if(capEl) capEl.innerText = item.caption + ` (${currentSlide+1}/${currentGallery.length})`;
    }
    
    function moveCarousel(dir) {
        if(currentGallery.length <= 1) return;
        currentSlide = (currentSlide + dir + currentGallery.length) % currentGallery.length;
        renderSlide();
    }
    
    function openModal(id) {
        const p = projectData[id];
        if(!p || !modalEl) return;
    
        document.getElementById('m-title').innerText = p.title;
        document.getElementById('m-status').innerText = p.status;
        document.getElementById('m-overview').innerText = p.overview;
        
        currentGallery = p.gallery;
        currentSlide = 0;
        renderSlide();
        
        const prevBtn = document.querySelector('.m-c-prev');
        const nextBtn = document.querySelector('.m-c-next');
        if(prevBtn) prevBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
        if(nextBtn) nextBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
    
        document.getElementById('m-metrics').innerHTML = p.metrics.map(m => 
            `<div class="metric-panel"><span class="m-val">${m.v}</span><span class="m-lbl">${m.l}</span></div>`
        ).join('');
    
        document.getElementById('m-features').innerHTML = p.features.map(f => `<li>${f}</li>`).join('');
        document.getElementById('m-tech').innerHTML = p.tech.map(t => `<span class="tag">${t}</span>`).join('');
        document.getElementById('m-github').href = p.github;
    
        modalEl.classList.add('active');
    }
    
    function closeModal() { if(modalEl) modalEl.classList.remove('active'); }

    // Expose modal/carousel functions globally so inline onclick handlers work
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.moveCarousel = moveCarousel;

    // Evidence Gallery Lightbox
    const lightboxEl = document.getElementById('evidence-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    function openLightbox(src, caption) {
        if (!lightboxEl || !lightboxImg) return;
        lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.innerText = caption || '';
        lightboxEl.classList.add('active');
    }
    function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.classList.remove('active');
    }
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;

    // Footer: cycling glitch-morph name
    const morphEl = document.getElementById('pf-morph-name');
    const morphWords = [
      'ARUNACHALAM P',
      'RTL  DESIGNER',
      'FPGA DEVELOPER',
      'ASIC  ENGINEER',
      'RISC-V  BUILDER',
    ];
    const scrambleSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let morphIdx = 0;
    let morphBusy = false;

    function morphToNext() {
      if (!morphEl || morphBusy) return;
      morphBusy = true;
      morphIdx = (morphIdx + 1) % morphWords.length;
      const target = morphWords[morphIdx];

      // Phase 1: scramble current text for ~300ms
      let scrambleFrames = 0;
      const maxScramble = 18;
      function scrambleTick() {
        scrambleFrames++;
        morphEl.textContent = target.split('').map(ch =>
          ch === ' ' ? ' ' : scrambleSet[Math.floor(Math.random() * scrambleSet.length)]
        ).join('');
        if (scrambleFrames < maxScramble) {
          requestAnimationFrame(scrambleTick);
        } else {
          // Phase 2: reveal left-to-right
          let revealFrame = 0;
          function revealTick() {
            revealFrame++;
            morphEl.textContent = target.split('').map((ch, i) => {
              if (ch === ' ') return ' ';
              const revealAt = Math.floor((i / target.length) * 14);
              return revealFrame > revealAt ? ch : scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
            }).join('');
            if (revealFrame < 20) {
              requestAnimationFrame(revealTick);
            } else {
              morphEl.textContent = target;
              morphBusy = false;
            }
          }
          revealTick();
        }
      }

      // Add glitch class for clip-path animation
      morphEl.classList.add('pf-glitching');
      setTimeout(() => morphEl.classList.remove('pf-glitching'), 420);
      scrambleTick();
    }

    // Auto-cycle every 3.5s
    const morphInterval = setInterval(morphToNext, 3500);

    const onEscapeKey = (e) => {
        if(e.key === 'Escape') { closeModal(); closeLightbox(); closeGalleryModal(); }
    };
    document.addEventListener('keydown', onEscapeKey);
    
    // Terminal Logic
    const commands={
      'help':'Commands available: whoami, skills, projects, project [name], experience, education, certifications, achievements, resume, github, linkedin, contact, clear',
      'whoami':'Arunachalam P — RTL Design Engineer, FPGA Developer, VLSI Enthusiast.<br>Location: Chennai, India.',
      'skills':'<span style="color:var(--accent)">Languages:</span> Verilog, SystemVerilog, C/C++, TCL<br><span style="color:var(--accent)">EDA Tools:</span> Cadence Genus, Innovus, Synopsys DC, PrimeTime, VCS, Vivado<br><span style="color:var(--accent)">Domains:</span> RTL Design, Verification, Physical Design, STA',
      'projects':'Available projects to query:<br>- project riscv<br>- project seap1<br>- project cnn<br>- project adas<br>- project traffic',
      'project riscv': '<strong style="color:#fff">RISC-V Soft-Core SoC</strong><br>Tech: Verilog, Genus, Innovus, 90nm<br>Result: RV32I 5-stage pipeline, Tape-out ready flow, Fmax 200MHz.<br>Link: github.com/Arunachalam-212223060022/riscv_soc',
      'project seap1': '<strong style="color:#fff">FPGA Edge-Analytics IP Core</strong><br>Tech: Verilog, Spartan-7, Vivado<br>Result: 100MHz, 6.8µs latency, 69/69 vectors passing.<br>Link: github.com/Arunachalam-212223060022/rtl_edge_analytic_SEAP1',
      'project cnn': '<strong style="color:#fff">HW-Accelerated CNN Inference</strong><br>Tech: Vitis HLS, Zynq-7020, C++<br>Result: 6.6x speedup over CPU, deterministic latency.<br>Link: github.com/Arunachalam-212223060022/CNN-Accelerator',
      'project adas': '<strong style="color:#fff">ADAS Safety Monitor</strong><br>Tech: Verilog FSM, Clock Dividers, Vivado<br>Result: Dynamic Frequency Scaling, active power management.',
      'project traffic': '<strong style="color:#fff">Traffic Light Controller IP</strong><br>Tech: Verilog, Artix-7, STA<br>Result: Fmax >200 MHz, ~45 LUTs, Zero Failures.',
      'experience':'<span style="color:var(--accent)">1. VLSI Design Intern</span> @ Codec Technology (Nov 2024 - Jan 2025)<br><span style="color:var(--accent)">2. Engineering Intern</span> @ NSIC (Jul 2024 - Sep 2024)',
      'education':'B.E. ECE @ Saveetha Engineering College (2023-2027) | CGPA: 8.1/10',
      'certifications': '1. RTL Design & Verification (GUVI x HCL)<br>2. VLSI for Beginners (NIELIT)<br>3. Embedded Systems (NIELIT)<br>4. Industry 4.0 (NPTEL)',
      'achievements':'1. AIR 17 (VLSI For All - NIT Jamshedpur)<br>2. Finalist (SAKEC x ChipMonk FPGA Hackathon)<br>3. Selected (ARM Bharat AI SoC)',
      'resume':'Execute "Download" button in the Documentation section.',
      'github':'github.com/Arunachalam-212223060022',
      'linkedin':'linkedin.com/in/arunachalam-p-12445b290',
      'contact':'arunachalam862005@gmail.com',
      'sudo hire arunachalam':'<span style="color:var(--accent-alt);font-weight:700;">[OK] Authorization Accepted.</span><br><span style="color:var(--accent);">Welcome to the Semiconductor Industry. Awaiting HR protocol initiation...</span>',
      'clear':'__clear__'
    };
    
    const inputEl = document.getElementById('term-input');
    const tb = document.getElementById('term-body');
    
    if(inputEl) {
        inputEl.addEventListener('keydown',e=>{
          if(e.key!=='Enter')return;
          const val=e.target.value.trim().toLowerCase();e.target.value='';
          if(!val)return;
          
          const sp=document.createElement('span');sp.className='term-line';
          sp.innerHTML=`<span class="term-prompt">arunachalam@vlsi:~$ </span><span style="color:#fff">${val}</span>`;
          if(tb) tb.appendChild(sp);
          
          if(val === 'clear'){ if(tb) tb.innerHTML=''; return; }
          
          let res = commands[val] || `bash: command not found: ${val}. Type 'help' for available commands.`;
          
          const out=document.createElement('span');out.className='term-line';
          out.innerHTML=`<span class="term-output">${res}</span>`;
          if(tb) {
              tb.appendChild(out);
              tb.scrollTop=tb.scrollHeight;
          }
        });
    }
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('keydown', onEscapeKey);
      if (roleInterval) clearInterval(roleInterval);
      if (morphInterval) clearInterval(morphInterval);
      if (galleryRoot) galleryRoot.unmount();
      revealObs.disconnect();
    };
  }, []);

  return null;
}
