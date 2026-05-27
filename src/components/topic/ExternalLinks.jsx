export default function ExternalLinks({ links = [] }) {
  if (links.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-surface-800 dark:text-surface-200">
        External Resources
      </h3>
      <div className="space-y-2">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-900 dark:hover:bg-primary-900/10"
          >
            <svg className="h-4 w-4 shrink-0 text-surface-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="truncate text-sm text-surface-600 group-hover:text-primary-700 dark:text-surface-400 dark:group-hover:text-primary-400">
              {link.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
