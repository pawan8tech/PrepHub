/**
 * Caret position inside `container` for `position: absolute` UI (sibling of `textarea`).
 * Mirror div copies computed styles; accounts for textarea scroll and offset within container.
 */
export function getCaretCoordinates(textarea, container) {
  if (!textarea || !container || typeof textarea.selectionStart !== 'number') {
    return { top: 0, left: 0 };
  }

  const position = textarea.selectionStart;
  const div = document.createElement('div');
  const cs = window.getComputedStyle(textarea);

  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    div.style.setProperty(prop, cs.getPropertyValue(prop), cs.getPropertyPriority(prop));
  }

  const ox = textarea.offsetLeft;
  const oy = textarea.offsetTop;

  Object.assign(div.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflow: 'hidden',
    left: `${ox}px`,
    top: `${oy}px`,
    width: `${textarea.clientWidth}px`,
    zIndex: '-1',
    height: 'auto',
    maxHeight: 'none',
    resize: 'none',
  });

  const text = textarea.value.substring(0, position);
  div.textContent = text;
  const span = document.createElement('span');
  span.textContent = '\u200b';
  div.appendChild(span);

  container.appendChild(div);

  const caretTop = span.offsetTop + span.offsetHeight;
  const caretLeft = span.offsetLeft;

  container.removeChild(div);

  const relTop = caretTop - textarea.scrollTop + oy;
  const relLeft = caretLeft - textarea.scrollLeft + ox;

  const gap = 4;
  const menuApproxH = 220;
  const menuMinW = 200;

  let top = relTop + gap;
  if (top + menuApproxH > container.clientHeight) {
    top = relTop - menuApproxH - gap;
  }
  top = Math.max(4, top);

  const maxLeft = Math.max(4, container.clientWidth - menuMinW - 4);
  const left = Math.max(4, Math.min(relLeft, maxLeft));

  return { top, left };
}

/** @deprecated use getCaretCoordinates(textarea, container) */
export function getCaretScreenPoint(textarea, position) {
  if (!textarea || typeof position !== 'number' || position < 0) {
    return { top: 0, left: 0 };
  }
  const mirror = document.createElement('div');
  const cs = getComputedStyle(textarea);
  mirror.setAttribute('aria-hidden', 'true');
  Object.assign(mirror.style, {
    position: 'absolute',
    left: '-99999px',
    top: '0',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflow: 'hidden',
    width: `${textarea.clientWidth}px`,
    font: cs.font,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    padding: cs.padding,
    border: cs.border,
    boxSizing: cs.boxSizing,
    tabSize: cs.tabSize,
  });
  mirror.textContent = textarea.value.slice(0, position);
  const span = document.createElement('span');
  span.textContent = '\u200b';
  mirror.appendChild(span);
  document.body.appendChild(mirror);
  const r = span.getBoundingClientRect();
  document.body.removeChild(mirror);
  return { top: r.bottom, left: r.left };
}

export function getCaretPointRelativeToContainer(container, textarea, position) {
  if (!container || !textarea) return { top: 0, left: 0 };
  const pt = getCaretScreenPoint(textarea, position);
  const cr = container.getBoundingClientRect();
  return {
    top: pt.top - cr.top,
    left: pt.left - cr.left,
  };
}
