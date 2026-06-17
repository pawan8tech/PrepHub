import {
  ensureDocumentShape,
  migrateHeadingValueToBlocks,
  isStorageBlockShape,
  DOCUMENT_ROOT_KEY,
  orderedDocumentSectionKeys,
} from './documentContent';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, '<br/>');
}

function headingBlockToHtml(block, hMin) {
  const lv = Math.min(6, Math.max(1, Number(block.level) || 2));
  const h = Math.min(6, Math.max(hMin, lv));
  const t = escapeHtml(typeof block.content === 'string' ? block.content : '');
  const fontSize = { 2: '17px', 3: '15px', 4: '14px', 5: '13px', 6: '12px' }[h] || '15px';
  return `<h${h} style="font-size:${fontSize};margin:0 0 8px;color:#0f172a;font-weight:600">${t}</h${h}>`;
}

function blockToHtml(block, headingLevel) {
  if (!block || typeof block !== 'object') return '';
  if (block.type === 'heading') return headingBlockToHtml(block, headingLevel);
  if (!isStorageBlockShape(block)) return '';
  switch (block.type) {
    case 'text':
      return `<p style="margin:0 0 10px;line-height:1.75;white-space:pre-line;color:#334155">${nl2br(typeof block.content === 'string' ? block.content : '')}</p>`;
    case 'list': {
      const items = (block.items || [])
        .map(
          (item) =>
            `<li style="margin-bottom:6px">${escapeHtml(typeof item === 'string' ? item : JSON.stringify(item))}</li>`,
        )
        .join('');
      return `<ul style="margin:0 0 12px;padding-left:20px;line-height:1.7;color:#334155">${items}</ul>`;
    }
    case 'code': {
      const lang = block.language
        ? `<span style="font-size:10px;color:#94a3b8">${escapeHtml(block.language)}</span><br/>`
        : '';
      const code = escapeHtml(typeof block.content === 'string' ? block.content : '');
      return `<pre style="margin:0 0 12px;padding:12px;background:#1e293b;color:#e2e8f0;border-radius:4px;font-size:12px;overflow-x:auto;white-space:pre-wrap">${lang}<code>${code}</code></pre>`;
    }
    case 'callout': {
      const v = block.variant === 'warning' ? 'warning' : block.variant === 'tip' ? 'tip' : 'info';
      const styles = {
        info: 'background:#eff6ff;border-left:4px solid #3b82f6;color:#1e3a8a;padding:10px 14px;border-radius:4px;margin:0 0 12px;line-height:1.65',
        warning: 'background:#fffbeb;border-left:4px solid #f59e0b;color:#92400e;padding:10px 14px;border-radius:4px;margin:0 0 12px;line-height:1.65',
        tip: 'background:#ecfdf5;border-left:4px solid #22c55e;color:#14532d;padding:10px 14px;border-radius:4px;margin:0 0 12px;line-height:1.65',
      };
      const body = typeof block.content === 'string' ? nl2br(block.content) : '';
      const label = v === 'warning' ? 'Warning' : v === 'tip' ? 'Tip' : 'Info';
      return `<aside style="${styles[v]}"><strong style="display:block;margin-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">${escapeHtml(label)}</strong>${body}</aside>`;
    }
    case 'table': {
      const { headers = [], rows = [] } = block;
      if (!headers.length) return '';
      const ths = headers
        .map((h) => `<th style="border:1px solid #cbd5e1;padding:6px 10px;background:#f8fafc;text-align:left;font-size:13px">${escapeHtml(h)}</th>`)
        .join('');
      const trs = (rows || [])
        .map((row) => {
          const cells = Array.isArray(row?.cells) ? row.cells : Array.isArray(row) ? row : [];
          const tds = cells.map((cell) => `<td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:13px">${escapeHtml(cell)}</td>`).join('');
          return `<tr>${tds}</tr>`;
        })
        .join('');
      return `<table style="width:100%;border-collapse:collapse;margin:0 0 12px"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    }
    case 'image': {
      const url = escapeHtml(block.url || '');
      const cap = typeof block.caption === 'string' ? escapeHtml(block.caption.trim()) : '';
      if (!url) return '';
      const capHtml = cap ? `<p style="margin:6px 0 0;font-size:12px;color:#64748b">${cap}</p>` : '';
      return `<figure style="margin:0 0 12px"><img src="${url}" alt="${cap}" style="max-width:100%;height:auto;border-radius:4px"/>${capHtml}</figure>`;
    }
    case 'group':
      return documentToHtml(ensureDocumentShape(block.content || {}), headingLevel + 1);
    case 'qna': {
      const q = typeof block.question === 'string' ? block.question : '';
      const answer = Array.isArray(block.answer) ? block.answer : [];
      const answerHtml = answer
        .map((child) => blockToHtml(child, headingLevel + 1))
        .filter(Boolean)
        .join('');
      if (!q.trim() && !answerHtml) return '';
      const qHtml = `<p style="margin:0 0 6px;line-height:1.65;color:#0f172a;font-weight:600"><span style="display:inline-block;min-width:18px;padding:0 6px;margin-right:6px;background:#4f46e5;color:#fff;border-radius:9px;font-size:11px;font-weight:700">Q</span>${nl2br(q)}</p>`;
      const aHtml = answerHtml
        ? `<div style="display:flex;gap:8px;align-items:flex-start"><span style="display:inline-block;min-width:18px;padding:0 6px;margin-top:2px;background:#16a34a;color:#fff;border-radius:9px;font-size:11px;font-weight:700;text-align:center">A</span><div style="flex:1;min-width:0">${answerHtml}</div></div>`
        : '';
      return `<div style="border:1px solid #c7d2fe;background:#eef2ff;border-radius:6px;padding:10px 14px;margin:0 0 12px">${qHtml}${aHtml}</div>`;
    }
    default:
      return '';
  }
}

function valueToHtml(value, headingLevel) {
  if (value == null) return '';
  const blocks = migrateHeadingValueToBlocks(value);
  return blocks.map((b) => blockToHtml(b, headingLevel)).join('');
}

function documentToHtml(doc, headingLevel = 2) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return '';
  const { content } = ensureDocumentShape(doc);
  const orderedKeys = orderedDocumentSectionKeys(doc);
  const h = Math.min(headingLevel, 6);
  const fontSize = { 2: '17px', 3: '15px', 4: '14px', 5: '13px', 6: '12px' }[h];
  return orderedKeys
    .map((key) => {
      const val = content[key];
      const body = valueToHtml(val, h);
      if (!body) return '';
      if (key === DOCUMENT_ROOT_KEY) {
        return `<div style="margin-bottom:18px">${body}</div>`;
      }
      return `<section style="margin-bottom:18px">
        <h${h} style="font-size:${fontSize};margin:0 0 8px;color:#0f172a;font-weight:600">${escapeHtml(key)}</h${h}>
        ${body}
      </section>`;
    })
    .join('');
}

function blocksToHtml(blocks, headingLevel = 2) {
  if (!Array.isArray(blocks) || !blocks.length) return '';
  return blocks.map((b) => blockToHtml(b, headingLevel)).join('');
}

function getMergedBlocksForTopic(topic, getUserNotes, mode) {
  const notes = getUserNotes(topic.slug);
  const blocks = notes?.[mode]?.document?.blocks;
  return Array.isArray(blocks) ? blocks : [];
}

function buildHeaderHtml(categoryTitle, topics) {
  return `<div style="text-align:center;margin:0 0 18px">
    <h1 style="font-size:26px;margin:0 0 4px;color:#0f172a">${escapeHtml(categoryTitle)}</h1>
    <p style="margin:0;color:#64748b;font-size:13px">${topics.length} topic${topics.length !== 1 ? 's' : ''} &bull; PrepHub</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:11px">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>`;
}

function buildTopicHtml(topic, getUserNotes) {
  const learningBlocks = getMergedBlocksForTopic(topic, getUserNotes, 'learning');
  const interviewBlocks = getMergedBlocksForTopic(topic, getUserNotes, 'interview');

  const sectionBadge = (label, color, bg) =>
    `<span style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${color};background:${bg};padding:3px 10px;border-radius:9999px;margin:0 0 10px">${label}</span>`;

  const learningHtml =
    learningBlocks.length > 0
      ? `<div style="margin-bottom:14px">
        ${sectionBadge('Learning', '#1e40af', '#dbeafe')}
        ${blocksToHtml(learningBlocks, 3)}
      </div>`
      : '';

  const interviewHtml =
    interviewBlocks.length > 0
      ? `<div style="margin-bottom:14px">
        ${sectionBadge('Interview', '#92400e', '#fef3c7')}
        ${blocksToHtml(interviewBlocks, 3)}
      </div>`
      : '';

  return `<div style="padding:0 0 14px;border-bottom:1px solid #e2e8f0">
    <h2 style="font-size:19px;margin:0 0 12px;padding:0 0 6px;color:#0f172a;font-weight:700;border-bottom:2px solid #4f46e5">${escapeHtml(topic.title)}</h2>
    ${learningHtml}
    ${interviewHtml}
  </div>`;
}

/**
 * Build the ordered list of section HTML strings: a header followed by one
 * block per topic. Each section is rendered to its own canvas (see below) so
 * we never produce a single huge canvas — html2canvas returns a blank image
 * once the canvas exceeds the browser's maximum dimensions, which is why large
 * categories previously exported blank pages.
 */
function buildSections(categoryTitle, topics, getUserNotes) {
  return [
    buildHeaderHtml(categoryTitle, topics),
    ...topics.map((topic) => buildTopicHtml(topic, getUserNotes)),
  ];
}

export async function downloadCategoryPdf(categoryTitle, topics, getUserNotes) {
  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = html2canvasMod.default;

  const sections = buildSections(categoryTitle, topics, getUserNotes);

  // Off-screen host that each section is rendered into, one at a time.
  const RENDER_WIDTH = 760; // px; maps to the PDF content width
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${RENDER_WIDTH}px;background:#ffffff;font-family:'Segoe UI',system-ui,sans-serif;font-size:13px;color:#1e293b;line-height:1.6`;
  document.body.appendChild(host);

  const slug = categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // A4 portrait, in mm.
  const pageW = 210;
  const pageH = 297;
  const margin = { top: 12, right: 14, bottom: 12, left: 14 };
  const contentW = pageW - margin.left - margin.right;
  const contentH = pageH - margin.top - margin.bottom;
  const pageBottom = pageH - margin.bottom;
  const gap = 5; // mm between sections

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let cursorY = margin.top;

  const sliceToJpeg = (canvas, srcY, srcH) => {
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = srcH;
    const ctx = slice.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
    return slice.toDataURL('image/jpeg', 0.95);
  };

  const placeCanvas = (canvas) => {
    const mmPerPx = contentW / canvas.width;
    const fullHmm = canvas.height * mmPerPx;
    const availHmm = pageBottom - cursorY;

    if (fullHmm <= availHmm) {
      // Fits in the remaining space on the current page.
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin.left, cursorY, contentW, fullHmm);
      cursorY += fullHmm + gap;
      return;
    }
    if (fullHmm <= contentH) {
      // Doesn't fit here but fits on a fresh page — move it down, don't cut it.
      pdf.addPage();
      cursorY = margin.top;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin.left, cursorY, contentW, fullHmm);
      cursorY += fullHmm + gap;
      return;
    }
    // Taller than a full page — slice it across pages, starting from the cursor.
    let srcY = 0;
    while (srcY < canvas.height) {
      let availPx = Math.floor((pageBottom - cursorY) / mmPerPx);
      if (availPx < 1) {
        pdf.addPage();
        cursorY = margin.top;
        availPx = Math.floor(contentH / mmPerPx);
      }
      const slicePx = Math.min(availPx, canvas.height - srcY);
      const sliceHmm = slicePx * mmPerPx;
      pdf.addImage(sliceToJpeg(canvas, srcY, slicePx), 'JPEG', margin.left, cursorY, contentW, sliceHmm);
      srcY += slicePx;
      cursorY += sliceHmm;
      if (srcY < canvas.height) {
        pdf.addPage();
        cursorY = margin.top;
      }
    }
    cursorY += gap;
  };

  try {
    for (const sectionHtml of sections) {
      host.innerHTML = sectionHtml;
      const el = host.firstElementChild;
      if (!el) continue;
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      if (canvas.height === 0) continue;
      placeCanvas(canvas);
    }
    pdf.save(`PrepHub-${slug}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}
