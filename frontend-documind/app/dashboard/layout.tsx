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
  background: #f4f7f5;
  padding: 24px;
`;
