/* Recorrido 3D de las habitaciones del Hotel Les Monges.
   Cada habitación se construye a escala (metros) a partir de lo que se ve en
   sus fotos. Luz real de una habitación de hotel (HDRI), texturas PBR y muebles
   3D de Poly Haven (CC0). Es una recreación orientativa, no un plano exacto.
   Modos: «Maqueta» (desde arriba, paredes cercanas bajadas) y «Caminar». */
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { RGBELoader } from './vendor/RGBELoader.js';

const RAIZ = '3d/';
const cargadorT = new THREE.TextureLoader();
const cacheT = {};
function texPBR(nombre, rep = [1, 1], color = true) {
  const k = nombre + rep.join() + color;
  if (cacheT[k]) return cacheT[k];
  const t = m => { const x = cargadorT.load(`${RAIZ}t/${nombre}-${m}.jpg`); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(rep[0], rep[1]); x.anisotropy = 8; return x; };
  const r = { normalMap: t('normal'), roughnessMap: t('rugosidad') };
  if (color) { r.map = t('color'); r.map.colorSpace = THREE.SRGBColorSpace; }
  return (cacheT[k] = r);
}
function lienzo(w, h, pinta) { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
const azar = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
function texHidraulico() {
  return lienzo(1024, 1024, (x, w) => {
    const n = 4, t = w / n, r = azar(5);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const ox = i * t, oy = j * t, k = .94 + r() * .08;
      x.fillStyle = `rgb(${233 * k | 0},${225 * k | 0},${210 * k | 0})`; x.fillRect(ox, oy, t, t);
      x.fillStyle = '#7d8f86'; x.beginPath(); x.arc(ox + t / 2, oy + t / 2, t * .34, 0, 7); x.fill();
      x.fillStyle = '#e9e1d2'; x.beginPath(); x.arc(ox + t / 2, oy + t / 2, t * .2, 0, 7); x.fill();
      x.fillStyle = '#b8654a'; [[0, 0], [t, 0], [0, t], [t, t]].forEach(([a, b]) => { x.beginPath(); x.arc(ox + a, oy + b, t * .22, 0, 7); x.fill(); });
      x.fillStyle = '#c9a85f'; x.beginPath(); x.arc(ox + t / 2, oy + t / 2, t * .07, 0, 7); x.fill();
      x.strokeStyle = 'rgba(60,50,40,.35)'; x.lineWidth = 3; x.strokeRect(ox, oy, t, t);
    }
  });
}
function texFlores() {
  return lienzo(1024, 1024, (x, w, h) => {
    x.fillStyle = '#f2ebe2'; x.fillRect(0, 0, w, h);
    const r = azar(11), cols = ['#d4577a', '#e8a33d', '#4e8fb8', '#6aa36f', '#c7483f'];
    for (let i = 0; i < 700; i++) { x.strokeStyle = cols[i % cols.length]; x.lineWidth = 3 + r() * 5; x.beginPath(); x.ellipse(r() * w, r() * h, 14 + r() * 30, 7 + r() * 14, r() * 3, 0, 6.3); x.stroke(); }
  });
}
// caja con aristas redondeadas (colchones, cojines, cabeceros tapizados)
function cajaRedondaGeo(w, h, d, r, seg = 6) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    v.sub(c).normalize().multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}

/* ---------- habitaciones (medidas aproximadas, en metros) ---------- */
export const SALAS = {
  individual: { an: 2.7, fo: 4.2, al: 2.9, pared: '#efebe3', acento: '#efebe3', suelo: 'madera', techo: 'plano', camas: [{ t: 'ind', x: -.55 }], extra: ['escritorio', 'tv', 'jarron'], banio: 'ducha' },
  dui: { an: 3.3, fo: 4.6, al: 3, pared: '#ece8e0', acento: '#4c6c66', suelo: 'madera', techo: 'plano', camas: [{ t: 'doble', x: 0 }], extra: ['cuadro', 'tv', 'butaca'], banio: 'ducha' },
  standard: { an: 3.3, fo: 4.5, al: 3, pared: '#ebe7df', acento: '#3f5d58', suelo: 'madera', techo: 'plano', camas: [{ t: 'doble', x: 0 }], extra: ['cuadro', 'tv', 'jarron'], banio: 'ducha' },
  sup: { an: 3.8, fo: 4.8, al: 3.1, pared: '#f2efe8', acento: '#f2efe8', suelo: 'madera', techo: 'vigas', camas: [{ t: 'doble', x: .3 }], extra: ['cuadro', 'alfombra', 'puf', 'tv', 'claraboya'], banio: 'ducha' },
  hidro: { an: 3.5, fo: 4.8, al: 3, pared: '#ece8df', acento: '#ece8df', suelo: 'madera', techo: 'plano', camas: [{ t: 'doble', x: 0 }], extra: ['tv', 'cuadro', 'butaca'], banio: 'hidro' },
  junior: { an: 4.4, fo: 4.8, al: 3.2, pared: '#f2efe8', acento: '#f2efe8', suelo: 'hidraulico', techo: 'vigas', camas: [{ t: 'doble', x: -.6 }], extra: ['cuadro', 'claraboya', 'puf'], banio: 'abierto' },
  triple: { an: 4, fo: 4.8, al: 3, pared: '#eeeae2', acento: '#eeeae2', suelo: 'madera', techo: 'plano', camas: [{ t: 'ind', x: -1.15 }, { t: 'ind', x: 0 }, { t: 'ind', x: 1.15 }], extra: ['tv'], banio: 'ducha' },
  familiar: { an: 4.6, fo: 5.4, al: 3.2, pared: '#f2efe8', acento: '#f2efe8', suelo: 'madera', techo: 'vigas', camas: [{ t: 'doble', x: .7 }], extra: ['sofa', 'tv', 'cuadro', 'claraboya', 'jarron'], banio: 'ducha' },
};

export function crearSala(lienzoEl, id, onModo, onListo) {
  const S = SALAS[id];
  const r = new THREE.WebGLRenderer({ canvas: lienzoEl, antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .95;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const esc = new THREE.Scene(); esc.background = new THREE.Color('#0c110e');
  const cam = new THREE.PerspectiveCamera(70, 1, .05, 60);
  const M = o => new THREE.MeshStandardMaterial(o);
  const malla = (geo, mat, x, y, z, padre = esc) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; padre.add(m); return m; };
  const caja = (w, h, d, mat, x, y, z, padre) => malla(new THREE.BoxGeometry(w, h, d), mat, x, y, z, padre);
  const redonda = (w, h, d, rad, mat, x, y, z, padre) => malla(cajaRedondaGeo(w, h, d, rad), mat, x, y, z, padre);
  const solidos = [];
  const solido = (x, z, w, d) => solidos.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const W = S.an, D = S.fo, H = S.al, hw = W / 2, hd = D / 2;
  const techoObjs = [], tapanMaqueta = [], bajosMaqueta = [], paredes = {};
  let modo = 'maqueta';
  let pendientes = 0; const listo = () => { if (--pendientes <= 0) onListo && onListo(); };

  /* ---------- luz: HDRI de una habitación de hotel + sol por la ventana + lámparas ---------- */
  pendientes++;
  new RGBELoader().load(RAIZ + 'luz.hdr', t => { t.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(r); esc.environment = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose(); listo(); }, undefined, listo);
  esc.add(new THREE.HemisphereLight('#fff8ec', '#8a7a68', .35));
  const sol = new THREE.DirectionalLight('#ffe6c4', 3.2); sol.position.set(-hw - 2.5, H + 1.2, 1.2); sol.target.position.set(.5, 0, -.3);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); sol.shadow.bias = -.0004; sol.shadow.radius = 4;
  esc.add(sol, sol.target);

  /* ---------- suelo ---------- */
  if (S.suelo === 'madera') {
    const s = malla(new THREE.PlaneGeometry(W, D), M({ ...texPBR('suelo', [W / 1.6, D / 1.6]), roughness: 1, color: '#d9c4ad' }), 0, 0, 0); s.rotation.x = -Math.PI / 2; s.castShadow = false;
  } else {
    const tH = texHidraulico(); tH.repeat.set(W / 1.2, D / 1.2);
    const s = malla(new THREE.PlaneGeometry(W, D), M({ map: tH, roughness: .28 }), 0, 0, 0); s.rotation.x = -Math.PI / 2; s.castShadow = false;
  }

  /* ---------- paredes de yeso (con su normal hacia dentro y lo que cuelga de ellas) ---------- */
  const pared = (k, w, h, x, z, ry, color, nx, nz) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ ...texPBR('pared', [w / 2, h / 2], false), color, roughness: .95, side: THREE.DoubleSide, normalScale: new THREE.Vector2(.6, .6) }));
    m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true; esc.add(m); paredes[k] = { m, x, z, nx, nz, cosas: [] }; return m;
  };
  pared('fondo', W, H, 0, -hd, 0, S.acento, 0, 1);
  pared('frente', W, H, 0, hd, Math.PI, S.pared, 0, -1);
  pared('izq', D, H, -hw, 0, Math.PI / 2, S.pared, 1, 0);
  pared('der', D, H, hw, 0, -Math.PI / 2, S.pared, -1, 0);
  const colgar = (k, ...o) => paredes[k].cosas.push(...o);
  const zoc = M({ color: '#d9d2c4', roughness: .6 });
  caja(W, .1, .02, zoc, 0, .05, -hd + .01); caja(W, .1, .02, zoc, 0, .05, hd - .01); caja(.02, .1, D, zoc, -hw + .01, .05, 0); caja(.02, .1, D, zoc, hw - .01, .05, 0);

  /* ---------- ventana con balcón de forja ---------- */
  const vz = .2, vw = 1.1, vh = 2.1;
  const luzV = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh), new THREE.MeshBasicMaterial({ color: '#fff4e2' }));
  luzV.position.set(-hw + .02, 1.25, vz); luzV.rotation.y = Math.PI / 2; esc.add(luzV);
  const marcoM = M({ color: '#5a3a26', roughness: .5 });
  colgar('izq', luzV, caja(.08, vh + .1, .08, marcoM, -hw + .04, 1.25, vz - vw / 2), caja(.08, vh + .1, .08, marcoM, -hw + .04, 1.25, vz + vw / 2),
    caja(.08, .08, vw, marcoM, -hw + .04, 1.25 + vh / 2, vz), caja(.08, .06, vw, marcoM, -hw + .04, 1.25, vz));
  const forja = M({ color: '#151515', roughness: .35, metalness: .7 });
  for (let i = 0; i <= 10; i++) colgar('izq', caja(.015, .9, .015, forja, -hw - .06, .65, vz - vw / 2 + i * vw / 10));
  colgar('izq', caja(.03, .03, vw, forja, -hw - .06, 1.1, vz));
  const tela = M({ ...texPBR('lino', [1.5, 3], false), color: '#f1e6d2', roughness: 1, side: THREE.DoubleSide });
  [-1, 1].forEach(s => {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(.5, vh + .35, 24, 1), tela);
    const p = c.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 38) * .035); c.geometry.computeVertexNormals();
    c.position.set(-hw + .13, 1.32, vz + s * (vw / 2 + .14)); c.rotation.y = Math.PI / 2; c.castShadow = true; esc.add(c); colgar('izq', c);
  });
  const barra = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, vw + .9, 12), M({ color: '#b08a45', metalness: .9, roughness: .3 })); barra.rotation.x = Math.PI / 2; barra.position.set(-hw + .13, 1.25 + vh / 2 + .15, vz); esc.add(barra); colgar('izq', barra);
  solido(-hw + .2, vz, .4, vw + .9);

  /* ---------- puerta con cuarterones ---------- */
  const cuarteron = M({ color: '#5d3822', roughness: .45 });
  colgar('frente', caja(.95, 2.15, .05, M({ color: '#6b4128', roughness: .45 }), hw - .8, 1.075, hd - .03),
    caja(.75, .8, .02, cuarteron, hw - .8, 1.55, hd - .065), caja(.75, .8, .02, cuarteron, hw - .8, .6, hd - .065),
    malla(new THREE.SphereGeometry(.035, 20, 12), M({ color: '#c8a24f', metalness: 1, roughness: .25 }), hw - 1.18, 1.05, hd - .09));

  /* ---------- techo ---------- */
  if (S.techo === 'vigas') {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M({ ...texPBR('techo', [W / 1.4, D / 1.4]), color: '#e2a877', roughness: .9, side: THREE.DoubleSide }));
    t.position.y = H; t.rotation.x = Math.PI / 2; esc.add(t); techoObjs.push(t);
    const vigaM = M({ ...texPBR('techo', [.4, 2]), color: '#b06d3c', roughness: .8 });
    for (let i = 0; i < 5; i++) techoObjs.push(caja(.16, .22, D, vigaM, -hw + W * (i + .5) / 5, H - .11, 0));
    techoObjs.push(caja(W, .26, .26, vigaM, 0, H - .13, 0));
  } else {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M({ color: '#f6f3ed', roughness: 1, side: THREE.DoubleSide })); t.position.y = H; t.rotation.x = Math.PI / 2; esc.add(t); techoObjs.push(t);
    const mold = M({ color: '#e6e0d4' }); techoObjs.push(caja(W, .09, .09, mold, 0, H - .045, -hd + .045), caja(W, .09, .09, mold, 0, H - .045, hd - .045), caja(.09, .09, D, mold, -hw + .045, H - .045, 0), caja(.09, .09, D, mold, hw - .045, H - .045, 0));
  }
  if (S.extra.includes('claraboya')) { const c = new THREE.Mesh(new THREE.PlaneGeometry(.7, .9), new THREE.MeshBasicMaterial({ color: '#e6f3ff', side: THREE.DoubleSide })); c.position.set(-.2, H - .01, .4); c.rotation.x = Math.PI / 2; esc.add(c); techoObjs.push(c); }

  /* ---------- modelos 3D reales (Poly Haven, CC0) ---------- */
  const gltf = new GLTFLoader();
  function modelo(nombre, alto, x, y, z, ry = 0, colgarEn, padre = esc, ocultaMaqueta) {
    pendientes++;
    gltf.load(`${RAIZ}m/${nombre}.gltf`, g => {
      const o = g.scene; o.rotation.y = ry;
      const b = new THREE.Box3().setFromObject(o); o.scale.setScalar(alto / b.getSize(new THREE.Vector3()).y);
      const b2 = new THREE.Box3().setFromObject(o), c = b2.getCenter(new THREE.Vector3());
      o.position.set(x - c.x, y - b2.min.y, z - c.z);
      o.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
      padre.add(o); if (colgarEn) colgar(colgarEn, o); if (ocultaMaqueta) { tapanMaqueta.push(o); o.visible = modo === 'caminar'; }
      listo();
    }, undefined, listo);
  }

  /* ---------- camas tapizadas ---------- */
  const sabana = M({ ...texPBR('algodon', [3, 3], false), color: '#fbfaf6', roughness: .95 });
  const edredon = M({ ...texPBR('lino', [2, 2], false), color: '#efe2c8', roughness: 1 });
  const pieCama = M({ ...texPBR('lino', [2, 1], false), color: '#a8875f', roughness: 1 });
  const tapiz = M({ ...texPBR('lino', [2, 2], false), color: S.acento === S.pared ? '#7a5a42' : '#d7cbb6', roughness: 1 });
  const cojines = [M({ color: '#2f5f69', roughness: .55 }), M({ color: '#5f6e3d', roughness: .55 }), M({ color: '#f5f1e8', roughness: .9 })];
  S.camas.forEach((c, n) => {
    const an = c.t === 'doble' ? 1.6 : .9, la = 2.0, z = -hd + la / 2 + .06;
    const g = new THREE.Group(); g.position.set(c.x, 0, z); esc.add(g);
    redonda(an + .06, .28, la, .03, M({ color: '#3b2a1f', roughness: .6 }), 0, .16, 0, g);
    redonda(an, .24, la - .04, .08, sabana, 0, .41, .01, g);
    redonda(an + .06, .07, la * .72, .035, edredon, 0, .55, la * .14, g);
    redonda(an + .1, .045, .55, .02, pieCama, 0, .6, la * .34, g);
    redonda(an + .14, 1.05, .1, .04, tapiz, 0, .62, -la / 2 - .03, g);
    const nP = c.t === 'doble' ? 2 : 1;
    for (let k = 0; k < nP; k++) {
      const px = nP === 1 ? 0 : (k ? .4 : -.4);
      const a = redonda(.66, .17, .42, .08, cojines[2], px, .63, -la / 2 + .3, g); a.rotation.x = -.35;
      const b = redonda(.42, .38, .15, .07, cojines[(k + n) % 2], px, .74, -la / 2 + .47, g); b.rotation.x = -.18;
    }
    solido(c.x, z, an + .3, la + .3);
    [-1, 1].forEach(s => {
      const mx = c.x + s * (an / 2 + .33); if (Math.abs(mx) > hw - .2 || (S.camas.length > 1 && s === 1 && n < S.camas.length - 1)) return;
      modelo('mesita', .58, mx, 0, -hd + .26);
      const base = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(.07, 0), new THREE.Vector2(.09, .08), new THREE.Vector2(.06, .2), new THREE.Vector2(.02, .26), new THREE.Vector2(0, .26)], 32), M({ color: '#c8a24f', metalness: .85, roughness: .25 }));
      base.position.set(mx, .58, -hd + .26); base.castShadow = true; esc.add(base);
      const pant = new THREE.Mesh(new THREE.CylinderGeometry(.12, .17, .22, 40, 1, true), M({ ...texPBR('lino', [2, 1], false), color: '#fff3dd', emissive: '#ffd08f', emissiveIntensity: .9, side: THREE.DoubleSide }));
      pant.position.set(mx, .95, -hd + .26); esc.add(pant);
      const l = new THREE.PointLight('#ffc77d', 4, 5, 1.6); l.position.set(mx, .95, -hd + .38); esc.add(l);
    });
  });

  /* ---------- extras ---------- */
  const ex = S.extra, madC = M({ color: '#4d3424', roughness: .5 });
  if (ex.includes('cuadro')) modelo('marco', .85, S.camas[0].x, 1.5, -hd + .04, 0, 'fondo');
  if (ex.includes('tv')) { const tv = redonda(1, .58, .04, .01, M({ color: '#0a0a0a', roughness: .15, metalness: .3 }), hw - .04, 1.45, .25); tv.rotation.y = -Math.PI / 2; colgar('der', tv); redonda(.45, .62, 1.1, .02, madC, hw - .25, .31, .25); solido(hw - .25, .25, .5, 1.2); }
  if (ex.includes('alfombra')) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .015, 64), M({ ...texPBR('lino', [3, 3], false), color: '#cfc8bc', roughness: 1 })); a.position.set(-.5, .008, .9); a.receiveShadow = true; esc.add(a); }
  if (ex.includes('puf')) { modelo('puf', .42, -1.1, 0, .1); solido(-1.1, .1, .6, .6); }
  if (ex.includes('butaca')) { modelo('butaca', .9, -hw + .75, 0, 1.25, Math.PI / 2 + .5); solido(-hw + .75, 1.25, .9, .9); }
  if (ex.includes('escritorio')) { redonda(.55, .05, 1, .01, madC, hw - .3, .76, .9); caja(.45, .74, .04, madC, hw - .3, .37, .42); caja(.45, .74, .04, madC, hw - .3, .37, 1.38); solido(hw - .3, .9, .6, 1.1); }
  if (ex.includes('sofa')) { modelo('sofa', .85, -hw + 1.3, 0, 1.45, Math.PI); solido(-hw + 1.3, 1.45, 2.1, 1); }
  if (ex.includes('jarron')) modelo('jarron', .35, -hw + .35, 0, -hd + .4);

  /* ---------- baño ---------- */
  const blanco = M({ color: '#f7f7f4', roughness: .12 }), cristal = new THREE.MeshPhysicalMaterial({ color: '#e6f1ee', transmission: .95, transparent: true, opacity: .22, roughness: .03, thickness: .01 });
  const grifo = M({ color: '#d9d9d9', metalness: 1, roughness: .15 });
  const lavabo = (x, z, ry = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; esc.add(g);
    redonda(.8, .5, .45, .02, madC, 0, .6, 0, g);
    redonda(.52, .13, .4, .05, blanco, 0, .91, 0, g);
    const c = new THREE.Mesh(new THREE.TorusGeometry(.06, .012, 8, 24, Math.PI), grifo); c.position.set(0, 1.0, -.15); g.add(c);
    modelo('espejo', .8, 0, 1.25, -.2, 0, null, g, true);
  };
  if (S.banio === 'abierto') {
    const perfil = [new THREE.Vector2(0, 0), new THREE.Vector2(.34, .01), new THREE.Vector2(.39, .08), new THREE.Vector2(.41, .55), new THREE.Vector2(.38, .58), new THREE.Vector2(.35, .52), new THREE.Vector2(.32, .1), new THREE.Vector2(0, .08)];
    const ban = new THREE.Mesh(new THREE.LatheGeometry(perfil, 64), M({ color: '#d8c4a0', roughness: .3, side: THREE.DoubleSide })); ban.scale.set(1.9, 1, 1); ban.position.set(1.1, 0, .9); ban.castShadow = true; esc.add(ban); solido(1.1, .9, 1.6, .9);
    const agua = new THREE.Mesh(new THREE.CircleGeometry(.31, 48), M({ color: '#a9cdd3', roughness: .02, metalness: .1 })); agua.rotation.x = -Math.PI / 2; agua.scale.set(1.9, 1, 1); agua.position.set(1.1, .42, .9); esc.add(agua);
    const tf = texFlores(); tf.repeat.set(1.4, 2.3);
    const pf = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), M({ map: tf, roughness: .15 })); pf.position.set(hw - .01, 1.2, -hd + 1.1); pf.rotation.y = -Math.PI / 2; esc.add(pf); colgar('der', pf);
    const cr = new THREE.Mesh(new THREE.BoxGeometry(.02, 2.1, 1.3), cristal); cr.position.set(hw - 1.1, 1.05, -hd + 1.1); esc.add(cr);
    const ducha = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .02, 32), grifo); ducha.position.set(hw - .5, 2.2, -hd + 1.1); esc.add(ducha);
    lavabo(hw - .5, hd - .45, Math.PI);
  } else {
    const bd = 1.6, bx = hw - .72, bz = hd - bd / 2;
    const tabique = caja(.07, H - .2, bd, M({ ...texPBR('pared', [1, 1.5], false), color: S.pared, roughness: .95 }), hw - 1.45, (H - .2) / 2, hd - bd / 2);
    const cr = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, .02), cristal); cr.position.set(bx, 1.05, hd - bd); esc.add(cr);
    bajosMaqueta.push(tabique);
    solido(bx, bz, 1.55, bd + .1);
    lavabo(bx + .25, hd - .3, Math.PI);
    if (S.banio === 'hidro') { redonda(1.4, .56, .75, .08, blanco, bx, .28, bz - .25); const agua = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .58), M({ color: '#a9cdd3', roughness: .02, metalness: .1 })); agua.rotation.x = -Math.PI / 2; agua.position.set(bx, .5, bz - .25); esc.add(agua); }
    else redonda(.85, .06, .85, .02, blanco, bx - .2, .03, bz - .25);
  }

  /* ---------- cámaras y controles ---------- */
  let pitch = -.62, dist = Math.max(W, D) * 1.55, angM = .7;
  const pos = new THREE.Vector3(-hw + .6, 1.6, hd - .6); let yawP = 0, pitchP = -.12;
  const teclas = {}, joy = { x: 0, y: 0 };
  const choca = (x, z) => x < -hw + .3 || x > hw - .3 || z < -hd + .3 || z > hd - .3 || solidos.some(s => x > s.x0 - .2 && x < s.x1 + .2 && z > s.z0 - .2 && z < s.z1 + .2);
  function ponerModo(m) {
    modo = m; techoObjs.forEach(o => o.visible = m === 'caminar'); tapanMaqueta.forEach(o => o.visible = m === 'caminar');
    if (m === 'caminar' && choca(pos.x, pos.z)) {
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

  let vivo = true, prev = performance.now(), quieto = 0, paso = 0;
  function bucle(t) {
    if (!vivo) return;
    const dt = Math.min(.05, (t - prev) / 1000); prev = t;
    if (modo === 'maqueta') {
      if (!arr) { quieto += dt; if (quieto > 2) angM += dt * .12; } else quieto = 0;
      cam.fov = 42; cam.updateProjectionMatrix();
      const c = Math.cos(pitch);
      cam.position.set(Math.sin(angM) * dist * c, -Math.sin(pitch) * dist + .5, Math.cos(angM) * dist * c);
      cam.lookAt(0, .6, 0);
      for (const k in paredes) { const p = paredes[k], fuera = (cam.position.x - p.x) * p.nx + (cam.position.z - p.z) * p.nz < 0, h = fuera ? .32 : 1; p.m.scale.y = h; p.m.position.y = H * h / 2; p.cosas.forEach(o => o.visible = !fuera); }
      bajosMaqueta.forEach(o => { o.scale.y = .32; o.position.y = (H - .2) * .16; });
    } else {
      for (const k in paredes) { const p = paredes[k]; p.m.scale.y = 1; p.m.position.y = H / 2; p.cosas.forEach(o => o.visible = true); }
      bajosMaqueta.forEach(o => { o.scale.y = 1; o.position.y = (H - .2) / 2; });
      cam.fov = 68; cam.updateProjectionMatrix();
      const v = 1.3 * dt; let f = 0, s = 0;
      if (teclas['w'] || teclas['arrowup']) f += 1; if (teclas['s'] || teclas['arrowdown']) f -= 1;
      if (teclas['a'] || teclas['arrowleft']) s -= 1; if (teclas['d'] || teclas['arrowright']) s += 1;
      f += -joy.y; s += joy.x;
      if (f || s) { mover((-Math.sin(yawP) * f + Math.cos(yawP) * s) * v, (-Math.cos(yawP) * f - Math.sin(yawP) * s) * v); paso += dt * 7; }
      cam.position.set(pos.x, pos.y + Math.sin(paso) * .012, pos.z);
      cam.rotation.set(pitchP, yawP, 0, 'YXZ');
    }
    r.render(esc, cam);
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);
  if (pendientes === 0) onListo && onListo();
  return {
    modo: ponerModo, joy,
    destruir() { vivo = false; removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('resize', medir); esc.traverse(o => { o.geometry && o.geometry.dispose(); const m = o.material; if (m) [].concat(m).forEach(x => x.dispose()); }); r.dispose(); }
  };
}
