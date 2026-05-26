"use client";

import styled from "styled-components";

type AddFolderPayload = {
  name: string;
  description: string;
  semanticRules: string;
  autoUpdateType: boolean;
  autoTags: string[];
};

type Props = {
  branch?: string;
  scope?: string;
  section?: string;
  folderCount: number;
  fileCount: number;
};

export default function WorkspacePathBar({
  branch = "main",
  scope = "workspace",
  section = "cartelle",
  folderCount,
  fileCount,
}: Props) {
  return (
    <Bar>
      <Trail>
        <Pill>{branch}</Pill>
        <Sep>/</Sep>
        <Pill $muted>{scope}</Pill>
        <Sep>/</Sep>
        <Pill $muted>{section}</Pill>
      </Trail>
      <Meta>
        <MetaItem>{folderCount} cartelle</MetaItem>
        <MetaItem>{fileCount} file</MetaItem>
      </Meta>
    </Bar>
  );
}

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid #dbe4e0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(8px);

  @media (max-width: 768px) {
    gap: 8px;
    padding: 8px 10px;
    border-radius: 12px;
  }

  @media (max-width: 640px) {
    gap: 6px;
    padding: 6px 8px;
    border-radius: 10px;
  }
`;

const Trail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 4px;
  }
`;

const Pill = styled.span<{ $muted?: boolean }>`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid ${({ $muted }) => ($muted ? "#d5dbd8" : "#1f2937")};
  background: ${({ $muted }) => ($muted ? "#f7f9f8" : "#1f2937")};
  color: ${({ $muted }) => ($muted ? "#475569" : "#f8fafc")};
  font-size: 0.78rem;
  font-weight: 700;
`;

const Sep = styled.span`
  color: #94a3b8;
  font-weight: 700;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 6px;
  }

  @media (max-width: 640px) {
    gap: 4px;
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
  }
`;

const MetaItem = styled.span`
  font-size: 0.76rem;
  color: #64748b;
  font-weight: 600;

  @media (max-width: 640px) {
    font-size: 0.70rem;
  }
`;
