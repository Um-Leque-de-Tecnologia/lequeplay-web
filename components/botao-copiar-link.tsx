"use client";
export function BotaoCopiarLink() {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(location.href)}
    >
      🔗 Copiar link
    </button>
  );
}