const touch = {
  left: false,
  right: false,
  float: false,
  jumpTap: false,
  actionTap: false,
  pauseTap: false,
};

let active = false;

export function isTouchUiActive() {
  return active;
}

export function getTouchState() {
  return touch;
}

function bindHold(el, onDown, onUp) {
  const start = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDown();
  };
  const end = (e) => {
    e?.preventDefault?.();
    onUp();
  };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointerleave', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

function bindTap(el, onTap) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTap();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function initTouch() {
  const ui = document.getElementById('touch-ui');
  if (!ui) return;

  const mobile = matchMedia('(pointer: coarse)').matches || window.innerWidth < 960;
  if (!mobile) {
    ui.remove();
    return;
  }

  active = true;
  ui.classList.add('on');

  bindHold(ui.querySelector('[data-act="left"]'), () => { touch.left = true; }, () => { touch.left = false; });
  bindHold(ui.querySelector('[data-act="right"]'), () => { touch.right = true; }, () => { touch.right = false; });
  bindHold(ui.querySelector('[data-act="float"]'), () => { touch.float = true; }, () => { touch.float = false; });
  bindTap(ui.querySelector('[data-act="jump"]'), () => { touch.jumpTap = true; });
  bindTap(ui.querySelector('[data-act="action"]'), () => { touch.actionTap = true; });
  bindTap(ui.querySelector('[data-act="pause"]'), () => { touch.pauseTap = true; });
}

export function consumeTouchFlags() {
  const j = touch.jumpTap;
  const a = touch.actionTap;
  const p = touch.pauseTap;
  touch.jumpTap = false;
  touch.actionTap = false;
  touch.pauseTap = false;
  return { jumpTap: j, actionTap: a, pauseTap: p };
}
