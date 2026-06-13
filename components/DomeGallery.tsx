"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useGesture } from "@use-gesture/react";
import "./DomeGallery.css";

type ImageItem = string | { src: string; alt?: string };

type DomeGalleryProps = {
  images?: ImageItem[];
  fit?: number;
  fitBasis?: "auto" | "min" | "max" | "width" | "height";
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
};

type ItemDef = { src: string; alt: string; x: number; y: number; sizeX: number; sizeY: number };

const DEFAULTS = { maxVerticalRotationDeg: 5, dragSensitivity: 20, enlargeTransitionMs: 300, segments: 35 };

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => { const a = (((deg + 180) % 360) + 360) % 360; return a - 180; };
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool: ImageItem[], seg: number): ItemDef[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];
  const coords = xCols.flatMap((x, c) => (c % 2 === 0 ? evenYs : oddYs).map(y => ({ x, y, sizeX: 2, sizeY: 2 })));
  if (pool.length === 0) return coords.map(c => ({ ...c, src: "", alt: "" }));
  const normalized = pool.map(img => typeof img === "string" ? { src: img, alt: "" } : { src: img.src || "", alt: img.alt || "" });
  const used = Array.from({ length: coords.length }, (_, i) => normalized[i % normalized.length]!);
  for (let i = 1; i < used.length; i++) {
    const cur = used[i], prev = used[i - 1];
    if (cur && prev && cur.src === prev.src) {
      for (let j = i + 1; j < used.length; j++) {
        const next = used[j];
        if (next && next.src !== cur.src) { used[i] = next; used[j] = cur; break; }
      }
    }
  }
  return coords.map((c, i) => ({ ...c, src: used[i]?.src ?? "", alt: used[i]?.alt ?? "" }));
}

function computeItemBaseRotation(ox: number, oy: number, sx: number, sy: number, seg: number) {
  const unit = 360 / seg / 2;
  return { rotateX: unit * (oy - (sy - 1) / 2), rotateY: unit * (ox + (sx - 1) / 2) };
}

export default function DomeGallery({
  images = [],
  fit = 0.8,
  fitBasis = "auto",
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = "#111111",
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth = "400px",
  openedImageHeight = "400px",
  imageBorderRadius = "16px",
  openedImageBorderRadius = "16px",
  grayscale = false,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const focusedElRef = useRef<HTMLElement | null>(null);
  const originalTilePositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);
  const scrollLockedRef = useRef(false);

  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return;
    scrollLockedRef.current = true;
    document.body.classList.add("dg-scroll-lock");
  }, []);

  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return;
    if (rootRef.current?.getAttribute("data-enlarging") === "true") return;
    scrollLockedRef.current = false;
    document.body.classList.remove("dg-scroll-lock");
  }, []);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  };

  const lockedRadiusRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(1, cr.width), h = Math.max(1, cr.height);
      const minDim = Math.min(w, h), maxDim = Math.max(w, h), aspect = w / h;
      let basis: number;
      switch (fitBasis) {
        case "min": basis = minDim; break;
        case "max": basis = maxDim; break;
        case "width": basis = w; break;
        case "height": basis = h; break;
        default: basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = clamp(Math.min(basis * fit, h * 1.35), minRadius, maxRadius);
      lockedRadiusRef.current = Math.round(radius);
      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty("--radius", `${lockedRadiusRef.current}px`);
      root.style.setProperty("--viewer-pad", `${viewerPad}px`);
      root.style.setProperty("--overlay-blur-color", overlayBlurColor);
      root.style.setProperty("--tile-radius", imageBorderRadius);
      root.style.setProperty("--enlarge-radius", openedImageBorderRadius);
      root.style.setProperty("--image-filter", grayscale ? "grayscale(1)" : "none");
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius, openedImageWidth, openedImageHeight]);

  useEffect(() => { applyTransform(rotationRef.current.x, rotationRef.current.y); }, []);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) { cancelAnimationFrame(inertiaRAF.current); inertiaRAF.current = null; }
  }, []);

  const startInertia = useCallback((vx: number, vy: number) => {
    let vX = clamp(vx, -1.4, 1.4) * 80, vY = clamp(vy, -1.4, 1.4) * 80;
    let frames = 0;
    const d = clamp(dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d, stopThreshold = 0.015 - 0.01 * d, maxFrames = Math.round(90 + 270 * d);
    const step = () => {
      vX *= frictionMul; vY *= frictionMul;
      if ((Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) || ++frames > maxFrames) { inertiaRAF.current = null; return; }
      const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
      const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
      rotationRef.current = { x: nextX, y: nextY };
      applyTransform(nextX, nextY);
      inertiaRAF.current = requestAnimationFrame(step);
    };
    stopInertia();
    inertiaRAF.current = requestAnimationFrame(step);
  }, [dragDampening, maxVerticalRotationDeg, stopInertia]);

  useGesture({
    onDragStart: ({ event }) => {
      if (focusedElRef.current) return;
      stopInertia();
      const evt = event as PointerEvent;
      draggingRef.current = true; movedRef.current = false;
      startRotRef.current = { ...rotationRef.current };
      startPosRef.current = { x: evt.clientX, y: evt.clientY };
    },
    onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
      if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;
      const evt = event as PointerEvent;
      const dxTotal = evt.clientX - startPosRef.current.x, dyTotal = evt.clientY - startPosRef.current.y;
      if (!movedRef.current && dxTotal * dxTotal + dyTotal * dyTotal > 16) movedRef.current = true;
      const nextX = clamp(startRotRef.current.x - dyTotal / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
      const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);
      if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) { rotationRef.current = { x: nextX, y: nextY }; applyTransform(nextX, nextY); }
      if (last) {
        draggingRef.current = false;
        let [vMagX, vMagY] = velocity; const [dirX, dirY] = direction;
        let vx = vMagX * dirX, vy = vMagY * dirY;
        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) { const [mx, my] = movement; vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2); vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2); }
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
        if (movedRef.current) lastDragEndAt.current = performance.now();
        movedRef.current = false;
      }
    }
  }, { target: mainRef, eventOptions: { passive: true } });

  const openItemFromElement = useCallback((el: HTMLElement) => {
    if (openingRef.current) return;
    openingRef.current = true; openStartedAtRef.current = performance.now(); lockScroll();
    const parent = el.parentElement as HTMLElement;
    focusedElRef.current = el; el.setAttribute("data-focused", "true");
    const offsetX = getDataNumber(parent, "offsetX", 0), offsetY = getDataNumber(parent, "offsetY", 0);
    const sizeX = getDataNumber(parent, "sizeX", 2), sizeY = getDataNumber(parent, "sizeY", 2);
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
    const parentY = normalizeAngle(parentRot.rotateY), globalY = normalizeAngle(rotationRef.current.y);
    let rotY = -(parentY + globalY) % 360; if (rotY < -180) rotY += 360;
    const rotX = -parentRot.rotateX - rotationRef.current.x;
    parent.style.setProperty("--rot-y-delta", `${rotY}deg`); parent.style.setProperty("--rot-x-delta", `${rotX}deg`);
    const refDiv = document.createElement("div");
    refDiv.className = "item__image item__image--reference"; refDiv.style.opacity = "0";
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv); void refDiv.offsetHeight;
    const tileR = refDiv.getBoundingClientRect(), mainR = mainRef.current?.getBoundingClientRect(), frameR = frameRef.current?.getBoundingClientRect();
    if (!mainR || !frameR || tileR.width <= 0) { openingRef.current = false; focusedElRef.current = null; parent.removeChild(refDiv); unlockScroll(); return; }
    originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
    el.style.visibility = "hidden";
    const overlay = document.createElement("div");
    overlay.className = "enlarge"; overlay.style.cssText = `position:absolute;left:${frameR.left-mainR.left}px;top:${frameR.top-mainR.top}px;width:${frameR.width}px;height:${frameR.height}px;opacity:0;z-index:30;will-change:transform,opacity;transform-origin:top left;transition:transform ${enlargeTransitionMs}ms ease,opacity ${enlargeTransitionMs}ms ease;`;
    const img = document.createElement("img"); img.src = parent.dataset.src || (el.querySelector("img") as HTMLImageElement)?.src || "";
    overlay.appendChild(img); viewerRef.current!.appendChild(overlay);
    const tx0 = tileR.left - frameR.left, ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width, sy0 = tileR.height / frameR.height;
    overlay.style.transform = `translate(${tx0}px,${ty0}px) scale(${isFinite(sx0)&&sx0>0?sx0:1},${isFinite(sy0)&&sy0>0?sy0:1})`;
    setTimeout(() => { if (!overlay.parentElement) return; overlay.style.opacity = "1"; overlay.style.transform = "translate(0px,0px) scale(1,1)"; rootRef.current?.setAttribute("data-enlarging", "true"); }, 16);
  }, [segments, enlargeTransitionMs, lockScroll, unlockScroll]);

  const onTileClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingRef.current || movedRef.current || performance.now() - lastDragEndAt.current < 80 || openingRef.current) return;
    openItemFromElement(e.currentTarget);
  }, [openItemFromElement]);

  useEffect(() => {
    const scrim = scrimRef.current; if (!scrim) return;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current; if (!el) return;
      const parent = el.parentElement as HTMLElement;
      const overlay = viewerRef.current?.querySelector(".enlarge") as HTMLElement | null; if (!overlay) return;
      const refDiv = parent.querySelector(".item__image--reference") as HTMLElement | null;
      const originalPos = originalTilePositionRef.current;
      if (!originalPos) { overlay.remove(); if (refDiv) refDiv.remove(); parent.style.setProperty("--rot-y-delta","0deg"); parent.style.setProperty("--rot-x-delta","0deg"); el.style.visibility=""; focusedElRef.current=null; rootRef.current?.removeAttribute("data-enlarging"); openingRef.current=false; unlockScroll(); return; }
      const currentRect = overlay.getBoundingClientRect(), rootRect = rootRef.current!.getBoundingClientRect();
      const animating = document.createElement("div");
      animating.className = "enlarge-closing";
      animating.style.cssText = `position:absolute;left:${currentRect.left-rootRect.left}px;top:${currentRect.top-rootRect.top}px;width:${currentRect.width}px;height:${currentRect.height}px;z-index:9999;border-radius:var(--enlarge-radius,32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;`;
      const origImg = overlay.querySelector("img"); if (origImg) { const i = origImg.cloneNode() as HTMLImageElement; i.style.cssText="width:100%;height:100%;object-fit:cover;"; animating.appendChild(i); }
      overlay.remove(); rootRef.current!.appendChild(animating); void animating.getBoundingClientRect();
      requestAnimationFrame(() => { animating.style.left=`${originalPos.left-rootRect.left}px`; animating.style.top=`${originalPos.top-rootRect.top}px`; animating.style.width=`${originalPos.width}px`; animating.style.height=`${originalPos.height}px`; animating.style.opacity="0"; });
      animating.addEventListener("transitionend", () => {
        animating.remove(); originalTilePositionRef.current=null;
        if (refDiv) refDiv.remove();
        parent.style.setProperty("--rot-y-delta","0deg"); parent.style.setProperty("--rot-x-delta","0deg");
        requestAnimationFrame(() => { el.style.visibility=""; el.style.opacity="0"; focusedElRef.current=null; rootRef.current?.removeAttribute("data-enlarging");
          requestAnimationFrame(() => { el.style.transition="opacity 300ms ease-out"; requestAnimationFrame(() => { el.style.opacity="1"; setTimeout(()=>{ el.style.transition=""; el.style.opacity=""; openingRef.current=false; if (!draggingRef.current) document.body.classList.remove("dg-scroll-lock"); },300); }); });
        });
      }, { once: true });
    };
    scrim.addEventListener("click", close);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => { scrim.removeEventListener("click", close); window.removeEventListener("keydown", onKey); };
  }, [enlargeTransitionMs, unlockScroll]);

  useEffect(() => () => { document.body.classList.remove("dg-scroll-lock"); }, []);

  return (
    <div ref={rootRef} className="sphere-root" style={{ ["--segments-x" as string]: segments, ["--segments-y" as string]: segments, ["--overlay-blur-color" as string]: overlayBlurColor, ["--tile-radius" as string]: imageBorderRadius, ["--enlarge-radius" as string]: openedImageBorderRadius, ["--image-filter" as string]: grayscale ? "grayscale(1)" : "none" } as React.CSSProperties}>
      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div key={`${it.x},${it.y},${i}`} className="item" data-src={it.src} data-offset-x={it.x} data-offset-y={it.y} data-size-x={it.sizeX} data-size-y={it.sizeY} style={{ ["--offset-x" as string]: it.x, ["--offset-y" as string]: it.y, ["--item-size-x" as string]: it.sizeX, ["--item-size-y" as string]: it.sizeY } as React.CSSProperties}>
                <div className="item__image" role="button" tabIndex={0} aria-label={it.alt || "Open image"} onClick={onTileClick}>
                  <img src={it.src} draggable={false} alt={it.alt} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />
        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  );
}
