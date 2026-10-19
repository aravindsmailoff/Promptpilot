"use client";

import React, { useEffect, useRef } from "react";

export interface TickerItem {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  change?: number; // % vs open
  good?: "up" | "down";
  vol?: number;
  live?: boolean;
}

export interface TickerLane {
  size: "lg" | "md" | "sm";
  speed?: number;
  reverse?: boolean;
  label?: string;
  items: TickerItem[];
}

export interface VsTickerProps {
  dir?: "left" | "right";
  theme?: "dark" | "light";
  palette?: "classic" | "teal" | "cb";
  speedMultiplier?: number;
  className?: string;
  lanes?: TickerLane[];
}

const DEFAULT_LANES: TickerLane[] = [
  {
    size: "lg",
    speed: 46,
    label: "AI Neural Core & Output",
    items: [
      { label: "Tokens/sec", value: 1428, change: 4.2, good: "up", vol: 0.007 },
      { label: "p95 Latency", value: 38, suffix: "ms", change: -6.4, good: "down", vol: 0.02 },
      { label: "Prompt Score", value: 98.4, decimals: 1, suffix: "%", change: 1.8, good: "up", vol: 0.004 },
      { label: "Active Agents", value: 284, change: 8.5, good: "up", vol: 0.015 },
      { label: "Token Savings", value: 42.60, decimals: 2, prefix: "$", change: 3.1, good: "up", vol: 0.006 },
      { label: "Cache Hit Rate", value: 96.8, decimals: 1, suffix: "%", change: 0.9, good: "up", vol: 0.002 },
      { label: "Missions/hr", value: 3840, change: 5.7, good: "up", vol: 0.005 },
      { label: "Routing Errors", value: 0, decimals: 2, suffix: "%", change: -12.0, good: "down", vol: 0.01 },
    ],
  },
  {
    size: "md",
    speed: 32,
    reverse: true,
    label: "Model Fleet Telemetry",
    items: [
      { label: "Claude 3.5 Sonnet", value: 99.4, decimals: 1, suffix: "%", change: 0.6, good: "up", vol: 0.003 },
      { label: "GPT-4o Speed", value: 112, suffix: " t/s", change: 3.8, good: "up", vol: 0.01 },
      { label: "Gemini Context", value: 1.85, decimals: 2, suffix: "M", change: 0.2, good: "up", vol: 0.001 },
      { label: "DeepSeek R1 Cost", value: 0.0014, decimals: 4, prefix: "$", change: -4.5, good: "down", vol: 0.02 },
      { label: "Routing Accuracy", value: 99.8, decimals: 1, suffix: "%", change: 0.1, good: "up", vol: 0.001 },
      { label: "Fleet Queue", value: 2, change: -25.0, good: "down", vol: 0.04 },
      { label: "Flux Schnell Gen", value: 1.4, decimals: 1, suffix: "s", change: -8.0, good: "down", vol: 0.02 },
      { label: "Local Ollama VRAM", value: 6.8, decimals: 1, suffix: "GB", change: 1.2, good: "down", vol: 0.01 },
    ],
  },
  {
    size: "sm",
    speed: 22,
    label: "Edge Network & Global Cluster",
    items: [
      { label: "us-east-1", value: 24, suffix: "ms", change: -3.2, good: "down", vol: 0.02 },
      { label: "eu-west", value: 38, suffix: "ms", change: -1.8, good: "down", vol: 0.02 },
      { label: "ap-south", value: 54, suffix: "ms", change: 2.1, good: "down", vol: 0.02 },
      { label: "GPU Tensor Load", value: 72.4, decimals: 1, suffix: "%", change: 3.5, good: "down", vol: 0.01 },
      { label: "Webhooks/min", value: 12480, change: 4.8, good: "up", vol: 0.006 },
      { label: "Memory Pool", value: 94.2, decimals: 1, suffix: "%", change: 0.3, good: "up", vol: 0.001 },
      { label: "Cluster Uptime", value: 99.99, decimals: 2, suffix: "%", change: 0.01, good: "up", vol: 0.0001 },
      { label: "Sync Dispatches", value: 894, change: 1.4, good: "up", vol: 0.008 },
    ],
  },
];

export function VsTicker({
  dir = "left",
  theme = "dark",
  palette = "classic",
  speedMultiplier = 1,
  className = "",
  lanes = DEFAULT_LANES,
}: VsTickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ARROW =
      '<svg class="vs-ticker-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2 13 10.4H3Z" fill="currentColor"/></svg>';
    const HIST = 20;

    const gauss = () => {
      let u = 0;
      while (!u) u = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
    };

    const spring = (s: { x: number; v: number; g: number }, k: number, c: number, dt: number) => {
      for (let h = 0; h < dt; h += 1 / 120) {
        const t = Math.min(1 / 120, dt - h);
        s.v += (-k * (s.x - s.g) - c * s.v) * t;
        s.x += s.v * t;
      }
      if (Math.abs(s.x - s.g) < 1e-3 && Math.abs(s.v) < 1e-2) {
        s.x = s.g;
        s.v = 0;
        return false;
      }
      return true;
    };

    function makeItem(li: HTMLElement) {
      const d = li.dataset;
      const dec = parseInt(d.decimals || "0", 10);
      const nf = new Intl.NumberFormat(d.locale || "en-US", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
      const value = parseFloat(d.value || "0") || 0;
      const base = value / (1 + (parseFloat(d.change || "0") || 0) / 100);
      const m: any = {
        label: li.textContent?.trim() || "",
        dec,
        good: d.good === "down" ? "down" : "up",
        vol: parseFloat(d.vol || "0.004") || 0.004,
        live: d.live !== "off",
        value,
        base,
        anchor: value,
        hist: [],
        insts: [],
        cols: [],
        pattern: "",
        rot: { x: 0, v: 0, g: 0 },
        nextAt: 0,
        busy: false,
        hotT: 0,
        fmt: (v: number) => (d.prefix || "") + nf.format(v) + (d.suffix || ""),
      };

      let v = base;
      for (let i = 0; i < HIST - 1; i++) {
        v += (value - v) * 0.18 + gauss() * m.vol * value * 1.1;
        m.hist.push(v);
      }
      m.hist.push(value);

      li.classList.add("vs-ticker-item");
      li.textContent = "";
      li.innerHTML = `<span class="vs-ticker-flash" aria-hidden="true"></span><span class="vs-ticker-name"></span><span class="vs-ticker-fig"><span class="vs-ticker-val"></span></span><span class="vs-ticker-chg">${ARROW}<span></span></span><svg class="vs-ticker-spark" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><polyline/></svg>`;
      const nameEl = li.querySelector(".vs-ticker-name");
      if (nameEl) nameEl.textContent = m.label;
      m.li = li;
      return m;
    }

    const bindInst = (m: any, li: HTMLElement) => {
      const inst = {
        li,
        val: li.querySelector(".vs-ticker-val") as HTMLElement,
        txt: li.querySelector(".vs-ticker-chg > span") as HTMLElement,
        arrow: li.querySelector(".vs-ticker-arrow") as HTMLElement,
        poly: li.querySelector("polyline") as SVGPolylineElement,
      };
      m.insts.push(inst);
      return inst;
    };

    const digitsOf = (s: string) => [...s].filter((c) => c >= "0" && c <= "9").map(Number);

    const paintCol = (c: any) => {
      const q = ((c.x % 10) + 10) % 10;
      const t = `translate3d(0,${(-q * 1.1).toFixed(4)}em,0)`;
      c.strips.forEach((s: HTMLElement) => (s.style.transform = t));
    };

    function layout(m: any) {
      const str = m.fmt(m.value);
      const pat = str.replace(/\d/g, "0");
      m.pattern = pat;
      m.cols = [];
      const ds = digitsOf(str);
      let di = 0;
      for (const ch of str) {
        if (ch >= "0" && ch <= "9") {
          m.cols.push({ x: ds[di], v: 0, g: ds[di], due: 0, strips: [] });
          di++;
        }
      }
      m.insts.forEach((inst: any) => {
        inst.val.textContent = "";
        let k = 0;
        for (const ch of str) {
          if (ch >= "0" && ch <= "9") {
            const col = document.createElement("span");
            col.className = "vs-ticker-col";
            const strip = document.createElement("span");
            strip.className = "vs-ticker-strip";
            strip.innerHTML =
              "<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>0</span>";
            col.appendChild(strip);
            inst.val.appendChild(col);
            m.cols[k++].strips.push(strip);
          } else {
            const s = document.createElement("span");
            s.className = "vs-ticker-sep";
            s.textContent = ch;
            inst.val.appendChild(s);
          }
        }
        inst.val.setAttribute("aria-label", str);
      });
      m.cols.forEach(paintCol);
    }

    function paintMeta(m: any) {
      const net = ((m.value - m.base) / m.base) * 100;
      const r = Math.abs(net) < 0.005 ? 0 : net;
      const txt = Math.abs(r).toFixed(Math.abs(r) < 0.1 ? 2 : 1) + "%";
      m.rot.g = r < 0 ? 180 : r === 0 ? 90 : 0;
      const tone = r === 0 ? "flat" : (r > 0) === (m.good === "up") ? "good" : "bad";
      const lo = Math.min(...m.hist);
      const hi = Math.max(...m.hist);
      const span = hi - lo || 1;
      const pts = m.hist
        .map(
          (v: number, i: number) =>
            `${((i / (HIST - 1)) * 100).toFixed(1)},${(18 - ((v - lo) / span) * 16).toFixed(2)}`
        )
        .join(" ");
      m.insts.forEach((inst: any) => {
        inst.txt.textContent = txt;
        inst.li.dataset.net = tone;
        inst.poly.setAttribute("points", pts);
      });
    }

    function setValue(m: any, next: number, now: number, animate: boolean) {
      const prev = m.value;
      if (next === prev) return null;
      m.value = next;
      m.hist.push(next);
      if (m.hist.length > HIST) m.hist.shift();
      const str = m.fmt(next);
      const dir = next > prev ? 1 : -1;
      const tick = (dir > 0) === (m.good === "up") ? "good" : "bad";

      if (str.replace(/\d/g, "0") !== m.pattern) {
        layout(m);
      } else {
        const ds = digitsOf(str);
        const n = m.cols.length;
        m.cols.forEach((c: any, i: number) => {
          const cur = ((Math.round(c.g) % 10) + 10) % 10;
          if (cur === ds[i]) return;
          const steps = ((ds[i] - cur) * dir + 10) % 10;
          c.g = Math.round(c.g) + steps * dir;
          c.due = now + (n - 1 - i) * 32;
          if (!animate) {
            c.x = c.g;
            c.v = 0;
            paintCol(c);
          }
        });
        m.insts.forEach((inst: any) => inst.val.setAttribute("aria-label", str));
      }

      m.insts.forEach((inst: any) => {
        inst.li.dataset.tick = tick;
        if (animate) inst.li.classList.add("is-hot");
      });
      if (animate) m.hotT = now + 70;
      m.busy = animate;
      paintMeta(m);
      if (!animate) {
        m.rot.x = m.rot.g;
        m.insts.forEach((inst: any) => (inst.arrow.style.transform = `rotate(${m.rot.x}deg)`));
      }
      return { prev, tick };
    }

    const items: any[] = [];
    const laneElements = Array.from(root.querySelectorAll(".vs-ticker-lane")) as HTMLElement[];

    const lanesData = laneElements.map((lane) => {
      let track = lane.querySelector(".vs-ticker-track") as HTMLElement | null;
      const list = lane.querySelector(".vs-ticker-list") as HTMLElement;
      if (!list) return null;

      if (!track) {
        track = document.createElement("div");
        track.className = "vs-ticker-track";
        if (list.parentNode === lane) {
          lane.insertBefore(track, list);
          track.appendChild(list);
        } else {
          lane.appendChild(track);
          track.appendChild(list);
        }
      }

      const models = Array.from(list.children).map((li) => makeItem(li as HTMLElement));
      models.forEach((m) => {
        bindInst(m, m.li);
        items.push(m);
      });

      lane.tabIndex = 0;
      lane.setAttribute("role", "marquee");

      return {
        lane,
        track,
        list,
        models,
        clones: [] as HTMLElement[],
        x: 0,
        v: 0,
        a: 0,
        setW: 1,
        hover: false,
        focus: false,
        paused: false,
        drag: null as any,
        coast: false,
        speed: parseFloat(lane.dataset.speed || "40") || 40,
        rev: lane.hasAttribute("data-reverse"),
      };
    }).filter((L): L is NonNullable<typeof L> => Boolean(L));

    items.forEach((m) => {
      layout(m);
      paintMeta(m);
      m.rot.x = m.rot.g;
      if (m.insts[0]?.arrow) {
        m.insts[0].arrow.style.transform = `rotate(${m.rot.x}deg)`;
      }
    });

    let mul = speedMultiplier;
    let dirSign = root.getAttribute("data-vs-ticker-dir") === "right" ? -1 : 1;

    const fill = (L: any) => {
      if (reduced) return;
      L.setW = L.list.getBoundingClientRect().width || 1;
      const need = Math.max(1, Math.ceil(L.lane.clientWidth / L.setW) + 1);
      while (L.clones.length < need) {
        const c = L.list.cloneNode(true) as HTMLElement;
        c.setAttribute("aria-hidden", "true");
        Array.from(c.children).forEach((li, i) => {
          (li as HTMLElement).classList.remove("is-hot");
          const m = L.models[i];
          bindInst(m, li as HTMLElement);
          let k = 0;
          li.querySelectorAll(".vs-ticker-strip").forEach((s) => {
            m.cols[k++]?.strips.push(s as HTMLElement);
          });
        });
        L.track.appendChild(c);
        L.clones.push(c);
      }
    };

    const ro = new ResizeObserver(() => lanesData.forEach(fill));
    lanesData.forEach((L) => {
      ro.observe(L.lane);
      ro.observe(L.list);
    });

    if (reduced) root.classList.add("is-static");

    // Gesture & mouse interaction
    lanesData.forEach((L) => {
      const el = L.lane;
      el.addEventListener("pointerenter", (e: PointerEvent) => {
        if (e.pointerType === "mouse") L.hover = true;
      });
      el.addEventListener("pointerleave", (e: PointerEvent) => {
        if (e.pointerType === "mouse") L.hover = false;
      });

      el.addEventListener("pointerdown", (e: PointerEvent) => {
        if (reduced || e.button > 0) return;
        L.drag = {
          id: e.pointerId,
          x0: e.clientX,
          off0: L.x,
          lx: e.clientX,
          lt: performance.now(),
          vel: 0,
          moved: false,
        };
      });

      el.addEventListener("pointermove", (e: PointerEvent) => {
        const D = L.drag;
        if (!D || D.id !== e.pointerId) return;
        if (!D.moved && Math.abs(e.clientX - D.x0) > 4) {
          D.moved = true;
          el.setPointerCapture(e.pointerId);
          el.classList.add("is-drag");
        }
        if (!D.moved) return;
        const now = performance.now();
        const dt = Math.max(1, now - D.lt) / 1000;
        const inst = -(e.clientX - D.lx) / dt;
        D.vel = D.vel * 0.6 + inst * 0.4;
        D.lx = e.clientX;
        D.lt = now;
        L.x = D.off0 - (e.clientX - D.x0);
        kick();
      });

      const end = (e: PointerEvent) => {
        const D = L.drag;
        if (!D || D.id !== e.pointerId) return;
        L.drag = null;
        el.classList.remove("is-drag");
        if (D.moved) {
          const idle = performance.now() - D.lt > 90;
          L.v = idle ? 0 : Math.max(-4000, Math.min(4000, D.vel));
          L.a = 0;
          L.coast = true;
        }
        if (e.pointerType !== "mouse") L.hover = false;
      };

      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);

      el.addEventListener("focus", () => {
        L.focus = true;
      });
      el.addEventListener("blur", () => {
        L.focus = false;
        L.paused = false;
      });

      el.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") {
          L.paused = !L.paused;
          L.focus = L.paused;
          e.preventDefault();
        } else if (e.key === "ArrowRight") {
          L.v += 700;
          L.coast = true;
          e.preventDefault();
        } else if (e.key === "ArrowLeft") {
          L.v -= 700;
          L.coast = true;
          e.preventDefault();
        }
        kick();
      });
    });

    let raf = 0;
    let last = 0;
    let visible = false;
    let globalPause = false;

    const tickItem = (m: any, now: number) => {
      m.anchor += (m.base * (1 + (Math.random() - 0.45) * 0.06) - m.anchor) * 0.05;
      let next = m.value + (m.anchor - m.value) * 0.08 + gauss() * m.vol * m.value;
      const q = Math.pow(10, m.dec);
      next = Math.round(next * q) / q;
      if (next === m.value) {
        next = Math.round((m.value + (Math.random() < 0.5 ? -1 : 1) / q) * q) / q;
      }
      if (next <= 0) next = m.value;
      const r = setValue(m, next, now, !reduced);
      if (r) {
        root.dispatchEvent(
          new CustomEvent("vs-ticker:tick", {
            detail: { label: m.label, value: next, prev: r.prev, good: r.tick === "good" },
          })
        );
      }
    };

    const schedule = (m: any, now: number) => (m.nextAt = now + 800 + Math.random() * 1200);
    items.forEach((m) => (m.nextAt = performance.now() + 300 + Math.random() * 1600));

    function frame(now: number) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;

      lanesData.forEach((L) => {
        if (L.drag && L.drag.moved) {
          L.v = L.drag.vel;
          L.a = 0;
        } else {
          const stop = L.hover || L.focus || L.paused || globalPause;
          const target = stop ? 0 : L.speed * mul * dirSign * (L.rev ? -1 : 1);
          const w = L.coast ? 1.7 : 4.2;
          L.a += (w * w * (target - L.v) - 2 * w * L.a) * dt;
          L.v += L.a * dt;
          if (L.coast && Math.abs(L.v - target) < 2) L.coast = false;
          L.x += L.v * dt;
        }
        const W = L.setW;
        const x = ((L.x % W) + W) % W;
        L.track.style.transform = `translate3d(${(-x).toFixed(2)}px,0,0)`;
      });

      items.forEach((m) => {
        if (m.live && now >= m.nextAt) {
          tickItem(m, now);
          schedule(m, now);
        }
        if (m.hotT && now >= m.hotT) {
          m.hotT = 0;
          m.insts.forEach((i: any) => i.li.classList.remove("is-hot"));
        }
        if (m.busy) {
          let moving = false;
          m.cols.forEach((c: any) => {
            if (now < c.due) {
              moving = true;
              return;
            }
            if (c.x !== c.g || c.v) {
              if (spring(c, 230, 21, dt)) moving = true;
              paintCol(c);
            }
          });
          if (m.rot.x !== m.rot.g || m.rot.v) {
            if (spring(m.rot, 320, 16, dt)) moving = true;
            const t = `rotate(${m.rot.x.toFixed(2)}deg)`;
            m.insts.forEach((i: any) => (i.arrow.style.transform = t));
          }
          m.busy = moving;
        }
      });

      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
      if (!raf) last = 0;
    }

    const kick = () => {
      if (!raf && visible && !document.hidden && !reduced) {
        raf = requestAnimationFrame(frame);
      }
    };

    let timer: any = 0;
    const slow = () => {
      const now = performance.now();
      items.forEach((m) => {
        if (m.live && now >= m.nextAt) {
          tickItem(m, now);
          schedule(m, now);
        }
      });
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting || false;
      if (reduced) {
        clearInterval(timer);
        if (visible) timer = setInterval(slow, 400);
      } else {
        kick();
      }
    });
    io.observe(root);

    const onVisChange = () => kick();
    document.addEventListener("visibilitychange", onVisChange);

    // Expose API on element
    (root as any).vsTicker = {
      set: (label: string, value: number) => {
        const m = items.find((i) => i.label === label);
        if (m) {
          setValue(m, value, performance.now(), !reduced);
          kick();
        }
      },
      pause: () => {
        globalPause = true;
      },
      play: () => {
        globalPause = false;
        kick();
      },
      lanes: () => lanesData.map((L) => ({ x: L.x, v: L.v, width: L.setW })),
    };

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
      lanesData.forEach((L) => {
        if (L) {
          L.clones.forEach((c) => c.remove());
        }
      });
    };
  }, [speedMultiplier]);

  return (
    <div
      ref={rootRef}
      className={`vs-ticker rounded-3xl border border-white/10 shadow-2xl ${className}`}
      data-vs-ticker-dir={dir}
      data-vs-ticker-theme={theme}
      data-vs-ticker-palette={palette}
    >
      {lanes.map((lane, laneIdx) => (
        <div
          key={laneIdx}
          className="vs-ticker-lane"
          data-size={lane.size}
          data-speed={lane.speed || 40}
          data-reverse={lane.reverse ? "" : undefined}
          aria-label={lane.label || `Ticker lane ${laneIdx + 1}`}
        >
          <div className="vs-ticker-track">
            <ul className="vs-ticker-list">
              {lane.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  data-value={item.value}
                  data-decimals={item.decimals}
                  data-prefix={item.prefix}
                  data-suffix={item.suffix}
                  data-change={item.change}
                  data-good={item.good || "up"}
                  data-vol={item.vol}
                  data-live={item.live === false ? "off" : undefined}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
