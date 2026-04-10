"use client";

import { useState } from "react";
import styled from "styled-components";
import type { AnalysisResult, ClassificationEntry } from "@/lib/features/fileSlice";

type Props = {
  analysis: AnalysisResult;
  onConfirm: (confirmedType: string, additionalTags: string[]) => void;
  onDismiss: () => void;
};

type ExtractedData = {
  tipo_documento?: string;
  data_documento?: string;
  descrizione_breve?: string;
};

const TYPE_ICONS: Record<string, string> = {
  Invoice: "🧾",
  Receipt: "🧾",
  Contract: "📝",
  Resume: "👤",
  "Personal Document": "🪪",
  "Legal Document": "⚖️",
  Poetry: "✍️",
  Literature: "📚",
  Code: "💻",
  Spreadsheet: "📊",
  Presentation: "📽️",
  Report: "📋",
  Email: "📧",
  "Financial Document": "💰",
  "Medical Document": "🏥",
  "Technical Document": "🔧",
  Other: "📄",
};

export default function ConfirmationPopup({ analysis, onConfirm, onDismiss }: Props) {
  const [selected, setSelected] = useState<string | null>(
    analysis.options?.[0]?.type ?? null
  );
  const [customTags, setCustomTags] = useState("");
  const extractedData = analysis.extracted_data as ExtractedData | undefined;

  const handleConfirm = () => {
    if (!selected) return;
    const tags = customTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    onConfirm(selected, tags);
  };

  const options = analysis.options ?? analysis.classifications?.slice(0, 3) ?? [];

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <Modal>
        <ModalHeader>
          <AlertIcon>🤔</AlertIcon>
          <div>
            <ModalTitle>Classificazione incerta</ModalTitle>
            <ModalSubtitle>{analysis.message}</ModalSubtitle>
          </div>
        </ModalHeader>

        <FileInfo>
          <FileIcon>📄</FileIcon>
          <FileName>{analysis.filename}</FileName>
        </FileInfo>

        <SectionLabel>Quale tipo di documento è?</SectionLabel>

        <OptionsList>
          {options.map((opt: ClassificationEntry) => (
            <OptionCard
              key={opt.type}
              $selected={selected === opt.type}
              onClick={() => setSelected(opt.type)}
            >
              <OptionIcon>{TYPE_ICONS[opt.type] ?? "📄"}</OptionIcon>
              <OptionContent>
                <OptionType>{opt.type}</OptionType>
                <ConfidenceBar>
                  <ConfidenceFill $pct={opt.confidence * 100} />
                  <ConfidenceLabel>{Math.round(opt.confidence * 100)}%</ConfidenceLabel>
                </ConfidenceBar>
              </OptionContent>
              {selected === opt.type && <SelectedCheck>✓</SelectedCheck>}
            </OptionCard>
          ))}

          {/* Option to pick "Other" not in the list */}
          <OptionCard
            $selected={selected === "Other"}
            onClick={() => setSelected("Other")}
          >
            <OptionIcon>🗂️</OptionIcon>
            <OptionContent>
              <OptionType>Altro tipo (non elencato)</OptionType>
              <OptionHint>Sposta in &quot;Senza categoria&quot;</OptionHint>
            </OptionContent>
            {selected === "Other" && <SelectedCheck>✓</SelectedCheck>}
          </OptionCard>
        </OptionsList>

        {/* Estratto documento (preview) */}
        {extractedData && (
          <ExtractedPreview>
            <PreviewTitle>📋 Dati estratti</PreviewTitle>
            {extractedData.tipo_documento && (
              <PreviewRow>
                <span>Tipo rilevato:</span>
                <strong>{extractedData.tipo_documento}</strong>
              </PreviewRow>
            )}
            {extractedData.data_documento && (
              <PreviewRow>
                <span>Data:</span>
                <strong>{extractedData.data_documento}</strong>
              </PreviewRow>
            )}
            {extractedData.descrizione_breve && (
              <PreviewRow>
                <span>Descrizione:</span>
                <em>{extractedData.descrizione_breve}</em>
              </PreviewRow>
            )}
          </ExtractedPreview>
        )}

        {/* Tag aggiuntivi */}
        <TagSection>
          <SectionLabel>Tag aggiuntivi (opzionale)</SectionLabel>
          <TagInput
            placeholder="es: urgente, 2024, cliente-rossi (separati da virgola)"
            value={customTags}
            onChange={(e) => setCustomTags(e.target.value)}
          />
        </TagSection>

        <ActionRow>
          <DismissButton onClick={onDismiss}>Annulla</DismissButton>
          <ConfirmButton disabled={!selected} onClick={handleConfirm}>
            Conferma classificazione
          </ConfirmButton>
        </ActionRow>
      </Modal>
    </Overlay>
  );
}

// ===== STYLED COMPONENTS =====

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 20px;
  width: min(100%, 560px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.28);
  padding: 28px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
`;

const AlertIcon = styled.div`font-size: 2.2rem; flex-shrink: 0;`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  color: #1a3a30;
  margin: 0 0 4px;
`;

const ModalSubtitle = styled.p`color: #666; font-size: 0.9rem; margin: 0; line-height: 1.4;`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5faf8;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 1px solid #d4ece5;
`;

const FileIcon = styled.span`font-size: 1.3rem;`;
const FileName = styled.span`
  font-weight: 600;
  color: #1a3a30;
  font-size: 0.92rem;
  word-break: break-all;
`;

const SectionLabel = styled.p`
  font-weight: 700;
  color: #286052;
  font-size: 0.85rem;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
`;

const OptionCard = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-radius: 12px;
  border: 2px solid ${({ $selected }) => ($selected ? "#1b6f5c" : "#e0e0e0")};
  background: ${({ $selected }) => ($selected ? "#f0faf5" : "#fafafa")};
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  &:hover { border-color: #1b6f5c; background: #f5fdf9; }
`;

const OptionIcon = styled.span`font-size: 1.4rem; flex-shrink: 0;`;

const OptionContent = styled.div`flex: 1;`;

const OptionType = styled.div`font-weight: 600; color: #1a3a30; font-size: 0.93rem;`;
const OptionHint = styled.div`color: #888; font-size: 0.8rem; margin-top: 2px;`;

const ConfidenceBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
`;

const ConfidenceFill = styled.div<{ $pct: number }>`
  flex: 1;
  height: 5px;
  background: #e0e0e0;
  border-radius: 99px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${({ $pct }) => $pct}%;
    height: 100%;
    background: ${({ $pct }) =>
      $pct > 60 ? "#1b6f5c" : $pct > 45 ? "#f59e0b" : "#ef4444"};
    border-radius: 99px;
    transition: width 0.3s ease;
  }
`;

const ConfidenceLabel = styled.span`
  font-size: 0.78rem;
  color: #777;
  min-width: 32px;
  text-align: right;
`;

const SelectedCheck = styled.div`
  position: absolute;
  right: 14px;
  background: #1b6f5c;
  color: #fff;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 900;
`;

const ExtractedPreview = styled.div`
  background: #fffbf0;
  border: 1px solid #f0d88a;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
`;

const PreviewTitle = styled.div`font-weight: 700; color: #7a5f10; font-size: 0.82rem; margin-bottom: 8px;`;

const PreviewRow = styled.div`
  display: flex;
  gap: 8px;
  font-size: 0.84rem;
  margin-bottom: 4px;
  color: #555;

  span { flex-shrink: 0; }
  strong, em { color: #333; }
`;

const TagSection = styled.div`margin-bottom: 22px;`;

const TagInput = styled.input`
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.88rem;
  outline: none;

  &:focus { border-color: #1b6f5c; box-shadow: 0 0 0 3px rgba(27,111,92,0.12); }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const DismissButton = styled.button`
  padding: 11px 20px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  color: #666;
  font-size: 0.9rem;

  &:hover { background: #f5f5f5; }
`;

const ConfirmButton = styled.button`
  padding: 11px 22px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;
