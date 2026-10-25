import { useEffect, useState } from "react";
import { DEFAULT_MEMBER_PRICING, type MemberPricing } from "@/lib/member-pricing";

export function useMemberPricing() {
  const [pricing, setPricing] = useState<MemberPricing>(DEFAULT_MEMBER_PRICING);
  const [pricingLoaded, setPricingLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/member-pricing", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<MemberPricing> : null)
      .then((data) => {
        if (!active || !data) return;
        if (Number.isSafeInteger(data.regularPrice) && Number.isSafeInteger(data.bulkPrice) &&
            Number.isSafeInteger(data.bulkMin) && data.bulkMin >= 2) setPricing(data);
        setPricingLoaded(true);
      })
      .catch(() => { if (active) setPricingLoaded(true); });
    void load();
    const interval = window.setInterval(() => void load(), 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  return { pricing, pricingLoaded };
}
