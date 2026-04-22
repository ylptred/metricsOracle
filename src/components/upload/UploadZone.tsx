"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { AnalysisResult } from "@/types";

interface Props {
  onResult: (result: AnalysisResult) => void;
}

export function UploadZone({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File) {
    setFile(f);
    setError(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) pickFile(selected);
  }

  async function handleAnalyze() {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Ошибка анализа");
      onResult(data as AnalysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  const borderColor = isDragging
    ? "border-emerald-500/70 bg-emerald-500/5"
    : file
    ? "border-emerald-500/40 bg-emerald-500/5"
    : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-600";

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${borderColor}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.xlsx"
          className="hidden"
          onChange={handleInputChange}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <div>
              <p className="font-medium text-zinc-100">{file.name}</p>
              <p className="text-sm text-zinc-500">
                {(file.size / 1024).toFixed(1)} KB · нажмите чтобы заменить
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud
              className={`h-10 w-10 transition-colors ${
                isDragging ? "text-emerald-400" : "text-zinc-600"
              }`}
            />
            <div>
              <p className="font-medium text-zinc-300">
                {isDragging ? "Отпустите файл" : "Перетащите файл или нажмите"}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                <FileText className="mr-1 inline h-3.5 w-3.5" />
                .txt · .xlsx
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!file || isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.35)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Анализируем…
          </>
        ) : (
          "Анализировать"
        )}
      </button>
    </div>
  );
}
