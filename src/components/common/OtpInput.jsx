import React from 'react';

const OtpInput = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  className = ''
}) => {
  const inputsRef = React.useRef([]);

  const digits = React.useMemo(() => {
    const raw = String(value || '').replace(/\D/g, '').slice(0, length);
    return Array.from({ length }, (_, i) => raw[i] || '');
  }, [value, length]);

  const setAt = (index, nextChar) => {
    const current = digits.join('');
    const arr = current.split('');
    while (arr.length < length) arr.push('');
    arr[index] = nextChar;
    const joined = arr.join('').replace(/\D/g, '').slice(0, length);
    onChange(joined);
  };

  const focusIndex = (index) => {
    const el = inputsRef.current[index];
    if (!el) return;
    el.focus();
    try {
      el.setSelectionRange(0, 1);
    } catch (_) {
      // ignore
    }
  };

  React.useEffect(() => {
    if (!autoFocus) return;
    focusIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          disabled={disabled}
          value={d}
          onChange={(e) => {
            const next = String(e.target.value || '').replace(/\D/g, '');
            if (!next) {
              setAt(i, '');
              return;
            }

            const chars = next.slice(0, length - i).split('');
            let idx = i;
            for (const ch of chars) {
              setAt(idx, ch);
              idx += 1;
              if (idx >= length) break;
            }

            if (idx < length) focusIndex(idx);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              if (digits[i]) {
                setAt(i, '');
                return;
              }
              if (i > 0) {
                focusIndex(i - 1);
                setAt(i - 1, '');
              }
            }

            if (e.key === 'ArrowLeft' && i > 0) {
              e.preventDefault();
              focusIndex(i - 1);
            }

            if (e.key === 'ArrowRight' && i < length - 1) {
              e.preventDefault();
              focusIndex(i + 1);
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text') || window.clipboardData?.getData('text') || '';
            const cleaned = String(text).replace(/\D/g, '').slice(0, length);
            if (!cleaned) return;
            onChange(cleaned);
            const nextFocus = Math.min(cleaned.length, length - 1);
            focusIndex(nextFocus);
          }}
          className="w-11 h-12 text-center text-xl font-semibold rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={1}
        />
      ))}
    </div>
  );
};

export default OtpInput;
