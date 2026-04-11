"use client";

import { useState } from "react";
import styled from "styled-components";
import type { AnalysisResult, TagEntry } from "@/lib/features/fileSlice";

type Props = {
  analysis: AnalysisResult;
  onConfirm: (confirmedTags: string[], additionalTags: string[]) => void;
  onDismiss: () => void;
};

export default function ConfirmationPopup({ analysis, onConfirm, onDismiss }: Props) {
  // Tag già certi (PARTIAL_CONFIRMATION)
  const autoTags = analysis.tags?.map((t) => t.name) ?? [];

  // Tag da scegliere (pending)
  const pendingTags = analysis.pending_tags ?? analysis.all_tags ?? [];

  // Selezione utente: parte dai pending con confidence > 0.6
  const [selected, setSelected] = useState<Set<string>>(
    new Set(
      pendingTags
        .filter((t) => t.confidence >= 0.6)
        .map((t) => t.name)
    )
  );

  const [customInput, setCustomInput] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);

  const toggleTag = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addCustomTag = () => {
    const normalized = customInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized || customTags.includes(normalized)) return;
    setCustomTags((prev) => [...prev, normalized]);
    setCustomInput("");
  };

  const removeCustom = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleConfirm = () => {
    const confirmed = [...autoTags, ...Array.from(selected)];
    onConfirm(confirmed, customTags);
  };

  const totalSelected = autoTags.length + selected.size + customTags.length;

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <Modal>
        {/* Header */}
        <Header>
          <HeaderIcon>🤔</HeaderIcon>
          <HeaderContent>
            <HeaderTitle>Classificazione incerta</HeaderTitle>
            <HeaderSub>{analysis.message}</HeaderSub>
          </HeaderContent>
        </Header>

        {/* File info */}
        <FileRow>
          <FileIcon>📄</FileIcon>
          <FileName title={analysis.filename}>{analysis.filename}</FileName>
        </FileRow>

        {/* Tag automatici (già certi) */}
        {autoTags.length > 0 && (
          <Section>
            <SectionLabel>
              <span>✅</span> Tag già classificati automaticamente
            </SectionLabel>
            <AutoTagsRow>
              {(analysis.tags ?? []).map((tag) => (
                <AutoTag key={tag.name}>
                  {tag.name}
                  <ConfBadge $high>{Math.round(tag.confidence * 100)}%</ConfBadge>
                </AutoTag>
              ))}
            </AutoTagsRow>
          </Section>
        )}

        {/* Tag da confermare */}
        {pendingTags.length > 0 && (
          <Section>
            <SectionLabel>
              <span>❓</span>
              {analysis.type === "CONFIRMATION_REQUIRED"
                ? "Seleziona i tag corretti per questo documento"
                : "Conferma anche questi tag incerti?"}
            </SectionLabel>
            <TagGrid>
              {pendingTags.map((tag) => {
                const pct = Math.round(tag.confidence * 100);
                const isSelected = selected.has(tag.name);
                return (
                  <TagCard
                    key={tag.name}
                    $selected={isSelected}
                    onClick={() => toggleTag(tag.name)}
                  >
                    <TagCardTop>
                      <TagName>{tag.name.replace(/_/g, " ")}</TagName>
                      <ConfBadge $high={tag.confidence >= 0.6}>
                        {pct}%
                      </ConfBadge>
                    </TagCardTop>
                    {tag.description && (
                      <TagDesc>{tag.description}</TagDesc>
                    )}
                    <BarWrap>
                      <Bar $pct={pct} $high={tag.confidence >= 0.6} />
                    </BarWrap>
                    {isSelected && <CheckMark>✓</CheckMark>}
                  </TagCard>
                );
              })}
            </TagGrid>
          </Section>
        )}

        {/* Tag custom aggiuntivi */}
        <Section>
          <SectionLabel>
            <span>➕</span> Aggiungi tag personalizzati (opzionale)
          </SectionLabel>
          <CustomInputRow>
            <CustomInput
              placeholder="es: urgente, 2024, cliente-rossi"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
            />
            <AddBtn type="button" onClick={addCustomTag} disabled={!customInput.trim()}>
              Aggiungi
            </AddBtn>
          </CustomInputRow>
          {customTags.length > 0 && (
            <CustomTagsRow>
              {customTags.map((tag) => (
                <CustomTagPill key={tag}>
                  {tag}
                  <RemoveBtn onClick={() => removeCustom(tag)}>✕</RemoveBtn>
                </CustomTagPill>
              ))}
            </CustomTagsRow>
          )}
        </Section>

        {/* Sommario */}
        {analysis.summary && (
          <SummaryBox>
            <strong>Riassunto AI:</strong> {analysis.summary}
          </SummaryBox>
        )}

        {/* Azioni */}
        <Actions>
          <DismissBtn onClick={onDismiss}>Annulla</DismissBtn>
          <ConfirmBtn onClick={handleConfirm} disabled={totalSelected === 0}>
            Conferma {totalSelected > 0 && `(${totalSelected} tag)`}
          </ConfirmBtn>
        </Actions>
      </Modal>
    </Overlay>
  );
}

// ============================================================
// STYLES
// ============================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 20px;
  width: min(100%, 600px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.28);
  padding: 28px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const HeaderIcon = styled.div`font-size: 2rem;`;
const HeaderContent = styled.div`flex: 1;`;
const HeaderTitle = styled.h3`font-size: 1.2rem; color: #1a3a30; margin: 0 0 4px;`;
const HeaderSub = styled.p`color: #666; font-size: 0.88rem; margin: 0; line-height: 1.4;`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5faf8;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #d4ece5;
`;
const FileIcon = styled.span`font-size: 1.2rem;`;
const FileName = styled.span`
  font-weight: 600; color: #1a3a30; font-size: 0.9rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const Section = styled.div``;

const SectionLabel = styled.p`
  font-weight: 700;
  color: #286052;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AutoTagsRow = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;

const AutoTag = styled.span`
  background: #f0faf5;
  color: #1b6f5c;
  border: 1px solid #b8ddd4;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const ConfBadge = styled.span<{ $high?: boolean }>`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $high }) => ($high ? "#1b6f5c" : "#d97706")};
  background: ${({ $high }) => ($high ? "#e0f5ee" : "#fef3c7")};
  border-radius: 999px;
  padding: 1px 6px;
`;

const TagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
`;

const TagCard = styled.div<{ $selected: boolean }>`
  position: relative;
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid ${({ $selected }) => ($selected ? "#1b6f5c" : "#e0e0e0")};
  background: ${({ $selected }) => ($selected ? "#f0faf5" : "#fafafa")};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #1b6f5c; background: #f5fdf9; }
`;

const TagCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const TagName = styled.div`
  font-weight: 700;
  color: #1a3a30;
  font-size: 0.88rem;
`;

const TagDesc = styled.p`
  font-size: 0.76rem;
  color: #666;
  margin: 0 0 8px;
  line-height: 1.4;
`;

const BarWrap = styled.div`
  height: 4px;
  background: #e0e0e0;
  border-radius: 99px;
  overflow: hidden;
`;

const Bar = styled.div<{ $pct: number; $high: boolean }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $high }) => ($high ? "#1b6f5c" : "#f59e0b")};
  border-radius: 99px;
  transition: width 0.4s;
`;

const CheckMark = styled.div`
  position: absolute;
  top: 8px; right: 8px;
  width: 20px; height: 20px;
  background: #1b6f5c;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 900;
`;

const CustomInputRow = styled.div`display: flex; gap: 8px;`;

const CustomInput = styled.input`
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.88rem;
  outline: none;

  &:focus { border-color: #1b6f5c; box-shadow: 0 0 0 3px rgba(27,111,92,0.1); }
`;

const AddBtn = styled.button`
  padding: 8px 16px;
  background: #1b6f5c;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.86rem;
  cursor: pointer;

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const CustomTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const CustomTagPill = styled.span`
  background: #e8f5f0;
  color: #1b6f5c;
  border: 1px solid #b8ddd4;
  border-radius: 999px;
  padding: 3px 10px 3px 12px;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const RemoveBtn = styled.button`
  background: none; border: none;
  cursor: pointer; font-size: 0.7rem;
  color: #1b6f5c; padding: 0;
  &:hover { color: #c00; }
`;

const SummaryBox = styled.div`
  background: #fffbf0;
  border: 1px solid #f0d88a;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.84rem;
  color: #7a5f10;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
`;

const DismissBtn = styled.button`
  padding: 10px 18px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  color: #666;
  font-size: 0.9rem;

  &:hover { background: #f5f5f5; }
`;

const ConfirmBtn = styled.button`
  padding: 10px 22px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;
