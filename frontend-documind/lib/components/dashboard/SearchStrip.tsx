"use client";

import styled from "styled-components";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchStrip({ value, onChange }: Props) {
  return (
    <Wrap>
      <Trail>
        <TrailPill>main</TrailPill>
        <TrailSep>/</TrailSep>
        <TrailPill $muted>search</TrailPill>
      </Trail>
      <SearchInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cerca file, tag o cartella..."
      />
    </Wrap>
  );
}

const Wrap = styled.div`
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #dbe4e0;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Trail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const TrailPill = styled.span<{ $muted?: boolean }>`
  padding: 5px 10px;
  border-radius: 999px;
  background: ${({ $muted }) => ($muted ? "#f8fafc" : "#1f2937")};
  color: ${({ $muted }) => ($muted ? "#64748b" : "#f8fafc")};
  border: 1px solid ${({ $muted }) => ($muted ? "#dbe4e0" : "#1f2937")};
  font-size: 0.75rem;
  font-weight: 700;
`;

const TrailSep = styled.span`
  color: #94a3b8;
  font-weight: 700;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 180px;
  border: none;
  outline: none;
  font-size: 0.92rem;
  color: #0f172a;
  background: transparent;
`;
