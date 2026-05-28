"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  confirmClassification,
  clearPendingAnalysis,
  loadFolders,
  loadTrashedFolders,
  createFolder,
  uploadAndAnalyze,
  uploadAndAnalyzeWithProgress,
  reorderFiles,
  addFileWithoutAnalysis,
  type AnalysisResult,
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
import UploadAnalysisErrorPopup from "@/lib/components/UploadAnalysisErrorPopup";
import ManualTagAssignmentPopup from "@/lib/components/ManualTagAssignmentPopup";
import { useRouter } from "next/navigation";
import { logoutState } from "@/lib/features/authSlice";
import TutorialOverlay from "@/lib/components/TutorialOverlay";
import GuidedCreateFolder from "@/lib/components/GuidedCreateFolder";
import DashboardSidebar from "@/lib/components/dashboard/DashboardSidebar";

type Props = {
  folderPathSegments?: string[];
};

function ClientUserGreeting({ userName, userSurname }: { userName?: string; userSurname?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <UserGreeting>
      {isMounted ? (
        <>
          Ciao, <strong>{userName || "Utente"} {userSurname || ""}</strong>
        </>
      ) : (
        <span style={{ opacity: 0 }}>placeholder</span>
      )}
    </UserGreeting>
  );
}

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
  const { files, pendingAnalysis, folders } = useAppSelector((s) => s.files);
  const user = useAppSelector((s) => s.auth.user);

  const currentFolderPath = useMemo(() => toFullPath(folderPathSegments), [folderPathSegments]);

  const existingTags = useMemo(() => {
    const collected = new Set<string>();

    for (const folder of folders) {
      const folderName = folder.name.trim().toLowerCase();
      if (folderName) collected.add(folderName);
    }

    return Array.from(collected).sort((a, b) => a.localeCompare(b));
  }, [folders]);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGuidedCreate, setShowGuidedCreate] = useState(false);
  const [guidedDefaultName, setGuidedDefaultName] = useState("");
  const [uploadErrorFile, setUploadErrorFile] = useState<File | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [uploadErrorCode, setUploadErrorCode] = useState<string | null>(null);
  const [manualUploadFile, setManualUploadFile] = useState<File | null>(null);
  const [showManualUploadPopup, setShowManualUploadPopup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
    setGuidedDefaultName("");
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

  const handleRetryUploadAnalysis = async (selectedTags: string[]) => {
    if (!uploadErrorFile) return;

    const customTags = Object.fromEntries(selectedTags.map((tag) => [tag, tag]));
    setUploadProgress(0);

    let analysis: AnalysisResult;
    try {
      analysis = await uploadAndAnalyzeWithProgress(uploadErrorFile, {
        customTags,
        onProgress: setUploadProgress,
      });
    } catch (error: any) {
      setUploadProgress(null);
      setUploadErrorMessage(error?.message ?? "Impossibile analizzare il file.");
      setUploadErrorCode(error?.code ?? null);
      return;
    }

    // Dopo l'upload con tag forzati, avvia subito il riordino per assegnare la cartella/tag
    try {
      const fileId = analysis?.file_id;
      const filename = analysis?.filename;
      const suggestedFolder = analysis?.suggested_folder ?? "Non classificati";
      const primaryTag = selectedTags && selectedTags.length > 0 ? selectedTags[0] : suggestedFolder;

      if (fileId) {
        const currentPath = `${suggestedFolder}/${filename}`.replace(/^\/+/, "");
        const reorderResult = await dispatch(
          reorderFiles({ files: [{ fileId: String(fileId), newTag: primaryTag, currentPath }] })
        );

        if (reorderFiles.rejected.match(reorderResult)) {
          setUploadErrorMessage(reorderResult.payload?.message ?? "Errore durante il riordino del file.");
          setUploadErrorCode(reorderResult.payload?.code ?? null);
          setUploadProgress(null);
          return;
        }
      }

      // Se tutto OK, chiudi il popup
      setUploadErrorFile(null);
      setUploadErrorMessage("");
      setUploadErrorCode(null);
      setUploadProgress(null);
    } catch {
      setUploadErrorMessage("Errore interno durante il retry.");
      setUploadErrorCode(null);
      setUploadProgress(null);
      return;
    }
  };

  const resolveFolderForManualTags = (tags: string[]) => {
    const normalizedTag = tags[0]?.trim().toLowerCase();
    if (!normalizedTag) return currentFolderPath || "Non classificati";

    const matchedFolder = folders
      .filter((folder) => !folder.system && !folder.trashed)
      .filter((folder) => {
        const folderName = folder.name.trim().toLowerCase();
        const fullPath = folder.fullPath.trim().toLowerCase();
        const autoTags = (folder.autoTags ?? []).map((tag) => tag.trim().toLowerCase());
        return (
          folderName === normalizedTag ||
          fullPath === normalizedTag ||
          fullPath.endsWith(`/${normalizedTag}`) ||
          autoTags.includes(normalizedTag)
        );
      })
      .sort((left, right) => right.fullPath.length - left.fullPath.length)[0];

    return matchedFolder?.fullPath || currentFolderPath || "Non classificati";
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
  }): Promise<boolean> => {
    const result = await dispatch(
      createFolder({
        name: payload.name,
        description: payload.description,
        semanticRules: payload.semanticRules,
        autoUpdateType: payload.autoUpdateType,
        autoTags: payload.autoTags,
        parentPath: currentFolderPath || undefined,
      })
    );
    if (createFolder.rejected.match(result)) {
      window.alert(result.payload ?? "Impossibile creare la cartella.");
      return false;
    }

    return true;
  };

  const handleAddFile = async (file: File, runAnalysis: boolean) => {
    if (runAnalysis) {
      setUploadProgress(0);
      try {
        await uploadAndAnalyzeWithProgress(file, { onProgress: setUploadProgress });
      } catch (error: any) {
        setUploadProgress(null);
        setUploadErrorFile(file);
        setUploadErrorMessage(error?.message ?? "Impossibile analizzare il file.");
        setUploadErrorCode(error?.code ?? null);
        return;
      }
      setUploadProgress(null);
      return;
    }

    setManualUploadFile(file);
    setShowManualUploadPopup(true);
  };

  const [uploadingFileIds, setUploadingFileIds] = useState<Set<string>>(new Set());

  const handleManualUploadAssign = (tags: string[]) => {
    if (!manualUploadFile) return;

    const folderPath = resolveFolderForManualTags(tags);
    const primaryTag = tags[0] || folderPath;

    // Close popup immediately and add file to UI with correct folder path
    const manualId = `manual-${Date.now()}`;
    dispatch(
      addFileWithoutAnalysis({
        id: manualId,
        filename: manualUploadFile.name,
        folder: folderPath,
        tags,
      })
    );

    setManualUploadFile(null);
    setShowManualUploadPopup(false);

    // Track this file as uploading
    setUploadingFileIds((prev) => new Set([...prev, manualId]));
    setUploadProgress(0);

    // Upload and reorder in background without blocking UI
    const fileToUpload = manualUploadFile;
    (async () => {
      try {
        const analysis = await uploadAndAnalyzeWithProgress(fileToUpload, {
          onProgress: setUploadProgress,
        });

        // Upload succeeded, now reorder file to the correct folder path
        const fileId = analysis?.file_id;
        const filename = analysis?.filename;

        if (fileId && filename) {
          const currentPath = `${folderPath}/${filename}`.replace(/^\/+/, "");
          await dispatch(
            reorderFiles({
              files: [
                {
                  fileId,
                  newTag: primaryTag,
                  currentPath,
                },
              ],
            })
          );
        }

        dispatch(removeFile(manualId));

        // Done uploading, remove from tracking
        setUploadingFileIds((prev) => {
          const next = new Set(prev);
          next.delete(manualId);
          return next;
        });
        setUploadProgress(null);
      } catch (error) {
        // Clean up on any error
        setUploadingFileIds((prev) => {
          const next = new Set(prev);
          next.delete(manualId);
          return next;
        });
        setUploadProgress(null);
      }
    })();
  };

  const handleManualUploadSkip = () => {
    if (!manualUploadFile) return;

    dispatch(
      addFileWithoutAnalysis({
        filename: manualUploadFile.name,
        folder: currentFolderPath || "Non classificati",
      })
    );

    setManualUploadFile(null);
    setShowManualUploadPopup(false);
  };

  const handleOpenFolder = (folderFullPath: string) => {
    router.push(toDashboardUrl(folderFullPath));
  };

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
      {uploadErrorFile && (
        <UploadAnalysisErrorPopup
          fileName={uploadErrorFile.name}
          errorMessage={uploadErrorMessage || "Impossibile analizzare il file."}
          errorCode={uploadErrorCode}
          availableTags={existingTags}
          onRetry={handleRetryUploadAnalysis}
          onSkip={() => {
            setUploadErrorFile(null);
            setUploadErrorMessage("");
            setUploadErrorCode(null);
          }}
        />
      )}

      {showManualUploadPopup && manualUploadFile && (
        <ManualTagAssignmentPopup
          filename={manualUploadFile.name}
          onAssign={handleManualUploadAssign}
          onSkip={handleManualUploadSkip}
          onCancel={() => {
            setManualUploadFile(null);
            setShowManualUploadPopup(false);
          }}
          availableTags={existingTags.map((t) => ({ name: t }))}
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
                <ClientUserGreeting userName={user?.name} userSurname={user?.surname} />
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

                    {uploadProgress !== null && (
                      <UploadProgressBanner>
                        <UploadProgressHeader>
                          <UploadProgressTitle>Upload in corso</UploadProgressTitle>
                          <UploadProgressLabel>Manca {Math.max(0, 100 - Math.round(uploadProgress))}%</UploadProgressLabel>
                        </UploadProgressHeader>
                        <UploadProgressTrack>
                          <UploadProgressFill style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }} />
                        </UploadProgressTrack>
                      </UploadProgressBanner>
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
  padding: 0;

  @media (max-width: 768px) {
    padding: 0;
  }

  @media (max-width: 640px) {
    padding: 0;
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
  padding: 0;
  flex: 1;

  @media (max-width: 768px) {
    gap: 8px;
    padding: 0;
  }

  @media (max-width: 640px) {
    gap: 6px;
    padding: 0;
  }
`;

const TopActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
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

const UserGreeting = styled.div`
  font-size: 0.95rem;
  color: #0f172a;
  margin-right: auto;
  font-weight: 500;

  strong {
    font-weight: 700;
    color: #1b6f5c;
  }
`;

const TopActionsSpacer = styled.div`
  flex: 1;
`;

const WorkspaceGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 260px);
  gap: 10px;
  flex: 1;
  min-height: 0;

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



const CenterCol = styled.div`min-width: 0; display: flex; flex-direction: column;`;

const RightRail = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;
`;

const UploadProgressBanner = styled.div`
  display: flex;
  flex-direction: column;
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

const UploadProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const UploadProgressTitle = styled.div`
  font-weight: 700;
  color: #0f172a;
`;

const UploadProgressLabel = styled.div`
  font-variant-numeric: tabular-nums;
  color: #1b6f5c;
`;

const UploadProgressTrack = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #d9e7e4;
  overflow: hidden;
`;

const UploadProgressFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1b6f5c, #2ca07f);
  transition: width 180ms ease;
`;
