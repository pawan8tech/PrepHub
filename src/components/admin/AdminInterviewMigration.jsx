import { useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { categories as systemCategories } from '../../data/categories';

const SEP = '::';

function titleFromSlug(slug) {
  return String(slug || '')
    .replace(/^custom-/, '')
    .split('-')
    .filter(Boolean)
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(' ');
}

function categoryTitle(slug) {
  const c = systemCategories.find((x) => x.slug === slug);
  return c?.title || titleFromSlug(slug);
}

function blockEmpty(b) {
  if (!b || typeof b !== 'object') return true;
  switch (b.type) {
    case 'text':
    case 'heading':
    case 'callout':
    case 'code':
      return !String(b.content ?? '').trim();
    case 'list':
      return (Array.isArray(b.items) ? b.items : []).every((x) => !String(x).trim());
    case 'image':
      return !String(b.url ?? '').trim();
    case 'table':
      return !(Array.isArray(b.headers) ? b.headers : []).some((h) => String(h).trim());
    case 'qna':
      return !String(b.question ?? '').trim();
    default:
      return false;
  }
}

function hasContent(blocks) {
  return Array.isArray(blocks) && blocks.some((b) => !blockEmpty(b));
}

/** Interview blocks to fold in: prefer the migrated "<topic> Interview" topic, else the original. */
async function interviewBlocksFor(topicId, fallbackBlocks) {
  try {
    const snap = await getDoc(doc(db, 'admin_notes', `${topicId}-interview${SEP}learning`));
    if (snap.exists() && hasContent(snap.data().blocks)) return snap.data().blocks;
  } catch {
    /* ignore */
  }
  return Array.isArray(fallbackBlocks) ? fallbackBlocks : [];
}

/** All non-empty interview notes in admin_notes, excluding DSA. */
async function loadInterviewDocs() {
  const snap = await getDocs(collection(db, 'admin_notes'));
  const rows = [];
  snap.forEach((d) => {
    const id = d.id;
    const sepIdx = id.lastIndexOf(SEP);
    if (sepIdx === -1) return;
    const topicId = id.slice(0, sepIdx);
    const mode = id.slice(sepIdx + SEP.length);
    if (mode !== 'interview') return;
    const data = d.data() || {};
    const category = data.category || 'general';
    if (category === 'dsa') return; // DSA keeps learning only — excluded
    if (!hasContent(data.blocks)) return;
    rows.push({ id, topicId, category, title: data.title || topicId, blocks: data.blocks });
  });
  return rows;
}

export default function AdminInterviewMigration() {
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [mergeCats, setMergeCats] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const push = (line) => setLog((l) => [...l, line]);

  const run = async (label, fn) => {
    setBusy(true);
    setLog([]);
    try {
      await fn();
    } catch (err) {
      push(`❌ ${label} failed: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const dryRun = () =>
    run('Dry run', async () => {
      const rows = await loadInterviewDocs();
      const byCat = {};
      rows.forEach((r) => {
        byCat[r.category] = (byCat[r.category] || 0) + 1;
      });
      push(`Found ${rows.length} interview note(s) across ${Object.keys(byCat).length} category(ies):`);
      Object.entries(byCat).forEach(([c, n]) =>
        push(`  • ${categoryTitle(c)} → "${categoryTitle(c)} Interview": ${n} topic(s)`),
      );
      if (rows.length === 0) push('Nothing to migrate. ✅');
      else push('No changes made (dry run). Click "Migrate" to apply.');
    });

  const migrate = () => {
    if (
      !window.confirm(
        'Create the "<Subject> Interview" categories + topics from existing interview notes?\n\nOriginals are kept (you can clean up later). Safe to re-run.',
      )
    )
      return;
    run('Migrate', async () => {
      const rows = await loadInterviewDocs();
      let created = 0;
      let skipped = 0;
      const cats = new Set();
      for (const r of rows) {
        const catSlug = `${r.category}-interview`;
        const newDocId = `${r.topicId}-interview${SEP}learning`;

        if (!cats.has(catSlug)) {
          try {
            await setDoc(
              doc(db, 'shared_categories', catSlug),
              {
                title: `${categoryTitle(r.category)} Interview`,
                slug: catSlug,
                icon: '💼',
                description: `Interview notes for ${categoryTitle(r.category)}`,
                color: '#6366F1',
                isCustom: true,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          } catch (err) {
            push(`⚠️ Couldn't write category record ${catSlug} (rules?): ${err?.message || err}`);
          }
          cats.add(catSlug);
        }

        // eslint-disable-next-line no-await-in-loop
        const existing = await getDoc(doc(db, 'admin_notes', newDocId));
        if (existing.exists()) {
          skipped += 1;
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        await setDoc(doc(db, 'admin_notes', newDocId), {
          title: r.title,
          category: catSlug,
          blocks: r.blocks,
          updatedAt: serverTimestamp(),
        });
        created += 1;
        push(`✓ ${r.title} → ${categoryTitle(r.category)} Interview`);
      }
      push(
        `Done. Created ${created} topic(s), skipped ${skipped} already-migrated, across ${cats.size} category(ies). 🎉`,
      );
    });
  };

  const cleanup = () => {
    if (
      !window.confirm(
        'Delete the OLD interview notes (admin_notes …::interview)?\n\nDo this ONLY after verifying the new "Interview" categories look right. This cannot be undone.',
      )
    )
      return;
    run('Cleanup', async () => {
      const rows = await loadInterviewDocs();
      let deleted = 0;
      let skipped = 0;
      for (const r of rows) {
        const newDocId = `${r.topicId}-interview${SEP}learning`;
        // eslint-disable-next-line no-await-in-loop
        const migrated = await getDoc(doc(db, 'admin_notes', newDocId));
        if (!migrated.exists()) {
          skipped += 1; // never delete an original that wasn't migrated
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        await deleteDoc(doc(db, 'admin_notes', r.id));
        deleted += 1;
      }
      push(`Deleted ${deleted} old interview note(s); skipped ${skipped} (not migrated yet).`);
    });
  };

  const loadMergeCats = () =>
    run('Load categories', async () => {
      const rows = await loadInterviewDocs();
      const byCat = {};
      rows.forEach((r) => {
        byCat[r.category] = (byCat[r.category] || 0) + 1;
      });
      const list = Object.entries(byCat)
        .map(([slug, count]) => ({ slug, count }))
        .sort((a, b) => categoryTitle(a.slug).localeCompare(categoryTitle(b.slug)));
      setMergeCats(list);
      if (list.length && !list.some((c) => c.slug === selectedCat)) setSelectedCat(list[0].slug);
      push(`${list.length} category(ies) still have interview notes. Pick one to merge.`);
    });

  const mergeDryRun = () => {
    if (!selectedCat) return;
    run('Merge dry run', async () => {
      const rows = (await loadInterviewDocs()).filter((r) => r.category === selectedCat);
      push(`${categoryTitle(selectedCat)} — topics that would fold interview into learning:`);
      let toMerge = 0;
      let already = 0;
      for (const r of rows) {
        // eslint-disable-next-line no-await-in-loop
        const learnSnap = await getDoc(doc(db, 'admin_notes', `${r.topicId}${SEP}learning`));
        if (learnSnap.exists() && learnSnap.data().interviewMerged) {
          already += 1;
        } else {
          toMerge += 1;
          push(`  • ${r.title}`);
        }
      }
      push(`${toMerge} to merge, ${already} already merged. (Interview category is kept.)`);
      if (!toMerge) push('Nothing new to merge.');
      else push('No changes made (dry run). Click "Merge into learning" to apply.');
    });
  };

  const mergeCategory = () => {
    if (!selectedCat) return;
    if (
      !window.confirm(
        `Append every topic's interview notes into its learning notes for "${categoryTitle(selectedCat)}"?\n\nThe Interview category and interview docs are KEPT — delete them later when ready. Safe to re-run (already-merged topics are skipped).`,
      )
    )
      return;
    run('Merge', async () => {
      const rows = (await loadInterviewDocs()).filter((r) => r.category === selectedCat);
      let merged = 0;
      let skipped = 0;
      for (const r of rows) {
        const learnRef = doc(db, 'admin_notes', `${r.topicId}${SEP}learning`);
        // eslint-disable-next-line no-await-in-loop
        const learnSnap = await getDoc(learnRef);
        const learnData = learnSnap.exists() ? learnSnap.data() : {};
        if (learnData.interviewMerged) {
          skipped += 1;
          continue; // already merged — never double-append
        }
        // eslint-disable-next-line no-await-in-loop
        const interviewBlocks = await interviewBlocksFor(r.topicId, r.blocks);
        const learningBlocks = Array.isArray(learnData.blocks) ? learnData.blocks : [];
        const combined = [...learningBlocks, ...interviewBlocks];
        // eslint-disable-next-line no-await-in-loop
        await setDoc(
          learnRef,
          {
            title: learnData.title || r.title,
            category: learnData.category || selectedCat,
            blocks: combined,
            interviewMerged: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        merged += 1;
        push(`✓ ${r.title}: +${interviewBlocks.length} interview block(s)`);
      }
      push(
        `Done. Merged ${merged} topic(s) into learning, skipped ${skipped} already-merged. Interview category kept — delete it later when ready.`,
      );
    });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-800/60 dark:bg-amber-950/20">
      <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
        Interview notes → separate categories (admin)
      </h2>
      <p className="mt-1 text-xs text-surface-600 dark:text-surface-400">
        Moves each subject's interview notes into a new “&lt;Subject&gt; Interview” category. DSA is
        excluded. Run <strong>Dry run</strong> first — it writes nothing.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={dryRun}
          disabled={busy}
          className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
        >
          {busy ? 'Working…' : 'Dry run'}
        </button>
        <button
          type="button"
          onClick={migrate}
          disabled={busy}
          className="rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          Migrate
        </button>
        <button
          type="button"
          onClick={cleanup}
          disabled={busy}
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          Delete old interview notes
        </button>
      </div>

      <div className="mt-4 border-t border-amber-200/60 pt-3 dark:border-amber-800/40">
        <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
          Merge interview into learning (per category)
        </h3>
        <p className="mt-1 text-[11px] text-surface-600 dark:text-surface-400">
          Appends each topic's interview notes into its learning notes (learning first, interview
          after, no separator). The Interview category and interview docs are kept — delete them
          later. Safe to re-run (already-merged topics are skipped).
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadMergeCats}
            disabled={busy}
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
          >
            Load categories
          </button>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            disabled={busy || mergeCats.length === 0}
            className="rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-xs text-surface-800 outline-none disabled:opacity-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200"
          >
            {mergeCats.length === 0 ? (
              <option value="">— load first —</option>
            ) : (
              mergeCats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {categoryTitle(c.slug)} ({c.count})
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            onClick={mergeDryRun}
            disabled={busy || !selectedCat}
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
          >
            Dry run
          </button>
          <button
            type="button"
            onClick={mergeCategory}
            disabled={busy || !selectedCat}
            className="rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Merge into learning
          </button>
        </div>
      </div>

      {log.length > 0 ? (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-900 p-3 text-[11px] leading-relaxed text-surface-100 dark:bg-black/40">
          {log.join('\n')}
        </pre>
      ) : null}
    </div>
  );
}
