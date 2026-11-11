/* Recorrido 3D de las habitaciones del Hotel Les Monges.
   Cada habitación se construye a escala (metros) a partir de lo que se ve en
   sus fotos reales: techo de vigas, suelo, camas, bañera… Es una recreación
   orientativa, no un plano exacto. Dos modos: «Maqueta» (vista desde arriba
   sin techo, girando) y «Caminar» (en primera persona, moviéndote libre). */
import * as THREE from './vendor/three.module.min.js';

/* ---------- texturas hechas a mano en canvas ---------- */
function lienzo(w, h, pinta) { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
const azar = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
function texMadera(tono = [176, 128, 84]) {
  return lienzo(1024, 1024, (x, w, h) => {
    const r = azar(7), filas = 8;
    for (let i = 0; i < filas; i++) {
      let px = -r() * 400;
      while (px < w) {
        const largo = 300 + r() * 380, k = .82 + r() * .3;
        x.fillStyle = `rgb(${tono[0] * k | 0},${tono[1] * k | 0},${tono[2] * k | 0})`;
        x.fillRect(px, i * h / filas, largo, h / filas);
        x.globalAlpha = .08;
        for (let v = 0; v < 14; v++) { x.fillStyle = r() > .5 ? '#2a170c' : '#fff3e0'; x.fillRect(px, i * h / filas + r() * h / filas, largo, 1 + r() * 2); }
        x.globalAlpha = .35; x.fillStyle = '#3a2412'; x.fillRect(px, i * h / filas, 2, h / filas); x.globalAlpha = 1;
        px += largo;
      }
      x.fillStyle = 'rgba(40,24,12,.45)'; x.fillRect(0, i * h / filas, w, 2);
    }
  });
}
function texHidraulico() {
  return lienzo(512, 512, (x, w) => {
    const n = 4, t = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const ox = i * t, oy = j * t;
      x.fillStyle = '#e9e1d2'; x.fillRect(ox, oy, t, t);
      x.fillStyle = '#7d8f86'; x.beginPath(); x.arc(ox + t / 2, oy + t / 2, t * .34, 0, 7); x.fill();
      x.fillStyle = '#e9e1d2'; x.beginPath(); x.arc(ox + t / 2, oy + t / 2, t * .2, 0, 7); x.fill();
      x.fillStyle = '#b8654a';
      [[0, 0], [t, 0], [0, t], [t, t]].forEach(([a, b]) => { x.beginPath(); x.arc(ox + a, oy + b, t * .22, 0, 7); x.fill(); });
      x.fillStyle = '#c9a85f'; x.beginPath(); x.arc(ox + t / 2, oy + t / 2, t * .07, 0, 7); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.12)'; x.strokeRect(ox, oy, t, t);
    }
  });
}
function texFlores() {
  return lienzo(512, 512, (x, w, h) => {
    x.fillStyle = '#f2ebe2'; x.fillRect(0, 0, w, h);
    const r = azar(11), cols = ['#d4577a', '#e8a33d', '#4e8fb8', '#6aa36f', '#c7483f'];
    for (let i = 0; i < 260; i++) { x.strokeStyle = cols[i % cols.length]; x.lineWidth = 2 + r() * 3; x.beginPath(); const a = r() * w, b = r() * h; x.ellipse(a, b, 8 + r() * 18, 4 + r() * 8, r() * 3, 0, 6.3); x.stroke(); }
  });
}
function texPared(base) {
  return lienzo(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); const r = azar(3); for (let i = 0; i < 1800; i++) { x.fillStyle = r() > .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)'; x.fillRect(r() * w, r() * h, 2, 2); } });
}
function texCuadro() {
  return lienzo(256, 340, (x, w, h) => {
    x.fillStyle = '#1d1712'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#5a3d2a'; x.beginPath(); x.ellipse(w / 2, h * .42, w * .2, h * .16, 0, 0, 7); x.fill();
    x.fillStyle = '#c99b7c'; x.beginPath(); x.ellipse(w / 2, h * .4, w * .13, h * .11, 0, 0, 7); x.fill();
    x.fillStyle = '#2f2a3a'; x.beginPath(); x.moveTo(w * .2, h); x.quadraticCurveTo(w / 2, h * .5, w * .8, h); x.fill();
  });
}

/* ---------- habitaciones (medidas aproximadas, en metros) ---------- */
export const SALAS = {
  individual: { an: 2.7, fo: 3.5, al: 2.9, pared: '#ece8df', acento: '#ece8df', suelo: 'madera', techo: 'plano', camas: [{ t: 'ind', x: -.65, z: -.55 }], extra: ['escritorio', 'tv'], banio: 'ducha' },
  dui: { an: 3.3, fo: 3.9, al: 3, pared: '#e9e6de', acento: '#3f5d58', suelo: 'madera', techo: 'plano', camas: [{ t: 'doble', x: 0, z: -.7 }], extra: ['cuadro', 'tv', 'butaca'], banio: 'ducha' },
  standard: { an: 3.3, fo: 3.7, al: 3, pared: '#e7e4dc', acento: '#33504c', suelo: 'madera', techo: 'plano', camas: [{ t: 'doble', x: 0, z: -.7 }], extra: ['cuadro', 'tv'], banio: 'ducha' },
  sup: { an: 3.8, fo: 4.3, al: 3.1, pared: '#f0ede6', acento: '#f0ede6', suelo: 'madera', techo: 'vigas', camas: [{ t: 'doble', x: .3, z: -.85 }], extra: ['cuadro', 'alfombra', 'puf', 'tv', 'claraboya'], banio: 'ducha' },
  hidro: { an: 3.5, fo: 4.1, al: 3, pared: '#eae6dd', acento: '#eae6dd', suelo: 'madera', techo: 'plano', camas: [{ t: 'doble', x: 0, z: -.75 }], extra: ['tv', 'cuadro'], banio: 'hidro' },
  junior: { an: 4.4, fo: 4.8, al: 3.2, pared: '#f0ede6', acento: '#f0ede6', suelo: 'hidraulico', techo: 'vigas', camas: [{ t: 'doble', x: -.6, z: -1 }], extra: ['banera', 'ducha-flores', 'cuadro', 'claraboya'], banio: 'abierto' },
  triple: { an: 4, fo: 4.2, al: 3, pared: '#ece9e1', acento: '#ece9e1', suelo: 'madera', techo: 'plano', camas: [{ t: 'ind', x: -1.15, z: -.7 }, { t: 'ind', x: 0, z: -.7 }, { t: 'ind', x: 1.15, z: -.7 }], extra: ['tv'], banio: 'ducha' },
  familiar: { an: 4.6, fo: 5, al: 3.2, pared: '#f0ede6', acento: '#f0ede6', suelo: 'madera', techo: 'vigas', camas: [{ t: 'doble', x: .7, z: -1.1 }], extra: ['sofa', 'tv', 'cuadro', 'claraboya'], banio: 'ducha' },
};

export function crearSala(lienzoEl, id, onModo) {
  const S = SALAS[id];
  const r = new THREE.WebGLRenderer({ canvas: lienzoEl, antialias: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.3;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const esc = new THREE.Scene(); esc.background = new THREE.Color('#0c110e');
  const cam = new THREE.PerspectiveCamera(70, 1, .05, 60);
  const M = (o) => new THREE.MeshStandardMaterial(o);
  const caja = (w, h, d, mat, x, y, z, padre = esc) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; padre.add(m); return m; };
  const solidos = []; // cajas para no atravesar muebles al caminar
  const solido = (x, z, w, d) => solidos.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const W = S.an, D = S.fo, H = S.al, hw = W / 2, hd = D / 2;
  const techoObjs = [], tapanMaqueta = [];

  // luz
  esc.add(new THREE.HemisphereLight('#fff8ec', '#8a7a68', 1.35));
  const sol = new THREE.DirectionalLight('#ffe9cc', 2.4); sol.position.set(-hw - 2, H + 1.5, 1); sol.target.position.set(0, 0, -.5);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); sol.shadow.bias = -.0005;
  esc.add(sol, sol.target);

  // suelo
  const tSuelo = S.suelo === 'madera' ? texMadera() : texHidraulico();
  tSuelo.repeat.set(S.suelo === 'madera' ? W / 2.2 : W / 1.2, S.suelo === 'madera' ? D / 2.2 : D / 1.2);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M({ map: tSuelo, roughness: S.suelo === 'madera' ? .55 : .35 }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; esc.add(suelo);

  // paredes (la del cabecero puede ir en color de acento)
  const tPared = texPared(S.pared), tAcento = texPared(S.acento);
  const paredes = {};
  const pared = (k, w, h, x, z, ry, tex, nx, nz) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ map: tex, roughness: .95, side: THREE.DoubleSide })); m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true; esc.add(m); paredes[k] = { m, x, z, nx, nz, cosas: [] }; return m; };
  pared('fondo', W, H, 0, -hd, 0, tAcento, 0, 1);
  pared('frente', W, H, 0, hd, Math.PI, tPared, 0, -1);
  pared('izq', D, H, -hw, 0, Math.PI / 2, tPared, 1, 0);
  pared('der', D, H, hw, 0, -Math.PI / 2, tPared, -1, 0);
  const colgar = (k, ...o) => paredes[k].cosas.push(...o);
  // zócalo
  const zoc = M({ color: '#d9d2c4', roughness: .7 });
  caja(W, .1, .02, zoc, 0, .05, -hd + .01); caja(W, .1, .02, zoc, 0, .05, hd - .01); caja(.02, .1, D, zoc, -hw + .01, .05, 0); caja(.02, .1, D, zoc, hw - .01, .05, 0);

  // ventana con balcón de forja (pared izquierda) y luz
  const vz = .2, vw = 1.1, vh = 2.1;
  const luzV = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh), new THREE.MeshBasicMaterial({ color: '#fff3dc' }));
  luzV.position.set(-hw + .02, 1.25, vz); luzV.rotation.y = Math.PI / 2; esc.add(luzV);
  const marcoM = M({ color: '#5a3a26', roughness: .6 });
  colgar('izq', luzV, caja(.08, vh + .1, .08, marcoM, -hw + .04, 1.25, vz - vw / 2), caja(.08, vh + .1, .08, marcoM, -hw + .04, 1.25, vz + vw / 2),
    caja(.08, .08, vw, marcoM, -hw + .04, 1.25 + vh / 2, vz), caja(.08, .06, vw, marcoM, -hw + .04, 1.25, vz));
  const forja = M({ color: '#151515', roughness: .4, metalness: .6 });
  for (let i = 0; i <= 10; i++) colgar('izq', caja(.015, .9, .015, forja, -hw - .06, .65, vz - vw / 2 + i * vw / 10));
  colgar('izq', caja(.03, .03, vw, forja, -hw - .06, 1.1, vz));
  const tela = M({ color: '#efe6d6', roughness: 1, side: THREE.DoubleSide });
  [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.45, vh + .3, 12, 1), tela); const p = c.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * .03); c.geometry.computeVertexNormals(); c.position.set(-hw + .12, 1.3, vz + s * (vw / 2 + .12)); c.rotation.y = Math.PI / 2; c.castShadow = true; esc.add(c); colgar('izq', c); });
  solido(-hw + .2, vz, .4, vw + .9);

  // puerta de entrada (pared del frente)
  colgar('frente', caja(.95, 2.15, .05, M({ color: '#6b4128', roughness: .55 }), hw - .8, 1.075, hd - .03), caja(.06, .06, .06, M({ color: '#c8a24f', metalness: .9, roughness: .3 }), hw - 1.18, 1.05, hd - .08));

  // techo
  const techoM = M({ color: '#f4f1ea', roughness: 1, side: THREE.DoubleSide });
  if (S.techo === 'vigas') {
    const tT = texMadera([196, 140, 90]); tT.repeat.set(W / 1.6, D / 1.6);
    const t = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M({ map: tT, roughness: .8, side: THREE.DoubleSide })); t.position.y = H; t.rotation.x = Math.PI / 2; esc.add(t); techoObjs.push(t);
    const tV = texMadera([140, 86, 46]); const vigaM = M({ map: tV, roughness: .7 });
    for (let i = 0; i < 5; i++) techoObjs.push(caja(.16, .22, D, vigaM, -hw + W * (i + .5) / 5, H - .11, 0));
    techoObjs.push(caja(W, .26, .26, vigaM, 0, H - .13, 0));
  } else {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(W, D), techoM); t.position.y = H; t.rotation.x = Math.PI / 2; esc.add(t); techoObjs.push(t);
    const mold = M({ color: '#e2dccf' }); techoObjs.push(caja(W, .08, .08, mold, 0, H - .04, -hd + .04), caja(W, .08, .08, mold, 0, H - .04, hd - .04));
  }
  if (S.extra.includes('claraboya')) { const c = new THREE.Mesh(new THREE.PlaneGeometry(.7, .9), new THREE.MeshBasicMaterial({ color: '#dff0ff', side: THREE.DoubleSide })); c.position.set(-.2, H + .05, .4); c.rotation.x = Math.PI / 2 + .38; esc.add(c); techoObjs.push(c); }

  // camas
  const sabana = M({ color: '#f7f5f0', roughness: .95 }), pie = M({ color: '#cdb79c', roughness: .9 }), madC = M({ color: '#4d3424', roughness: .6 });
  const cojin = [M({ color: '#3f6b74', roughness: .9 }), M({ color: '#6d7b4e', roughness: .9 }), M({ color: '#f1ece2', roughness: .95 })];
  S.camas.forEach(c => {
    const an = c.t === 'doble' ? 1.6 : .9, la = 2.0, z = -hd + la / 2 + .05 + (c.z + .7) * 0;
    const g = new THREE.Group(); g.position.set(c.x, 0, z); esc.add(g);
    caja(an + .06, .3, la, madC, 0, .15, 0, g);
    caja(an, .26, la - .05, sabana, 0, .43, .02, g);
    caja(an + .04, .05, .7, pie, 0, .58, .6, g);
    caja(an + .1, 1.1, .08, S.acento === S.pared ? madC : M({ color: '#d8cfbf', roughness: .8 }), 0, .55, -la / 2 - .02, g);
    const n = c.t === 'doble' ? 2 : 1;
    for (let k = 0; k < n; k++) { const px = n === 1 ? 0 : (k ? .38 : -.38); const a = caja(.62, .16, .38, cojin[2], px, .64, -la / 2 + .3, g); a.rotation.x = -.25; const b = caja(.45, .34, .14, cojin[k % 2], px, .7, -la / 2 + .45, g); b.rotation.x = -.15; }
    solido(c.x, z, an + .3, la + .3);
    // mesitas y lámparas
    [-1, 1].forEach(s => {
      const mx = c.x + s * (an / 2 + .32); if (Math.abs(mx) > hw - .2) return;
      caja(.42, .5, .38, madC, mx, .25, -hd + .25);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .3, 16), M({ color: '#c8a24f', metalness: .8, roughness: .3 })); base.position.set(mx, .65, -hd + .25); esc.add(base);
      const pant = new THREE.Mesh(new THREE.CylinderGeometry(.11, .16, .2, 24, 1, true), M({ color: '#fff1d6', emissive: '#ffcf8a', emissiveIntensity: 1.1, side: THREE.DoubleSide })); pant.position.set(mx, .88, -hd + .25); esc.add(pant);
      const l = new THREE.PointLight('#ffc77d', 3.5, 5, 1.6); l.position.set(mx, .9, -hd + .35); esc.add(l);
    });
  });

  // extras
  const ex = S.extra;
  if (ex.includes('cuadro')) {
    const g = new THREE.Group(); g.position.set(S.camas[0].x, 1.85, -hd + .03); esc.add(g); colgar('fondo', g);
    caja(.62, .82, .04, M({ color: '#a9873f', metalness: .7, roughness: .35 }), 0, 0, 0, g);
    const lienzoC = new THREE.Mesh(new THREE.PlaneGeometry(.52, .72), M({ map: texCuadro(), roughness: .8 })); lienzoC.position.z = .025; g.add(lienzoC);
  }
  if (ex.includes('tv')) { const tv = caja(.95, .55, .04, M({ color: '#0b0b0b', roughness: .2 }), hw - .03, 1.45, .2); tv.rotation.y = Math.PI / 2; colgar('der', tv); caja(.5, .7, .4, madC, hw - .25, .35, .2); solido(hw - .25, .2, .5, .5); }
  if (ex.includes('alfombra')) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .015, 48), M({ color: '#c9c3b8', roughness: 1 })); a.position.set(-.5, .008, .9); a.receiveShadow = true; esc.add(a); }
  if (ex.includes('puf')) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .4, 32), M({ color: '#5d6162', roughness: .9 })); p.position.set(-1.1, .2, -.2); p.castShadow = true; esc.add(p); solido(-1.1, -.2, .6, .6); }
  if (ex.includes('butaca')) { caja(.7, .45, .7, M({ color: '#8a6d55', roughness: .9 }), -hw + .7, .22, 1.2); caja(.7, .5, .12, M({ color: '#8a6d55' }), -hw + .7, .65, 1.5); solido(-hw + .7, 1.25, .8, .8); }
  if (ex.includes('escritorio')) { caja(1, .05, .5, madC, hw - .3, .76, .9).rotation.y = Math.PI / 2; caja(.04, .74, .45, madC, hw - .3, .37, .45); caja(.04, .74, .45, madC, hw - .3, .37, 1.35); solido(hw - .3, .9, .6, 1.1); }
  if (ex.includes('sofa')) { const sm = M({ color: '#2f3a3d', roughness: .9 }); caja(1.9, .42, .85, sm, -hw + 1.3, .21, 1.4); caja(1.9, .45, .18, sm, -hw + 1.3, .62, 1.75); caja(.18, .3, .85, sm, -hw + .35, .55, 1.4); caja(.18, .3, .85, sm, -hw + 2.25, .55, 1.4); solido(-hw + 1.3, 1.45, 2.1, 1); }

  // baño
  const blanco = M({ color: '#f6f6f3', roughness: .25 }), cristal = new THREE.MeshPhysicalMaterial({ color: '#dfeeea', transmission: .9, transparent: true, opacity: .25, roughness: .05 });
  const lavabo = (x, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; esc.add(g); caja(.8, .5, .45, madC, 0, .6, 0, g); caja(.5, .12, .38, blanco, 0, .9, 0, g); const esp = new THREE.Mesh(new THREE.CircleGeometry(.3, 40), M({ color: '#cfd8da', metalness: 1, roughness: .05 })); esp.position.set(0, 1.55, -.21); g.add(esp); };
  if (S.banio === 'abierto') {
    // junior: bañera exenta en la habitación y ducha abierta con azulejo de flores
    const prof = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(.36, .02), new THREE.Vector2(.4, .55), new THREE.Vector2(.37, .58), new THREE.Vector2(.33, .1)], 48);
    const ban = new THREE.Mesh(prof, M({ color: '#d9c6a2', roughness: .35, side: THREE.DoubleSide })); ban.scale.set(1.9, 1, 1); ban.position.set(1.1, 0, .9); ban.castShadow = true; esc.add(ban); solido(1.1, .9, 1.6, .9);
    const flores = M({ map: texFlores(), roughness: .3 });
    const pf = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.3), flores); pf.position.set(hw - .01, 1.15, -hd + 1.1); pf.rotation.y = -Math.PI / 2; esc.add(pf);
    const cr = new THREE.Mesh(new THREE.BoxGeometry(.02, 2.1, 1.3), cristal); cr.position.set(hw - 1.1, 1.05, -hd + 1.1); esc.add(cr);
    lavabo(hw - .5, hd - .5, Math.PI);
  } else {
    // baño en un rincón, tras una pared con puerta de cristal
    const bx = hw - .9, bz = hd - 1;
    const tabique = caja(.06, H - .2, 1.6, M({ map: tPared, roughness: .9 }), hw - 1.8, (H - .2) / 2, hd - 1.2);
    const cr = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.1, .02), cristal); cr.position.set(bx, 1.05, hd - 2); esc.add(cr);
    tapanMaqueta.push(tabique);
    solido(bx, hd - 1, 1.9, 2.1);
    lavabo(bx + .4, bz + .7, Math.PI);
    if (S.banio === 'hidro') { caja(1.6, .55, .75, blanco, bx, .28, bz - .4); const agua = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .6), M({ color: '#9fc7cf', roughness: .05, metalness: .2 })); agua.rotation.x = -Math.PI / 2; agua.position.set(bx, .5, bz - .4); esc.add(agua); }
    else { caja(.9, .06, .9, blanco, bx - .3, .03, bz - .4); }
  }

  /* ---------- cámaras y controles ---------- */
  let modo = 'maqueta', yaw = .6, pitch = -.62, dist = Math.max(W, D) * 1.55, angM = .7;
  const pos = new THREE.Vector3(-hw + .9, 1.6, hd - .7); let yawP = 0, pitchP = -.12;
  const teclas = {}; const joy = { x: 0, y: 0 };
  const choca = (x, z) => x < -hw + .3 || x > hw - .3 || z < -hd + .3 || z > hd - .3 || solidos.some(s => x > s.x0 - .2 && x < s.x1 + .2 && z > s.z0 - .2 && z < s.z1 + .2);
  function ponerModo(m) {
    modo = m; techoObjs.forEach(o => o.visible = m === 'caminar'); tapanMaqueta.forEach(o => o.visible = m === 'caminar');
    if (m === 'caminar' && choca(pos.x, pos.z)) { // buscar un sitio libre cerca de la puerta
      for (let z = hd - .5; z > -hd; z -= .2) for (let x = -hw + .6; x < hw; x += .2) if (!choca(x, z)) { pos.set(x, 1.6, z); z = -99; break; }
    }
    if (m === 'caminar') { yawP = Math.atan2(pos.x - S.camas[0].x, pos.z - (-hd + 1)); pitchP = -.12; }
    onModo && onModo(m);
  }
  ponerModo('maqueta');
  const el = lienzoEl; let arr = null;
  el.addEventListener('pointerdown', e => { arr = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!arr) return; const dx = e.clientX - arr.x, dy = e.clientY - arr.y; arr = { x: e.clientX, y: e.clientY };
    if (modo === 'maqueta') { angM -= dx * .006; pitch = Math.max(-1.35, Math.min(-.25, pitch - dy * .004)); }
    else { yawP -= dx * .005; pitchP = Math.max(-1, Math.min(1, pitchP - dy * .004)); }
  });
  ['pointerup', 'pointercancel'].forEach(n => el.addEventListener(n, () => arr = null));
  el.addEventListener('wheel', e => { e.preventDefault(); if (modo === 'maqueta') dist = Math.max(3, Math.min(14, dist + e.deltaY * .005)); else { const f = -e.deltaY * .004; mover(Math.sin(yawP) * -f, Math.cos(yawP) * -f); } }, { passive: false });
  const onKey = e => { teclas[e.key.toLowerCase()] = e.type === 'keydown'; };
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);
  function mover(dx, dz) { const nx = pos.x + dx, nz = pos.z + dz; if (!choca(nx, pos.z)) pos.x = nx; if (!choca(pos.x, nz)) pos.z = nz; }

  function medir() { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  addEventListener('resize', medir); medir();
  let vivo = true, prev = performance.now(), quieto = 0;
  function bucle(t) {
    if (!vivo) return;
    const dt = Math.min(.05, (t - prev) / 1000); prev = t;
    if (modo === 'maqueta') {
      if (!arr) { quieto += dt; if (quieto > 2) angM += dt * .12; } else quieto = 0;
      cam.fov = 45; cam.updateProjectionMatrix();
      const c = Math.cos(pitch);
      cam.position.set(Math.sin(angM) * dist * c, -Math.sin(pitch) * dist + .5, Math.cos(angM) * dist * c);
      cam.lookAt(0, .6, 0);
      for (const k in paredes) { const p = paredes[k], fuera = (cam.position.x - p.x) * p.nx + (cam.position.z - p.z) * p.nz < 0; const h = fuera ? .32 : 1; p.m.scale.y = h; p.m.position.y = H * h / 2; p.cosas.forEach(o => o.visible = !fuera); }
    } else {
      for (const k in paredes) { const p = paredes[k]; p.m.scale.y = 1; p.m.position.y = H / 2; p.cosas.forEach(o => o.visible = true); }
      cam.fov = 72; cam.updateProjectionMatrix();
      const v = 1.4 * dt; let f = 0, s = 0;
      if (teclas['w'] || teclas['arrowup']) f += 1; if (teclas['s'] || teclas['arrowdown']) f -= 1;
      if (teclas['a'] || teclas['arrowleft']) s -= 1; if (teclas['d'] || teclas['arrowright']) s += 1;
      f += -joy.y; s += joy.x;
      if (f || s) mover((-Math.sin(yawP) * f + Math.cos(yawP) * s) * v, (-Math.cos(yawP) * f - Math.sin(yawP) * s) * v);
      cam.position.copy(pos);
      cam.rotation.set(pitchP, yawP, 0, 'YXZ');
    }
    r.render(esc, cam);
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);
  return {
    modo: ponerModo, joy,
    destruir() { vivo = false; removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('resize', medir); esc.traverse(o => { o.geometry && o.geometry.dispose(); const m = o.material; if (m) [].concat(m).forEach(x => { x.map && x.map.dispose(); x.dispose(); }); }); r.dispose(); }
  };
}
