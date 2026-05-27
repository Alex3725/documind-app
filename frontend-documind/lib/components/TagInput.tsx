"use client";
import React, { useEffect, useRef, useState } from "react";
import binaryPrefixSearch from "../utils/binaryPrefixSearch";

type Tag = { name: string; description?: string };

interface TagInputProps {
  selected: Tag[];
  onChange: (tags: Tag[]) => void;
  tags?: Tag[]; // optional sorted list (by name) from parent
  placeholder?: string;
  limit?: number;
  allowFreeText?: boolean;
}

export default function TagInput({
  selected,
  onChange,
  tags,
  placeholder = "#tag",
  limit = 10,
  allowFreeText = true,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [candidates, setCandidates] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const p = input.trim().replace(/^#/, "").toLowerCase();
    if (!p) {
      setCandidates([]);
      setOpen(false);
      return;
    }

    if (tags && tags.length > 0) {
      const res = binaryPrefixSearch(tags, (t) => t.name.toLowerCase(), p);
      setCandidates(res.slice(0, limit));
      setOpen(res.length > 0);
      return;
    }

    if (!allowFreeText) {
      setCandidates([]);
      setOpen(false);
      return;
    }

    // fallback: call server-side search
    let cancelled = false;
    (async () => {
      try {
        const q = encodeURIComponent(p);
        const resp = await fetch(`/api/tags/search?prefix=${q}&limit=${limit}`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (cancelled) return;
        setCandidates((data.tags || []).slice(0, limit));
        setOpen((data.tags || []).length > 0);
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [input, tags, limit, allowFreeText]);

  function addTag(t: Tag) {
    if (selected.find((s) => s.name === t.name)) return;
    onChange([...selected, t]);
    setInput("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(name: string) {
    onChange(selected.filter((s) => s.name !== name));
  }

  return (
    <div className="tag-input" style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {selected.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "center", background: "#eef2ff", padding: "4px 8px", borderRadius: 16 }}>
            <span style={{ marginRight: 8 }}>#{t.name}</span>
            <button aria-label={`remove-${t.name}`} onClick={() => removeTag(t.name)} style={{ border: 0, background: "transparent", cursor: "pointer" }}>×</button>
          </div>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => { if (input.trim()) setOpen(true); }}
          onKeyDown={(e) => {
            if (!allowFreeText && e.key === "Enter") {
              e.preventDefault();
            }
          }}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 120, border: "1px solid #d1d5db", padding: "6px 8px", borderRadius: 6 }}
        />
      </div>

      {open && candidates.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: 6, marginTop: 6, zIndex: 40, maxHeight: 240, overflow: "auto" }}>
          {candidates.map((c) => (
            <button key={c.name} onClick={() => addTag(c)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: 0, background: "transparent" }}>
              <div style={{ fontWeight: 600 }}>#{c.name}</div>
              {c.description && <div style={{ fontSize: 12, color: "#6b7280" }}>{c.description}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
