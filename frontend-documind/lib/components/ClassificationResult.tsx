"use client";

import styled from "styled-components";
import type { FileItem } from "@/lib/features/fileSlice";
import { removeFile } from "@/lib/features/fileSlice";
import { useAppDispatch } from "@/lib/hooks";

type Props = {
  file: FileItem;
};

type ExtractedData = {
  tipo_documento?: string;
  data_documento?: string;
  soggetti_coinvolti?: string[];
  descrizione_breve?: string;
};

const TYPE_ICONS: Record<string, string> = {
  Invoice: "🧾", Receipt: "🧾", Contract: "📝", Resume: "👤",
  "Personal Document": "🪪", "Legal Document": "⚖️", Poetry: "✍️",
  Literature: "📚", Code: "💻", Spreadsheet: "📊", Presentation: "📽️",
  Report: "📋", Email: "📧", "Financial Document": "💰",
  "Medical Document": "🏥", "Technical Document": "🔧", Other: "📄",
};

const STATUS_CONFIG = {
  CLASSIFIED: { label: "Classificato", color: "#1b6f5c", bg: "#f0faf5", border: "#b8ddd4" },
  CONFIRMATION_REQUIRED: { label: "In attesa", color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  LOW_CONFIDENCE: { label: "Non classificato", color: "#6b7280", bg: "#f9fafb", border: "#d1d5db" },
};

export default function ClassificationResult({ file }: Props) {
  const dispatch = useAppDispatch();
  const { analysisResult } = file;
  const status = STATUS_CONFIG[analysisResult.type] ?? STATUS_CONFIG.LOW_CONFIDENCE;

  const topClassifications = (analysisResult.classifications ?? [])
    .filter((c) => c.confidence >= 0.3)
    .slice(0, 4);

  const extractedData = analysisResult.extracted_data as ExtractedData | undefined;

  return (
    <Card>
      <CardHeader>
        <FileIconWrap>
          {TYPE_ICONS[topClassifications[0]?.type ?? "Other"] ?? "📄"}
        </FileIconWrap>
        <HeaderContent>
          <FileName title={file.filename}>{file.filename}</FileName>
          <StatusBadge $color={status.color} $bg={status.bg} $border={status.border}>
            {status.label}
          </StatusBadge>
        </HeaderContent>
        <DeleteBtn
          onClick={() => dispatch(removeFile(file.id))}
          title="Rimuovi"
        >
          🗑️
        </DeleteBtn>
      </CardHeader>

      {file.folder && (
        <FolderRow>
          <span>📁</span>
          <span>{file.folder}</span>
        </FolderRow>
      )}

      {/* Classifications */}
      {topClassifications.length > 0 && (
        <Section>
          <SectionTitle>Classificazioni AI</SectionTitle>
          <ClassificationsList>
            {topClassifications.map((c) => (
              <ClassificationRow key={c.type}>
                <ClassLabel>{TYPE_ICONS[c.type] ?? "•"} {c.type}</ClassLabel>
                <ProgressWrap>
                  <ProgressBar $pct={c.confidence * 100} $high={c.confidence > 0.6} />
                </ProgressWrap>
                <Pct $high={c.confidence > 0.6} $medium={c.confidence >= 0.5}>
                  {Math.round(c.confidence * 100)}%
                </Pct>
              </ClassificationRow>
            ))}
          </ClassificationsList>
        </Section>
      )}

      {/* Tags */}
      {file.tags && file.tags.length > 0 && (
        <Section>
          <SectionTitle>Tag</SectionTitle>
          <TagsRow>
            {file.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </TagsRow>
        </Section>
      )}

      {/* Extracted data */}
      {extractedData && (
        <Section>
          <SectionTitle>Dati estratti</SectionTitle>
          <ExtractedGrid>
            {extractedData.tipo_documento && (
              <ExtractedItem>
                <ExtractedKey>Tipo</ExtractedKey>
                <ExtractedVal>{String(extractedData.tipo_documento)}</ExtractedVal>
              </ExtractedItem>
            )}
            {extractedData.data_documento && (
              <ExtractedItem>
                <ExtractedKey>Data</ExtractedKey>
                <ExtractedVal>{String(extractedData.data_documento)}</ExtractedVal>
              </ExtractedItem>
            )}
            {Array.isArray(extractedData.soggetti_coinvolti) &&
              (extractedData.soggetti_coinvolti as string[]).length > 0 && (
                <ExtractedItem $full>
                  <ExtractedKey>Soggetti</ExtractedKey>
                  <ExtractedVal>
                    {(extractedData.soggetti_coinvolti as string[]).join(", ")}
                  </ExtractedVal>
                </ExtractedItem>
              )}
            {extractedData.descrizione_breve && (
              <ExtractedItem $full>
                <ExtractedKey>Descrizione</ExtractedKey>
                <ExtractedVal>{String(extractedData.descrizione_breve)}</ExtractedVal>
              </ExtractedItem>
            )}
          </ExtractedGrid>
        </Section>
      )}

      <CardFooter>
        <FooterDate>{new Date(file.uploadedAt).toLocaleString("it-IT")}</FooterDate>
        {analysisResult.message && <FooterMsg>{analysisResult.message}</FooterMsg>}
      </CardFooter>
    </Card>
  );
}

// ===== STYLES =====

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e8e6;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
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

const StatusBadge = styled.span<{ $color: string; $bg: string; $border: string }>`
  display: inline-block;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $border }) => $border};
  border-radius: 999px;
  padding: 2px 10px;
`;

const DeleteBtn = styled.button`
  background: none; border: none;
  cursor: pointer; font-size: 1rem;
  opacity: 0.5; flex-shrink: 0;
  padding: 2px;

  &:hover { opacity: 1; }
`;

const FolderRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.82rem;
  color: #555;
  margin-bottom: 12px;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 8px;
`;

const Section = styled.div`margin-bottom: 14px;`;

const SectionTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
  margin-bottom: 8px;
`;

const ClassificationsList = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const ClassificationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ClassLabel = styled.span`
  font-size: 0.82rem;
  color: #444;
  min-width: 170px;
  flex-shrink: 0;
`;

const ProgressWrap = styled.div`
  flex: 1;
  height: 6px;
  background: #e8e8e8;
  border-radius: 99px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ $pct: number; $high: boolean }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $high }) => ($high ? "#1b6f5c" : "#f59e0b")};
  border-radius: 99px;
  transition: width 0.5s ease;
`;

const Pct = styled.span<{ $high: boolean; $medium: boolean }>`
  font-size: 0.78rem;
  font-weight: 700;
  min-width: 34px;
  text-align: right;
  color: ${({ $high, $medium }) =>
    $high ? "#1b6f5c" : $medium ? "#d97706" : "#999"};
`;

const TagsRow = styled.div`display: flex; flex-wrap: wrap; gap: 6px;`;

const Tag = styled.span`
  background: #e8f5f0;
  color: #1b6f5c;
  border: 1px solid #b8ddd4;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.78rem;
  font-weight: 600;
`;

const ExtractedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ExtractedItem = styled.div<{ $full?: boolean }>`
  background: #f8f8f8;
  border-radius: 8px;
  padding: 8px 10px;
  ${({ $full }) => $full && "grid-column: 1 / -1;"}
`;

const ExtractedKey = styled.div`font-size: 0.7rem; color: #999; text-transform: uppercase; margin-bottom: 2px;`;
const ExtractedVal = styled.div`font-size: 0.83rem; color: #333;`;

const CardFooter = styled.div`
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
  margin-top: 8px;
`;

const FooterDate = styled.div`font-size: 0.74rem; color: #bbb;`;
const FooterMsg = styled.div`font-size: 0.78rem; color: #888; margin-top: 3px; font-style: italic;`;
