"use client";

import styled from "styled-components";
import type { HierarchicalClassification } from "@/lib/features/fileSlice";

type Props = {
  classification: HierarchicalClassification;
  compact?: boolean;
};

const CONTEXT_LABELS: Record<string, string> = {
  work: "💼 Lavoro",
  personal: "👤 Personale",
  study: "📚 Studio",
  leisure: "🎮 Svago",
};

const CONTENT_LABELS: Record<string, string> = {
  code: "💻 Codice",
  document: "📄 Documento",
  notes: "📝 Note",
  data: "📊 Dati",
  communication: "📧 Comunicazione",
  literature: "📖 Letteratura",
  tutorial: "🎓 Guida/Tutorial",
  media_metadata: "🎵 Media",
};

const SUB_LABELS: Record<string, string> = {
  java: "☕ Java",
  javascript: "🟡 JavaScript/TS",
  python: "🐍 Python",
  shell_config: "⚙️ Config/Shell",
  web: "🌐 Web",
  invoice: "🧾 Fattura",
  contract: "⚖️ Contratto",
  receipt: "🧾 Ricevuta",
  report: "📊 Relazione",
  certificate: "🏅 Certificato",
  identity_doc: "🪪 Documento ID",
  personal_notes: "✏️ Note Personali",
  todo: "✅ To-do",
  draft: "📋 Bozza",
  spreadsheet: "📊 Foglio Calcolo",
  csv_data: "📑 CSV/Tabella",
  json_xml: "🔧 JSON/XML",
  email: "📧 Email",
  formal_letter: "📮 Lettera",
  poetry: "🎭 Poesia",
  fiction: "📗 Narrativa",
  essay: "📝 Saggio",
  manual: "📘 Manuale",
  howto: "🔍 Guida Pratica",
};

function getLabel(key: string, labels: Record<string, string>): string {
  return labels[key] ?? key.replace(/_/g, " ");
}

export default function HierarchicalClassificationView({ classification, compact = false }: Props) {
  const { step1_context, step2_content_type, step3_sub_type } = classification;

  const renderLevel = (
    label: string,
    stepNum: number,
    level: { scores: Record<string, number>; top: string | null; reasoning?: string },
    labelMap: Record<string, string>
  ) => {
    if (!level?.scores || Object.keys(level.scores).length === 0) return null;

    const sorted = Object.entries(level.scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, compact ? 3 : 6);

    const topScore = sorted[0]?.[1] ?? 0;

    return (
      <LevelCard key={stepNum}>
        <LevelHeader>
          <StepBadge>{stepNum}</StepBadge>
          <LevelTitle>{label}</LevelTitle>
          {level.top && (
            <TopLabel>{getLabel(level.top, labelMap)}</TopLabel>
          )}
        </LevelHeader>

        <Bars>
          {sorted.map(([key, score]) => {
            const pct = Math.round(score * 100);
            const isTop = key === level.top;
            return (
              <BarRow key={key} $top={isTop}>
                <BarName $top={isTop}>{getLabel(key, labelMap)}</BarName>
                <BarTrack>
                  <BarFill $pct={pct} $top={isTop} />
                </BarTrack>
                <BarPct $top={isTop} $high={score >= 0.75}>{pct}%</BarPct>
              </BarRow>
            );
          })}
        </Bars>

        {!compact && level.reasoning && (
          <Reasoning>{level.reasoning}</Reasoning>
        )}
      </LevelCard>
    );
  };

  return (
    <Container $compact={compact}>
      <SectionTitle>🧠 Analisi AI — Classificazione Gerarchica</SectionTitle>
      <Levels>
        {renderLevel("Contesto", 1, step1_context, CONTEXT_LABELS)}
        {renderLevel("Tipo di contenuto", 2, step2_content_type, CONTENT_LABELS)}
        {renderLevel("Sotto-tipo", 3, step3_sub_type, SUB_LABELS)}
      </Levels>
    </Container>
  );
}

// =====================================================
// STYLES
// =====================================================

const Container = styled.div<{ $compact: boolean }>`
  background: ${({ $compact }) => $compact ? "transparent" : "#f9fafb"};
  border-radius: ${({ $compact }) => $compact ? "0" : "12px"};
  padding: ${({ $compact }) => $compact ? "0" : "16px"};
`;

const SectionTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8b5cf6;
  margin-bottom: 12px;
`;

const Levels = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LevelCard = styled.div`
  background: #fff;
  border: 1px solid #e8e8f0;
  border-radius: 10px;
  padding: 12px 14px;
`;

const LevelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const StepBadge = styled.div`
  width: 22px; height: 22px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
`;

const LevelTitle = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
  flex: 1;
`;

const TopLabel = styled.span`
  font-size: 0.74rem;
  font-weight: 700;
  color: #8b5cf6;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 999px;
  padding: 2px 8px;
`;

const Bars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const BarRow = styled.div<{ $top: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${({ $top }) => ($top ? 1 : 0.65)};
`;

const BarName = styled.div<{ $top: boolean }>`
  font-size: 0.74rem;
  color: ${({ $top }) => ($top ? "#1f2937" : "#6b7280")};
  font-weight: ${({ $top }) => ($top ? 700 : 400)};
  min-width: 110px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: #f0f0f4;
  border-radius: 99px;
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number; $top: boolean }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $top }) =>
    $top ? "linear-gradient(90deg, #8b5cf6, #6366f1)" : "#d1d5db"};
  border-radius: 99px;
  transition: width 0.5s ease;
`;

const BarPct = styled.span<{ $top: boolean; $high: boolean }>`
  font-size: 0.72rem;
  font-weight: 700;
  min-width: 32px;
  text-align: right;
  color: ${({ $top, $high }) =>
    $top && $high ? "#8b5cf6" : $top ? "#6366f1" : "#9ca3af"};
`;

const Reasoning = styled.p`
  font-size: 0.74rem;
  color: #6b7280;
  margin: 8px 0 0;
  font-style: italic;
  border-top: 1px solid #f0f0f0;
  padding-top: 6px;
`;
