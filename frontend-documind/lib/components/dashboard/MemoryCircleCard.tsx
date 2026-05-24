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
  background: #16a34a;
  border: 1px solid #15803d;
  border-radius: 16px;
  padding: 14px;
  color: #ecfdf5;
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
  background: conic-gradient(#dcfce7 ${({ $percent }) => $percent}%, rgba(255,255,255,0.18) 0%);
`;

const CircleInner = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #0f7a35;
  display: grid;
  place-items: center;
  text-align: center;
`;

const Percent = styled.div`font-size:1.35rem;font-weight:900;line-height:1;`;
const Meta = styled.div`font-size:0.76rem;opacity:0.9;`;

const Stats = styled.div`display:grid;grid-template-columns:1fr;gap:8px;`;
const Stat = styled.div`display:flex;justify-content:space-between;background:rgba(255,255,255,0.12);border-radius:10px;padding:8px 10px;`;
const Label = styled.div`font-size:0.76rem;opacity:0.95;`;
const Value = styled.div`font-size:0.8rem;font-weight:800;`;
