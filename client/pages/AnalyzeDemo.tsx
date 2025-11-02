import React, { useState } from "react";
import { DemoAnalysisResponse } from "@shared/api";

export default function AnalyzeDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DemoAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("demo", file);

    try {
      const response = await fetch("/api/analyze-demo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!data.success) setError(data.error || "Unknown error");
      else setResult(data);
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Analizator demo CS2</h1>
      <input type="file" accept=".dem" onChange={handleFileChange} />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
        disabled={loading || !file}
        onClick={handleUpload}
      >
        {loading ? "Analizuję..." : "Wyślij demo"}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {result && (
        <div className="mt-4">
          <div className="font-semibold mb-1">Mapa: {result.map}</div>
          <ul>
            {result.players.map((p) => (
              <li key={p.steam_id} className="border-b py-1">
                {p.name} — {p.kills} K / {p.deaths} D / {p.assists} A
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
