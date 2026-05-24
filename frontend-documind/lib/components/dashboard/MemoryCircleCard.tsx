"use client";

import styled from "styled-components";

type Props = {
  totalGb: number;
  usedGb: number;
  fileCount: number;
};

export default function MemoryCircleCard({ totalGb, usedGb, fileCount }: Props) {
  const safeUsed = Math.max(0, Math.min(usedGb, totalGb));
  const percent = totalGb > 0 ? Math.round((safeUsed / totalGb) * 100) : 0;

  return (
    <Card>
      <Header>Utilizzo memoria</Header>
      <Circle $percent={percent}>
        <CircleInner>
          <Percent>{percent}%</Percent>
          <Meta>usata</Meta>
        </CircleInner>
      </Circle>
      <Stats>
        <Stat>
          <Label>Totale</Label>
          <Value>{totalGb.toFixed(2)} GB</Value>
        </Stat>
        <Stat>
          <Label>Usata</Label>
          <Value>{safeUsed.toFixed(2)} GB</Value>
        </Stat>
        <Stat>
          <Label>File</Label>
          <Value>{fileCount}</Value>
        </Stat>
      </Stats>
    </Card>
  );
}

const Card = styled.section`
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #dbe4e0;
  border-radius: 16px;
  padding: 14px;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 240px;
`;

const Header = styled.h3`margin:0;font-size:0.92rem;font-weight:800;`;

const Circle = styled.div<{ $percent: number }>`
  width: 148px;
  height: 148px;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(#1f2937 ${({ $percent }) => $percent}%, #e2e8f0 0%);
`;

const CircleInner = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #ffffff;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px solid #dbe4e0;
`;

const Percent = styled.div`font-size:1.35rem;font-weight:900;line-height:1;`;
const Meta = styled.div`font-size:0.76rem;color:#64748b;`;

const Stats = styled.div`display:grid;grid-template-columns:1fr;gap:8px;`;
const Stat = styled.div`display:flex;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;`;
const Label = styled.div`font-size:0.76rem;color:#64748b;`;
const Value = styled.div`font-size:0.8rem;font-weight:800;`;
