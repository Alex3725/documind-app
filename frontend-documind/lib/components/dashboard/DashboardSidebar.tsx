"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import DocuMindLogo from "@/lib/components/DocuMindLogo";
import MemoryCircleCard from "./MemoryCircleCard";

type Props = {
  userName?: string;
  userSurname?: string;
  onLogout: () => void;
  totalMemoryGb?: number;
  usedMemoryGb?: number;
  filesCount?: number;
  onAddFile?: (file: File, runAnalysis: boolean) => Promise<void>;
};

const navigationItems = [
  { label: "Dashboard", description: "Panoramica del workspace", href: "/dashboard", active: true },
  { label: "AI Classifier", description: "Classificazione intelligente", href: "/wip/ai-classifier" },
  { label: "Smart Tags", description: "Tipi semantici", href: "/tags" },
  { label: "Settings", description: "Preferenze utente", href: "/settings" },
  { label: "Cestino", description: "Cartelle eliminate", href: "/dashboard/cestino" },
];

export default function DashboardSidebar({ 
  userName, 
  userSurname, 
  onLogout,
  totalMemoryGb = 5.64,
  usedMemoryGb = 0.08,
  filesCount = 0,
  onAddFile
}: Props) {
  const router = useRouter();

  const handleFileUpload = async (file: File, runAnalysis: boolean) => {
    if (onAddFile) {
      await onAddFile(file, runAnalysis);
    }
  };

  return (
    <Sidebar>
      <BrandBlock type="button" onClick={() => router.push("/dashboard")}>
        <BrandLogo>
          <DocuMindLogo size={42} />
        </BrandLogo>
        <BrandCopy>
          <BrandName>DocuMind</BrandName>
          <BrandMeta>Workspace visuale</BrandMeta>
        </BrandCopy>
      </BrandBlock>

      <SidebarSection>
        <SidebarLabel>Navigation</SidebarLabel>
        <NavList>
          {navigationItems.map((item) => (
            <NavButton
              key={item.label}
              type="button"
              $active={item.active}
              onClick={() => router.push(item.href)}
            >
              <NavCopy>
                <NavTitle>{item.label}</NavTitle>
                <NavDescription>{item.description}</NavDescription>
              </NavCopy>
              <NavArrow>{item.href === "/dashboard" ? "Home" : "Go"}</NavArrow>
            </NavButton>
          ))}
        </NavList>
      </SidebarSection>

      <SidebarFooter>
        <MemoryCircleCard
          totalGb={totalMemoryGb}
          usedGb={usedMemoryGb}
          fileCount={filesCount}
        />

        <UserCard>
          <UserAvatar>{(userName?.[0] ?? "U").toUpperCase()}</UserAvatar>
          <UserCardCopy>
            <UserCardName>{userName ?? "Utente"}</UserCardName>
            <UserCardRole>{userSurname ? `${userSurname}` : "Admin"}</UserCardRole>
          </UserCardCopy>
        </UserCard>

        <FooterActions>
          <FooterBtn type="button" onClick={() => router.push("/settings")}>Settings</FooterBtn>
          <FooterBtn type="button" onClick={onLogout}>Logout</FooterBtn>
        </FooterActions>
      </SidebarFooter>
    </Sidebar>
  );
}

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #dbe4e0;
  color: #0f172a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);  height: fit-content;
  max-height: calc(100vh - 32px);

  @media (max-width: 768px) {
    gap: 8px;
    padding: 8px;
  }

  @media (max-width: 640px) {
    gap: 6px;
    padding: 6px;
    border-radius: 10px;
  }
`;

const BrandBlock = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #dbe4e0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(96, 165, 250, 0.1);
    border-color: rgba(96, 165, 250, 0.3);
  }

  @media (max-width: 640px) {
    padding: 6px;
    gap: 6px;
    font-size: 0.88rem;
  }
`;

const BrandLogo = styled.div`
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(96, 165, 250, 0.08);
  border: 1px solid rgba(96, 165, 250, 0.2);
  flex-shrink: 0;
`;

const BrandCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const BrandName = styled.div`
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
`;

const BrandMeta = styled.div`
  font-size: 0.7rem;
  color: #64748b;
`;

const SidebarSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  max-height: calc(100vh - 600px);
  flex-shrink: 1;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(96, 165, 250, 0.3);
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    gap: 4px;
  }

  @media (max-width: 640px) {
    gap: 3px;
  }
`;

const SidebarLabel = styled.div`
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  font-weight: 700;
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const NavButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid ${({ $active }) => ($active ? "rgba(96, 165, 250, 0.4)" : "transparent")};
  background: ${({ $active }) => ($active ? "rgba(96, 165, 250, 0.12)" : "transparent")};
  color: ${({ $active }) => ($active ? "#1e40af" : "#475569")};
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(96, 165, 250, 0.08);
    color: #1e40af;
  }
`;

const NavCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const NavTitle = styled.div`
  font-size: 0.84rem;
  font-weight: 700;
`;

const NavDescription = styled.div`
  font-size: 0.68rem;
  color: inherit;
  opacity: 0.7;
`;

const NavArrow = styled.div`
  flex-shrink: 0;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.6;
  font-weight: 600;
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid #dbe4e0;
  flex-shrink: 0;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px;
  border-radius: 8px;
  background: rgba(96, 165, 250, 0.06);
  border: 1px solid rgba(96, 165, 250, 0.15);
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(96, 165, 250, 0.1);
  }
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  flex-shrink: 0;
  font-size: 0.9rem;
`;

const UserCardCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const UserCardName = styled.div`
  font-size: 0.82rem;
  font-weight: 800;
  color: #0f172a;
`;

const UserCardRole = styled.div`
  font-size: 0.7rem;
  color: #64748b;
`;

const FooterActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  flex-shrink: 0;
`;

const FooterBtn = styled.button`
  border: 1px solid #dbe4e0;
  background: rgba(255, 255, 255, 0.5);
  color: #0f172a;
  padding: 7px 8px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(96, 165, 250, 0.1);
    border-color: rgba(96, 165, 250, 0.3);
  }
`;
