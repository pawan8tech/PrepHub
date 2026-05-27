import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="mb-2 text-6xl font-bold text-surface-200 dark:text-surface-700">
        404
      </p>
      <h1 className="mb-2 text-xl font-bold text-surface-800 dark:text-surface-200">
        Page not found
      </h1>
      <p className="mb-6 text-sm text-surface-500 dark:text-surface-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
