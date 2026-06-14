const touch = {
  left: false,
  right: false,
  float: false,
  jumpTap: false,
  actionTap: false,
  pauseTap: false,
};

let active = false;
let visible = false;

export function isTouchUiActive() {
  return active;
}

export function isTouchUiVisible() {
  return active && visible;
}

export function setTouchUiVisible(show) {
  visible = show;
  const ui = document.getElementById('touch-ui');
  if (!ui || !active) return;
  ui.classList.toggle('on', show);
  if (!show) {
    touch.left = false;
    touch.right = false;
    touch.float = false;
    touch.jumpTap = false;
    touch.actionTap = false;
    touch.pauseTap = false;
  }
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
}

function bindTap(el, onTap) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTap();
  });
}

export function initTouch() {
  const ui = document.getElementById('touch-ui');
  if (!ui) return;

  const mobile = matchMedia('(pointer: coarse)').matches
    || navigator.maxTouchPoints > 0
    || window.innerWidth < 900;

  if (!mobile) {
    ui.remove();
    return;
  }

  active = true;

  bindHold(ui.querySelector('[data-act="left"]'), () => { touch.left = true; }, () => { touch.left = false; });
  bindHold(ui.querySelector('[data-act="right"]'), () => { touch.right = true; }, () => { touch.right = false; });
  bindHold(ui.querySelector('[data-act="float"]'), () => { touch.float = true; }, () => { touch.float = false; });
  bindTap(ui.querySelector('[data-act="jump"]'), () => { touch.jumpTap = true; });
  bindTap(ui.querySelector('[data-act="action"]'), () => { touch.actionTap = true; });
  bindTap(ui.querySelector('[data-act="pause"]'), () => { touch.pauseTap = true; });
}
