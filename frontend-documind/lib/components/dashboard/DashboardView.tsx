"use client";

import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  confirmClassification,
  clearPendingAnalysis,
  loadFolders,
  loadTrashedFolders,
  createFolder,
  uploadAndAnalyze,
  addFileWithoutAnalysis,
} from "@/lib/features/fileSlice";
import ConfirmationPopup from "@/lib/components/ConfirmationPopup";
import PrivacyConsentModal from "@/lib/components/PrivacyConsentModal";
import OnboardingModal from "@/lib/components/OnboardingModal";
import { buildOnboardingFolderPayload } from "@/lib/onboardingFolders";
import SearchStrip from "@/lib/components/dashboard/SearchStrip";
import FoldersBoard from "@/lib/components/dashboard/FoldersBoard";
import WorkspacePathBar from "@/lib/components/dashboard/WorkspacePathBar";
import CreateActionsDropdown from "@/lib/components/dashboard/CreateActionsDropdown";
import TrashBoard from "@/lib/components/dashboard/TrashBoard";
import WorkspacePreviewCard from "@/lib/components/dashboard/WorkspacePreviewCard";
import WorkspaceStatusPieCard from "@/lib/components/dashboard/WorkspaceStatusPieCard";
import { useRouter } from "next/navigation";
import { logoutState } from "@/lib/features/authSlice";
import TutorialOverlay from "@/lib/components/TutorialOverlay";
import GuidedCreateFolder from "@/lib/components/GuidedCreateFolder";
import DashboardSidebar from "@/lib/components/dashboard/DashboardSidebar";

type Props = {
  folderPathSegments?: string[];
};

function toFullPath(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join("/");
}

function toDashboardUrl(fullPath: string): string {
  const segments = fullPath
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => encodeURIComponent(s));

  if (segments.length === 0) return "/dashboard";
  return `/dashboard/${segments.join("/")}`;
}

export default function DashboardView({ folderPathSegments = [] }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { files, pendingAnalysis, status, folders } = useAppSelector((s) => s.files);
  const user = useAppSelector((s) => s.auth.user);

  const currentFolderPath = useMemo(() => toFullPath(folderPathSegments), [folderPathSegments]);

  const existingTags = useMemo(() => {
    const collected = new Set<string>();

    for (const folder of folders) {
      for (const tag of folder.autoTags ?? []) {
        const normalized = tag.trim().toLowerCase();
        if (normalized) collected.add(normalized);
      }
    }

    for (const file of files) {
      for (const tag of file.tags ?? []) {
        const normalized = tag.trim().toLowerCase();
        if (normalized) collected.add(normalized);
      }
      for (const tag of file.confirmedTags ?? []) {
        const normalized = tag.trim().toLowerCase();
        if (normalized) collected.add(normalized);
      }
    }

    return Array.from(collected).sort((a, b) => a.localeCompare(b));
  }, [files, folders]);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGuidedCreate, setShowGuidedCreate] = useState(false);
  const [guidedDefaultName, setGuidedDefaultName] = useState("");

  useEffect(() => {
    dispatch(loadFolders());
  }, [dispatch]);

  useEffect(() => {
    if (currentFolderPath === "cestino") {
      dispatch(loadTrashedFolders());
    }
  }, [currentFolderPath, dispatch]);

  useEffect(() => {
    const privacyAccepted = !!localStorage.getItem("documind:privacy");
    const onboardingDone = !!localStorage.getItem("documind:onboarding");

    setShowPrivacy(!privacyAccepted);
    setShowOnboarding(privacyAccepted && !onboardingDone);
  }, []);

  const handlePrivacyAccept = () => {
    localStorage.setItem("documind:privacy", "1");
    setShowPrivacy(false);
    if (!localStorage.getItem("documind:onboarding")) setShowOnboarding(true);
  };

  const handleOnboardingComplete = async (folders: string[]) => {
    const selectedFullPaths: string[] = [];

    for (const folderId of folders) {
      const payload = buildOnboardingFolderPayload(folderId);
      if (!payload) continue;

      selectedFullPaths.push(payload.fullPath);

      try {
        const response = await fetch("/api/folders", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok && response.status !== 409) {
          throw new Error("Errore creazione cartelle iniziali");
        }
      } catch {
        // Non blocca l'onboarding: le cartelle possono essere create anche dopo.
      }
    }

    localStorage.setItem("documind:onboarding", "1");
    localStorage.setItem("documind:folders", JSON.stringify(selectedFullPaths));
    setShowOnboarding(false);
    dispatch(loadFolders());
    // Open guided creation of a folder for the user to try immediately.
    if (selectedFullPaths.length > 0) {
      const first = selectedFullPaths[0];
      const parts = first.split("/").filter(Boolean);
      setGuidedDefaultName(parts.length ? parts[parts.length - 1] : "");
    }
    setShowGuidedCreate(true);
  };

  const handleConfirmClassification = async (confirmedTags: string[], additionalTags: string[]) => {
    if (!pendingAnalysis) return;
    await dispatch(confirmClassification({
      fileId: pendingAnalysis.file_id,
      confirmedTags,
      additionalTags,
    }));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    dispatch(logoutState());
    router.push("/");
  };

  const handleCreateFolder = async (payload: {
    name: string;
    description: string;
    semanticRules: string;
    autoUpdateType: boolean;
    autoTags: string[];
  }) => {
    const result = await dispatch(
      createFolder({
        name: payload.name,
        description: payload.description,
        semanticRules: payload.semanticRules,
        autoUpdateType: payload.autoUpdateType,
        autoTags: payload.autoTags,
      })
    );
    if (createFolder.rejected.match(result)) {
      throw new Error("Impossibile creare la cartella.");
    }
  };

  const handleAddFile = async (file: File, runAnalysis: boolean) => {
    if (runAnalysis) {
      const result = await dispatch(uploadAndAnalyze({ file }));
      if (uploadAndAnalyze.rejected.match(result)) {
        throw new Error("Impossibile analizzare il file.");
      }
      return;
    }

    dispatch(
      addFileWithoutAnalysis({
        filename: file.name,
        folder: "Non classificati",
      })
    );
  };

  const handleOpenFolder = (folderFullPath: string) => {
    router.push(toDashboardUrl(folderFullPath));
  };

  const activeSection = currentFolderPath ? `Folder: ${currentFolderPath}` : "Dashboard";
  const isTrashView = currentFolderPath === "cestino";

  const totalMemoryGb = 5.64;
  const usedMemoryGb = Math.min(totalMemoryGb, Math.max(0.08, files.length * 0.12));

  const statsClassified = files.filter((f) => f.analysisResult.type === "CLASSIFIED").length;
  const statsPending = files.filter(
    (f) => f.analysisResult.type === "CONFIRMATION_REQUIRED" || f.analysisResult.type === "PARTIAL_CONFIRMATION"
  ).length;
  const statsLow = files.filter((f) => f.analysisResult.type === "LOW_CONFIDENCE").length;
  const statsManual = files.filter((f) => f.userOverride).length;

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
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      {showGuidedCreate && (
        <GuidedCreateFolder
          defaultName={guidedDefaultName}
          onCreate={handleCreateFolder}
          onClose={() => setShowGuidedCreate(false)}
        />
      )}

      <PageWrapper>
        <Shell>
          <DashboardSidebar
            userName={user?.name}
            userSurname={user?.surname}
            onLogout={handleLogout}
            totalMemoryGb={totalMemoryGb}
            usedMemoryGb={usedMemoryGb}
            filesCount={files.length}
            onAddFile={handleAddFile}
          />

          <Main>
            {!isTrashView && (
              <TopActionsRow>
                <TopActionsSpacer />
                <CreateActionsDropdown
                  foldersCount={folders.filter((f) => !f.system).length}
                  existingTags={existingTags}
                  onAddFolder={handleCreateFolder}
                  onAddType={() => router.push("/tags")}
                  onAddFile={handleAddFile}
                />
              </TopActionsRow>
            )}

            <WorkspacePathBar
              folderCount={folders.filter((f) => !f.system).length}
              fileCount={files.length}
              section={currentFolderPath || "cartelle"}
            />

            {isTrashView ? (
              <TrashBoard onBackToWorkspace={() => router.push("/dashboard")} />
            ) : (
              <>
                <SearchStrip value={searchTerm} onChange={setSearchTerm} />

                <WorkspaceGrid>
                  <CenterCol>
                    <FoldersBoard
                      searchTerm={searchTerm}
                      onSearchTermChange={setSearchTerm}
                      currentFolderPath={currentFolderPath}
                      onOpenFolder={handleOpenFolder}
                    />
                  </CenterCol>

                  <RightRail>
                    <WorkspaceStatusPieCard
                      totalFiles={files.length}
                      classified={statsClassified}
                      pending={statsPending}
                      lowConfidence={statsLow}
                      manual={statsManual}
                    />

                    <WorkspacePreviewCard text="Area riservata alla preview del contenuto del workspace." />

                    {status === "loading" && (
                      <AnalyzingBanner>
                        <AnalyzingSpinner />
                        Analisi AI in corso — Classificazione gerarchica a 3 livelli...
                      </AnalyzingBanner>
                    )}
                  </RightRail>
                </WorkspaceGrid>
              </>
            )}
          </Main>
        </Shell>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  min-height: calc(100vh - 48px);
  padding: 0 8px;

  @media (max-width: 768px) {
    padding: 0 6px;
  }

  @media (max-width: 640px) {
    padding: 0 4px;
  }
`;

const Shell = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
  gap: 12px;
  min-height: calc(100vh - 48px);

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    gap: 8px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 0 2px;

  @media (max-width: 768px) {
    gap: 8px;
    padding: 0 2px;
  }

  @media (max-width: 640px) {
    gap: 6px;
    padding: 0 2px;
  }
`;

const TopActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 42px;
  padding: 2px 0 0;

  @media (max-width: 768px) {
    min-height: 38px;
  }

  @media (max-width: 640px) {
    min-height: 34px;
    padding-top: 0;
  }
`;

const TopActionsSpacer = styled.div`
  flex: 1;
`;

const WorkspaceGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 260px);
  gap: 10px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;



const CenterCol = styled.div`min-width: 0;`;

const RightRail = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;
`;

const AnalyzingBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  padding: 12px 16px;
  background: linear-gradient(90deg, #eff6ff, #f8fafc);
  border: 1px solid #d4dcec;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1b6f5c;
`;

const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;
const AnalyzingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #d4ece5;
  border-top-color: #1b6f5c;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  flex-shrink: 0;
`;
