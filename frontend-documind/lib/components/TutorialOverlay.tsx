"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";

type Step = {
  id: number;
  icon: string;
  title: string;
  description: string;
  tip?: string;
  action?: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    icon: "⬆️",
    title: "Carica un documento",
    description:
      "Trascina un file nella zona di upload o clicca per selezionarlo. Puoi caricare PDF, DOCX, TXT, Markdown, CSV e HTML fino a 50MB.",
    tip: "I documenti vengono analizzati localmente dal tuo modello Ollama — nessun dato va su server esterni.",
    action: "Prova a caricare un PDF",
  },
  {
    id: 2,
    icon: "🤖",
    title: "L'AI classifica il documento",
    description:
      "Il modello Ollama analizza il contenuto e assegna una percentuale di probabilità a ogni tipo: Fattura, Contratto, Curriculum, Poesia, Codice...",
    tip: "La classificazione è multi-label: un documento può essere sia una 'Fattura' che un 'Documento personale'.",
  },
  {
    id: 3,
    icon: "✅",
    title: "Classificazione automatica",
    description:
      "Se la confidenza supera il 60%, il file viene classificato automaticamente. Riceve tag e viene inserito nella cartella giusta.",
    tip: "Esempio: 'Invoice (85%)' → tag automatici: invoice, finance → cartella: Finance",
  },
  {
    id: 4,
    icon: "🤔",
    title: "Popup di conferma (50–60%)",
    description:
      "Se la confidenza è tra 50% e 60%, l'AI non è sicura. Apparirà un popup con le opzioni più probabili e tu sceglierai quella corretta.",
    tip: "Il tuo feedback aiuta a migliorare la classificazione nel tempo.",
    action: "Guarda come appare il popup →",
  },
  {
    id: 5,
    icon: "🏷️",
    title: "Gestisci i tag",
    description:
      "Puoi creare tag personalizzati nella sezione 'Tag'. Attivando 'Influenza AI', i tuoi tag vengono considerati dal modello durante la classificazione.",
    tip: "Esempi di tag utili: urgente, 2024, cliente-xyz, da-firmare.",
    action: "Vai a Gestione Tag →",
  },
  {
    id: 6,
    icon: "📁",
    title: "Organizza con le cartelle",
    description:
      "Le cartelle vengono create automaticamente in base alle classificazioni. Usa la sidebar per navigare tra Finance, Legal, Personal e le tue cartelle personalizzate.",
    tip: "I file con bassa confidenza vanno in 'Senza categoria' — puoi riclassificarli manualmente.",
  },
];

type Props = {
  onClose: () => void;
};

export default function TutorialOverlay({ onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <Overlay>
      <TutorialCard>
        <ProgressBar>
          {STEPS.map((s, i) => (
            <ProgressDot
              key={s.id}
              $active={i === currentStep}
              $done={i < currentStep}
              onClick={() => setCurrentStep(i)}
            />
          ))}
        </ProgressBar>

        <StepCounter>
          Passo {currentStep + 1} di {STEPS.length}
        </StepCounter>

        <StepIcon>{step.icon}</StepIcon>
        <StepTitle>{step.title}</StepTitle>
        <StepDescription>{step.description}</StepDescription>

        {step.tip && (
          <TipBox>
            <TipIcon>💡</TipIcon>
            <span>{step.tip}</span>
          </TipBox>
        )}

        {step.action && (
          <ActionHint>
            <span>👆</span>
            <span>{step.action}</span>
          </ActionHint>
        )}

        <NavRow>
          <NavBtn
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          >
            ← Precedente
          </NavBtn>

          <SkipBtn onClick={onClose}>Salta tutorial</SkipBtn>

          {isLast ? (
            <FinishBtn onClick={onClose}>Inizia a usare DocuMind 🚀</FinishBtn>
          ) : (
            <NextBtn onClick={() => setCurrentStep((s) => s + 1)}>
              Avanti →
            </NextBtn>
          )}
        </NavRow>
      </TutorialCard>
    </Overlay>
  );
}

const fadeIn = keyframes`from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); }`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
`;

const TutorialCard = styled.div`
  background: #fff;
  border-radius: 24px;
  padding: 36px 32px;
  width: min(100%, 520px);
  box-shadow: 0 32px 80px rgba(0,0,0,0.3);
  text-align: center;
  animation: ${fadeIn} 0.25s ease;
`;

const ProgressBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 18px;
`;

const ProgressDot = styled.div<{ $active: boolean; $done: boolean }>`
  width: ${({ $active }) => ($active ? "28px" : "8px")};
  height: 8px;
  border-radius: 99px;
  background: ${({ $active, $done }) =>
    $active ? "#1b6f5c" : $done ? "#7dc9b8" : "#e0e0e0"};
  cursor: pointer;
  transition: all 0.25s ease;
`;

const StepCounter = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 20px;
`;

const StepIcon = styled.div`font-size: 3.2rem; margin-bottom: 16px;`;

const StepTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 800;
  color: #113f36;
  margin: 0 0 12px;
`;

const StepDescription = styled.p`
  font-size: 0.96rem;
  color: #555;
  line-height: 1.65;
  margin: 0 0 18px;
`;

const TipBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f0faf5;
  border: 1px solid #c0ddd4;
  border-radius: 12px;
  padding: 12px 16px;
  text-align: left;
  margin-bottom: 14px;
  font-size: 0.86rem;
  color: #2a5a50;
  line-height: 1.55;
`;

const TipIcon = styled.span`font-size: 1rem; flex-shrink: 0;`;

const ActionHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #fff8e6;
  border: 1px solid #f5d87a;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.84rem;
  color: #7a5f10;
  margin-bottom: 6px;
`;

const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 24px;
  flex-wrap: wrap;
`;

const NavBtn = styled.button`
  padding: 9px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #666;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #f5f5f5; }
  &:disabled { opacity: 0.35; cursor: default; }
`;

const SkipBtn = styled.button`
  background: none; border: none;
  font-size: 0.82rem;
  color: #aaa;
  cursor: pointer;
  text-decoration: underline;

  &:hover { color: #666; }
`;

const NextBtn = styled.button`
  padding: 10px 22px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
`;

const FinishBtn = styled(NextBtn)`
  padding: 11px 24px;
  font-size: 0.95rem;
`;
