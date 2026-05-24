"use client";

import styled from "styled-components";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchStrip({ value, onChange }: Props) {
  return (
    <Wrap>
      <SearchInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cerca file, tag, cartella..."
      />
    </Wrap>
  );
}

const Wrap = styled.div`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 12px;
`;

const SearchInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.92rem;
  color: #111827;
  background: transparent;
`;
