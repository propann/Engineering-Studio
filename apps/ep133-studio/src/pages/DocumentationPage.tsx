export function DocumentationPage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: "40px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      <h1>📚 Documentation EP-133</h1>
      <p style={{ fontSize: "16px", lineHeight: "1.8", marginBottom: "20px" }}>
        La documentation a été centralisée au <strong>Hub Central</strong> pour un meilleur accès.
      </p>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Vous y trouverez toutes les infos sur l'EP-133, les patterns, les transferts et l'entraînement rhythm.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={() => {
            const hubUrl = new URLSearchParams(window.location.search).get('hubReturn') || window.location.origin;
            window.location.href = `${hubUrl}?page=documentation`;
          }}
          style={{
            padding: "12px 24px",
            background: "#ff5a1f",
            color: "#fff",
            border: "2px solid #111",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          Ouvrir Documentation au Hub →
        </button>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            background: "#ebece6",
            color: "#111",
            border: "2px solid #111",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          Retour
        </button>
      </div>
    </div>
  );
}
