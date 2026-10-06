"use client";

import { useEffect, useRef } from "react";
import { isFancyDesktop } from "@/lib/perf";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  vec2 q = vec2(fbm(p * 1.5 + t), fbm(p * 1.5 + vec2(5.2, 1.3) - t));
  float f = fbm(p * 1.4 + 3.2 * q);

  vec3 ink = vec3(0.02, 0.0, 0.06);
  vec3 grape = vec3(0.30, 0.08, 0.52);
  vec3 violet = vec3(0.50, 0.30, 0.95);
  vec3 cyan = vec3(0.18, 0.80, 0.95);
  vec3 magenta = vec3(0.85, 0.25, 0.92);
  vec3 accent = mix(magenta, cyan, smoothstep(0.25, 0.75, uScroll));

  vec3 col = mix(ink, grape, smoothstep(0.25, 0.85, f));
  col = mix(col, violet, smoothstep(0.6, 1.1, length(q)) * 0.4);
  col += accent * pow(max(f - 0.52, 0.0) * 2.4, 2.0) * 0.32;

  float d = length(p - m);
  col += vec3(0.55, 0.38, 1.0) * (0.10 / (d * d * 7.0 + 0.16));

  float vig = smoothstep(1.3, 0.15, length(gl_FragCoord.xy / uRes - 0.5) * 1.7);
  col *= mix(0.45, 1.0, vig) * 0.85;
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

export default function Shader() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !isFancyDesktop()) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "p");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uScroll = gl.getUniformLocation(prog, "uScroll");

    const mouse = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    let scroll = 0;
    let raf = 0;
    let lastDraw = 0;
    const start = performance.now();

    const resize = () => {
      canvas.width = Math.max(2, Math.floor(window.innerWidth * 0.35));
      canvas.height = Math.max(2, Math.floor(window.innerHeight * 0.35));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll = max > 0 ? window.scrollY / max : 0;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - lastDraw < 33) return;
      lastDraw = now;
      mouse.x += (target.x - mouse.x) * 0.1;
      mouse.y += (target.y - mouse.y) * 0.1;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uScroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize();
    onScroll();
    document.documentElement.classList.add("shader");
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("shader");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="fixed inset-0 -z-20 h-full w-full" />;
}
