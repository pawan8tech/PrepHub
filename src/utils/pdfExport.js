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

function buildCategoryHtml(categoryTitle, topics, getUserNotes) {
  const topicBlocks = topics
    .map((topic) => {
      const learningBlocks = getMergedBlocksForTopic(topic, getUserNotes, 'learning');
      const interviewBlocks = getMergedBlocksForTopic(topic, getUserNotes, 'interview');

      const learningHtml =
        learningBlocks.length > 0
          ? `<div style="margin-bottom:16px">
            <p style="font-size:13px;font-weight:600;margin:0 0 10px;color:#1e40af">Learning</p>
            ${blocksToHtml(learningBlocks, 3)}
          </div>`
          : '';

      const interviewHtml =
        interviewBlocks.length > 0
          ? `<div style="margin-bottom:16px">
            <p style="font-size:13px;font-weight:600;margin:0 0 10px;color:#92400e">Interview</p>
            ${blocksToHtml(interviewBlocks, 3)}
          </div>`
          : '';

      return `<div style="page-break-before:always">
        <h2 style="font-size:20px;margin:0 0 12px;color:#0f172a">${escapeHtml(topic.title)}</h2>
        ${learningHtml}
        ${interviewHtml}
      </div>`;
    })
    .join('');

  return `<div style="font-family:'Segoe UI',system-ui,sans-serif;font-size:13px;color:#1e293b;line-height:1.6">
    <div style="text-align:center;margin-bottom:24px">
      <h1 style="font-size:26px;margin:0 0 4px;color:#0f172a">${escapeHtml(categoryTitle)}</h1>
      <p style="margin:0;color:#64748b;font-size:13px">${topics.length} topic${topics.length !== 1 ? 's' : ''} &bull; PrepHub</p>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:11px">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    ${topicBlocks}
  </div>`;
}

export async function downloadCategoryPdf(categoryTitle, topics, getUserNotes) {
  const html2pdf = (await import('html2pdf.js')).default;

  const html = buildCategoryHtml(categoryTitle, topics, getUserNotes);

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const slug = categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    await html2pdf()
      .set({
        margin: [12, 14, 12, 14],
        filename: `PrepHub-${slug}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '[style*="page-break-before"]' },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
