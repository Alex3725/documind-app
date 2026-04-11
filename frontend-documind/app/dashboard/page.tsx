"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { confirmClassification, clearPendingAnalysis } from "@/lib/features/fileSlice";
import UploadZone from "@/lib/components/UploadZone";
import ClassificationResult from "@/lib/components/ClassificationResult";
import ConfirmationPopup from "@/lib/components/ConfirmationPopup";
import PrivacyConsentModal from "@/lib/components/PrivacyConsentModal";
import OnboardingModal from "@/lib/components/OnboardingModal";

type FilterType = "all" | "classified" | "confirmation_required" | "low_confidence";
type SortType = "newest" | "oldest" | "name";

const FOLDER_COLORS: Record<string, string> = {
  Finance: "#16a34a",
  Finanza: "#16a34a",
  Legal: "#7c3aed",
  Legale: "#7c3aed",
  HR: "#0284c7",
  Personal: "#db2777",
  Personale: "#db2777",
  Health: "#dc2626",
  Salute: "#dc2626",
  Tech: "#0891b2",
  Comunicazioni: "#d97706",
  Business: "#64748b",
  Dati: "#0891b2",
  Letteratura: "#a16207",
  Email: "#d97706",
  Reports: "#64748b",
  Literature: "#a16207",
  Other: "#6b7280",
  Altro: "#6b7280",
  Uncategorized: "#9ca3af",
  "Non classificati": "#9ca3af",
};

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { files, pendingAnalysis, status } = useAppSelector((s) => s.files);
  const user = useAppSelector((s) => s.auth.user);

  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const privacyAccepted = localStorage.getItem("documind:privacy");
    const onboardingDone = localStorage.getItem("documind:onboarding");
    if (!privacyAccepted) {
      setShowPrivacy(true);
    } else if (!onboardingDone) {
      setShowOnboarding(true);
    }
  }, []);

  const handlePrivacyAccept = () => {
    localStorage.setItem("documind:privacy", "1");
    setShowPrivacy(false);
    const onboardingDone = localStorage.getItem("documind:onboarding");
    if (!onboardingDone) setShowOnboarding(true);
  };

  const handleOnboardingComplete = (folders: string[]) => {
    localStorage.setItem("documind:onboarding", "1");
    localStorage.setItem("documind:folders", JSON.stringify(folders));
    setShowOnboarding(false);
  };

  const handleConfirmClassification = async (confirmedTags: string[], tags: string[]) => {
    if (!pendingAnalysis) return;
    await dispatch(
      confirmClassification({
        fileId: pendingAnalysis.file_id,
        confirmedTags,
        additionalTags: tags,
      })
    );
  };

  const folders = Array.from(new Set(files.map((f) => f.folder))).sort();

  const filteredFiles = files
    .filter((f) => {
      if (activeFolder && f.folder !== activeFolder) return false;
      if (filter === "classified" && f.analysisResult.type !== "CLASSIFIED") return false;
      if (
        filter === "confirmation_required" &&
        f.analysisResult.type !== "CONFIRMATION_REQUIRED" &&
        f.analysisResult.type !== "PARTIAL_CONFIRMATION"
      ) return false;
      if (filter === "low_confidence" && f.analysisResult.type !== "LOW_CONFIDENCE") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.filename.toLowerCase().includes(q) ||
          f.tags.some((t) => t.includes(q)) ||
          f.folder.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sort === "oldest") return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      return a.filename.localeCompare(b.filename);
    });

  const statsClassified = files.filter((f) => f.analysisResult.type === "CLASSIFIED").length;
  const statsPending = files.filter(
    (f) =>
      f.analysisResult.type === "CONFIRMATION_REQUIRED" ||
      f.analysisResult.type === "PARTIAL_CONFIRMATION"
  ).length;
  const statsLow = files.filter((f) => f.analysisResult.type === "LOW_CONFIDENCE").length;

  return (
    <>
      {showPrivacy && <PrivacyConsentModal onAccept={handlePrivacyAccept} />}
      {showOnboarding && !showPrivacy && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onSkip={() => handleOnboardingComplete([])}
        />
      )}
      {pendingAnalysis && (
        <ConfirmationPopup
          analysis={pendingAnalysis}
          onConfirm={handleConfirmClassification}
          onDismiss={() => dispatch(clearPendingAnalysis())}
        />
      )}

      <PageWrapper>
        <Sidebar>
          <SidebarHeader>
            <AppLogo>🧠</AppLogo>
            <AppName>DocuMind</AppName>
          </SidebarHeader>

          <UserInfo>
            <UserAvatar>{(user?.name ?? "U")[0].toUpperCase()}</UserAvatar>
            <UserMeta>
              <UserName>{user?.name ?? "Utente"} {user?.surname ?? ""}</UserName>
              <UserEmail>{user?.email ?? ""}</UserEmail>
            </UserMeta>
          </UserInfo>

          <NavSection>
            <NavTitle>Vista</NavTitle>
            <NavItem $active={!activeFolder && filter === "all"} onClick={() => { setActiveFolder(null); setFilter("all"); }}>
              <span>📁</span> Tutti i file
              <NavCount>{files.length}</NavCount>
            </NavItem>
            <NavItem $active={filter === "classified"} onClick={() => { setActiveFolder(null); setFilter("classified"); }}>
              <span>✅</span> Classificati
              <NavCount $color="#1b6f5c">{statsClassified}</NavCount>
            </NavItem>
            {statsPending > 0 && (
              <NavItem $active={filter === "confirmation_required"} $highlight onClick={() => { setActiveFolder(null); setFilter("confirmation_required"); }}>
                <span>🤔</span> In attesa
                <NavCount $color="#d97706">{statsPending}</NavCount>
              </NavItem>
            )}
            <NavItem $active={filter === "low_confidence"} onClick={() => { setActiveFolder(null); setFilter("low_confidence"); }}>
              <span>🗂️</span> Senza categoria
              <NavCount>{statsLow}</NavCount>
            </NavItem>
          </NavSection>

          {folders.length > 0 && (
            <NavSection>
              <NavTitle>Cartelle</NavTitle>
              {folders.map((folder) => (
                <NavItem
                  key={folder}
                  $active={activeFolder === folder}
                  onClick={() => { setActiveFolder(activeFolder === folder ? null : folder); setFilter("all"); }}
                >
                  <FolderDot $color={FOLDER_COLORS[folder] ?? "#888"} />
                  {folder}
                  <NavCount>{files.filter((f) => f.folder === folder).length}</NavCount>
                </NavItem>
              ))}
            </NavSection>
          )}
        </Sidebar>

        <Main>
          <TopBar>
            <PageTitle>
              {activeFolder ? `📁 ${activeFolder}` : "Archivio Documenti"}
            </PageTitle>
            <SearchInput
              placeholder="🔍 Cerca per nome, tag, cartella..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SortSelect value={sort} onChange={(e) => setSort(e.target.value as SortType)}>
              <option value="newest">Più recenti</option>
              <option value="oldest">Meno recenti</option>
              <option value="name">Nome A-Z</option>
            </SortSelect>
          </TopBar>

          <StatsRow>
            <StatCard>
              <StatNum>{files.length}</StatNum>
              <StatLabel>File totali</StatLabel>
            </StatCard>
            <StatCard $accent="#1b6f5c">
              <StatNum>{statsClassified}</StatNum>
              <StatLabel>Classificati</StatLabel>
            </StatCard>
            <StatCard $accent="#d97706">
              <StatNum>{statsPending}</StatNum>
              <StatLabel>In attesa</StatLabel>
            </StatCard>
            <StatCard $accent="#6b7280">
              <StatNum>{statsLow}</StatNum>
              <StatLabel>Non classificati</StatLabel>
            </StatCard>
          </StatsRow>

          <UploadSection>
            <SectionHeading>📤 Carica nuovo documento</SectionHeading>
            <UploadZone />
          </UploadSection>

          <FilesSection>
            <FilesHeader>
              <SectionHeading>
                {activeFolder ? `📁 ${activeFolder}` : "Tutti i file"}
                {" "}
                <FilesCount>({filteredFiles.length})</FilesCount>
              </SectionHeading>
            </FilesHeader>

            {filteredFiles.length === 0 ? (
              <EmptyState>
                {status === "loading" ? (
                  <>
                    <EmptyIcon>⏳</EmptyIcon>
                    <EmptyText>Analisi in corso...</EmptyText>
                  </>
                ) : search ? (
                  <>
                    <EmptyIcon>🔍</EmptyIcon>
                    <EmptyText>Nessun file trovato per &quot;{search}&quot;</EmptyText>
                  </>
                ) : (
                  <>
                    <EmptyIcon>📭</EmptyIcon>
                    <EmptyText>Nessun documento ancora. Carica il tuo primo file!</EmptyText>
                  </>
                )}
              </EmptyState>
            ) : (
              <FilesGrid>
                {filteredFiles.map((file) => (
                  <ClassificationResult key={file.id} file={file} />
                ))}
              </FilesGrid>
            )}
          </FilesSection>
        </Main>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f4f7f5;
`;

const Sidebar = styled.aside`
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e0e8e5;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  @media (max-width: 768px) { display: none; }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 6px 16px;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
`;

const AppLogo = styled.span`font-size: 1.6rem;`;
const AppName = styled.span`font-size: 1.2rem; font-weight: 800; color: #113f36;`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 16px;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
`;

const UserAvatar = styled.div`
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #1b6f5c, #245c99);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const UserMeta = styled.div`min-width: 0;`;
const UserName = styled.div`font-weight: 700; font-size: 0.87rem; color: #1a3a30; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const UserEmail = styled.div`font-size: 0.74rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;

const NavSection = styled.div`margin-bottom: 8px;`;
const NavTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #aaa;
  padding: 8px 8px 4px;
`;

const NavItem = styled.div<{ $active?: boolean; $highlight?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.88rem;
  color: ${({ $active }) => ($active ? "#1b6f5c" : "#444")};
  background: ${({ $active }) => ($active ? "#f0faf5" : "transparent")};
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  transition: all 0.15s;
  position: relative;

  ${({ $highlight }) =>
    $highlight &&
    `
    &::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 60%;
      background: #d97706;
      border-radius: 99px;
    }
  `}

  &:hover { background: #f5f5f5; color: #1b6f5c; }
`;

const NavCount = styled.span<{ $color?: string }>`
  margin-left: auto;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ $color }) => $color ?? "#aaa"};
  background: ${({ $color }) => ($color ? `${$color}18` : "#f0f0f0")};
  border-radius: 999px;
  padding: 1px 7px;
  min-width: 22px;
  text-align: center;
`;

const FolderDot = styled.span<{ $color: string }>`
  width: 8px; height: 8px;
  background: ${({ $color }) => $color};
  border-radius: 50%;
  flex-shrink: 0;
`;

const Main = styled.main`
  flex: 1;
  padding: 28px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 800;
  color: #113f36;
  margin: 0;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 180px;
  border: 1px solid #d0ddd9;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.9rem;
  outline: none;
  background: #fff;

  &:focus { border-color: #1b6f5c; box-shadow: 0 0 0 3px rgba(27,111,92,0.1); }
`;

const SortSelect = styled.select`
  border: 1px solid #d0ddd9;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 0.88rem;
  outline: none;
  background: #fff;
  cursor: pointer;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
`;

const StatCard = styled.div<{ $accent?: string }>`
  background: #fff;
  border: 1px solid #e5ede9;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  border-left: 4px solid ${({ $accent }) => $accent ?? "#e0e0e0"};
`;

const StatNum = styled.div`font-size: 1.6rem; font-weight: 800; color: #1a3a30;`;
const StatLabel = styled.div`font-size: 0.78rem; color: #888; margin-top: 2px;`;

const UploadSection = styled.div`
  background: #fff;
  border: 1px solid #e5ede9;
  border-radius: 16px;
  padding: 20px 24px;
`;

const SectionHeading = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #1a3a30;
  margin: 0 0 14px;
`;

const FilesSection = styled.div``;

const FilesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const FilesCount = styled.span`
  font-weight: 400;
  color: #aaa;
`;

const FilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border: 1px dashed #d0ddd9;
  border-radius: 16px;
`;

const EmptyIcon = styled.div`font-size: 3rem; margin-bottom: 12px;`;
const EmptyText = styled.p`color: #888; font-size: 0.96rem;`;
