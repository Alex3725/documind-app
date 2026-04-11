"use client";

import styled from "styled-components";
import type { FileItem } from "@/lib/features/fileSlice";
import { removeFile } from "@/lib/features/fileSlice";
import { useAppDispatch } from "@/lib/hooks";

type Props = { file: FileItem };

const CATEGORY_ICONS: Record<string, string> = {
  finance: "💰",
  legal: "⚖️",
  hr: "👤",
  personal: "🪪",
  health: "🏥",
  tech: "💻",
  literature: "📚",
  business: "📋",
  communication: "📧",
  data: "📊",
  custom: "🏷️",
  other: "📄",
};

const STATUS_CONFIG = {
  CLASSIFIED: {
    label: "Classificato",
    color: "#1b6f5c",
    bg: "#f0faf5",
    border: "#b8ddd4",
    icon: "✅",
  },
  PARTIAL_CONFIRMATION: {
    label: "Parz. confermato",
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#bae6fd",
    icon: "🔵",
  },
  CONFIRMATION_REQUIRED: {
    label: "In attesa",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    icon: "🤔",
  },
  LOW_CONFIDENCE: {
    label: "Non classificato",
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#d1d5db",
    icon: "🗂️",
  },
};

export default function ClassificationResult({ file }: Props) {
  const dispatch = useAppDispatch();
  const { analysisResult } = file;
  const status = STATUS_CONFIG[analysisResult.type] ?? STATUS_CONFIG.LOW_CONFIDENCE;

  // Tag assegnati (solo quelli certi)
  const assignedTags = analysisResult.tags ?? [];

  // Usa all_tags per mostrare la distribuzione completa
  const allTags = (analysisResult.all_tags ?? analysisResult.tags ?? [])
    .filter((t) => t.confidence > 0.08)
    .slice(0, 8);

  const topCategoryIcon =
    assignedTags.length > 0
      ? CATEGORY_ICONS[assignedTags[0].category ?? "other"] ?? "📄"
      : "📄";

  return (
    <Card>
      {/* Header */}
      <CardHeader>
        <FileIconWrap>{topCategoryIcon}</FileIconWrap>
        <HeaderContent>
          <FileName title={file.filename}>{file.filename}</FileName>
          <StatusRow>
            <StatusBadge $color={status.color} $bg={status.bg} $border={status.border}>
              {status.icon} {status.label}
            </StatusBadge>
            {file.folder && file.folder !== "Altro" && (
              <FolderBadge>{file.folder}</FolderBadge>
            )}
          </StatusRow>
        </HeaderContent>
        <DeleteBtn onClick={() => dispatch(removeFile(file.id))} title="Rimuovi">🗑️</DeleteBtn>
      </CardHeader>

      {/* Summary */}
      {analysisResult.summary && (
        <Summary>{analysisResult.summary}</Summary>
      )}

      {/* Tag assegnati */}
      {assignedTags.length > 0 && (
        <Section>
          <SectionTitle>Tag assegnati</SectionTitle>
          <TagsRow>
            {assignedTags.map((tag) => (
              <AssignedTag key={tag.name} title={tag.description}>
                {tag.name.replace(/_/g, " ")}
                <ConfPct $high={tag.confidence >= 0.75}>
                  {Math.round(tag.confidence * 100)}%
                </ConfPct>
              </AssignedTag>
            ))}
          </TagsRow>
        </Section>
      )}

      {/* Distribuzione completa tag (barre) */}
      {allTags.length > 0 && (
        <Section>
          <SectionTitle>Analisi AI</SectionTitle>
          <BarsContainer>
            {allTags.map((tag) => {
              const pct = Math.round(tag.confidence * 100);
              const isAssigned = assignedTags.some((t) => t.name === tag.name);
              return (
                <BarRow key={tag.name}>
                  <BarLabel $assigned={isAssigned}>
                    {tag.name.replace(/_/g, " ")}
                    {isAssigned && <AssignedDot />}
                  </BarLabel>
                  <BarWrap>
                    <BarFill
                      $pct={pct}
                      $assigned={isAssigned}
                      $high={tag.confidence >= 0.75}
                    />
                  </BarWrap>
                  <BarPct $assigned={isAssigned} $high={tag.confidence >= 0.75}>
                    {pct}%
                  </BarPct>
                </BarRow>
              );
            })}
          </BarsContainer>
        </Section>
      )}

      {/* Dati estratti */}
      {analysisResult.extracted_data && Object.keys(analysisResult.extracted_data).length > 0 && (
        <ExtractedSection>
          {Object.entries(analysisResult.extracted_data)
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .slice(0, 3)
            .map(([key, val]) => (
              <ExtractedRow key={key}>
                <ExtractedKey>{key.replace(/_/g, " ")}</ExtractedKey>
                <ExtractedVal>
                  {Array.isArray(val) ? val.join(", ") : String(val)}
                </ExtractedVal>
              </ExtractedRow>
            ))}
        </ExtractedSection>
      )}

      {/* Footer */}
      <CardFooter>
        <FooterDate>
          {new Date(file.uploadedAt).toLocaleString("it-IT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </FooterDate>
        {analysisResult.message && (
          <FooterMsg>{analysisResult.message}</FooterMsg>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// STYLES
// ============================================================

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e8e6;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const FileIconWrap = styled.div`font-size: 1.8rem; flex-shrink: 0;`;

const HeaderContent = styled.div`flex: 1; min-width: 0;`;

const FileName = styled.div`
  font-weight: 700;
  color: #1a3a30;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
`;

const StatusRow = styled.div`display: flex; flex-wrap: wrap; gap: 6px; align-items: center;`;

const StatusBadge = styled.span<{ $color: string; $bg: string; $border: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.73rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $border }) => $border};
  border-radius: 999px;
  padding: 2px 9px;
`;

const FolderBadge = styled.span`
  font-size: 0.72rem;
  color: #555;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 2px 8px;
`;

const DeleteBtn = styled.button`
  background: none; border: none;
  cursor: pointer; font-size: 0.95rem;
  opacity: 0.4; flex-shrink: 0;
  padding: 2px;
  transition: opacity 0.15s;

  &:hover { opacity: 1; }
`;

const Summary = styled.p`
  font-size: 0.84rem;
  color: #555;
  line-height: 1.5;
  margin: 0;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #1b6f5c;
`;

const Section = styled.div``;

const SectionTitle = styled.div`
  font-size: 0.69rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #aaa;
  margin-bottom: 8px;
`;

const TagsRow = styled.div`display: flex; flex-wrap: wrap; gap: 6px;`;

const AssignedTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #e8f5f0;
  color: #1b6f5c;
  border: 1px solid #b8ddd4;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.79rem;
  font-weight: 600;
`;

const ConfPct = styled.span<{ $high: boolean }>`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ $high }) => ($high ? "#1b6f5c" : "#d97706")};
  background: ${({ $high }) => ($high ? "#d1fae5" : "#fef3c7")};
  border-radius: 999px;
  padding: 0 5px;
`;

const BarsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BarLabel = styled.div<{ $assigned: boolean }>`
  font-size: 0.78rem;
  color: ${({ $assigned }) => ($assigned ? "#1a3a30" : "#888")};
  font-weight: ${({ $assigned }) => ($assigned ? 700 : 400)};
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AssignedDot = styled.span`
  width: 6px; height: 6px;
  background: #1b6f5c;
  border-radius: 50%;
  flex-shrink: 0;
`;

const BarWrap = styled.div`
  flex: 1;
  height: 5px;
  background: #e8e8e8;
  border-radius: 99px;
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number; $assigned: boolean; $high: boolean }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $assigned, $high }) =>
    $assigned && $high
      ? "#1b6f5c"
      : $assigned
      ? "#0284c7"
      : $high
      ? "#22c55e"
      : "#d1d5db"};
  border-radius: 99px;
  transition: width 0.4s ease;
`;

const BarPct = styled.span<{ $assigned: boolean; $high: boolean }>`
  font-size: 0.73rem;
  font-weight: 700;
  min-width: 30px;
  text-align: right;
  color: ${({ $assigned, $high }) =>
    $assigned && $high ? "#1b6f5c" : $high ? "#22c55e" : "#bbb"};
`;

const ExtractedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 8px 12px;
`;

const ExtractedRow = styled.div`
  display: flex;
  gap: 8px;
  font-size: 0.79rem;
`;

const ExtractedKey = styled.span`
  color: #999;
  text-transform: capitalize;
  flex-shrink: 0;
  min-width: 80px;
`;

const ExtractedVal = styled.span`
  color: #333;
  font-weight: 600;
`;

const CardFooter = styled.div`
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
`;

const FooterDate = styled.div`font-size: 0.72rem; color: #bbb;`;
const FooterMsg = styled.div`
  font-size: 0.76rem; color: #888;
  margin-top: 2px; font-style: italic;
`;
