"use client";

import styled from "styled-components";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return <PageContent>{children}</PageContent>;
}

const PageContent = styled.main`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(199, 210, 254, 0.35), transparent 30%),
    radial-gradient(circle at top right, rgba(165, 243, 252, 0.28), transparent 26%),
    linear-gradient(180deg, #f8fafb 0%, #f3f6f8 100%);
  padding: 24px;
`;
