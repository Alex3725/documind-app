"use client";

import { useState } from "react";
import styled from "styled-components";

type FolderChoice = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

const FOLDER_OPTIONS: FolderChoice[] = [
  { id: "personal", label: "Personale", icon: "👤", description: "Documenti di identità, anagrafe, famiglia" },
  { id: "work", label: "Lavoro", icon: "💼", description: "Contratti, buste paga, documenti aziendali" },
  { id: "finance", label: "Finanza", icon: "💰", description: "Fatture, ricevute, estratti conto" },
  { id: "health", label: "Salute", icon: "🏥", description: "Referti, prescrizioni, documenti medici" },
  { id: "legal", label: "Legale", icon: "⚖️", description: "Atti, contratti, documenti notarili" },
  { id: "tech", label: "Tech", icon: "💻", description: "Manuali, codice, documentazione tecnica" },
];

type Props = {
  onComplete: (selectedFolders: string[]) => void;
  onSkip: () => void;
};

export default function OnboardingModal({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(1);
  const [selectedFolders, setSelectedFolders] = useState<string[]>(["personal", "work"]);

  const toggleFolder = (id: string) => {
    setSelectedFolders((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  if (step === 1) {
    return (
      <Overlay>
        <Modal>
          <WelcomeHeader>
            <BigEmoji>🧠</BigEmoji>
            <WelcomeTitle>Benvenuto in DocuMind!</WelcomeTitle>
            <WelcomeSubtitle>
              Il tuo archivio intelligente per documenti. L&apos;AI classifica automaticamente i tuoi file
              e li organizza nelle cartelle giuste.
            </WelcomeSubtitle>
          </WelcomeHeader>

          <FeatureList>
            <Feature>
              <span>🤖</span>
              <div>
                <strong>Classificazione AI</strong>
                <p>I documenti vengono analizzati e classificati automaticamente</p>
              </div>
            </Feature>
            <Feature>
              <span>🏷️</span>
              <div>
                <strong>Tag automatici</strong>
                <p>Tag assegnati in base al contenuto del documento</p>
              </div>
            </Feature>
            <Feature>
              <span>✅</span>
              <div>
                <strong>Controllo umano</strong>
                <p>Quando l&apos;AI non è sicura, ti chiede conferma</p>
              </div>
            </Feature>
          </FeatureList>

          <ButtonRow>
            <SkipButton onClick={onSkip}>Salta configurazione</SkipButton>
            <NextButton onClick={() => setStep(2)}>Inizia configurazione →</NextButton>
          </ButtonRow>
        </Modal>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <Modal>
        <Header>
          <span>📁</span>
          <div>
            <StepTitle>Scegli le cartelle</StepTitle>
            <StepSubtitle>Seleziona le cartelle da creare nel tuo archivio</StepSubtitle>
          </div>
        </Header>

        <FolderGrid>
          {FOLDER_OPTIONS.map((folder) => (
            <FolderCard
              key={folder.id}
              $selected={selectedFolders.includes(folder.id)}
              onClick={() => toggleFolder(folder.id)}
            >
              <FolderIcon>{folder.icon}</FolderIcon>
              <FolderName>{folder.label}</FolderName>
              <FolderDesc>{folder.description}</FolderDesc>
              {selectedFolders.includes(folder.id) && <CheckMark>✓</CheckMark>}
            </FolderCard>
          ))}
        </FolderGrid>

        <InfoNote>
          Verranno sempre create anche: <strong>Senza categoria</strong> (file con bassa confidenza AI)
          e <strong>Tutti i file</strong>.
        </InfoNote>

        <ButtonRow>
          <SkipButton onClick={onSkip}>Salta</SkipButton>
          <NextButton
            onClick={() => onComplete(selectedFolders)}
            disabled={selectedFolders.length === 0}
          >
            Crea archivio →
          </NextButton>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 20px;
  width: min(100%, 580px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.25);
  padding: 32px;
  max-height: 90vh;
  overflow-y: auto;
`;

const WelcomeHeader = styled.div`
  text-align: center;
  margin-bottom: 28px;
`;

const BigEmoji = styled.div`font-size: 3.5rem; margin-bottom: 12px;`;

const WelcomeTitle = styled.h2`
  font-size: 1.8rem;
  color: #113f36;
  margin: 0 0 10px;
`;

const WelcomeSubtitle = styled.p`
  color: #555;
  line-height: 1.6;
  font-size: 0.96rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
`;

const Feature = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  background: #f5faf8;
  border-radius: 12px;
  border: 1px solid #daeee8;

  > span { font-size: 1.5rem; flex-shrink: 0; }
  strong { display: block; color: #1a584b; font-size: 0.95rem; margin-bottom: 2px; }
  p { color: #666; font-size: 0.86rem; margin: 0; }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;

  > span { font-size: 2rem; }
`;

const StepTitle = styled.h2`font-size: 1.3rem; color: #113f36; margin: 0;`;
const StepSubtitle = styled.p`color: #666; font-size: 0.88rem; margin: 0;`;

const FolderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

const FolderCard = styled.div<{ $selected: boolean }>`
  position: relative;
  padding: 16px 14px;
  border-radius: 14px;
  border: 2px solid ${({ $selected }) => ($selected ? "#1b6f5c" : "#e0e0e0")};
  background: ${({ $selected }) => ($selected ? "#f0faf5" : "#fafafa")};
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: center;

  &:hover { border-color: #1b6f5c; background: #f5fdf9; }
`;

const FolderIcon = styled.div`font-size: 1.8rem; margin-bottom: 6px;`;
const FolderName = styled.div`font-weight: 700; color: #1a3a30; font-size: 0.9rem;`;
const FolderDesc = styled.div`color: #777; font-size: 0.76rem; margin-top: 4px; line-height: 1.4;`;

const CheckMark = styled.div`
  position: absolute;
  top: 8px;
  right: 10px;
  background: #1b6f5c;
  color: #fff;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 900;
`;

const InfoNote = styled.p`
  background: #fffbf0;
  border: 1px solid #f0d88a;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.84rem;
  color: #7a5f10;
  margin-bottom: 24px;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const SkipButton = styled.button`
  padding: 11px 20px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  color: #666;
  font-size: 0.9rem;

  &:hover { background: #f5f5f5; }
`;

const NextButton = styled.button`
  padding: 11px 24px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;

  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;
