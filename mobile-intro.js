(() => {
  const root = document.documentElement;
  const mobile = matchMedia("(max-width: 900px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const intro = document.querySelector(".mobile-intro");
  root.classList.remove("mobile-intro-pending");
  if (!mobile.matches || location.hash || typeof intro?.showModal !== "function") return;

  const sourceMetrics = [...document.querySelectorAll(".h-stats .stat")];
  if (sourceMetrics.length !== 4) return;
  const rows = sourceMetrics.map((metric) => {
    const row = document.createElement("li");
    row.className = "mobile-intro__row";
    const value = document.createElement("strong");
    value.textContent = metric.querySelector("b").textContent.trim();
    const label = metric.querySelector("span").cloneNode(true);
    label.querySelectorAll("br").forEach((lineBreak) => lineBreak.replaceWith(" "));
    row.append(value, label);
    return row;
  });
  intro.querySelector(".mobile-intro__metrics").append(...rows);

  const count = intro.querySelector(".mobile-intro__count");
  const next = intro.querySelector(".mobile-intro__next");
  const skip = intro.querySelector(".mobile-intro__skip");
  const progress = intro.querySelector(".mobile-intro__progress");
  const markers = rows.map(() => document.createElement("i"));
  progress.append(...markers);

  const threshold = 54;
  let current = 0;
  let swipe = null;
  let wheelDistance = 0;
  let lastWheel = -Infinity;
  let wheelCommitted = false;
  let closing = false;
  let exitTimer = 0;

  function render() {
    rows.forEach((row, index) => {
      if (index > current) {
        delete row.dataset.state;
        row.setAttribute("aria-hidden", "true");
      } else {
        row.dataset.state = index === current ? "current" : "past";
        row.removeAttribute("aria-hidden");
      }

      if (index === current) row.setAttribute("aria-current", "step");
      else row.removeAttribute("aria-current");
      markers[index].classList.toggle("current", index === current);
    });
    count.textContent = String(current + 1).padStart(2, "0") + " / " + String(rows.length).padStart(2, "0");
    next.textContent = current === rows.length - 1 ? "포트폴리오 ↓" : "다음 ↓";
  }

  function closeImmediately(focusMain) {
    clearTimeout(exitTimer);
    if (!intro.open) return;
    intro.close();
    root.classList.remove("mobile-intro-open");
    delete intro.dataset.closing;
    if (!focusMain) return;

    window.scrollTo({ top: 0, behavior: "instant" });
    const title = document.querySelector(".band-head h1");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    title.removeAttribute("tabindex");
  }

  function finish() {
    if (closing) return;
    closing = true;
    if (reducedMotion.matches) {
      closeImmediately(true);
      return;
    }
    intro.dataset.closing = "";
    exitTimer = window.setTimeout(() => closeImmediately(true), 300);
  }

  function step(direction) {
    if (closing) return;
    if (direction > 0 && current === rows.length - 1) {
      finish();
      return;
    }
    const destination = Math.max(0, current + direction);
    if (destination === current) return;
    current = destination;
    render();
  }

  intro.addEventListener("wheel", (event) => {
    if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 155) {
      wheelDistance = 0;
      wheelCommitted = false;
    }
    lastWheel = now;
    if (wheelCommitted) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? intro.clientHeight : 1;
    wheelDistance += event.deltaY * unit;
    if (Math.abs(wheelDistance) < threshold) return;
    wheelCommitted = true;
    step(Math.sign(wheelDistance));
  }, { passive: false });

  intro.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.pointerType === "mouse" || event.target.closest("button")) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    intro.setPointerCapture(event.pointerId);
  });
  intro.addEventListener("pointermove", (event) => {
    if (!swipe || swipe.id !== event.pointerId || swipe.moved) return;
    const y = swipe.y - event.clientY;
    if (Math.abs(y) < threshold || Math.abs(y) <= Math.abs(swipe.x - event.clientX)) return;
    swipe.moved = true;
    step(Math.sign(y));
  });
  function endSwipe(event) {
    if (swipe?.id === event.pointerId) swipe = null;
  }
  intro.addEventListener("pointerup", endSwipe);
  intro.addEventListener("pointercancel", endSwipe);
  intro.addEventListener("keydown", (event) => {
    const direction = {
      ArrowDown: 1,
      PageDown: 1,
      ArrowUp: -1,
      PageUp: -1,
    }[event.key];
    if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    if (!event.repeat) step(direction);
  });
  intro.addEventListener("cancel", (event) => {
    event.preventDefault();
    finish();
  });
  next.addEventListener("click", () => step(1));
  skip.addEventListener("click", finish);
  mobile.addEventListener("change", () => {
    if (!mobile.matches) closeImmediately(false);
  });
  window.addEventListener("hashchange", () => {
    if (location.hash) closeImmediately(false);
  });

  render();
  intro.showModal();
  root.classList.add("mobile-intro-open", "mobile-intro-seen");
})();
