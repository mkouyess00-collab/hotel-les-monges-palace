/* Motor de fotos en 3D: cada foto real del hotel + su mapa de profundidad
   (calculado con Depth Anything V2). La cámara avanza (push) y se asoma
   (mirada) moviendo más lo cercano que lo lejano, como una cámara real. */
(() => {
  const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p*.5+.5; v.y = 1.-v.y; gl_Position = vec4(p,0.,1.); }`;
  const FRAG = `precision highp float;
  varying vec2 v;
  uniform sampler2D uImg, uDep;
  uniform vec2 uRes, uTam, uCentro, uMirada, uFoco;
  uniform float uPush, uFuerza, uAlfa, uLuz, uGrano, uTiempo, uOscuro;
  vec2 cubrir(vec2 uv){
    float rs = uRes.x/uRes.y, ri = uTam.x/uTam.y;
    vec2 s = rs > ri ? vec2(1., ri/rs) : vec2(rs/ri, 1.);
    return (uv-.5)*s + clamp(uFoco, s*.5, 1.-s*.5);
  }
  float azar(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec2 uv = cubrir(v);
    float k = uPush/(1.+uPush);
    vec2 s = mix(uCentro, cubrir(vec2(.5)), k);
    vec2 q = uv; float d = texture2D(uDep, uv).r;
    for (int i = 0; i < 4; i++) {
      float z = 1. + uPush*(.25 + .9*d);
      q = uCentro + (uv - s)/z - uMirada*uFuerza*(d - .45);
      d = mix(d, texture2D(uDep, q).r, .7);
    }
    vec3 c = texture2D(uImg, clamp(q, .001, .999)).rgb;
    // grado cinematográfico: sombras frías, luces cálidas
    float l = dot(c, vec3(.299,.587,.114));
    c = mix(c, c*vec3(.92,.98,1.04), smoothstep(.5,0.,l)*.5);
    c = mix(c, c*vec3(1.06,1.,.9), smoothstep(.5,1.,l)*.5);
    c = (c - .5)*1.06 + .5;
    // viñeta
    vec2 w = v - .5; float vi = 1. - dot(w,w)*1.15;
    c *= mix(1., vi, .85);
    // luz cálida que sale de la puerta
    float dc = length((v - .5)*vec2(uRes.x/uRes.y, 1.));
    c += vec3(1.,.82,.55)*uLuz*smoothstep(.9,0.,dc);
    c *= 1. - uOscuro;
    c += (azar(v*uRes + uTiempo) - .5)*uGrano;
    gl_FragColor = vec4(c, uAlfa);
  }`;

  function cargar(src) {
    return new Promise((ok, mal) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = mal; i.src = src; });
  }

  class Escena3D {
    constructor(canvas) {
      this.c = canvas;
      const gl = this.gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: true });
      if (!gl) throw new Error('sin webgl');
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
      const pr = this.pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(pr); gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      this.u = {};
      ['uImg', 'uDep', 'uRes', 'uTam', 'uCentro', 'uMirada', 'uFoco', 'uPush', 'uFuerza', 'uAlfa', 'uLuz', 'uGrano', 'uTiempo', 'uOscuro'].forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
      gl.uniform1i(this.u.uImg, 0); gl.uniform1i(this.u.uDep, 1);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      this.capas = [];
      this.medir();
    }
    medir() {
      const r = Math.min(devicePixelRatio || 1, 1.75);
      const w = Math.round(this.c.clientWidth * r), h = Math.round(this.c.clientHeight * r);
      if (w && h && (w !== this.c.width || h !== this.c.height)) { this.c.width = w; this.c.height = h; }
    }
    tex(img) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      return t;
    }
    // capa: { foto, prof, centro:[x,y], fuerza }
    async capa(op) {
      const [i, d] = await Promise.all([cargar(op.foto), cargar(op.prof)]);
      const c = { ...op, img: this.tex(i), dep: this.tex(d), tam: [i.naturalWidth, i.naturalHeight], push: 0, alfa: 1, luz: 0, oscuro: 0 };
      this.capas.push(c);
      return c;
    }
    async cambiar(capa, foto, prof) {
      const [i, d] = await Promise.all([cargar(foto), cargar(prof)]);
      const gl = this.gl; gl.deleteTexture(capa.img); gl.deleteTexture(capa.dep);
      capa.img = this.tex(i); capa.dep = this.tex(d); capa.tam = [i.naturalWidth, i.naturalHeight];
    }
    pintar(mx = 0, my = 0, t = 0) {
      const gl = this.gl, u = this.u;
      this.medir();
      gl.viewport(0, 0, this.c.width, this.c.height);
      gl.clearColor(0.05, 0.07, 0.06, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.uRes, this.c.width, this.c.height);
      gl.uniform2f(u.uMirada, mx, my);
      gl.uniform1f(u.uTiempo, t % 100);
      gl.uniform1f(u.uGrano, .045);
      for (const c of this.capas) {
        if (c.alfa <= 0.001) continue;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, c.img);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, c.dep);
        gl.uniform2f(u.uTam, c.tam[0], c.tam[1]);
        gl.uniform2f(u.uCentro, c.centro[0], c.centro[1]);
        const fo = c.foco || [.5, .5]; gl.uniform2f(u.uFoco, fo[0], fo[1]);
        gl.uniform1f(u.uPush, c.push);
        gl.uniform1f(u.uFuerza, c.fuerza);
        gl.uniform1f(u.uAlfa, c.alfa);
        gl.uniform1f(u.uLuz, c.luz);
        gl.uniform1f(u.uOscuro, c.oscuro);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  }
  window.Escena3D = Escena3D;
})();
