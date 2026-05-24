"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  confirmClassification,
  clearPendingAnalysis,
  loadFolders,
  createFolder,
  uploadAndAnalyze,
  addFileWithoutAnalysis,
} from "@/lib/features/fileSlice";
import ConfirmationPopup from "@/lib/components/ConfirmationPopup";
import PrivacyConsentModal from "@/lib/components/PrivacyConsentModal";
import OnboardingModal from "@/lib/components/OnboardingModal";
import { buildOnboardingFolderPayload } from "@/lib/onboardingFolders";
import TopUtilityBar from "@/lib/components/dashboard/TopUtilityBar";
import SearchStrip from "@/lib/components/dashboard/SearchStrip";
import MemoryCircleCard from "@/lib/components/dashboard/MemoryCircleCard";
import QuickActionsPanel from "@/lib/components/dashboard/QuickActionsPanel";
import FoldersBoard from "@/lib/components/dashboard/FoldersBoard";
import { useRouter } from "next/navigation";
import { logoutState } from "@/lib/features/authSlice";
import TutorialOverlay from "@/lib/components/TutorialOverlay";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { files, pendingAnalysis, status, folders } = useAppSelector((s) => s.files);
  const user = useAppSelector((s) => s.auth.user);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);

  // Carica le cartelle dell'utente
  useEffect(() => {
    dispatch(loadFolders());
  }, [dispatch]);

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

  const handleCreateFolder = async (payload: { name: string; description: string }) => {
    const result = await dispatch(
      createFolder({
        name: payload.name,
        description: payload.description,
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

      <PageWrapper>
        <TopUtilityBar
          userName={user?.name}
          onLogout={handleLogout}
          onOpenTutorial={() => setShowTutorial(true)}
        />

        <SearchStrip value={searchTerm} onChange={setSearchTerm} />

        <Grid>
          <LeftCol>
            <QuickActionsPanel
              foldersCount={folders.filter((f) => !f.system).length}
              onAddFolder={handleCreateFolder}
              onAddType={() => router.push("/tags")}
              onAddFile={handleAddFile}
            />
            <MemoryCircleCard
              totalGb={totalMemoryGb}
              usedGb={usedMemoryGb}
              fileCount={files.length}
            />
          </LeftCol>

          <RightCol>
            <FoldersBoard searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
          </RightCol>
        </Grid>

        {status === "loading" && (
          <AnalyzingBanner>
            <AnalyzingSpinner />
            Analisi AI in corso — Classificazione gerarchica a 3 livelli...
          </AnalyzingBanner>
        )}

        <StatsRow>
          <StatCard>
            <StatNum>{files.length}</StatNum>
            <StatLabel>File totali</StatLabel>
          </StatCard>
          <StatCard $accent="#1b6f5c">
            <StatNum>{statsClassified}</StatNum>
            <StatLabel>Classificati AI</StatLabel>
          </StatCard>
          {statsPending > 0 && (
            <StatCard $accent="#d97706">
              <StatNum>{statsPending}</StatNum>
              <StatLabel>In attesa</StatLabel>
            </StatCard>
          )}
          <StatCard $accent="#6b7280">
            <StatNum>{statsLow}</StatNum>
            <StatLabel>Non classificati</StatLabel>
          </StatCard>
          {statsManual > 0 && (
            <StatCard $accent="#8b5cf6">
              <StatNum>{statsManual}</StatNum>
              <StatLabel>Manuale</StatLabel>
            </StatCard>
          )}
        </StatsRow>
      </PageWrapper>
    </>
  );
}

// ============================================================
// STYLES
// ============================================================

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const LeftCol = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 12px;
`;

const RightCol = styled.div`min-width: 0;`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
`;

const StatCard = styled.div<{ $accent?: string }>`
  background: #fff; border: 1px solid #e5ede9;
  border-radius: 14px; padding: 14px; text-align: center;
  border-left: 4px solid ${({ $accent }) => $accent ?? "#e0e0e0"};
`;

const StatNum = styled.div`font-size: 1.5rem; font-weight: 800; color: #1a3a30;`;
const StatLabel = styled.div`font-size: 0.72rem; color: #888; margin-top: 2px;`;

const AnalyzingBanner = styled.div`
  display: flex; align-items: center; gap: 10px;
  margin-top: 4px; padding: 12px 16px;
  background: linear-gradient(90deg, #f0faf5, #f5f3ff);
  border: 1px solid #d4ece5; border-radius: 10px;
  font-size: 0.88rem; font-weight: 600; color: #1b6f5c;
`;

const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;
const AnalyzingSpinner = styled.div`
  width: 16px; height: 16px;
  border: 2px solid #d4ece5; border-top-color: #1b6f5c;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  flex-shrink: 0;
`;

