import { useCallback, useState } from 'react';

type Rules<T> = {
  [K in keyof T]?: (value: T[K], form: T) => string | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useValidation<T extends Record<string, any>>(rules: Rules<T>) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback(
    (form: T): boolean => {
      const e: Partial<Record<keyof T, string>> = {};
      for (const key in rules) {
        const rule = rules[key];
        if (rule) {
          const msg = rule(form[key], form);
          if (msg) e[key] = msg;
        }
      }
      setErrors(e);
      return Object.keys(e).length === 0;
    },
    [rules],
  );

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, setErrors, validate, clearErrors };
}
