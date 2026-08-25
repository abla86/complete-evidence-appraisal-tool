export default function IntegrityBadge({ hash, label = 'Dokumentidentitet' }) {
  if (!hash) return null;

  const normalizedHash = String(hash).toLowerCase();
  const preview = normalizedHash.length > 16
    ? `${normalizedHash.slice(0, 16)}…`
    : normalizedHash;

  return (
    <div
      className="integrity-badge"
      title={`SHA-256: ${normalizedHash}`}
      aria-label={`${label}. SHA-256 ${normalizedHash}`}
    >
      <span className="integrity-badge-icon" aria-hidden="true">✓</span>
      <span>
        <strong>{label}</strong>
        <small>SHA-256 {preview}</small>
      </span>
    </div>
  );
}
