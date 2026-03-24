'use client';

export default function AutoresearchToggle() {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <input
        type="checkbox"
        name="autoresearch"
        defaultChecked
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>
        Enable autoresearch{' '}
        <span className="text-gray-400">(deeper context, +2-3s)</span>
      </span>
    </label>
  );
}
