"use client";

import styled from "styled-components";

type Segment = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  totalFiles: number;
  classified: number;
  pending: number;
  lowConfidence: number;
  manual: number;
};

export default function WorkspaceStatusPieCard({
  totalFiles,
  classified,
  pending,
  lowConfidence,
  manual,
}: Props) {
  const segments: Segment[] = [
    { label: "Classificati AI", value: classified, color: "#1b6f5c" },
    { label: "In attesa", value: pending, color: "#d97706" },
    { label: "Non classificati", value: lowConfidence, color: "#6b7280" },
    { label: "Manuale", value: manual, color: "#8b5cf6" },
  ];

  const activeSegments = segments.filter((segment) => segment.value > 0);
  const visibleTotal = activeSegments.reduce((sum, segment) => sum + segment.value, 0);
  const pieGradient =
    activeSegments.length > 0
      ? activeSegments
          .map((segment, index) => {
            const start = activeSegments
              .slice(0, index)
              .reduce((sum, item) => sum + (item.value / visibleTotal) * 360, 0);
            const end = start + (segment.value / visibleTotal) * 360;
            return `${segment.color} ${start}deg ${end}deg`;
          })
          .join(", ")
      : "#dbe4e0 0deg 360deg";

  return (
    <RailCard>
      <RailTitle>Stato workspace</RailTitle>

      <ChartArea>
        <ChartRing $gradient={pieGradient}>
          <ChartCenter>
            <ChartValue>{totalFiles}</ChartValue>
            <ChartLabel>File</ChartLabel>
          </ChartCenter>
        </ChartRing>

        <ChartMeta>
          <ChartMetaLabel>Distribuzione documenti</ChartMetaLabel>
          <ChartMetaValue>{visibleTotal > 0 ? `${Math.round((classified / Math.max(1, totalFiles)) * 100)}% classificati` : "Nessun file"}</ChartMetaValue>
        </ChartMeta>
      </ChartArea>

      <Legend>
        {segments.map((segment) => (
          <LegendItem key={segment.label}>
            <LegendSwatch $color={segment.color} />
            <LegendCopy>
              <LegendLabel>{segment.label}</LegendLabel>
              <LegendValue>{segment.value}</LegendValue>
            </LegendCopy>
          </LegendItem>
        ))}
      </Legend>
    </RailCard>
  );
}

const RailCard = styled.section`
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #dbe4e0;
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
`;

const RailTitle = styled.h3`
  margin: 0 0 14px;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.01em;
`;

const ChartArea = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const ChartRing = styled.div<{ $gradient: string }>`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: conic-gradient(${({ $gradient }) => $gradient});
  padding: 18px;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);

  &::after {
    content: "";
    position: absolute;
    inset: 18px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 25%, #ffffff 0%, #f8fbff 55%, #eef3f7 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
`;

const ChartCenter = styled.div`
  position: absolute;
  inset: 18px;
  z-index: 1;
  display: grid;
  place-items: center;
  text-align: center;
`;

const ChartValue = styled.div`
  font-size: 2rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
`;

const ChartLabel = styled.div`
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ChartMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const ChartMetaLabel = styled.div`
  color: #64748b;
  font-size: 0.74rem;
`;

const ChartMetaValue = styled.div`
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 800;
`;

const Legend = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5ede9;
`;

const LegendSwatch = styled.span<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const LegendCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const LegendLabel = styled.div`
  color: #0f172a;
  font-size: 0.76rem;
  font-weight: 700;
`;

const LegendValue = styled.div`
  color: #64748b;
  font-size: 0.72rem;
`;