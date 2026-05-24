"use client";

import { useState } from "react";
import styled from "styled-components";
import type { FileItem } from "@/lib/features/fileSlice";
import {
  removeFile,
  overrideFileFolder,
  moveFileToFolder,
} from "@/lib/features/fileSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import HierarchicalClassificationView from "@/lib/components/HierarchicalClassificationView";

type Props = { file: FileItem };

const CATEGORY_ICONS: Record<string, string> = {
  finance: "💰", legal: "⚖️", hr: "👤", personal: "🪪", health: "🏥",
  tech: "💻", literature: "📚", business: "📋", communication: "📧",
  data: "📊", custom: "🏷️", context: "🌍", content_type: "📂",
  sub_type: "🔍", system: "⚙️", other: "📄",
};

const STATUS_CONFIG = {
  CLASSIFIED: { label: "Classificato", color: "#1b6f5c", bg: "#f0faf5", border: "#b8ddd4", icon: "✅" },
  PARTIAL_CONFIRMATION: { label: "Parz. confermato", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", icon: "🔵" },
  CONFIRMATION_REQUIRED: { label: "In attesa", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", icon: "🤔" },
  LOW_CONFIDENCE: { label: "Non classificato", color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", icon: "🗂️" },
};

export default function ClassificationResult({ file }: Props) {
  const dispatch = useAppDispatch();
  const { folders } = useAppSelector((s) => s.files);
  const { analysisResult } = file;
  const status = STATUS_CONFIG[analysisResult.type] ?? STATUS_CONFIG.LOW_CONFIDENCE;

  const [showHierarchy, setShowHierarchy] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState("");

  const assignedTags = analysisResult.tags ?? [];
  const allTags = (analysisResult.all_tags ?? analysisResult.tags ?? [])
    .filter((t) => t.confidence > 0.08)
    .slice(0, 8);

  const topCategoryIcon =
    assignedTags.length > 0
      ? CATEGORY_ICONS[assignedTags[0].category ?? "other"] ?? "📄"
      : "📄";

  const hasHierarchy = !!analysisResult.hierarchical_classification;

  const handleOverride = () => {
    if (!overrideTarget) return;
    const targetFolder = folders.find((f) => f.fullPath === overrideTarget);
    if (targetFolder) {
      dispatch(moveFileToFolder({ fileId: file.id, targetFolder }));
    } else {
      dispatch(overrideFileFolder({ fileId: file.id, folder: overrideTarget }));
    }
    setShowOverride(false);
  };

  return (
    <Card>
      {/* HEADER */}
      <CardHeader>
        <FileIconWrap>{topCategoryIcon}</FileIconWrap>
        <HeaderContent>
          <FileName title={file.filename}>{file.filename}</FileName>
          <StatusRow>
            <StatusBadge $color={status.color} $bg={status.bg} $border={status.border}>
              {status.icon} {status.label}
            </StatusBadge>
            {file.folder && <FolderBadge>{file.folder}</FolderBadge>}
            {file.userOverride && <OverrideBadge>👤 Manuale</OverrideBadge>}
          </StatusRow>
        </HeaderContent>
        <HeaderActions>
          {hasHierarchy && (
            <ActionIconBtn
              onClick={() => setShowHierarchy((v) => !v)}
              title="Mostra analisi AI gerarchica"
              $active={showHierarchy}
            >
              🧠
            </ActionIconBtn>
          )}
          <ActionIconBtn
            onClick={() => setShowOverride((v) => !v)}
            title="Sovrascrive classificazione AI"
            $active={showOverride}
          >
            ✏️
          </ActionIconBtn>
          <DeleteBtn onClick={() => dispatch(removeFile(file.id))} title="Rimuovi">🗑️</DeleteBtn>
        </HeaderActions>
      </CardHeader>

      {/* OVERRIDE PANEL */}
      {showOverride && (
        <OverridePanel>
          <OverrideLabel>👤 Sovrascrive classificazione AI</OverrideLabel>
          <OverrideRow>
            <OverrideSelect
              value={overrideTarget}
              onChange={(e) => setOverrideTarget(e.target.value)}
            >
              <option value="">-- Seleziona cartella --</option>
              {folders
                .filter((f) => !f.system)
                .map((f) => (
                  <option key={f.id} value={f.fullPath}>
                    {f.icon} {f.fullPath}
                  </option>
                ))}
            </OverrideSelect>
            <OverrideBtn onClick={handleOverride} disabled={!overrideTarget}>
              Sposta
            </OverrideBtn>
          </OverrideRow>
          <OverrideHint>
            Spostando manualmente il file, il tipo verrà aggiornato automaticamente
            in base alla cartella di destinazione (se configurata).
          </OverrideHint>
        </OverridePanel>
      )}

      {/* SUMMARY */}
      {analysisResult.summary && (
        <Summary>{analysisResult.summary}</Summary>
      )}

      {/* TAG ASSEGNATI */}
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

      {/* DISTRIBUZIONE TAG (barre) */}
      {allTags.length > 0 && !showHierarchy && (
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
                    <BarFill $pct={pct} $assigned={isAssigned} $high={tag.confidence >= 0.75} />
                  </BarWrap>
                  <BarPct $assigned={isAssigned} $high={tag.confidence >= 0.75}>{pct}%</BarPct>
                </BarRow>
              );
            })}
          </BarsContainer>
        </Section>
      )}

      {/* CLASSIFICAZIONE GERARCHICA A 3 LIVELLI */}
      {showHierarchy && hasHierarchy && (
        <HierarchicalClassificationView
          classification={analysisResult.hierarchical_classification!}
          compact={true}
        />
      )}

      {/* DATI ESTRATTI */}
      {analysisResult.extracted_data && Object.keys(analysisResult.extracted_data).length > 0 && (
        <ExtractedSection>
          {Object.entries(analysisResult.extracted_data)
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .slice(0, 3)
            .map(([key, val]) => (
              <ExtractedRow key={key}>
                <ExtractedKey>{key.replace(/_/g, " ")}</ExtractedKey>
                <ExtractedVal>{Array.isArray(val) ? val.join(", ") : String(val)}</ExtractedVal>
              </ExtractedRow>
            ))}
        </ExtractedSection>
      )}

      {/* FOOTER */}
      <CardFooter>
        <FooterDate>
          {new Date(file.uploadedAt).toLocaleString("it-IT", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </FooterDate>
        {analysisResult.message && <FooterMsg>{analysisResult.message}</FooterMsg>}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// STYLES
// ============================================================

const Card = styled.div`
  background: #fff; border: 1px solid #e0e8e6; border-radius: 16px;
  padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s; display: flex; flex-direction: column; gap: 12px;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); }
`;

const CardHeader = styled.div`display: flex; align-items: flex-start; gap: 12px;`;
const FileIconWrap = styled.div`font-size: 1.8rem; flex-shrink: 0;`;
const HeaderContent = styled.div`flex: 1; min-width: 0;`;
const FileName = styled.div`font-weight: 700; color: #1a3a30; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px;`;
const StatusRow = styled.div`display: flex; flex-wrap: wrap; gap: 6px; align-items: center;`;
const StatusBadge = styled.span<{ $color: string; $bg: string; $border: string }>`
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.73rem; font-weight: 700;
  color: ${({ $color }) => $color}; background: ${({ $bg }) => $bg}; border: 1px solid ${({ $border }) => $border};
  border-radius: 999px; padding: 2px 9px;
`;
const FolderBadge = styled.span`font-size:0.72rem;color:#555;background:#f0f0f0;border:1px solid #ddd;border-radius:999px;padding:2px 8px;`;
const OverrideBadge = styled.span`font-size:0.72rem;color:#d97706;background:#fffbeb;border:1px solid #f5d87a;border-radius:999px;padding:2px 8px;`;
const HeaderActions = styled.div`display:flex;gap:4px;flex-shrink:0;`;
const ActionIconBtn = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => $active ? "#f5f3ff" : "none"};
  border: ${({ $active }) => $active ? "1px solid #ddd6fe" : "none"};
  border-radius: 8px; cursor: pointer; font-size: 0.95rem; opacity: 0.6;
  padding: 3px 6px; transition: all 0.15s;
  &:hover { opacity: 1; background: #f5f5f5; }
`;
const DeleteBtn = styled.button`background:none;border:none;cursor:pointer;font-size:0.95rem;opacity:0.4;padding:3px;&:hover{opacity:1;}`;

const OverridePanel = styled.div`
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 14px;
`;
const OverrideLabel = styled.div`font-size:0.78rem;font-weight:700;color:#92400e;margin-bottom:8px;`;
const OverrideRow = styled.div`display:flex;gap:8px;`;
const OverrideSelect = styled.select`flex:1;border:1px solid #fbbf24;border-radius:8px;padding:7px 10px;font-size:0.85rem;outline:none;background:#fff;&:focus{border-color:#d97706;}`;
const OverrideBtn = styled.button`padding:7px 14px;background:#d97706;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.84rem;cursor:pointer;&:hover:not(:disabled){opacity:0.9;}&:disabled{opacity:0.45;cursor:not-allowed;}`;
const OverrideHint = styled.p`font-size:0.74rem;color:#92400e;margin:6px 0 0;line-height:1.4;`;

const Summary = styled.p`font-size:0.84rem;color:#555;line-height:1.5;margin:0;background:#f8f9fa;padding:8px 12px;border-radius:8px;border-left:3px solid #1b6f5c;`;
const Section = styled.div``;
const SectionTitle = styled.div`font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#aaa;margin-bottom:8px;`;
const TagsRow = styled.div`display:flex;flex-wrap:wrap;gap:6px;`;
const AssignedTag = styled.span`display:inline-flex;align-items:center;gap:5px;background:#e8f5f0;color:#1b6f5c;border:1px solid #b8ddd4;border-radius:999px;padding:3px 10px;font-size:0.79rem;font-weight:600;`;
const ConfPct = styled.span<{ $high: boolean }>`font-size:0.7rem;font-weight:700;color:${({ $high }) => $high ? "#1b6f5c" : "#d97706"};background:${({ $high }) => $high ? "#d1fae5" : "#fef3c7"};border-radius:999px;padding:0 5px;`;
const BarsContainer = styled.div`display:flex;flex-direction:column;gap:5px;`;
const BarRow = styled.div`display:flex;align-items:center;gap:8px;`;
const BarLabel = styled.div<{ $assigned: boolean }>`font-size:0.78rem;color:${({ $assigned }) => $assigned ? "#1a3a30" : "#888"};font-weight:${({ $assigned }) => $assigned ? 700 : 400};min-width:120px;display:flex;align-items:center;gap:4px;`;
const AssignedDot = styled.span`width:6px;height:6px;background:#1b6f5c;border-radius:50%;flex-shrink:0;`;
const BarWrap = styled.div`flex:1;height:5px;background:#e8e8e8;border-radius:99px;overflow:hidden;`;
const BarFill = styled.div<{ $pct: number; $assigned: boolean; $high: boolean }>`height:100%;width:${({ $pct }) => $pct}%;background:${({ $assigned, $high }) => $assigned && $high ? "#1b6f5c" : $assigned ? "#0284c7" : $high ? "#22c55e" : "#d1d5db"};border-radius:99px;transition:width 0.4s ease;`;
const BarPct = styled.span<{ $assigned: boolean; $high: boolean }>`font-size:0.73rem;font-weight:700;min-width:30px;text-align:right;color:${({ $assigned, $high }) => $assigned && $high ? "#1b6f5c" : $high ? "#22c55e" : "#bbb"};`;
const ExtractedSection = styled.div`display:flex;flex-direction:column;gap:4px;background:#f8f8f8;border-radius:8px;padding:8px 12px;`;
const ExtractedRow = styled.div`display:flex;gap:8px;font-size:0.79rem;`;
const ExtractedKey = styled.span`color:#999;text-transform:capitalize;flex-shrink:0;min-width:80px;`;
const ExtractedVal = styled.span`color:#333;font-weight:600;`;
const CardFooter = styled.div`border-top:1px solid #f0f0f0;padding-top:8px;`;
const FooterDate = styled.div`font-size:0.72rem;color:#bbb;`;
const FooterMsg = styled.div`font-size:0.76rem;color:#888;margin-top:2px;font-style:italic;`;
