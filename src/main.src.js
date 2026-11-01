/* ===== Phong bì mở đầu + hiệu ứng "Mở thiệp" =====
   Đặt ĐẦU FILE để lỗi ở đoạn code bên dưới (vd. GSAP không tải được) không làm hỏng phần này. */
(function () {
  var env = document.getElementById('envelope');
  if (!env) return;
  var seal = document.getElementById('seal');
  var btn = document.getElementById('openBtn');
  var bgm = document.getElementById('bgm');
  var sfx = document.getElementById('sfx');   // âm thanh khi bấm "Mở thiệp"
  var bgmPending = false;                      // đang chờ sfx kết thúc để phát nhạc nền
  var musicBtn = document.getElementById('musicBtn');

  function setMusicUI(on) {
    if (!musicBtn) return;
    musicBtn.classList.toggle('playing', on);
    musicBtn.setAttribute('aria-pressed', on);
    musicBtn.setAttribute('aria-label', on ? 'Tắt nhạc' : 'Bật nhạc');
  }
  if (musicBtn && bgm) {
    musicBtn.addEventListener('click', function () {
      bgmPending = false;                      // người xem tự điều khiển -> không tự phát nữa
      if (bgm.paused) {
        var pr = bgm.play();
        if (pr && pr.then) pr.then(function () { setMusicUI(true); }).catch(function () {});
      } else {
        bgm.pause();
        setMusicUI(false);
      }
    });
  }
  var root = document.documentElement;
  var COLORS = ['#a8323b', '#ece4d8', '#c9a24a', '#7a1f26'];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  function finish() {
    env.remove();
    root.classList.remove('locked');
    if (window.ScrollTrigger) ScrollTrigger.refresh();   // tính lại vị trí sau khi mở khóa cuộn
  }

  // ?open=1 -> bỏ qua phong bì
  if (/[?&]open=1\b/.test(location.search)) {
    env.remove();
    if (musicBtn) musicBtn.classList.add('show');   // nhạc không tự phát, người xem bấm nút để bật
    return;
  }

  root.classList.add('locked');
  window.scrollTo(0, 0);

  // Phát sfx trước, hết sfx mới phát nhạc nền
  function startBgm() {
    if (!bgm || !bgmPending) return;
    bgmPending = false;
    bgm.volume = 0.6;
    var pr = bgm.play();
    if (pr && pr.then) pr.then(function () { setMusicUI(true); }).catch(function () { setMusicUI(false); });
  }
  function playOpenAudio() {
    if (bgm) {
      bgmPending = true;
      // "Mở khóa" thẻ nhạc nền ngay trong lúc bấm (iOS/Safari chỉ cho phát sau khi đã được mở khóa)
      var u = bgm.play();
      if (u && u.catch) u.catch(function () {});
      bgm.pause();
      bgm.currentTime = 0;
    }
    if (!sfx) { startBgm(); return; }                 // không có sfx -> phát nhạc nền luôn
    sfx.currentTime = 0;
    sfx.onended = startBgm;
    sfx.onerror = startBgm;                           // file sfx lỗi/thiếu -> vẫn phát nhạc nền
    var sp = sfx.play();
    if (sp && sp.catch) sp.catch(startBgm);           // trình duyệt chặn sfx -> vẫn phát nhạc nền
  }

  var opened = false;
  function openInvite(e) {
    if (e) e.preventDefault();
    if (opened) return;
    opened = true;
    if (musicBtn) musicBtn.classList.add('show');
    playOpenAudio();
    // Tâm con dấu theo toạ độ màn hình
    var r = seal.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;

    var ring = document.createElement('div');
    ring.className = 'fx-ring';
    ring.style.left = cx + 'px'; ring.style.top = cy + 'px';
    env.appendChild(ring);

    for (var i = 0; i < 16; i++) {
      var p = document.createElement('span');
      var ang = (Math.PI * 2 * i) / 16 + rnd(-.25, .25);
      var dist = rnd(90, 220);
      p.className = 'fx-burst';
      p.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;color:' + COLORS[i % 4] +
        ';font-size:' + rnd(10, 20) + 'px;--dx:' + Math.cos(ang) * dist + 'px;--dy:' + Math.sin(ang) * dist +
        'px;--rs:' + rnd(-30, 30) + 'deg;--re:' + rnd(-240, 240) + 'deg;animation-delay:' + rnd(0, .12) + 's';
      p.innerHTML = HEART;
      env.appendChild(p);
    }

    env.classList.add('opening');      // CSS: con dấu vỡ -> thiệp bay lên -> nền mờ dần
    btn.setAttribute('aria-busy', 'true');
    setTimeout(finish, 1800);
  }
  btn.addEventListener('click', openInvite);
})();

gsap.registerPlugin(ScrollTrigger);

// Trạng thái ban đầu: nắp gập xuống (đóng).
// Khi đóng, phần nhìn thấy của phong bì nằm ở ~57% phía dưới khung nên
// đẩy cả phong bì lên một chút để nó nằm giữa màn hình.
gsap.set(".envelope-flap", { rotateX: -180, zIndex: 8 });   // z 8 > thân trước (6): nắp đóng đè lên mặt trước
gsap.set(".envelope-wrapper", { yPercent: -21.5 });

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".envelope-section",
    start: "top top",   // Bắt đầu ngay từ pixel đầu tiên của trang
    end: "+=800",       // Quãng đường cuộn để hoàn tất hiệu ứng
    pin: true,          // Ghim màn hình lại khi mở phong bì
    scrub: true,        // Đồng bộ theo thao tác cuộn/vuốt
  },
});

// 1. Mở nắp: xoay quanh bản lề từ -180° (gập xuống) về 0° (dựng lên)
tl.to(".envelope-flap", { rotateX: 0, duration: 0.6, ease: "none" }, 0)

  // Khi nắp qua 90° (đứng thẳng) thì hạ xuống dưới ảnh/thân trước để ảnh trượt lên đè lên nắp
  .set(".envelope-flap", { zIndex: 1 }, 0.3)

  // Phong bì dịch xuống về giữa khung khi nắp mở ra
  .to(".envelope-wrapper", { yPercent: 0, duration: 1 }, 0)

  // 2. Trượt bức ảnh lên (vẫn còn một phần nằm trong túi phong bì)
  .to(".photo-inside", { yPercent: -48, scale: 1, duration: 1 }, 0.2)
  .to(".photo-wrap", { rotate: 12, duration: 1 }, 0.5) 
  .to(".flower-inside", { yPercent: -48, scale: 1, duration: 1 }, 0.2)


document.addEventListener('DOMContentLoaded', () => {
    let scrollTimer = null;
    let isScrolling = false;
    
    // CẤU HÌNH TỐC ĐỘ:
    const scrollSpeed = 5;     // Số pixel cuộn mỗi lần
    const scrollInterval = 16; // Thời gian giữa các nhịp cuộn ms (~60fps)

    function startScroll() {
      if (isScrolling) return;
      isScrolling = true;
      document.body.classList.add('auto-scrolling');

      scrollTimer = setInterval(() => {
        // Kiểm tra xem đã cuộn tới cuối trang chưa
        if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 2) {
          stopScroll();
        } else {
          window.scrollBy(0, scrollSpeed);
        }
      }, scrollInterval);
    }

    function stopScroll() {
      if (!isScrolling) return;
      isScrolling = false;
      clearInterval(scrollTimer);
      scrollTimer = null;
      document.body.classList.remove('auto-scrolling');
    }

    // 1. Lắng nghe sự kiện Click để Bật / Tắt
    document.addEventListener('click', (e) => {
      // ĐIỀU KIỆN 1: Không kích hoạt/tắt nếu click vào một DIV ngoại lệ (ví dụ: div có class là 'no-auto-scroll')
      // Bạn có thể thay '.no-auto-scroll' bằng ID (#my-div) hoặc class của thẻ div bạn muốn loại trừ
      if (e.target.closest('.no-auto-scroll')) {
        return;
      }

      // ĐIỀU KIỆN 2: Bỏ qua click nếu bấm vào các phần tử tương tác thông thường
      const interactiveElements = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'];
      if (e.target.closest(interactiveElements.join(','))) {
        return; 
      }

      if (isScrolling) {
        stopScroll();
      } else {
        startScroll();
      }
    });

    // 2. TỰ ĐỘNG HỦY KHI NGƯỜI DÙNG TỰ LĂN CHUỘT HOẶC DÙNG PHÍM
    const cancelEvents = ['wheel', 'touchmove', 'keydown'];
    
    cancelEvents.forEach(eventType => {
      window.addEventListener(eventType, (e) => {
        if (!isScrolling) return;

        // ĐIỀU KIỆN 3: Nếu sự kiện lăn chuột xảy ra BÊN TRONG div ngoại lệ thì BỎ QUA (không làm dừng cuộn trang chính)
        if (eventType === 'wheel' || eventType === 'touchmove') {
          if (e.target.closest('.no-auto-scroll')) {
            return; // Cho phép cuộn bên trong div đó bình thường mà không tắt auto-scroll của trang
          }
        }

        // Nếu là sự kiện bàn phím, chỉ hủy khi bấm các phím cuộn trang
        if (eventType === 'keydown') {
          const scrollKeys = ['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
          if (!scrollKeys.includes(e.code)) return;
        }

        stopScroll();
      }, { passive: true });
    });
  });




// ====== CHỈNH Ở ĐÂY ======
// img: URL hoặc data-URI ảnh của bạn (ảnh dọc/ngang/vuông đều được, tự lấy đúng tỉ lệ).
// Để trống sẽ dùng ảnh minh hoạ; khi đó ratio = rộng/cao.
var SLIDES=[{ img: "./images/couple/album1.webp"},{ img: "./images/couple/album2.webp"},{ img: "./images/couple/album3.webp"},{ img: "./images/couple/album4.webp"},{ img: "./images/couple/album5.webp"},{ img: "./images/couple/album6.webp"},{ img: "./images/couple/album7.webp"},{ img: "./images/couple/album8.webp"},{ img: "./images/couple/album9.webp"},{ img: "./images/couple/album10.webp"},{ img: "./images/couple/album11.webp"},{ img: "./images/couple/album12.webp"},{ img: "./images/couple/album13.webp"},{ img: "./images/couple/album14.webp"},{ img: "./images/couple/album15.webp"},];
var GRAYSCALE=false; // false để giữ nguyên màu ảnh
// =========================
var deck=document.getElementById("deck"),i=0,busy=false;
function rnd(a,b){return a+Math.random()*(b-a)}
function torn(){var p=[],n=26,j=1.3,k;
 for(k=0;k<=n;k++)p.push([k/n*100,rnd(0,j)]);
 for(k=1;k<=n;k++)p.push([100-rnd(0,j),k/n*100]);
 for(k=n-1;k>=0;k--)p.push([k/n*100,100-rnd(0,j)]);
 for(k=n-1;k>0;k--)p.push([rnd(0,j),k/n*100]);
 return"polygon("+p.map(function(a){return a[0].toFixed(2)+"% "+a[1].toFixed(2)+"%"}).join(",")+")"}
function art(s,n){
 if(s.img)return"url("+s.img+")";
 var g=[],h=40+n*23,c;
 for(c=0;c<7;c++)g.push("<rect x='"+rnd(0,380)+"' y='"+rnd(120,200)+"' width='"+rnd(14,40)+"' height='"+rnd(40,110)+"' fill='hsl(0,0%,"+rnd(8,30)+"%)'/>");
 var svg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 267' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='hsl("+h+",8%,78%)'/><stop offset='1' stop-color='hsl("+h+",8%,38%)'/></linearGradient></defs><rect width='400' height='267' fill='url(%23a)'/><circle cx='"+rnd(80,320)+"' cy='60' r='28' fill='hsl(0,0%,94%)' opacity='.8'/>"+g.join("")+"<rect y='215' width='400' height='52' fill='hsl(0,0%,14%)'/></svg>";
 return"url(\"data:image/svg+xml;utf8,"+svg.replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E")+"\")"}
// Đặt kích thước thẻ theo tỉ lệ ảnh, vừa trong khung deck
function fit(c){
 var p=parseFloat(getComputedStyle(c).paddingLeft)||0,bw=deck.clientWidth-2*p,bh=deck.clientHeight-2*p,r=c._r,w=Math.min(bw,bh*r);
 c.style.width=(w+2*p)+"px";c.style.height=(w/r+2*p)+"px"}
function fitAll(){cards.forEach(fit)}
var cards=SLIDES.map(function(s,n){
 var d=document.createElement("div");d.className="card";d.style.clipPath=torn();
 d._r=s.ratio||1.5;
 d.innerHTML="<div class='img'></div>";
 var im=d.firstChild;im.style.backgroundImage=s.img?"none":art(s,n);im.style.backgroundColor="#777";
 if(!GRAYSCALE)im.style.filter="none";
 d.dataset.r=rnd(-2.2,2.2).toFixed(2);d.dataset.x=rnd(-1,1).toFixed(2);d.dataset.y=rnd(-1,1).toFixed(2);
 deck.appendChild(d);return d});
// Vị trí nghỉ của ảnh đã lật: nằm tối ở bên trái, dưới chồng ảnh
// Tối ưu bộ nhớ: chỉ nạp ảnh gần slide hiện tại (KEEP ảnh mỗi bên), nạp lần lượt từng ảnh,
// thu nhỏ về tối đa MAXPX px (đã áp đen trắng sẵn), ảnh xa thì giải phóng. Ảnh gốc chỉ nạp khi phóng to.
var MAXPX=1100,KEEP=3,q=Promise.resolve();
function loadThumb(c,s){
 if(!s.img||c._st)return;c._st=1;
 q=q.then(function(){return new Promise(function(res){
  if(c._st!==1)return res();
  var im=new Image(),bg=c.firstChild;
  function use(u,own){if(c._st!==1){own&&URL.revokeObjectURL(u);return res()}
   c._u=own?u:null;bg.style.backgroundImage="url(\""+u+"\")";bg.style.filter=(own||!GRAYSCALE)?"none":"";c._st=2;fit(c);res()}
  if(!/^data:|^blob:/.test(s.img))im.crossOrigin="anonymous";
  im.onload=function(){var go=function(){
   var w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,MAXPX/Math.max(w,h)),cv=document.createElement("canvas"),x=cv.getContext("2d");
   c._r=w/h;cv.width=Math.round(w*k);cv.height=Math.round(h*k);
   var baked=GRAYSCALE&&"filter" in x;if(baked)x.filter="grayscale(1) contrast(1.1)";
   bg.style.filter=(baked||!GRAYSCALE)?"none":"";
   x.drawImage(im,0,0,cv.width,cv.height);
   try{cv.toBlob(function(b){b?use(URL.createObjectURL(b),1):use(s.img,0)},"image/jpeg",.85)}catch(e){use(s.img,0)}};im.decode?im.decode().then(go,go):go()};
  im.onerror=function(){
   if(im.crossOrigin){im.removeAttribute("crossorigin");im.src=s.img;return}
   bg.style.backgroundImage=art({},cards.indexOf(c));bg.style.filter="";c._st=2;
   console.warn("Không tải được ảnh:",s.img);res()};
  im.src=s.img})})}
function unload(c){
 if(!c._st)return;c._st=0;c.firstChild.style.backgroundImage="none";
 if(c._u){URL.revokeObjectURL(c._u);c._u=null}}
function manage(){
 var N=SLIDES.length,dist=function(n){var a=Math.abs(n-i);return Math.min(a,N-a)};
 cards.map(function(c,n){return n}).sort(function(a,b){return dist(a)-dist(b)}).forEach(function(n){
  if(dist(n)<=KEEP)loadThumb(cards[n],SLIDES[n]);else if(dist(n)>KEEP+1)unload(cards[n])})}
function rest(c){return{x:-105+(+c.dataset.x)*3,y:(+c.dataset.y)*8,a:-12+(+c.dataset.r)*3}}
function place(c,n){
 c.classList.toggle("front",n===i);
 c.style.visibility=(n-i>3||n-i<-3)?"hidden":"";
 var d=n-i,r=+c.dataset.r,x=+c.dataset.x,y=+c.dataset.y;
 if(d<0){var q=rest(c);c.classList.add("gone");c.style.zIndex=50+d;c.style.opacity=1;
  c.style.transform="translate("+q.x+"%,"+q.y+"%) rotate("+q.a+"deg)"}
 else{c.classList.remove("gone");c.style.zIndex=100-d;
  var s=Math.min(d,2);
  c.style.transform="translate("+(x+s*1.2)+"%,"+(y+s*1.6)+"%) rotate("+(r*(s?1.8:1)+s*0.8)+"deg)";
  c.style.opacity=d>2?0:1}}
// mv: thẻ đang bay. Next: trước -> trượt sang trái rồi chui xuống dưới. Prev: trượt từ trái sang lên trên cùng.
function layout(mv,loop){
 manage();
 var from=mv&&getComputedStyle(mv).transform;
 cards.forEach(function(c,n){
  if(c!==mv){if(c._a){c._a.cancel();c._a=null;c.style.transition=""}
   c.style.transitionDelay=loop?(3-Math.min(n,3))*70+"ms":"";place(c,n)}});
 if(!mv)return;
 var n=cards.indexOf(mv),under=loop||n<i,D=matchMedia("(prefers-reduced-motion:reduce)").matches?1:720;
 if(mv._a)mv._a.cancel();
 mv.style.transition="filter .6s";
 place(mv,n);
 var z=mv.style.zIndex,fin=mv.style.transform,kf=[{transform:from},{transform:fin}];
 if(loop){var q=rest(mv);mv.classList.add("gone");
  kf=[{transform:from,opacity:1},{transform:"translate("+q.x+"%,"+q.y+"%) rotate("+q.a+"deg)",opacity:0}]}
 mv.style.zIndex=200;
 mv._a=mv.animate(kf,{duration:D,easing:"cubic-bezier(.25,.8,.25,1)"});
 if(under)setTimeout(function(){if(mv._a)mv.style.zIndex=z},D*.4);
 mv._a.onfinish=function(){mv.style.zIndex=z;mv.style.transition="";mv._a=null}}
function text(){document.getElementById("count").textContent=(i+1)+"/"+SLIDES.length}
function go(n,drag){
 if(busy)return;busy=true;var mv=null,loop=0;
 n=(n+SLIDES.length)%SLIDES.length;
 if(n===0&&i===SLIDES.length-1){mv=cards[i];i=0;loop=1}
 else{mv=(drag&&n<i)?null:(n>i?cards[i]:cards[n]);i=n}
 layout(mv,loop);
 setTimeout(function(){text();busy=false;cards.forEach(function(c){c.style.transitionDelay=""})},380)}
document.getElementById("next").onclick=function(){go(i+1)};
document.getElementById("prev").onclick=function(){if(i>0)go(i-1)};
document.addEventListener("keydown",function(e){
 if(zoomed){if(e.key==="Escape")zoomClose();return}
 if(e.key==="ArrowRight")go(i+1);if(e.key==="ArrowLeft"&&i>0)go(i-1)});
// Kéo bằng ngón tay / chuột
var sx=null,dc=null,dm=null,dt=null,st=document.getElementById("stage");
function endDrag(e,cancel){
 if(sx===null)return;var dx=e.clientX-sx;sx=null;
 var c=dc,m=dm;dc=dm=null;
 if(!c){if(!cancel&&Math.abs(dx)<6&&dt&&cards[i].contains(dt))zoomOpen(cards[i]);return}
 c.style.transition="";
 if(!cancel&&m==="next"&&dx<-50)go(i+1,1);
 else if(!cancel&&m==="prev"&&dx>50)go(i-1,1);
 else if(m==="prev")layout(c);
 else place(c,i)}
st.addEventListener("pointerdown",function(e){if(busy||e.target.closest("button"))return;sx=e.clientX;dt=e.target});
window.addEventListener("pointermove",function(e){
 if(sx===null)return;var dx=e.clientX-sx;
 if(Math.abs(dx)<6)return;
 var m=dx<0?"next":(i>0?"prev":null);
 var c=m==="next"?cards[i]:m==="prev"?cards[i-1]:null;
 if(c!==dc){if(dc){dc.style.transition="";place(dc,cards.indexOf(dc))}
  dc=c;dm=m;if(c){c.style.transition="filter .3s";c.style.zIndex=200;c.classList.remove("gone");c.style.opacity=1}}
 if(!c)return;
 if(m==="next")c.style.transform="translate("+dx+"px,"+dx*.06+"px) rotate("+dx/28+"deg)";
 else{var q=rest(c),w=c.offsetWidth*Math.abs(q.x)/100,d2=Math.min(dx,w),p=d2/w;
  c.style.transform="translate(calc("+q.x+"% + "+d2+"px),"+q.y*(1-p)+"%) rotate("+q.a*(1-p)+"deg)"}});
window.addEventListener("pointerup",function(e){endDrag(e)});
window.addEventListener("pointercancel",function(e){endDrag(e,1)});
// Phóng to ảnh: bấm vào ảnh trên cùng; bấm bất kỳ đâu hoặc nhấn Esc để thu lại
var zoomed=null;
function flip(c,z,m){
 var r=c.getBoundingClientRect(),zr=z.getBoundingClientRect();
 return"translate("+(r.left+r.width/2-zr.left-zr.width/2)+"px,"+(r.top+r.height/2-zr.top-zr.height/2)+"px) rotate("+(+c.dataset.r)+"deg) scale("+c.offsetWidth/z.offsetWidth*(m||1)+")"}
var SH="drop-shadow(0 .6rem 1.4rem rgba(0,0,0,.55))",SH0="drop-shadow(0 0 0 rgba(0,0,0,0))";
function zoomOpen(c){
 if(zoomed)return;
 var ov=document.createElement("div"),w=document.createElement("div"),z=document.createElement("div"),im=document.createElement("div"),
 cr=c.offsetWidth/c.offsetHeight,cw=Math.min(innerWidth*.94,innerHeight*.9*cr),
 ps=cw*(parseFloat(getComputedStyle(c).paddingLeft)||0)/c.offsetWidth,
 D=matchMedia("(prefers-reduced-motion:reduce)").matches?1:450;
 ov.className = "no-auto-scroll";
 ov.style.cssText="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0);transition:background .35s;cursor:zoom-out;display:grid;place-items:center";
 w.style.cssText="display:block;filter:"+SH;
 z.style.cssText="width:"+cw+"px;height:"+cw/cr+"px;padding:"+ps+"px;background:#f1f1ee;box-sizing:border-box";
 z.style.clipPath=c.style.clipPath;
 im.style.cssText="width:100%;height:100%;background-size:cover;background-position:center";
 im.style.backgroundImage=c.firstChild.style.backgroundImage;
 im.style.filter=c.firstChild.style.filter||(GRAYSCALE?"grayscale(1) contrast(1.1)":"none");
 var si=SLIDES[cards.indexOf(c)];
 if(si.img){var hi=new Image();hi.onload=function(){var sw=function(){if(zoomed&&zoomed.c===c){im.style.backgroundImage="url(\""+si.img+"\")";im.style.filter=GRAYSCALE?"grayscale(1) contrast(1.1)":"none"}};hi.decode?hi.decode().then(sw,sw):sw()};hi.src=si.img}
 z.appendChild(im);w.appendChild(z);ov.appendChild(w);document.body.appendChild(ov);
 var from=flip(c,w),t=performance.now();
 w.animate([{transform:from,filter:SH0},{transform:"none",filter:SH}],{duration:D,easing:"cubic-bezier(.2,.8,.2,1)"});
 c.style.visibility="hidden";
 requestAnimationFrame(function(){ov.style.background="rgba(0,0,0,.9)"});
 ov.onclick=function(){if(performance.now()-t>350)zoomClose()};
 zoomed={c:c,ov:ov,w:w}}
// Thoát phóng to: ảnh rơi xuống đống ảnh, nảy nhẹ một nhịp rồi nằm yên
function zoomClose(){
 var o=zoomed;if(!o)return;zoomed=null;
 var D=matchMedia("(prefers-reduced-motion:reduce)").matches?1:400,land=flip(o.c,o.w),up=flip(o.c,o.w,1.06),up2=flip(o.c,o.w,1.015);
 o.ov.style.transition="background .22s";
 o.ov.style.background="rgba(0,0,0,0)";
 var a=o.w.animate([
  {transform:"none",filter:SH,easing:"cubic-bezier(.65,0,1,.55)"},
  {transform:land,filter:SH0,offset:.62,easing:"cubic-bezier(.2,.7,.4,1)"},
  {transform:up,filter:SH0,offset:.77,easing:"cubic-bezier(.6,0,1,.6)"},
  {transform:land,filter:SH0,offset:.89,easing:"cubic-bezier(.2,.7,.4,1)"},
  {transform:up2,filter:SH0,offset:.95,easing:"ease-in"},
  {transform:land,filter:SH0}],{duration:D,fill:"forwards"});
 a.onfinish=function(){o.c.style.visibility="";o.ov.remove()}}
window.addEventListener("resize",fitAll);
fitAll();layout();text();


// Đặt thời gian đếm ngược (Ví dụ: 2 ngày)

      // const countdownMinutes = 0.1;
      //   const countDownDate = new Date().getTime() + countdownMinutes * 60 * 1000;
        // Hoặc nếu muốn đặt mốc ngày cố định, hãy mở comment dòng dưới và sửa ngày:
         const countDownDate = new Date("Nov 29, 2026 10:00:00").getTime();

        // Cập nhật bộ đếm mỗi 1 giây
        const x = setInterval(function() {
            const now = new Date().getTime();
            const distance = countDownDate - now;

            // Tính toán Ngày, Giờ, Phút và Giây
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Hiển thị định dạng 2 chữ số (ví dụ: 02d : 05h : 09m : 05s)
            const displayDays = days < 10 ? "0" + days : days;
            const displayHours = hours < 10 ? "0" + hours : hours;
            const displayMinutes = minutes < 10 ? "0" + minutes : minutes;
            const displaySeconds = seconds < 10 ? "0" + seconds : seconds;

            document.getElementById("countdown").innerHTML = 
    `<div class="countdown-box">${displayDays}<span>Ngày</span></div>` +
    `<div class="countdown-box">${displayHours}<span>Giờ</span></div>` +
    `<div class="countdown-box">${displayMinutes}<span>Phút</span></div>` +
    `<div class="countdown-box">${displaySeconds}<span>Giây</span></div>`;

            // ĐIỀU KIỆN KHI BỘ ĐẾM NGƯỢC KẾT THÚC
            if (distance < 0) {
                clearInterval(x); // Dừng bộ đếm

                // Thay đổi tiêu đề (tùy chọn)
                document.getElementById("title").innerText = "TIỆC CƯỚI ĐANG DIỄN RA RỒI!!";

                // Thay thế thẻ đếm ngược thành thẻ text thông báo
                const countdownElem = document.getElementById("countdown");
                countdownElem.className = "event-ongoing center"; // Thêm class style mới
                countdownElem.innerText = "Đến chung vui với chúng tớ nhé ♥";
            }
        }, 1000);

// Đặt thanh highlight khớp với tab đang active mặc định (Tab 1)
window.addEventListener("DOMContentLoaded", () => {
    const indicator = document.getElementById("indicator");
    const firstBtn = document.querySelector(".tab-btn.active");
    if (indicator && firstBtn) {
        indicator.style.width = firstBtn.offsetWidth + "px";
        indicator.style.left = firstBtn.offsetLeft + "px";
    }
});
function openTab(evt, tabId) {
    // 1. Ẩn tất cả nội dung tab
    const contents = document.querySelectorAll(".tab-content");
    contents.forEach(content => content.classList.remove("active"));

    // 2. Xóa trạng thái active của tất cả các nút
    const buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach(btn => btn.classList.remove("active"));

    // 3. Hiển thị nội dung của tab được chọn và thêm class active cho nút tương ứng
    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");

    // 4. Cập nhật vị trí và độ rộng cho thanh highlight trượt (Indicator)
    const indicator = document.getElementById("indicator");
    const activeBtn = evt.currentTarget;
    if (indicator) {
        indicator.style.width = activeBtn.offsetWidth + "px";
        indicator.style.left = activeBtn.offsetLeft + "px";
    }
}

const store = {
  async getAll() {
    try {
      const r = await fetch('/api/comments', { cache: 'no-store' });
      if (!r.ok) throw new Error('api ' + r.status);
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    } catch {
      // Chạy local không có API: dùng tạm localStorage để vẫn xem thử được
      try { return JSON.parse(localStorage.getItem('guestbook') || '[]'); } catch { return []; }
    }
  },
  async add(item) {
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, msg: item.msg })
      });
      if (r.status === 429) throw new Error('Bạn gửi quá nhanh, vui lòng thử lại sau ít giây.');
      if (!r.ok) throw new Error('api ' + r.status);
    } catch (err) {
      if (String(err.message).startsWith('Bạn')) throw err;
      try {
        const all = JSON.parse(localStorage.getItem('guestbook') || '[]');
        all.push(item);
        localStorage.setItem('guestbook', JSON.stringify(all));
      } catch {}
    }
  }
};
/* ======================================================================================= */

const WISHES = [
  'Chúc tình yêu của hai bạn ngày càng nồng nàn, son sắt và thủy chung.',
  'Chúc cho cuộc sống hôn nhân của hai bạn luôn hòa hợp và bền chặt.',
  'Chúc hai bạn luôn tràn ngập yêu thương và hạnh phúc trong suốt quãng đời còn lại.',
  'Mong hai bạn xây dựng một mái ấm tràn đầy tiếng cười và niềm vui.',
  'Chúc hôn nhân của hai bạn là câu chuyện cổ tích đẹp đẽ kéo dài mãi mãi.',
  'Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long.',
  'Chúc vợ chồng mới cưới luôn gặp may mắn, sức khỏe và thành công.',
  'Chúc hai bạn luôn nắm chặt tay nhau qua mọi thăng trầm của cuộc sống.',
  'Chúc gia đình nhỏ của hai bạn luôn đầy ắp tiếng cười.',
  'Mong rằng mỗi ngày bên nhau đều là một ngày hạnh phúc của hai bạn.',
  'Chúc hai bạn sớm có tổ ấm thật nhiều niềm vui và tiếng trẻ thơ.',
  'Chúc tình yêu của hai bạn mãi vẹn tròn như ngày đầu.'
];

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const fmt = t => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

async function render() {
  const items = (await store.getAll()).slice().sort((a, b) => b.time - a.time);
  const list = $('list');
  list.replaceChildren();
  if (!items.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Hãy là người đầu tiên gửi lời chúc.';
    list.append(p);
    return;
  }
  for (const c of items) {
    const el = document.createElement('article');
    el.className = 'wish';
    const head = document.createElement('div');
    head.className = 'wish-head';
    const name = document.createElement('span');
    name.className = 'wish-name';
    name.textContent = c.name;            // textContent: tránh XSS
    const time = document.createElement('span');
    time.className = 'wish-time';
    time.textContent = fmt(c.time);
    head.append(name, time);
    const msg = document.createElement('p');
    msg.className = 'wish-msg';
    msg.textContent = c.msg;
    el.append(head, msg);
    list.append(el);
  }
}

$('form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const name = $('name').value.trim();
  const msg = $('msg').value.trim();
  if (!name || !msg) return;
  const btn = form.querySelector('.btn-send');
  btn.disabled = true;
  try {
    await store.add({ name, msg, time: Date.now() });
    form.reset();
    await render();
    $('list').scrollTop = 0;
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
});

/* ---- Bảng gợi ý ---- */
const dlg = $('dlg');

function pickFive() {
  const pool = WISHES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
}

function renderOptions() {
  const box = $('options');
  box.replaceChildren();
  for (const text of pickFive()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'option';
    b.textContent = text;
    b.addEventListener('click', () => {
      $('msg').value = text;
      dlg.close();
      $('msg').focus();
    });
    box.append(b);
  }
}

$('openSuggest').addEventListener('click', () => { renderOptions(); dlg.showModal(); });
$('more').addEventListener('click', renderOptions);
dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dlg.close()));
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // bấm ra ngoài để đóng

render();

// Hàm mở popup
    function openPopup() {
      document.getElementById("myPopup").style.display = "flex";
    }

    // Hàm đóng popup
    function closePopup() {
      document.getElementById("myPopup").style.display = "none";
    }

    // Đóng popup khi click ra vùng nền mờ bên ngoài
    function closePopupOnOverlay(event) {
      if (event.target === document.getElementById("myPopup")) {
        closePopup();
      }
    }


async function downloadLocalImage(imageSrc, filename) {
  const name = /\.\w+$/.test(filename) ? filename : filename + '.jpg';
  try {
    const response = await fetch(imageSrc);
    if (!response.ok) throw new Error('not found');
    const blob = await response.blob();
    const file = new File([blob], name, { type: blob.type || 'image/jpeg' });

    // Điện thoại: mở bảng chia sẻ để "Lưu vào Ảnh"
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: filename }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    window.open(imageSrc, '_blank'); // dự phòng: mở ảnh để nhấn giữ và lưu
  }
}
