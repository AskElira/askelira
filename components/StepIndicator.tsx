'use client';

// ---------------------------------------------------------------------------
// StepIndicator -- 4-dot step indicator for onboard wizard
// ---------------------------------------------------------------------------

const STEPS = ['Goal', 'Context', 'Blueprint', 'Build'] as const;

interface StepIndicatorProps {
  currentStep: number; // 1-based
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1.5rem 0 1rem',
      }}
    >
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isFuture = stepNum > currentStep;

        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {/* Dot */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: isCompleted
                    ? 'var(--accent)'
                    : isCurrent
                      ? 'var(--accent)'
                      : 'transparent',
                  border: isFuture
                    ? '2px solid var(--border)'
                    : '2px solid var(--accent)',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent
                    ? '0 0 8px var(--accent-glow)'
                    : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '0.625rem',
                  color: isFuture ? '#4b5563' : isCurrent ? '#fff' : '#9ca3af',
                  fontWeight: isCurrent ? 600 : 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                  transition: 'color 0.3s ease',
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line (not after last) */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: '2rem',
                  height: 1,
                  background: isCompleted
                    ? 'var(--accent)'
                    : 'var(--border)',
                  transition: 'background 0.3s ease',
                  marginBottom: '1.125rem', // offset for the label below dot
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
