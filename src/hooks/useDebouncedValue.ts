import { useEffect, useState } from "react";

/** يرجّع القيمة بعد ما يهدأ التغيير — يمنع طلب API مع كل حرف في البحث */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
