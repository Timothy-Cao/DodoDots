export function BloomDefs() {
  // Use filterUnits="userSpaceOnUse" so the filter region doesn't collapse
  // when the source element has a zero-height bbox (e.g. horizontal lines).
  // The region is set generously to cover any dynamic viewBox we produce.
  return (
    <defs>
      <filter id="bloom-dim" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1000" height="1000">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="bloom-bright" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1000" height="1000">
        <feGaussianBlur stdDeviation="1.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
