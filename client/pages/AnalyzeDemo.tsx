import React, { useState } from "react";
import { DemoAnalysisResponse } from "@shared/api";

export default function AnalyzeDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DemoAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
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
      setResult(data);
    } catch (err) {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analyze CS2 Demo</h1>
      <input type="file" accept=".dem" onChange={handleFileChange} />
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2" onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {result && result.success && (
        <div className="mt-4">
          <h2 className="font-bold">Map: {result.map}</h2>
          <div>Rounds: {result.rounds}</div>
          <div>
            <strong>Score:</strong> {result.score.team_a} : {result.score.team_b}
          </div>
          <h3 className="mt-2 font-semibold">Players:</h3>
          <ul>
            {result.players.map((p) => (
              <li key={p.steam_id}>
                {p.name} ({p.team}) – {p.kills} K / {p.deaths} D / {p.assists} A
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}