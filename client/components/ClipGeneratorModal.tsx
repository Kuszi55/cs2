import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface ClipGeneratorModalProps {
  isOpen: boolean;
  matchId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ClipGeneratorModal({
  isOpen,
  matchId,
  onClose,
  onSuccess,
}: ClipGeneratorModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [sensitivity, setSensitivity] = useState(3);
  const [maxClips, setMaxClips] = useState(15);

  const handleGenerate = async () => {
    if (!matchId) {
      setError("Match ID is required");
      return;
    }

    try {
      setIsGenerating(true);
      setError("");

      const response = await fetch(`/api/clips/${matchId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sensitivity,
          maxClips,
          format: "mp4",
          quality: "1080p",
          fps: 60,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate clips");
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-slate-700 bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-white">
            Generuj Podejrzane Klipy
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Wygeneruj do {maxClips} 1080p 60fps klipów z podejrzanymi momentami
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sensitivity Slider */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Czułość Detection ({sensitivity}/5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseInt(e.target.value))}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-slate-500 mt-1">
              {sensitivity === 1 && "Tylko bardzo podejrzane momenty"}
              {sensitivity === 2 && "Wysokie zagrożenie"}
              {sensitivity === 3 && "Normalne - zalecane"}
              {sensitivity === 4 && "Niska czułość - więcej wyników"}
              {sensitivity === 5 && "Wszystkie potencjalne momenty"}
            </p>
          </div>

          {/* Max Clips */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Maksymalna liczba klipów: {maxClips}
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={maxClips}
              onChange={(e) => setMaxClips(parseInt(e.target.value))}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-slate-500 mt-1">
              Więcej klipów = więcej czasu generowania
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              <span className="font-medium">Info:</span> Każdy klip ma ~1-20
              sekund, jakość 1080p 60fps. Generowanie może trwać kilka minut.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
            className="border-slate-700"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generowanie...
              </>
            ) : (
              "Generuj Klipy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
