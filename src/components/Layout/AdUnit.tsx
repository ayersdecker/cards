import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export default function AdUnit() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const desktopRail = window.matchMedia('(min-width: 1720px) and (min-height: 700px)');
    const requestAd = () => {
      const ad = adRef.current;
      if (!desktopRail.matches || !ad || ad.dataset.adsbygoogleStatus) return;

      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    };

    requestAd();
    desktopRail.addEventListener('change', requestAd);
    return () => desktopRail.removeEventListener('change', requestAd);
  }, []);

  return (
    <ins
      ref={adRef}
      className="adsbygoogle ad-rail-unit"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-2129408761521847"
      data-ad-slot="8675852273"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
