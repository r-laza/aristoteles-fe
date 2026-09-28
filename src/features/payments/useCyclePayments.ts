import { useEffect, useState } from "react";
import { paymentsApi, type Balances } from "../../services/payments.api";

export function useCyclePayments(cycleId: number) {
  const [data, setData] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .balances(cycleId)
      .then((value) => {
        if (!cancelled) {
          setData(value);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cycleId, version]);
  const refresh = () => {
    setLoading(true);
    setVersion((value) => value + 1);
  };
  return { data, loading, error, refresh };
}
