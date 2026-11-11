/* Les Monges Palace — dirección de movimiento cinematográfica */
// Protección anti-marcos: nadie puede meter esta web dentro de otra
if (window.top !== window.self) window.top.location = window.self.location;
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tactil = matchMedia('(pointer: coarse)').matches;
  const G = typeof gsap !== 'undefined';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const tramo = (p, a, b) => clamp((p - a) / (b - a));
  const suave = t => t * t * (3 - 2 * t);
  const entraSale = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const P = n => `img/prof/${n}-prof.jpg`;

  /* ---------- Mirada: el ratón mueve la cámara (como girar la cabeza) ---------- */
  const mira = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    mira.tx = (e.clientX / innerWidth - .5) * 2; mira.ty = (e.clientY / innerHeight - .5) * 2;
  }, { passive: true });

  /* ---------- Desplazamiento suave ---------- */
  let lenis = null;
  if (G) gsap.registerPlugin(ScrollTrigger);
  if (typeof Lenis !== 'undefined' && !reducir) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .9 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  }
  const irA = (dest, op = {}) => lenis ? lenis.scrollTo(dest, op) : (typeof dest === 'number' ? scrollTo({ top: dest, behavior: 'smooth' }) : $(dest)?.scrollIntoView({ behavior: 'smooth' }));
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href'); if (h.length < 2 || !$(h)) return;
    e.preventDefault(); cerrarCortina(); irA(h, { duration: 1.6 });
  }));

  /* ---------- Cabecera y menú móvil ---------- */
  const cab = $('#cabecera'); let ultimaY = 0;
  const alScroll = y => { cab.classList.toggle('esconde', y > ultimaY && y > 200 && $('#cortina').hidden); ultimaY = y; };
  lenis ? lenis.on('scroll', ({ scroll }) => alScroll(scroll)) : addEventListener('scroll', () => alScroll(scrollY), { passive: true });
  const navBtn = $('#navMovil'), cortina = $('#cortina');
  function cerrarCortina() { cortina.hidden = true; navBtn.setAttribute('aria-expanded', 'false'); navBtn.textContent = 'Menú'; }
  navBtn.addEventListener('click', () => {
    const abre = cortina.hidden; cortina.hidden = !abre; navBtn.setAttribute('aria-expanded', abre); navBtn.textContent = abre ? 'Cerrar' : 'Menú';
    if (abre && G) gsap.from('#cortina a', { yPercent: 60, opacity: 0, stagger: .05, duration: .7, ease: 'power3.out' });
  });

  /* ---------- Capítulos: aparecen y se van según el avance ---------- */
  function pintarCapitulos(esc, p) {
    $$('.capitulo', esc).forEach(c => {
      const de = +c.dataset.de, a = +c.dataset.a, f = .045;
      const o = Math.min(de <= 0 ? 1 : tramo(p, de, de + f), a >= 1 ? 1 : 1 - tramo(p, a - f, a));
      const op = clamp(o);
      c.style.opacity = op; c.style.visibility = op > 0 ? 'visible' : 'hidden';
      c.style.transform = `translateY(${(1 - op) * 30}px)`;
      c.style.filter = op < .6 ? `blur(${(.6 - op) * 10}px)` : 'none';
    });
  }

  /* ---------- 1. LA ENTRADA ---------- */
  const entrada = $('#entrada'), lienzoE = $('#lienzoEntrada'), timbre = $('#timbre');
  const PUERTA = [.309, .80], FOCO = innerWidth < innerHeight ? [.4, .62] : [.31, .9];
  let escE = null, fachada = null, salon = null, pE = 0, entradaVisible = true;
  function progresoDe(sec) {
    const r = sec.getBoundingClientRect(), rec = r.height - innerHeight;
    return rec > 0 ? clamp(-r.top / rec) : 0;
  }
  function puntoEnPantalla(img, uv) {
    const W = innerWidth, H = innerHeight, rs = W / H, ri = img[0] / img[1];
    const s = rs > ri ? [1, ri / rs] : [rs / ri, 1];
    const f = [0, 1].map(k => clamp(FOCO[k], s[k] / 2, 1 - s[k] / 2));
    return [((uv[0] - f[0]) / s[0] + .5) * W, ((uv[1] - f[1]) / s[1] + .5) * H];
  }
  function pintarEntrada(t) {
    const p = pE;
    if (escE && fachada) {
      const a = entraSale(tramo(p, 0, .5));
      fachada.push = a * 3.4;
      fachada.luz = suave(tramo(p, .28, .5)) * .95;
      fachada.alfa = 1 - suave(tramo(p, .45, .54));
      salon.alfa = suave(tramo(p, .45, .54));
      salon.push = .04 + entraSale(tramo(p, .45, 1)) * .22;
      salon.luz = (1 - suave(tramo(p, .47, .66))) * .8;
      salon.oscuro = suave(tramo(p, .78, .92)) * .45;
      const sx = tactil ? Math.sin(t * .0004) * .6 : mira.x, sy = tactil ? Math.cos(t * .0003) * .3 : mira.y;
      escE.pintar(sx, sy, t * .001);
    }
    // botón sobre la puerta
    const [x, y] = puntoEnPantalla(fachada ? fachada.tam : [1080, 978], PUERTA);
    timbre.style.left = x + 'px'; timbre.style.top = y + 'px';
    const vt = 1 - tramo(p, .02, .07);
    timbre.style.opacity = vt; timbre.style.pointerEvents = vt > .5 ? 'auto' : 'none';
    $('#pista').style.opacity = 1 - tramo(p, 0, .04);
    $('#reglaBarra').style.transform = `scaleY(${p})`;
    pintarCapitulos(entrada, p);
  }
  timbre.addEventListener('click', () => {
    const fin = entrada.offsetTop + (entrada.offsetHeight - innerHeight) * .9;
    irA(fin, { duration: 6.5, easing: t => entraSale(t) });
  });

  /* ---------- 4 y 6. Escenas de foto en 3D (azotea, Alicante) ---------- */
  const escenas = $$('.escena-foto').map(sec => ({ sec, lienzo: $('canvas', sec), foto: sec.dataset.foto, centro: sec.dataset.centro.split(',').map(Number), esc: null, capa: null, p: 0, visible: false }));

  /* ---------- Bucle de dibujo (solo lo que se ve) ---------- */
  const vis = new IntersectionObserver(es => es.forEach(e => {
    if (e.target === entrada) entradaVisible = e.isIntersecting;
    const s = escenas.find(x => x.sec === e.target); if (s) s.visible = e.isIntersecting;
  }));
  vis.observe(entrada); escenas.forEach(s => vis.observe(s.sec));
  function bucle(t) {
    mira.x += (mira.tx - mira.x) * .06; mira.y += (mira.ty - mira.y) * .06;
    if (entradaVisible) { pE = progresoDe(entrada); pintarEntrada(t); }
    escenas.forEach(s => {
      if (!s.visible) return;
      s.p = progresoDe(s.sec);
      if (s.esc && s.capa) {
        s.capa.push = .03 + entraSale(s.p) * .3;
        s.capa.oscuro = .1 + suave(tramo(s.p, .55, 1)) * .25;
        s.esc.pintar(tactil ? Math.sin(t * .0004) * .6 : mira.x, tactil ? 0 : mira.y, t * .001);
      }
      pintarCapitulos(s.sec, s.p);
    });
    if (visorAbierto) pintarVisor(t);
    requestAnimationFrame(bucle);
  }

  /* ---------- 2. HABITACIONES (fotos reales; número = su azulejo) ---------- */
  const HAB = [
    { id: 'sup', num: 301, nombre: 'Doble SUP', cap: 'Para 2 personas', desc: 'Más amplia que la standard y con más detalles de la casa. Algunas, en la última planta, conservan las vigas de madera.', inc: ['Cama doble', 'Más espacio', 'Baño privado', 'Caja fuerte'], fotos: 4 },
    { id: 'junior', num: 300, nombre: 'Junior', cap: 'Para 2 personas', desc: 'En lo alto de la casa, bajo las vigas: ducha abierta con azulejo de flores y bañera exenta dentro de la habitación.', inc: ['Bañera exenta', 'Ducha abierta', 'Vigas de madera'], fotos: 3 },
    { id: 'hidro', num: 101, nombre: 'Doble deluxe hidro', cap: 'Para 2 personas', desc: 'Para una escapada en pareja: la doble deluxe con bañera de hidromasaje.', inc: ['Hidromasaje', 'Cama doble', 'Secador'], fotos: 4 },
    { id: 'familiar', num: 302, nombre: 'Familiar', cap: 'Para familias', desc: 'La habitación grande de la última planta, con vigas de madera, zona de estar y baño privado.', inc: ['Zona de estar', 'Vigas de madera', 'Cuna bajo petición'], fotos: 4 },
    { id: 'standard', num: 111, nombre: 'Doble standard', cap: 'Para 2 personas', desc: 'La doble de la casa: cómoda, luminosa y con baño privado.', inc: ['Cama doble', 'Baño privado', 'Wifi gratis'], fotos: 4 },
    { id: 'triple', num: 100, nombre: 'Triple', cap: 'Para 3 personas', desc: 'Tres camas y sitio para las maletas de todos. Para amigos o familias pequeñas.', inc: ['Tres camas', 'Baño privado', 'Cuna bajo petición'], fotos: 4 },
    { id: 'dui', num: 204, nombre: 'DUI', cap: 'Doble de uso individual', desc: 'Una doble para una sola persona: más espacio y cama grande.', inc: ['Cama de matrimonio', 'Baño privado', 'Caja fuerte'], fotos: 4 },
    { id: 'individual', num: 109, nombre: 'Individual', cap: 'Para 1 persona', desc: 'Pensada para viajar solo: cama individual, escritorio y baño privado con ducha.', inc: ['Cama individual', 'Ducha', 'Escritorio'], fotos: 4 },
  ];
  const fotoHab = (h, i) => `img/hab-${h.id}-${i + 1}.jpg`;
  const vitrina = $('#vitrina');
  HAB.forEach((h, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'puerta-hab'; b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', `Ver la habitación ${h.nombre} en 3D`);
    b.innerHTML = `<span class="marco-foto"><img src="${fotoHab(h, 0)}" alt="" width="1080" height="720" loading="lazy"><img class="foto-b" src="${fotoHab(h, 1)}" alt="" width="1080" height="720" loading="lazy"><span class="brillo"></span><span class="pincel"></span><span class="azulejo">${h.num}</span><span class="entrar-hab">Entrar en 3D</span></span><span class="nombre-hab">${h.nombre}</span><span class="cap-hab">${h.cap}</span>`;
    b.addEventListener('click', () => abrirVisor(i, b));
    if (!tactil && G) {
      const m = $('.marco-foto', b);
      const rx = gsap.quickTo(m, 'rotateX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(m, 'rotateY', { duration: .6, ease: 'power3' });
      b.addEventListener('pointermove', e => {
        const r = m.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        rx((.5 - ny) * 14); ry((nx - .5) * 16);
        m.style.setProperty('--x', nx * 100 + '%'); m.style.setProperty('--y', ny * 100 + '%');
      });
      b.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
    vitrina.appendChild(b);
  });

  /* ventana de la habitación: fotos reales + recorrido 3D */
  const visor = $('#visor');
  let visorAbierto = false, actual = 0, fotoAct = 0, origen = null, sala = null, salaMod = null;
  const pintarVisor = () => {};
  function ponerFoto(k) {
    const h = HAB[actual]; fotoAct = (k + h.fotos) % h.fotos;
    const a = $('#galFoto'), b = $('#galFoto2'), src = fotoHab(h, fotoAct);
    $$('#visorFotos button').forEach((x, j) => x.setAttribute('aria-pressed', j === fotoAct));
    a.alt = `Habitación ${h.nombre}, foto ${fotoAct + 1} de ${h.fotos}`;
    if (G && !reducir) { b.src = a.src; gsap.set(b, { opacity: 1 }); a.src = src; gsap.fromTo(a, { scale: 1.06 }, { scale: 1, duration: 1.2, ease: 'power3.out' }); gsap.to(b, { opacity: 0, duration: .6 }); }
    else a.src = src;
  }
  function ponerHab(i) {
    cerrarSala();
    actual = (i + HAB.length) % HAB.length; const h = HAB[actual];
    $('#visorNum').textContent = h.num; $('#visorNombre').textContent = 'Habitación ' + h.nombre;
    $('#visorCap').textContent = h.cap; $('#visorDesc').textContent = h.desc;
    $('#visorInc').innerHTML = h.inc.map(x => `<li>${x}</li>`).join('');
    const fotos = $('#visorFotos'); fotos.innerHTML = '';
    for (let k = 0; k < h.fotos; k++) {
      const b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', `Ver foto ${k + 1}`);
      b.innerHTML = `<img src="${fotoHab(h, k)}" alt="" width="1080" height="720">`;
      b.addEventListener('click', () => ponerFoto(k));
      fotos.appendChild(b);
    }
    if (G && !reducir) gsap.fromTo('.visor-info > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .7, ease: 'power3.out' });
    ponerFoto(0);
  }
  $('#galAnt').addEventListener('click', () => ponerFoto(fotoAct - 1));
  $('#galSig').addEventListener('click', () => ponerFoto(fotoAct + 1));
  // deslizar con el dedo entre fotos
  let toque = null;
  $('#galeria').addEventListener('pointerdown', e => { toque = e.clientX; });
  $('#galeria').addEventListener('pointerup', e => { if (toque !== null && Math.abs(e.clientX - toque) > 50) ponerFoto(fotoAct + (e.clientX < toque ? 1 : -1)); toque = null; });

  // recorrido 3D (se carga solo cuando se pide)
  async function abrirSala() {
    const cont = $('#sala'); cont.hidden = false; visor.classList.add('en-3d');
    if (G && !reducir) gsap.fromTo(cont, { opacity: 0 }, { opacity: 1, duration: .6 });
    try {
      salaMod = salaMod || await import('./sala3d.js');
      if (sala) sala.destruir();
      sala = salaMod.crearSala($('#lienzoSala'), HAB[actual].id, m => {
        $('#modoMaqueta').setAttribute('aria-pressed', m === 'maqueta'); $('#modoCaminar').setAttribute('aria-pressed', m === 'caminar');
        $('#salaAyuda').textContent = m === 'maqueta' ? 'Arrastra para girar la maqueta · rueda para acercarte' : (tactil ? 'Mueve el mando para andar · arrastra para mirar' : 'Flechas o WASD para andar · arrastra para mirar');
        $('#mando').hidden = m !== 'caminar' || !tactil;
      });
    } catch (e) { $('#salaAyuda').textContent = 'Tu navegador no puede mostrar el 3D. Puedes ver las fotos.'; }
  }
  function cerrarSala() { if (sala) { sala.destruir(); sala = null; } $('#sala').hidden = true; visor.classList.remove('en-3d'); }
  $('#abrirSala').addEventListener('click', abrirSala);
  $('#volverFotos').addEventListener('click', cerrarSala);
  $('#modoMaqueta').addEventListener('click', () => sala && sala.modo('maqueta'));
  $('#modoCaminar').addEventListener('click', () => sala && sala.modo('caminar'));
  // mando táctil para andar
  const mando = $('#mando'), bola = $('#mandoBola'); let mandoId = null;
  const moverMando = e => { const r = mando.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2; let x = (e.clientX - cx) / R, y = (e.clientY - cy) / R; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } bola.style.transform = `translate(${x * R * .6}px,${y * R * .6}px)`; if (sala) { sala.joy.x = x; sala.joy.y = y; } };
  mando.addEventListener('pointerdown', e => { mandoId = e.pointerId; mando.setPointerCapture(e.pointerId); moverMando(e); e.stopPropagation(); });
  mando.addEventListener('pointermove', e => { if (e.pointerId === mandoId) moverMando(e); });
  ['pointerup', 'pointercancel'].forEach(n => mando.addEventListener(n, () => { mandoId = null; bola.style.transform = ''; if (sala) { sala.joy.x = 0; sala.joy.y = 0; } }));

  function abrirVisor(i, desde) {
    origen = desde; visor.hidden = false; visorAbierto = true; lenis && lenis.stop(); document.body.style.overflow = 'hidden';
    if (G && !reducir && desde) {
      const r = $('.marco-foto', desde).getBoundingClientRect();
      gsap.fromTo(visor, { clipPath: `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 2px)` }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1.1, ease: 'expo.inOut' });
    }
    ponerHab(i);
    $('#visorCerrar').focus();
  }
  function cerrarVisor() {
    cerrarSala();
    const fin = () => { visor.hidden = true; visorAbierto = false; lenis && lenis.start(); document.body.style.overflow = ''; origen && origen.focus(); };
    if (G && !reducir && origen) {
      const r = $('.marco-foto', origen).getBoundingClientRect();
      gsap.to(visor, { clipPath: `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 2px)`, duration: .9, ease: 'expo.inOut', onComplete: fin });
    } else fin();
  }
  $('#visorCerrar').addEventListener('click', cerrarVisor);
  $('#visorAnt').addEventListener('click', () => ponerHab(actual - 1));
  $('#visorSig').addEventListener('click', () => ponerHab(actual + 1));
  addEventListener('keydown', e => {
    if (!visorAbierto) return;
    if (e.key === 'Escape') { if (sala) cerrarSala(); else cerrarVisor(); }
    if (sala) return; // en 3D las flechas sirven para andar
    if (e.key === 'ArrowRight') ponerFoto(fotoAct + 1);
    if (e.key === 'ArrowLeft') ponerFoto(fotoAct - 1);
  });

  /* ---------- Textos: palabra a palabra y subidas ---------- */
  function partirPalabras(el) {
    const txt = el.textContent.trim().split(/\s+/);
    el.innerHTML = txt.map(w => `<span class="palabra"><span>${w}</span></span>`).join(' ');
    return $$('.palabra > span', el);
  }
  if (G && !reducir) {
    $$('[data-palabras]').forEach(el => {
      const ps = partirPalabras(el);
      gsap.fromTo(ps, { yPercent: 110, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    $$('[data-sube]').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
    gsap.fromTo('.puerta-hab', { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: .08, ease: 'expo.out', clearProps: 'opacity,transform', scrollTrigger: { trigger: '#vitrina', start: 'top 85%' } });
    // contadores
    $$('[data-cuenta]').forEach(el => {
      const fin = +el.dataset.cuenta, o = { v: 0 };
      gsap.to(o, { v: fin, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => el.textContent = o.v.toFixed(1).replace('.', ',') });
    });
    // HISTORIA: fotos en capas a distinta profundidad; la cámara las atraviesa
    // y al final el salón se abre hasta llenar la pantalla
    const capasFotos = $$('.foto-capa[data-prof]');
    const th = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#historia', start: 'top top', end: '+=300%', pin: true, scrub: 1 } });
    th.fromTo('.capas-fondo', { xPercent: 5 }, { xPercent: -55, duration: 1 }, 0);
    capasFotos.forEach(f => {
      const d = +f.dataset.prof;
      th.fromTo(f, { y: () => innerHeight * .28 * d, scale: .9 + d * .02, rotateX: 8 }, { y: () => -innerHeight * .26 * d, scale: 1 + d * .05, rotateX: -6, duration: 1 }, 0);
      th.fromTo($('img', f), { yPercent: -9 }, { yPercent: 9, duration: 1 }, 0);
    });
    const textoCapa = (sel, a, b) => {
      th.fromTo(sel, { autoAlpha: 0, y: 40, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .07 }, a);
      th.to(sel, { autoAlpha: 0, y: -30, filter: 'blur(8px)', duration: .06 }, b);
    };
    textoCapa('.ct-1', 0, .26); textoCapa('.ct-2', .3, .52); th.fromTo('.ct-3', { autoAlpha: 0, y: 40, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .07 }, .56);
    if (!tactil) {
      const marcos = $$('.foto-capa[data-prof] .foto-marco').map(m => ({ m, d: +m.parentNode.dataset.prof, x: gsap.quickTo(m, 'x', { duration: .9, ease: 'power3' }), y: gsap.quickTo(m, 'y', { duration: .9, ease: 'power3' }), r: gsap.quickTo(m, 'rotateY', { duration: .9, ease: 'power3' }) }));
      $('#capas').addEventListener('mousemove', e => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        marcos.forEach(o => { o.x(-nx * 40 * o.d); o.y(-ny * 30 * o.d); o.r(nx * 6 * o.d); });
      });
    }
    // DESAYUNO: la cámara entra por el túnel de fotos hasta llenar la pantalla
    const tt = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#desayuno', start: 'top top', end: '+=280%', pin: true, scrub: 1 } });
    $$('.t-foto').forEach((f, i) => {
      const r = f.getBoundingClientRect(), cx = r.left + r.width / 2 - innerWidth / 2, cy = r.top - $('#tunel').getBoundingClientRect().top + r.height / 2 - innerHeight / 2;
      tt.fromTo(f, { x: 0, y: 0, scale: 1, rotate: (i % 2 ? 3 : -3) }, { x: cx * 1.6, y: cy * 1.6, scale: 2.6, rotate: 0, duration: .7 }, i * .025)
        .to(f, { opacity: 0, duration: .15 }, .55 + i * .02)
        .fromTo($('img', f), { scale: 1.2 }, { scale: 1, duration: .7 }, 0);
    });
    tt.fromTo('.tunel-titulo', { scale: .9, opacity: 1 }, { scale: 1.7, opacity: 0, duration: .35 }, 0)
      .fromTo('.t-centro', { scale: 1 }, { scale: () => { const r = $('.t-centro').getBoundingClientRect(); return Math.max(innerWidth / r.width, innerHeight / r.height) * 1.04; }, borderRadius: 0, duration: .7 }, .05)
      .fromTo('.t-centro img', { scale: 1.3 }, { scale: 1, duration: .75 }, 0)
      .to('.tunel', { '--velo': 1, duration: .15 }, .72)
      .fromTo('.tunel-texto', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: .15 }, .76)
      .to({}, { duration: .1 });
    // Fotos que se mueven dentro de su marco al bajar
    $$('.foto-viva img').forEach(img => gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));
    // pie: el nombre crece
    gsap.fromTo('.pie-nombre', { yPercent: 40, scale: .9 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.pie', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    // botones magnéticos
    if (!tactil) $$('.boton-luz, .timbre, .reservar').forEach(b => {
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .3, duration: .5, ease: 'power3.out' }); });
      b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: .8, ease: 'power3.out' }));
    });
  } else $$('[data-sube]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });

  /* ---------- Carga: prepara las escenas 3D y abre el telón ---------- */
  async function iniciar() {
    const num = $('#cargaNum'), barra = $('#cargaBarra');
    let hecho = 0; const total = 2 + escenas.length;
    const paso = () => { hecho++; const v = Math.round(hecho / total * 100); num.textContent = v; barra.style.transform = `scaleX(${hecho / total})`; };
    try {
      escE = new Escena3D(lienzoE);
      salon = await escE.capa({ foto: 'img/salon-1.jpg', prof: P('salon-1'), centro: [.78, .52], fuerza: .018 }); salon.alfa = 0; paso();
      fachada = await escE.capa({ foto: 'img/fachada.jpg', prof: P('fachada'), centro: PUERTA, fuerza: .016, foco: FOCO });
      escE.capas.reverse(); paso();
    } catch { $('.escenario', entrada).classList.add('sin-gl'); paso(); paso(); }
    await Promise.all(escenas.map(async s => {
      try { s.esc = new Escena3D(s.lienzo); s.capa = await s.esc.capa({ foto: `img/${s.foto}.jpg`, prof: P(s.foto), centro: s.centro, fuerza: .016 }); }
      catch { $('.escenario', s.sec).classList.add('sin-gl'); }
      paso();
    }));
    requestAnimationFrame(bucle);
    const carga = $('#carga');
    if (G && !reducir) {
      const tl = gsap.timeline();
      tl.to('.carga-nombre span', { yPercent: -110, stagger: .06, duration: .7, ease: 'power3.in' }, '+=.2')
        .to(carga, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=.2')
        .set(carga, { display: 'none' })
        .fromTo('.titulo-gigante .linea', { yPercent: 105 }, { yPercent: 0, duration: 1.4, stagger: .12, ease: 'expo.out' }, '-=.55')
        .from('.sobre, .bajada', { opacity: 0, y: 20, duration: 1, stagger: .1 }, '-=1.1')
        .from(timbre, { scale: 0, duration: .9, ease: 'back.out(1.6)' }, '-=.8');
      gsap.from('.carga-nombre span', { yPercent: 110, stagger: .08, duration: .9, ease: 'expo.out' });
    } else carga.style.display = 'none';
    if (G) ScrollTrigger.refresh();
  }
  iniciar();
})();
