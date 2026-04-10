"use client";

import { useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logoutState } from "@/lib/features/authSlice";
import TutorialOverlay from "@/app/components/TutorialOverlay";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { files } = useAppSelector((s) => s.files);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "POST", credentials: "include", body: JSON.stringify({ logout: true }) });
    dispatch(logoutState());
    router.push("/");
  };

  const pendingCount = files.filter((f) => f.analysisResult.type === "CONFIRMATION_REQUIRED").length;

  return (
    <LayoutWrapper>
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

      <TopNav>
        <NavBrand onClick={() => router.push("/dashboard")}>
          <BrandIcon>🧠</BrandIcon>
          <BrandName>DocuMind</BrandName>
        </NavBrand>

        <NavLinks>
          <NavLink onClick={() => router.push("/dashboard")}>
            📁 Archivio
          </NavLink>
          <NavLink onClick={() => router.push("/tags")}>
            🏷️ Tag
          </NavLink>
          {pendingCount > 0 && (
            <PendingBadge onClick={() => router.push("/dashboard")}>
              🤔 {pendingCount} in attesa
            </PendingBadge>
          )}
        </NavLinks>

        <NavRight>
          <TutorialBtn onClick={() => setShowTutorial(true)} title="Tutorial">
            ❓ Guida
          </TutorialBtn>
          <UserChip>
            <UserInitial>{(user?.name ?? "U")[0].toUpperCase()}</UserInitial>
            <UserLabel>{user?.name ?? "Utente"}</UserLabel>
          </UserChip>
          <LogoutBtn onClick={handleLogout}>Esci</LogoutBtn>
        </NavRight>
      </TopNav>

      <PageContent>{children}</PageContent>
    </LayoutWrapper>
  );
}

const LayoutWrapper = styled.div`min-height: 100vh; background: #f4f7f5;`;

const TopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e0e8e5;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
`;

const BrandIcon = styled.span`font-size: 1.4rem;`;
const BrandName = styled.span`font-size: 1.1rem; font-weight: 800; color: #113f36;`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
`;

const NavLink = styled.button`
  background: none;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #444;
  font-weight: 600;
  transition: background 0.15s;

  &:hover { background: #f0faf5; color: #1b6f5c; }
`;

const PendingBadge = styled.button`
  background: #fff8e6;
  border: 1px solid #f5d87a;
  color: #7a5f10;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #fef3c7; }
`;

const NavRight = styled.div`display: flex; align-items: center; gap: 10px;`;

const TutorialBtn = styled.button`
  background: none;
  border: 1px solid #d0ddd9;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.84rem;
  color: #666;

  &:hover { background: #f5f5f5; }
`;

const UserChip = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  background: #f5faf8;
  border: 1px solid #d4ece5;
  border-radius: 999px;
`;

const UserInitial = styled.div`
  width: 24px; height: 24px;
  background: linear-gradient(135deg, #1b6f5c, #245c99);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.74rem;
  font-weight: 800;
`;

const UserLabel = styled.span`font-size: 0.82rem; font-weight: 600; color: #1a3a30;`;

const LogoutBtn = styled.button`
  background: none;
  border: 1px solid #fbb;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #c00;

  &:hover { background: #fee; }
`;

const PageContent = styled.main`padding: 24px;`;
