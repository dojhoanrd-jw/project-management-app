import { useState } from 'react';

export function useFormState<T extends { [K in keyof T]: string }>(initial: T) {
  const [form, setForm] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: keyof T, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const reset = () => {
    setForm(initial);
    setErrors({});
  };

  return { form, setForm, errors, setErrors, loading, setLoading, update, reset };
}
