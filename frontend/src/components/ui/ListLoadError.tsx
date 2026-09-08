interface ListLoadErrorProps {
  message: string;
  onRetry: () => void;
}

export function ListLoadError({ message, onRetry }: ListLoadErrorProps) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        다시 시도
      </button>
    </div>
  );
}
