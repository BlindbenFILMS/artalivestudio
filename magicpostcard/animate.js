/* ─────────────────────────────────────────────────────────────
   MAGIC POSTCARD: "Make it move for me".
   Brings any photo to life with Art Alive's own effects (the Creator Studio's Glow, Shimmer, Sway,
   golden hour and night looks), drawn live on the phone, so no video is needed.
   It looks at the photo to find the sky, the bright spots (lights, windows, sun) and the greenery,
   and only moves those: the picture itself never shifts, so it lines up with the printed card.
   MagicAnimate.create(photo, { style }) → { canvas, start(), stop(), setStyle(style) }
   Styles: 'daynight' (day turns to night, lights glow, stars), 'fireworks' (a night of fireworks),
   'sparkle' (glow and sparkles, by day), and 'scene': a place template's own settings (see stock/catalog.json):
     { style: 'scene', keys: [{ t, night, gold, sun, beacon }, ...] (the looks over time; it loops at the last t),
       sky: [[x, y], ...] (where the sky is, if the photo can't tell), water: [[[x, y], ...], ...] (where water moves),
       sunAt: [x, y], beaconAt: [x, y] (a lighthouse lamp), moonAt: [x, y] (a moon, with its path of light on any water, a silver-lit
       starry night and shooting stars; keys can set moon (0..1) and rise (it climbs as rise goes 0 to 1)),
       flare (0..1, a lens flare off the moon), biolum (0..1, breaking waves glow blue-green at night),
       fireflies: [x0, y0, x1, y1] (where they blink at night) and firefliesA (and firefliesSync: 1 to flash all together), lamps: [[x, y, size], ...] (up to 8 warm windows or lanterns that
       light at dusk) with mirror: y (the waterline they reflect across), falls: [x0, y0, x1, y1] (a waterfall flowing down that box),
       lightning (0..1, heat lightning in the clouds at night), snow, confetti, hearts, fireworks (0..1 each, for occasions), aurora (0..1, northern lights) with auroraY (how low they reach),
       cars: { path: [[x, y], ...], n, speed, size } (headlights driving along a road at night), beams (0..1, moonbeams through trees) with beamsFrom: [x, y] (where they shine from), leaves (0..1, autumn leaves drifting down), nightDark (how dark the land gets at night: 1 full, lower is a brighter moonlit night), milkyWay: [x0, y0, x1, y1] (the Milky Way, along that line), milkyWayA (its strength), mist: [x0, y0, x1, y1], mistA, wave, glint, shadow (cloud shadows),
       birds, clouds, sway (leaves moving), glow (lights glowing) }   x and y run 0..1 across and down the square picture.
   No need to edit this file.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const STYLES = [
    { id: 'daynight', name: 'Day to night', blurb: 'Golden sunset, then stars come out and the lights glow.' },
    { id: 'fireworks', name: 'Fireworks night', blurb: 'A starry night sky with fireworks bursting.' },
    { id: 'sparkle', name: 'Sparkle and glow', blurb: 'Bright spots glow and twinkle; leaves and sky drift.' }
  ];
  const N = 128;   // the size of the map of what's sky, light and greenery

  // look at the photo: sky (connected to the top, blue or pale), bright spots, greenery
  function analyse(img, sc) {
    sc = sc || {};
    const cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, s = Math.min(w, h);
    g.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, N, N);
    const px = g.getImageData(0, 0, N, N).data, sky = new Float32Array(N * N), glo = new Float32Array(N * N), grn = new Float32Array(N * N), lums = [];
    const cand = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) {
      const r = px[i * 4] / 255, gg = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = .3 * r + .59 * gg + .11 * b, sat = mx ? (mx - mn) / mx : 0, y = (i / N | 0) / N;
      if (y < .7 && ((b > r + .06 && b > gg - .06 && l > .32) || (l > .78 && sat < .18))) cand[i] = 1;
      if (gg > r + .03 && gg > b + .01 && l > .12) grn[i] = 1;
      lums.push(l);
    }
    // a template can draw its sky and water by hand (x, y from 0 to 1)
    const poly = (list, ch) => { const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#fff';
      list.forEach(pts => { x.beginPath(); pts.forEach(([u, v], k) => k ? x.lineTo(u * N, v * N) : x.moveTo(u * N, v * N)); x.closePath(); x.fill(); });
      const d = x.getImageData(0, 0, N, N).data, o = new Float32Array(N * N); for (let i = 0; i < N * N; i++) o[i] = d[i * 4] / 255; return o; };
    const skyPoly = sc.sky ? poly([sc.sky], 0) : null, wat = sc.water ? poly(sc.water, 0) : new Float32Array(N * N);
    // sky has to reach down from the top edge
    for (let x = 0; x < N; x++) if (cand[x]) sky[x] = 1;
    for (let y = 1; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!cand[i]) continue;
      if (sky[i - N] || (x && sky[i - N - 1]) || (x < N - 1 && sky[i - N + 1]) || (x && sky[i - 1])) sky[i] = 1; }
    for (let y = N - 2; y >= 0; y--) for (let x = N - 2; x > 0; x--) { const i = y * N + x; if (cand[i] && !sky[i] && (sky[i + 1] || sky[i - N])) sky[i] = 1; }
    const blur = (a, r) => { const o = new Float32Array(N * N), t = new Float32Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < N) { s += a[y * N + xx]; c++; } } t[y * N + x] = s / c; }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < N) { s += t[yy * N + x]; c++; } } o[y * N + x] = s / c; }
      return o; };
    // lights: spots brighter than what's around them (lamps, windows, the sun), not big bright walls
    const LA = new Float32Array(lums), LB = blur(LA, 7);
    for (let i = 0; i < N * N; i++) { if (sky[i]) { grn[i] = 0; continue; } const l = LA[i], loc = l - LB[i]; glo[i] = Math.max(0, Math.min(1, (loc - .05) / .16)) * Math.min(1, Math.max(0, (l - .42) / .2)); }
    if (skyPoly) for (let i = 0; i < N * N; i++) { sky[i] = skyPoly[i]; if (sky[i] > .5) { glo[i] = 0; grn[i] = 0; } }
    const S = blur(sky, 2), G = blur(glo, 1), V = blur(grn, 2), Wt = blur(wat, 1), out = new Uint8Array(N * N * 4);
    // red: sky, green: lights, blue: greenery, alpha: water
    for (let i = 0; i < N * N; i++) { out[i * 4] = S[i] * 255; out[i * 4 + 1] = G[i] * 255; out[i * 4 + 2] = V[i] * 255; out[i * 4 + 3] = Wt[i] * 255; }
    return out;
  }

  const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  // the same Glow, Shimmer, golden hour and night looks as the Creator Studio's shader
  const FS = `precision mediump float;varying vec2 uv;
uniform sampler2D img,msk;uniform float t,night,gold,spk,fw,glA,wave,glint,shadow,sway,clouds,birds,mistA;uniform vec3 bea,sun,moon;uniform vec4 mistR,mw;uniform float snowA,cfA,hrtA,ffS,nx,flare,mwA,nd,biol,ffA,ltA,lvA,fallA,lampA,mirY,aurA,aurY,bmA;uniform vec2 bmP;uniform vec4 ffR,fallR;uniform vec3 lamps[8];
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float lum(vec3 c){return dot(c,vec3(.3,.59,.11));}
vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}
void main(){
 vec4 M=texture2D(msk,uv);float sky=M.r,glo=M.g,grn=M.b,wat=M.a;vec2 q=uv;
 q.x+=sway*grn*(.006*sin(t*1.7+q.y*14.+q.x*3.)+.0025*sin(t*3.1+q.y*31.));q.y+=sway*grn*.002*sin(t*2.3+q.x*9.);
 // water: ripples, foam that surges in, and the sun glinting
 float wl=wat*smoothstep(.22,.45,lum(texture2D(img,uv).rgb));   // the water itself, not the dark rocks in it
 q+=wl*wave*vec2(.0045*sin(t*1.6+q.y*90.+vn(q*18.+t*.25)*6.)+.002*sin(t*2.3-q.y*140.),.003*sin(t*1.15+q.x*40.+q.y*70.));
 // a waterfall: the water slides down inside its box
 vec2 fq=(uv-fallR.xy)/(fallR.zw-fallR.xy);float fm=fallA*step(0.,fq.x)*step(fq.x,1.)*step(0.,fq.y)*step(fq.y,1.)*smoothstep(0.,.2,fq.x)*smoothstep(1.,.8,fq.x);
 q.y+=fm*.005*sin(q.y*140.-t*14.+q.x*50.);q.x+=fm*.0015*sin(q.y*90.-t*9.);
 vec3 src=texture2D(img,q).rgb,col=src;float L0=lum(src);
 if(fm>0.){float st=smoothstep(.45,.9,vn(vec2(q.x*90.,q.y*14.-t*5.)))*.7+smoothstep(.6,.95,vn(vec2(q.x*160.,q.y*30.-t*8.)))*.5;col+=vec3(.9,.95,1.)*st*fm*smoothstep(.35,.75,L0)*.45;}
 if(fallA>0.){vec2 bq=(uv-vec2((fallR.x+fallR.z)*.5,fallR.w))/vec2((fallR.z-fallR.x)*2.2,.05);float sp=exp(-dot(bq,bq))*(.6+.4*vn(uv*40.+vec2(0.,-t*2.)));col=mix(col,vec3(.92,.95,1.),sp*fallA*.35);}
 float c=vn(vec2(q.x*3.5-t*.06,q.y*7.))*.6+vn(vec2(q.x*8.-t*.11,q.y*15.))*.4;
 col=mix(col,col*.55+vec3(.5),sky*smoothstep(.55,.9,c)*.55*(1.-night)*clouds);
 // swells rolling in, and a big wave breaking every few seconds
 float sg=pow(.5+.5*sin(t*1.25-q.y*16.+vn(q*6.+t*.1)*5.),4.),surge=exp(-pow((mod(t,4.6)-1.2)*1.6,2.)),fo=wat*smoothstep(.42,.85,L0);
 if(wave>0.){float crest=pow(.5+.5*sin(t*1.5-q.y*60.+vn(q*7.+t*.05)*4.),14.)*wl;
  col+=wave*(fo*(sg*.22+surge*.38)*vec3(.92,.96,1.)+crest*.14*vec3(.85,.92,1.));}
 if(shadow>0.){float cs=smoothstep(.5,.85,vn(vec2(q.x*2.2-t*.05,q.y*3.5+t*.012)));col*=1.-shadow*(1.-night)*cs*(1.-sky)*(1.-wat*.5)*.38;}
 if(mistA>0.){vec2 mq=(q-mistR.xy)/(mistR.zw-mistR.xy);float inR=smoothstep(0.,.3,mq.x)*smoothstep(1.,.7,mq.x)*smoothstep(0.,.35,mq.y)*smoothstep(1.,.55,mq.y);
  float m=vn(vec2(q.x*6.-t*.08,q.y*14.))*.6+vn(vec2(q.x*13.-t*.13,q.y*25.+t*.02))*.4;col=mix(col,vec3(.93,.95,.97),inR*smoothstep(.42,.8,m)*mistA*.65);}
 col=mix(col,col*vec3(1.1,.9,.7)+vec3(.04,.01,0.),gold*.8);
 col=mix(col,mix(vec3(.95,.55,.35),vec3(.55,.35,.65),q.y*2.),sky*gold*.55);
 col=mix(col,col*vec3(.28,.36,.66),night*(.85+nx*.09)*nd);
 vec3 ns=mix(vec3(.03,.06,.15),vec3(.12,.17,.34),clamp(q.y*1.8,0.,1.));
 float cl=smoothstep(.35,.85,L0);   // the photo's clouds (bright parts of its sky)
 col=mix(col,ns+col*.12,sky*night*.9*(1.-nx));
 // a moonlit night (nx): the clouds stay, lit silver, and the sky fills with stars
 if(nx>0.){vec3 sil=ns+vec3(.42,.47,.62)*pow(L0,1.6)*.75;col=mix(col,sil,sky*night*.92*nx);}
 float sOK=sky*night*(1.-smoothstep(.55,.9,c)*.6*(1.-nx))*(1.-cl*nx*.55);
 if(night>.15){vec2 g=q*80.;vec2 id=floor(g);float h=hash(id);if(h>.94){vec2 f=fract(g)-.5;float s=smoothstep(.16,0.,length(f))*(.55+.45*sin(t*3.+h*50.));col+=vec3(1.,.97,.9)*s*sOK;}}
 if(nx>0.&&night>.15){
  vec2 g=q*150.;vec2 id=floor(g);float h=hash(id+5.3);vec2 f=fract(g)-.5;col+=mix(vec3(.75,.85,1.),vec3(1.,.9,.75),hash(id+8.))*smoothstep(.22,0.,length(f))*(.15+.75*pow(.5+.5*sin(t*(3.+h*5.)+h*80.),2.))*step(.9,h)*sOK*.85*nx;
  // big, bold stars: glowing cores, halos, strong twinkles, and four-point sparkles flashing
  g=q*22.;id=floor(g);h=hash(id+2.1);f=fract(g)-.5-vec2(hash(id+4.)-.5,hash(id+6.)-.5)*.55;float dl=length(f);
  float tw=.15+1.25*pow(.5+.5*sin(t*(1.6+h*3.5)+h*60.),2.5),bu=pow(max(0.,sin(t*(.9+h*.8)+h*37.)),10.)*step(.55,hash(id+11.));
  float core=smoothstep(.13,0.,dl)+exp(-dl*11.)*.55,sp=(smoothstep(.02,0.,abs(f.x))*smoothstep(.62,0.,abs(f.y))+smoothstep(.02,0.,abs(f.y))*smoothstep(.62,0.,abs(f.x)))*(.35*tw+1.6*bu);
  col+=mix(vec3(.75,.85,1.),vec3(1.,.88,.72),hash(id+9.))*(core*tw+sp+exp(-dl*6.)*bu*.6)*step(.76,h)*sOK*nx*1.3;
  if(mwA>0.){vec2 a0=mw.xy,a1=mw.zw,ab=a1-a0;float al=clamp(dot(q-a0,ab)/dot(ab,ab),-.2,1.2);vec2 pr=a0+ab*al;float dd=length(q-pr),band=exp(-pow(dd/.095,2.));   // the Milky Way
   float neb=vn(vec2(al*9.,dd*26.)+3.)*.6+vn(vec2(al*23.,dd*60.))*.4,dust=smoothstep(.55,.8,vn(vec2(al*14.,dd*40.)+9.));
   vec2 g6=q*260.;vec2 i6=floor(g6);float h6=hash(i6+3.3);
   col+=(vec3(.66,.68,.9)*smoothstep(.25,.85,neb)*.75*(1.-dust*.65)+vec3(.95,.95,1.)*smoothstep(.32,0.,length(fract(g6)-.5))*step(.66,h6)*(.35+.65*sin(t*3.+h6*70.))*.9)*band*sky*night*(1.-cl*.55)*mwA;}
  float P=6.5,k=floor(t/P),u=mod(t,P);   // a shooting star now and then
  if(u<.9){vec2 dir=normalize(vec2(-.8,.42)),hd=vec2(.3+.6*hash(vec2(k,1.)),.03+.12*hash(vec2(k,2.)))+dir*u*.42,pq=q-hd;float al=dot(pq,-dir),pp=abs(dot(pq,vec2(-dir.y,dir.x)));
   col+=vec3(1.,.97,.9)*step(0.,al)*smoothstep(.15,0.,al)*smoothstep(.0035,0.,pp)*(1.-u/.9)*1.5*sky*night*nx;}}
 if(moon.z>0.){vec2 dm=q-moon.xy;float d=length(dm),r=.034,disc=smoothstep(r,r-.004,d),sh=.8+.2*vn(dm*95.+3.);
  col=mix(col,vec3(.98,.96,.88)*sh,disc*moon.z);
  col+=vec3(.55,.65,.9)*(exp(-d*13.)*.3+exp(-d*45.)*.35)*moon.z*(1.-disc)*(.4+.6*sky)+vec3(.7,.75,.9)*cl*sky*exp(-d*6.)*.35*moon.z;
  if(flare>0.){float ang=atan(dm.y,dm.x),fz=flare*moon.z;   // a lens flare: rays, a long streak and colored ghosts across the picture
   col+=vec3(.75,.82,1.)*fz*((pow(abs(sin(ang*6.+t*.05)),40.)*exp(-d*20.)*.3+pow(abs(sin(ang*11.-t*.03)),60.)*exp(-d*13.)*.14)*(.3+.7*sky)+exp(-abs(dm.y)*320.)*exp(-abs(dm.x)*3.2)*.38*(.85+.15*sin(t*1.7)));
   vec2 ax=vec2(.5)-moon.xy;
   for(int i=0;i<4;i++){float fi=float(i),kk=1.25+fi*.42,rr=.022+.018*fi*(1.+.3*sin(fi*2.));vec2 gp=moon.xy+ax*kk;float gd=length(q-gp);
    vec3 gc=fi<.5?vec3(.4,.8,.9):fi<1.5?vec3(1.,.7,.35):fi<2.5?vec3(.7,.45,1.):vec3(.5,1.,.7);
    col+=gc*fz*(smoothstep(rr,rr*.6,gd)*.07+smoothstep(.004,0.,abs(gd-rr))*.09)*(.8+.2*sin(t*1.1+fi));}}
  // its path of light on the water, broken up by the waves
  float dy=q.y-moon.y;if(wat>0.&&dy>0.){float w=.012+dy*.1,colm=exp(-pow((q.x-moon.x)/w,2.)),sk=smoothstep(.38,.85,vn(vec2(q.x*45.,q.y*240.-t*1.3)))*.85+.15;
   vec2 g5=q*vec2(70.,160.);vec2 i5=floor(g5);float h5=hash(i5+1.7),tw5=pow(max(0.,sin(t*(2.5+h5*3.)+h5*40.)),10.);
   col+=vec3(.86,.9,1.)*wat*moon.z*(colm*sk*.75+colm*smoothstep(.3,0.,length(fract(g5)-.5))*tw5*step(.6,h5)*1.2);}}
 if(wave>0.&&night>0.){
  // at night the breaking waves glow blue-green (bioluminescence), with sparks, and the stars twinkle in the calmer water
  float bl=vn(q*vec2(30.,60.)+vec2(t*.4,-t*.3)),fb=wat*smoothstep(.55,.92,L0);
  col+=vec3(.05,.9,.95)*fb*night*biol*(.3+1.1*surge+.4*sg)*(.45+bl)*.85;
  vec2 g7=q*vec2(120.,200.);vec2 i7=floor(g7);float h7=hash(i7+4.4),tw7=pow(max(0.,sin(t*(3.+h7*4.)+h7*50.)),8.);
  col+=vec3(.45,1.,1.)*smoothstep(.3,0.,length(fract(g7)-.5))*tw7*step(.7,h7)*fb*night*biol*(.6+surge)*1.4;
  vec2 g8=q*vec2(55.,110.);vec2 i8=floor(g8);float h8=hash(i8+7.7),tw8=pow(.5+.5*sin(t*(2.+h8*3.)+h8*60.),6.);
  col+=vec3(.85,.9,1.)*smoothstep(.25,0.,length((fract(g8)-.5)*vec2(1.,1.6)))*tw8*step(.86,h8)*wl*(1.-fo)*night*nx*.9;}
 if(glint>0.){vec2 g3=q*vec2(90.,150.);vec2 i3=floor(g3);float h3=hash(i3+9.1);vec2 f3=fract(g3)-.5;float tw3=pow(max(0.,sin(t*(2.+h3*3.)+h3*40.)),12.);
  col+=vec3(1.,.95,.85)*smoothstep(.3,0.,length(f3*vec2(1.,1.6)))*tw3*step(.78,h3)*wat*glint*smoothstep(.28,.7,L0)*1.3;}
 if(sun.z>0.){vec2 d=q-sun.xy;float r=length(d),a=atan(d.y,d.x),rays=pow(max(0.,sin(a*14.+t*.2)),6.)*.5+pow(max(0.,sin(a*9.-t*.15)),8.)*.5;
  col+=mix(vec3(1.,.86,.58),vec3(1.,.62,.36),gold)*sun.z*(exp(-r*9.)*.55*(.9+.1*sin(t*1.3))+rays*exp(-r*3.5)*.2*(sky*.7+.3));}
 if(bea.z>0.){vec2 d=q-bea.xy;float a=t*1.3,cx=cos(a),fl=pow(max(0.,sin(a)),14.),al=d.x*sign(cx),len=abs(cx)*.75+.04,wd=.004+max(al,0.)*.07;
  float beam=step(0.,al)*smoothstep(len,0.,al)*smoothstep(wd,0.,abs(d.y+al*.03))*(.5+.5*abs(cx));
  col+=vec3(1.,.93,.74)*bea.z*(beam*.55*(.35+.65*sky)+exp(-length(d)*70.)*(.7+.3*fl)+exp(-length(d)*11.)*fl*.55);}
 if(birds>0.){for(int i=0;i<3;i++){float fi=float(i),h=hash(vec2(fi,9.)),bx=fract(t*.022*(1.+h)+h*.7)*1.3-.15,by=.07+.2*h+.012*sin(t*.6+fi*2.);
  vec2 p=(q-vec2(bx,by))/(.011+.008*h);float fl=.5+.5*sin(t*5.+fi*3.),w=abs(p.x),dd=abs(p.y+w*(.75*fl-.15)-w*w*.25);
  col=mix(col,vec3(.08,.08,.1),smoothstep(.22,.05,dd)*step(w,1.)*birds*.85*(1.-night));}}
 // warm lights: lanterns and windows (they come on at dusk), and their reflections in the water
 if(lampA>0.){vec3 wc=vec3(1.,.72,.38);
  for(int i=0;i<8;i++){vec3 L=lamps[i];if(L.z<=0.)continue;float fi=float(i),fl=.88+.12*sin(t*7.+fi*3.)*sin(t*3.1+fi);vec2 d=q-L.xy;float dd=length(d);
   col+=wc*lampA*fl*(smoothstep(L.z,L.z*.3,dd)*.95+exp(-dd/L.z*1.8)*.55+exp(-dd/L.z*.6)*.12);
   if(mirY>0.){vec2 r=q-vec2(L.x,2.*mirY-L.y);r.x+=.004*sin(q.y*120.+t*2.);col+=wc*lampA*fl*exp(-length(r*vec2(1.,.28))/L.z*2.)*.55*wat;}}}
 // fireflies blinking over the land
 if(ffA>0.){for(int i=0;i<26;i++){float fi=float(i);vec2 b=vec2(hash(vec2(fi,1.3)),hash(vec2(fi,2.7)));
   vec2 p=mix(ffR.xy,ffR.zw,fract(b+vec2(.035*sin(t*.4+fi*1.7)+.01*t*(hash(vec2(fi,5.))-.5),.03*sin(t*.33+fi*2.3))));
   float bl=pow(max(0.,sin(t*(1.1+hash(vec2(fi,8.))*1.4)+fi*2.4)),3.),dd=length(q-p);
   // synchronous fireflies (like the Great Smoky Mountains): they all flash together in bursts, then go dark
   bl=mix(bl,pow(max(0.,sin(t*7.5+hash(vec2(fi,9.))*.6)),4.)*step(fract(t/5.),.55),ffS);
   col+=vec3(.85,1.,.35)*bl*ffA*(smoothstep(.0045,0.,dd)*1.2+exp(-dd*120.)*.45);}}
 // the northern lights: curtains of green and violet rippling across the sky
 if(aurA>0.){for(int i=0;i<3;i++){float fi=float(i),yb=aurY+fi*.045+.035*sin(q.x*5.+t*.35+fi*2.1)+.015*sin(q.x*13.-t*.6+fi);
   float up=yb-q.y,f=step(0.,up)*exp(-up/(.09+.05*fi))*smoothstep(-.012,.01,up);
   float ry=.35+1.3*pow(vn(vec2(q.x*38.+t*.35+fi*7.,fi)),2.)*(.6+.4*sin(q.x*9.+t*.7+fi*3.));
   vec3 ac=mix(vec3(.15,1.,.45),vec3(.65,.3,1.),clamp(up/.16,0.,1.));
   col+=ac*f*ry*aurA*(.35+.65*sky)*(1.-cl*.4)*.55;}}
 // moonbeams slanting down through the trees
 if(bmA>0.){vec2 d=q-bmP;float a=atan(d.y,d.x),r=length(d),sh=smoothstep(.5,.92,vn(vec2(a*16.,t*.07)))+smoothstep(.62,.95,vn(vec2(a*31.+4.,t*.11)))*.6;
  col+=vec3(.7,.8,1.)*sh*smoothstep(.05,.2,r)*exp(-r*1.4)*bmA*.4;}
 // heat lightning flickering inside the clouds
 if(ltA>0.){float u=mod(t,5.3),k=floor(t/5.3),fl=exp(-pow((u-1.)*28.,2.))+.75*exp(-pow((u-1.16)*28.,2.))+.4*exp(-pow((u-3.4)*30.,2.));
  vec2 lc=vec2(.25+.5*hash(vec2(k,3.)),.12+.12*hash(vec2(k,4.)));float near=exp(-length(q-lc)*4.5);
  col+=vec3(.75,.8,1.)*fl*ltA*(cl*sky*(.5+1.2*near)+.08*near+.05);}
 // occasions: falling snow, birthday confetti, floating hearts
 if(snowA>0.){for(int l=0;l<3;l++){float fl=float(l),sc=18.+fl*14.;vec2 sq=q*sc+vec2(sin(t*.6+q.y*4.+fl)*.6,-t*(1.1+fl*.5)*(1.+fl*.3));vec2 si=floor(sq);float sh=hash(si+fl*7.);vec2 sf=fract(sq)-.5-vec2(hash(si+3.)-.5,hash(si+5.)-.5)*.6;
   col=mix(col,vec3(.97,.98,1.),smoothstep(.14-fl*.03,.03,length(sf))*step(.55,sh)*snowA*(1.-fl*.18));}}
 if(cfA>0.){for(int i=0;i<34;i++){float fi=float(i),h=hash(vec2(fi,21.)),sp=.06+.06*h;vec2 p=vec2(fract(hash(vec2(fi,22.))+.02*sin(t*1.3+fi)),fract(hash(vec2(fi,23.))+t*sp)*1.15-.08);
   vec2 d=q-p;float a=t*(3.+h*4.)+fi;d=mat2(cos(a),-sin(a),sin(a),cos(a))*d;d.y*=1.+3.*abs(sin(t*4.+fi));float pc=step(abs(d.x),.0075)*step(abs(d.y),.0045);
   col=mix(col,hue(hash(vec2(fi,24.)))*.9+.15,pc*cfA);}}
 if(hrtA>0.){for(int i=0;i<12;i++){float fi=float(i),h=hash(vec2(fi,31.)),sz=.018+.016*h;vec2 p=vec2(fract(hash(vec2(fi,32.))+.03*sin(t*.8+fi*2.)),1.08-fract(hash(vec2(fi,33.))+t*(.035+.03*h))*1.2);
   vec2 d=(q-p)/sz;d.y=-d.y+.25;float ha=d.x*d.x+d.y*d.y-1.,hv=ha*ha*ha-d.x*d.x*d.y*d.y*d.y;float hm=smoothstep(.05,-.05,hv);float fade=smoothstep(1.08,.85,p.y)*smoothstep(-.1,.15,p.y);
   col=mix(col,mix(vec3(1.,.35,.5),vec3(1.,.7,.8),h),hm*hrtA*.85*fade);col+=vec3(1.,.5,.65)*exp(-length(q-p)/sz*1.2)*.12*hrtA*fade;}}
 // autumn leaves drifting down
 if(lvA>0.){for(int i=0;i<16;i++){float fi=float(i),h=hash(vec2(fi,11.)),sp=.035+.035*h;
   vec2 p=vec2(fract(hash(vec2(fi,12.))+.012*t+.03*sin(t*.9+fi)),fract(hash(vec2(fi,13.))+t*sp)*1.1-.05);
   vec2 d=q-p;float a=t*(1.5+h*2.)+fi;d=mat2(cos(a),-sin(a),sin(a),cos(a))*d;d.x*=.45+.4*abs(sin(t*2.+fi));
   float lf=smoothstep(.007,.005,length(d*vec2(1.,1.8)));vec3 lcol=mix(vec3(.9,.35,.08),vec3(1.,.72,.15),hash(vec2(fi,14.)));
   col=mix(col,lcol*(1.-night*.6),lf*lvA*.92);}}
 float g=glo*glA*(1.+night*1.6),pulse=.6+.4*sin(t*2.1+q.x*7.+q.y*5.);
 vec3 warm=mix(src,vec3(lum(src))*vec3(1.,.72,.42)*1.25,night*.8);
 col+=warm*g*pulse*.85+vec3(1.,.86,.62)*g*g*pulse*.24;
 if(spk>0.){vec2 g2=q*46.;vec2 id2=floor(g2);float h2=hash(id2+3.7);vec2 f2=fract(g2)-.5-vec2(hash(id2)-.5,hash(id2+1.)-.5)*.5;
  float tw=pow(max(0.,sin(t*(1.5+h2*2.)+h2*30.)),6.),m=texture2D(msk,(id2+.5)/46.).g;
  float star=(smoothstep(.06,0.,abs(f2.x))*smoothstep(.3,0.,abs(f2.y))+smoothstep(.06,0.,abs(f2.y))*smoothstep(.3,0.,abs(f2.x)))*.6+smoothstep(.12,0.,length(f2));
  col+=vec3(1.,.97,.88)*star*tw*step(.55,h2)*max(m,.15*(1.-sky))*spk;}
 if(fw>0.){for(int b=0;b<3;b++){float fb=float(b),T=3.6,k0=floor((t+fb*1.2)/T),tt=mod(t+fb*1.2,T);
   if(tt<2.4){vec2 ce=vec2(.15+.6*hash(vec2(fb,k0)),.08+.2*hash(vec2(fb+7.,k0)));float r=.16*(1.-exp(-tt*2.4)),fade=pow(max(0.,1.-tt/2.4),1.3),acc=0.;
    for(int k=0;k<22;k++){float a=float(k)*.2856+hash(vec2(k0,fb))*6.28;vec2 p=ce+vec2(cos(a),sin(a))*r*(.75+.25*hash(vec2(float(k),k0)))+vec2(0.,.04*tt*tt);float d=length(q-p);acc+=smoothstep(.009,0.,d)+smoothstep(.035,0.,d)*.25;}
    if(tt<.2)acc+=smoothstep(.05,0.,length(q-ce))*(1.-tt/.2)*2.;
    col+=mix(hue(hash(vec2(k0,fb+3.))),vec3(1.),.25)*acc*fade*sky*fw*1.4;}}}
 gl_FragColor=vec4(clamp(col,0.,1.),1.);}`;

  function create(photo, opts) {
    const o = opts || {}, size = o.size || 512, canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false }) || canvas.getContext('experimental-webgl');
    let style = o.style || 'daynight', raf = 0, t0 = 0, running = false;
    if (!gl) return { canvas, ok: false, start() {}, stop() {}, destroy() {}, time: 0, setStyle(s) { style = s; }, get style() { return style; } };
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    const tex = (unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v)); return t; };
    // the photo, squared to the middle (as it's printed)
    tex(0); const sq = document.createElement('canvas'); sq.width = sq.height = size; const sg = sq.getContext('2d');
    const w = photo.naturalWidth || photo.width, h = photo.naturalHeight || photo.height, s = Math.min(w, h); sg.drawImage(photo, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sq);
    const sc = o.scene || (o.style === 'scene' ? o : null) || {};
    tex(1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, analyse(photo, style === 'scene' ? sc : null));
    gl.uniform1i(gl.getUniformLocation(prog, 'img'), 0); gl.uniform1i(gl.getUniformLocation(prog, 'msk'), 1);
    const U = { lamps: gl.getUniformLocation(prog, 'lamps') }; ['t', 'night', 'gold', 'spk', 'fw', 'glA', 'wave', 'glint', 'shadow', 'sway', 'clouds', 'birds', 'mistA', 'bea', 'sun', 'moon', 'nx', 'mistR', 'flare', 'mw', 'mwA', 'nd', 'biol', 'ffA', 'ltA', 'lvA', 'fallA', 'lampA', 'mirY', 'ffR', 'fallR', 'aurA', 'aurY', 'bmA', 'bmP', 'ffS', 'snowA', 'cfA', 'hrtA'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    // a template's looks over time: smooth steps between its keys, looping at the last one
    const keyAt = (t) => { const K = sc.keys || [{ t: 0 }], Lp = K[K.length - 1].t || 1, u = t % Lp; let a = K[0], b = K[0];
      for (let i = 0; i < K.length - 1; i++) if (u >= K[i].t && u <= K[i + 1].t) { a = K[i]; b = K[i + 1]; break; }
      const f = b.t > a.t ? sm(0, 1, (u - a.t) / (b.t - a.t)) : 0, v = n => (a[n] || 0) + ((b[n] || 0) - (a[n] || 0)) * f;
      return { night: v('night'), gold: v('gold'), sun: v('sun'), beacon: v('beacon'), moon: v('moon'), rise: v('rise') }; };
    const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    function draw(t) {
      let night = 0, gold = 0, spk = 0, fw = 0, glA = .55, P = { wave: 0, glint: 0, shadow: 0, sway: 1, clouds: 1, birds: 0, mistA: 0, nx: 0 }, bz = 0, sz = 0, mz = 0, rise = 0;
      if (style === 'scene') { const k = keyAt(t); night = k.night; gold = k.gold; bz = k.beacon; sz = k.sun; mz = k.moon; rise = k.rise; glA = sc.glow || 0;
        P = { wave: sc.wave || 0, glint: sc.glint || 0, shadow: sc.shadow || 0, sway: sc.sway || 0, clouds: sc.clouds == null ? 1 : sc.clouds, birds: sc.birds || 0, mistA: sc.mist ? (sc.mistA == null ? 1 : sc.mistA) : 0, nx: sc.moonAt ? 1 : 0 }; }
      else if (style === 'daynight') { const L = 14, u = t % L; night = sm(1, 3, u) * (1 - sm(10.5, 12.5, u)); gold = Math.sin(Math.PI * Math.min(1, night)) * .9; fw = 0; }
      else if (style === 'fireworks') { night = 1; gold = 0; fw = 1; glA = .6; }
      else { night = 0; gold = .15 + .1 * Math.sin(t * .5); spk = 1.6; glA = .8; }
      gl.viewport(0, 0, size, size); gl.uniform1f(U.t, t); gl.uniform1f(U.night, night); gl.uniform1f(U.gold, gold); gl.uniform1f(U.spk, spk); gl.uniform1f(U.fw, fw); gl.uniform1f(U.glA, glA);
      Object.keys(P).forEach(n => gl.uniform1f(U[n], P[n]));
      const on = style === 'scene', lampOn = on ? Math.min(1, night * 1.5) : 0, ffr = sc.fireflies || [0, 0, 1, 1], fr = sc.falls || [0, 0, 0, 0];
      gl.uniform1f(U.ffA, on && sc.fireflies ? night * (sc.firefliesA == null ? 1 : sc.firefliesA) : 0); gl.uniform4f(U.ffR, ffr[0], ffr[1], ffr[2], ffr[3]);
      gl.uniform1f(U.ltA, on ? (sc.lightning || 0) * night : 0); gl.uniform1f(U.lvA, on ? sc.leaves || 0 : 0);
      gl.uniform1f(U.fallA, on && sc.falls ? 1 : 0); gl.uniform4f(U.fallR, fr[0], fr[1], fr[2], fr[3]);
      gl.uniform1f(U.lampA, on && (sc.lamps || sc.cars) ? lampOn : 0); gl.uniform1f(U.mirY, on ? sc.mirror || 0 : 0);
      // cars: headlights moving along a road (a list of points), added to the lamps
      const lampList = (on && sc.lamps || []).slice();
      if (on && sc.cars && sc.cars.path) { const pth = sc.cars.path, seg = [], n = sc.cars.n || 2, spd = sc.cars.speed || .05; let tot = 0;
        for (let i = 1; i < pth.length; i++) { const l = Math.hypot(pth[i][0] - pth[i - 1][0], pth[i][1] - pth[i - 1][1]); seg.push(l); tot += l; }
        for (let k = 0; k < n; k++) { let d = ((t * spd + k / n) % 1) * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
          const f = d / seg[i], a = pth[i], b = pth[i + 1], y = a[1] + (b[1] - a[1]) * f; lampList.push([a[0] + (b[0] - a[0]) * f, y, (sc.cars.size || .006) * (.6 + .8 * y)]); } }
      const LA = new Float32Array(24); lampList.slice(0, 8).forEach((l, i) => { LA[i * 3] = l[0]; LA[i * 3 + 1] = l[1]; LA[i * 3 + 2] = l[2] || .012; }); gl.uniform3fv(U.lamps, LA);
      gl.uniform1f(U.snowA, on ? sc.snow || 0 : 0); gl.uniform1f(U.cfA, on ? sc.confetti || 0 : 0); gl.uniform1f(U.hrtA, on ? sc.hearts || 0 : 0);
      if (on && sc.fireworks) gl.uniform1f(U.fw, night * sc.fireworks);
      gl.uniform1f(U.ffS, on ? sc.firefliesSync || 0 : 0);
      gl.uniform1f(U.aurA, on && sc.aurora ? night * sc.aurora : 0); gl.uniform1f(U.aurY, sc.auroraY || .3);
      const bp = sc.beamsFrom || [.7, -.1]; gl.uniform1f(U.bmA, on && sc.beams ? night * sc.beams : 0); gl.uniform2f(U.bmP, bp[0], bp[1]);
      gl.uniform1f(U.biol, style === 'scene' ? sc.biolum || 0 : 0);
      gl.uniform1f(U.nd, style === 'scene' && sc.nightDark != null ? sc.nightDark : 1);
      gl.uniform1f(U.flare, style === 'scene' ? sc.flare || 0 : 0); const mwv = sc.milkyWay || [0, 0, 1, 0]; gl.uniform4f(U.mw, mwv[0], mwv[1], mwv[2], mwv[3]); gl.uniform1f(U.mwA, style === 'scene' && sc.milkyWay ? night * (sc.milkyWayA == null ? 1 : sc.milkyWayA) : 0);
      const ma = sc.moonAt || [0, 0]; gl.uniform3f(U.moon, ma[0], ma[1] - rise * .07, sc.moonAt ? mz : 0);
      const ba = sc.beaconAt || [0, 0], sa = sc.sunAt || [0, 0], mr = sc.mist || [0, 0, 1, 1];
      gl.uniform3f(U.bea, ba[0], ba[1], sc.beaconAt ? bz : 0); gl.uniform3f(U.sun, sa[0], sa[1], sc.sunAt ? sz : 0); gl.uniform4f(U.mistR, mr[0], mr[1], mr[2], mr[3]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop(now) { if (!running) return; if (!t0) t0 = now; draw((now - t0) / 1000); raf = requestAnimationFrame(loop); }
    draw(0);
    return { canvas, ok: true, draw, get time() { return running && t0 ? (performance.now() - t0) / 1000 : 0; },
      start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(loop); },
      stop() { running = false; cancelAnimationFrame(raf); },
      destroy() { running = false; cancelAnimationFrame(raf); try { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) {} },   // frees the graphics memory (pages with many cards)
      setStyle(st) { style = st; if (!running) draw(0); },
      get style() { return style; } };
  }
  window.MagicAnimate = { STYLES, create };
})();
