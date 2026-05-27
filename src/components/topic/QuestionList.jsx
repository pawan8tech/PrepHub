import { useDSAProblems } from '../../context/DSAProblemContext';

const difficultyStyles = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400',
  hard: 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-400',
};

const sheetStyles = {
  striver: 'bg-orange-50 text-orange-700 dark:bg-orange-900/25 dark:text-orange-400',
  'love-babbar': 'bg-pink-50 text-pink-700 dark:bg-pink-900/25 dark:text-pink-400',
  normal: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
};

const sheetLabels = {
  striver: 'Striver',
  'love-babbar': 'Love Babbar',
  normal: 'Normal',
};

export default function QuestionList({ questions = [] }) {
  const {
    isProblemDone,
    isProblemImportant,
    toggleProblemDone,
    toggleProblemImportant,
  } = useDSAProblems();

  if (questions.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-surface-800 dark:text-surface-200">
        Practice Questions
        <span className="ml-2 text-xs font-normal text-surface-400 dark:text-surface-500">
          {questions.length} problem{questions.length !== 1 && 's'}
        </span>
      </h3>

      <div className="overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left dark:border-surface-700 dark:bg-surface-800/50">
              <th className="w-10 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                <svg className="mx-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </th>
              <th className="w-10 px-1 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                <svg className="mx-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Problem
              </th>
              <th className="hidden px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 sm:table-cell">
                Pattern
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Difficulty
              </th>
              <th className="hidden px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 md:table-cell">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {questions.map((q) => {
              const done = isProblemDone(q.id);
              const important = isProblemImportant(q.id);

              return (
                <tr
                  key={q.id}
                  className={`transition-colors ${
                    done
                      ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
                      : 'bg-white dark:bg-surface-900'
                  } hover:bg-surface-50 dark:hover:bg-surface-800/50`}
                >
                  {/* Done checkbox */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => toggleProblemDone(q.id)}
                      className={`flex h-5 w-5 mx-auto items-center justify-center rounded border-2 transition-colors ${
                        done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-surface-300 hover:border-emerald-400 dark:border-surface-600 dark:hover:border-emerald-500'
                      }`}
                      aria-label={done ? 'Mark as not done' : 'Mark as done'}
                    >
                      {done && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* Important star */}
                  <td className="px-1 py-3 text-center">
                    <button
                      onClick={() => toggleProblemImportant(q.id)}
                      className="group mx-auto flex h-5 w-5 items-center justify-center"
                      aria-label={important ? 'Unmark important' : 'Mark as important'}
                    >
                      {important ? (
                        <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-surface-300 transition-colors group-hover:text-amber-300 dark:text-surface-600 dark:group-hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* Title + mobile-only badges */}
                  <td className="px-4 py-3">
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                        done
                          ? 'text-surface-400 line-through dark:text-surface-500'
                          : 'text-surface-800 dark:text-surface-200'
                      }`}
                    >
                      {q.title}
                      <svg
                        className="h-3 w-3 shrink-0 text-surface-300 group-hover:text-primary-400 dark:text-surface-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {/* Mobile-only: show pattern + sheet inline */}
                    <div className="mt-1 flex flex-wrap gap-1.5 md:hidden">
                      {q.pattern && (
                        <span className="inline-block rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400 sm:hidden">
                          {q.pattern}
                        </span>
                      )}
                      {q.sheet && (
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${sheetStyles[q.sheet] || sheetStyles.normal}`}>
                          {sheetLabels[q.sheet] || q.sheet}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Pattern (hidden on mobile) */}
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {q.pattern && (
                      <span className="rounded bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                        {q.pattern}
                      </span>
                    )}
                  </td>

                  {/* Difficulty */}
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        difficultyStyles[q.difficulty] || difficultyStyles.medium
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </td>

                  {/* Sheet source (hidden on mobile, visible md+) */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    {q.sheet && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sheetStyles[q.sheet] || sheetStyles.normal}`}>
                        {sheetLabels[q.sheet] || q.sheet}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
