export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 text-4xl text-surface-300 dark:text-surface-600">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-lg font-semibold text-surface-700 dark:text-surface-300">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-surface-500 dark:text-surface-400">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}
