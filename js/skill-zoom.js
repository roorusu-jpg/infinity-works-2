/* v0.28.0: zoom and pan are confined to each skill-tree viewport. */
(() => {
  const configs = [
    [".skill-map-viewport", ".skill-map"],
    [".prestige-map-viewport", ".prestige-map"],
    [".astral-map-viewport", ".astral-map"]
  ];
  configs.forEach(([viewportSelector, mapSelector]) => {
    const viewport = document.querySelector(viewportSelector);
    const map = viewport?.querySelector(mapSelector);
    if (!viewport || !map) return;

    const baseWidth = map.offsetWidth;
    const baseHeight = map.offsetHeight;
    const layer = document.createElement("div");
    layer.className = "skill-zoom-layer";
    layer.style.width = baseWidth + "px";
    layer.style.height = baseHeight + "px";
    while (map.firstChild) layer.appendChild(map.firstChild);
    map.appendChild(layer);

    const controls = viewport.parentElement.querySelector(".skill-zoom-controls");
    const label = controls?.querySelector("[data-zoom-label]");
    let scale = 1;
    const pointers = new Map();
    let gesture = null;
    let moved = false;
    let suppressClick = false;

    const clamp = value => Math.min(2, Math.max(.5, value));
    const apply = (next, anchorX, anchorY) => {
      const old = scale;
      scale = clamp(next);
      const x = anchorX ?? viewport.clientWidth / 2;
      const y = anchorY ?? viewport.clientHeight / 2;
      const contentX = (viewport.scrollLeft + x) / old;
      const contentY = (viewport.scrollTop + y) / old;
      map.style.width = (baseWidth * scale) + "px";
      map.style.height = (baseHeight * scale) + "px";
      layer.style.transform = "scale(" + scale + ")";
      viewport.scrollLeft = contentX * scale - x;
      viewport.scrollTop = contentY * scale - y;
      if (label) label.textContent = Math.round(scale * 100) + "%";
    };

    controls?.querySelector("[data-zoom-in]")?.addEventListener("click", () => apply(scale + .1));
    controls?.querySelector("[data-zoom-out]")?.addEventListener("click", () => apply(scale - .1));
    controls?.querySelector("[data-zoom-reset]")?.addEventListener("click", () => {
      apply(1);
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    });

    viewport.addEventListener("wheel", event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      apply(scale * (event.deltaY < 0 ? 1.1 : .9), event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });

    viewport.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      viewport.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      moved = false;
      if (pointers.size === 1) {
        gesture = { type: "pan", x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        gesture = {
          type: "pinch",
          distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
          scale,
          centerX: (pts[0].x + pts[1].x) / 2,
          centerY: (pts[0].y + pts[1].y) / 2
        };
      }
    });

    viewport.addEventListener("pointermove", event => {
      if (!pointers.has(event.pointerId) || !gesture) return;
      const previous = pointers.get(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const pts = [...pointers.values()];
        const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const rect = viewport.getBoundingClientRect();
        const centerX = (pts[0].x + pts[1].x) / 2 - rect.left;
        const centerY = (pts[0].y + pts[1].y) / 2 - rect.top;
        if (Math.abs(distance - gesture.distance) > 1) moved = true;
        apply(gesture.scale * distance / Math.max(1, gesture.distance), centerX, centerY);
      } else if (gesture.type === "pan") {
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        if (Math.abs(dx) + Math.abs(dy) > 7) moved = true;
        if (moved) {
          viewport.scrollLeft = gesture.left - dx;
          viewport.scrollTop = gesture.top - dy;
        }
      }
    });

    const endPointer = event => {
      pointers.delete(event.pointerId);
      if (moved) suppressClick = true;
      if (pointers.size === 1) {
        const point = [...pointers.values()][0];
        gesture = { type: "pan", x: point.x, y: point.y, left: viewport.scrollLeft, top: viewport.scrollTop };
      } else gesture = null;
    };
    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
    viewport.addEventListener("click", event => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
  });
})();