"use client";

import styled from "styled-components";

type Props = {
  title?: string;
  text: string;
};

export default function WorkspacePreviewCard({
  title = "Anteprima",
  text,
}: Props) {
  return (
    <Card>
      <Glow $tone="cyan" />
      <Glow $tone="lime" />
      <Copy>
        <Label>{title}</Label>
        <Text>{text}</Text>
      </Copy>
    </Card>
  );
}

const Card = styled.section`
  position: relative;
  min-height: 180px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #111827;
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.16), transparent 32%),
    radial-gradient(circle at bottom right, rgba(163, 230, 53, 0.14), transparent 28%),
    linear-gradient(145deg, #0b1220 0%, #111827 55%, #0f172a 100%);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
`;

const Glow = styled.span<{ $tone: "cyan" | "lime" }>`
  position: absolute;
  width: 148px;
  height: 148px;
  border-radius: 26px;
  transform: rotate(22deg);
  top: ${({ $tone }) => ($tone === "cyan" ? "18px" : "74px")};
  left: ${({ $tone }) => ($tone === "cyan" ? "-30px" : "90px")};
  background: ${({ $tone }) =>
    $tone === "cyan"
      ? "linear-gradient(135deg, rgba(165, 243, 252, 0.9), rgba(103, 232, 249, 0.2))"
      : "linear-gradient(135deg, rgba(217, 249, 157, 0.88), rgba(163, 230, 53, 0.22))"};
  opacity: 0.9;
`;

const Copy = styled.div`
  position: absolute;
  inset: auto 14px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
`;

const Label = styled.div`
  color: #e2e8f0;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Text = styled.div`
  color: #cbd5e1;
  font-size: 0.82rem;
  line-height: 1.4;
  max-width: 220px;
`;
