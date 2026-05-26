"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import DocuMindLogo from "@/lib/components/DocuMindLogo";

type Props = {
  userName?: string;
  userSurname?: string;
  onLogout: () => void;
};

const navigationItems = [
  { label: "Dashboard", description: "Panoramica del workspace", href: "/dashboard", active: true },
  { label: "Documents", description: "Archivio e contenuti", href: "/wip/documents" },
  { label: "AI Classifier", description: "Classificazione intelligente", href: "/wip/ai-classifier" },
  { label: "Smart Tags", description: "Tipi semantici", href: "/tags" },
  { label: "Workflows", description: "Automazioni e processi", href: "/wip/workflows" },
  { label: "Reports", description: "Analisi e report", href: "/wip/reports" },
  { label: "Integrations", description: "Connessioni esterne", href: "/wip/integrations" },
  { label: "Settings", description: "Preferenze utente", href: "/settings" },
];

export default function DashboardSidebar({ userName, userSurname, onLogout }: Props) {
  const router = useRouter();

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
  gap: 18px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(180deg, #081523 0%, #071120 100%);
  border: 1px solid rgba(96, 165, 250, 0.16);
  color: #e5eefc;
  box-shadow: 0 22px 50px rgba(6, 15, 28, 0.24);
}

const BrandBlock = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(96, 165, 250, 0.16);
  border-radius: 20px;
  background: rgba(9, 17, 31, 0.78);
  color: inherit;
  cursor: pointer;
  text-align: left;
`;

const BrandLogo = styled.div`
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(96, 165, 250, 0.2);
`;

const BrandCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const BrandName = styled.div`
  font-size: 1.08rem;
  font-weight: 800;
  color: #f8fbff;
`;

const BrandMeta = styled.div`
  font-size: 0.78rem;
  color: #8ea0bb;
`;

const SidebarSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SidebarLabel = styled.div`
  color: #8ea0bb;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  font-weight: 700;
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NavButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid ${({ $active }) => ($active ? "rgba(96, 165, 250, 0.5)" : "rgba(148, 163, 184, 0.16)")};
  background: ${({ $active }) => ($active ? "rgba(37, 99, 235, 0.24)" : "rgba(8, 21, 35, 0.62)")};
  color: ${({ $active }) => ($active ? "#eff6ff" : "#d6e3f3")};
  cursor: pointer;
  text-align: left;
  box-shadow: ${({ $active }) => ($active ? "0 12px 24px rgba(37, 99, 235, 0.18)" : "none")};
`;

const NavCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const NavTitle = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
`;

const NavDescription = styled.div`
  font-size: 0.74rem;
  color: inherit;
  opacity: 0.72;
`;

const NavArrow = styled.div`
  flex-shrink: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.72;
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

const UserAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #081523;
  background: linear-gradient(180deg, #cde4ff 0%, #8cc2ff 100%);
`;

const UserCardCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const UserCardName = styled.div`
  font-size: 0.92rem;
  font-weight: 800;
  color: #f8fbff;
`;

const UserCardRole = styled.div`
  font-size: 0.76rem;
  color: #8ea0bb;
`;

const FooterActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const FooterBtn = styled.button`
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #e5eefc;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
`;