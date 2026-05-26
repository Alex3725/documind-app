"use client";

import Link from "next/link";
import styled from "styled-components";
import DocuMindLogo from "@/lib/components/DocuMindLogo";

type Action = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  actions: Action[];
  children?: React.ReactNode;
};

export default function FeaturePageFrame({ eyebrow, title, description, actions, children }: Props) {
  return (
    <Page>
      <Glow />
      <Panel>
        <BrandRow>
          <BrandMark>
            <DocuMindLogo size={38} />
          </BrandMark>
          <BrandText>
            <BrandEyebrow>{eyebrow}</BrandEyebrow>
            <BrandTitle>{title}</BrandTitle>
          </BrandText>
        </BrandRow>

        <Description>{description}</Description>

        <Actions>
          {actions.map((action) => (
            <ActionLink key={action.label} href={action.href} $variant={action.variant ?? "secondary"}>
              {action.label}
            </ActionLink>
          ))}
        </Actions>

        {children && <Content>{children}</Content>}
      </Panel>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 32%),
    radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.16), transparent 28%),
    linear-gradient(180deg, #f6f9fb 0%, #edf3f8 100%);
  position: relative;
  overflow: hidden;
`;

const Glow = styled.div`
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0) 72%);
  top: -140px;
  right: -150px;
`;

const Panel = styled.section`
  position: relative;
  z-index: 1;
  width: min(100%, 760px);
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(8px);
`;

const BrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const BrandMark = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid rgba(59, 130, 246, 0.12);
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BrandEyebrow = styled.p`
  margin: 0;
  color: #4b7bc8;
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.11em;
  font-weight: 800;
`;

const BrandTitle = styled.h1`
  margin: 0;
  color: #0f172a;
  font-size: 1.8rem;
  line-height: 1.1;
`;

const Description = styled.p`
  margin: 18px 0 0;
  max-width: 62ch;
  color: #334155;
  font-size: 0.96rem;
  line-height: 1.6;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
`;

const ActionLink = styled(Link)<{ $variant: "primary" | "secondary" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid ${({ $variant }) => ($variant === "primary" ? "#2563eb" : "#cbd5e1")};
  background: ${({ $variant }) => ($variant === "primary" ? "#2563eb" : "#ffffff")};
  color: ${({ $variant }) => ($variant === "primary" ? "#ffffff" : "#0f172a")};
  font-weight: 700;
  text-decoration: none;
`;

const Content = styled.div`
  margin-top: 22px;
`;