"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import TagInput from "./TagInput";

type Tag = {
  name: string;
  description?: string;
};

type Props = {
  fileName: string;
  errorMessage: string;
  errorCode?: string | null;
  availableTags: string[];
  onRetry: (selectedTags: string[]) => void;
  onSkip: () => void;
};

export default function UploadAnalysisErrorPopup({
  fileName,
  errorMessage,
  errorCode,
  availableTags,
  onRetry,
  onSkip,
}: Props) {
  const sortedTags = useMemo<Tag[]>(
    () => availableTags.map((name) => ({ name })).sort((a, b) => a.name.localeCompare(b.name)),
    [availableTags]
  );
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  const handleRetry = () => {
    onRetry(selectedTags.map((tag) => tag.name));
  };

  return (
    <Overlay onClick={(event) => event.target === event.currentTarget && onSkip()}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="upload-analysis-error-title">
        <Header>
          <TitleRow>
            <Title id="upload-analysis-error-title">Analisi non completata</Title>
            <Subtitle>
              Seleziona uno o piu tag gia presenti nel workspace e riprova l&apos;analisi.
            </Subtitle>
          </TitleRow>
          <FileBadge>{fileName}</FileBadge>
        </Header>

        <MessageBox>
          <MessageLabel>Errore ricevuto</MessageLabel>
          <MessageText>{errorMessage}</MessageText>
          {errorCode && <MessageCode>Codice: {errorCode}</MessageCode>}
        </MessageBox>

        <Field>
          <FieldLabel>Tag disponibili</FieldLabel>
          <TagInput
            selected={selectedTags}
            onChange={setSelectedTags}
            tags={sortedTags}
            placeholder="#cerca un tag esistente"
            allowFreeText={false}
          />
        </Field>

        <Suggestions>
          <SuggestionsLabel>Tag più usati</SuggestionsLabel>
          <SuggestionList>
            {sortedTags.slice(0, 8).map((tag) => (
              <SuggestionChip key={tag.name} type="button" onClick={() => setSelectedTags([tag])}>
                #{tag.name}
              </SuggestionChip>
            ))}
          </SuggestionList>
        </Suggestions>

        <Actions>
          <SecondaryButton type="button" onClick={onSkip}>
            Annulla
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleRetry} disabled={selectedTags.length === 0}>
            Riprova analisi
          </PrimaryButton>
        </Actions>
      </Dialog>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 16, 24, 0.62);
  display: grid;
  place-items: center;
  padding: 20px;
`;

const Dialog = styled.div`
  width: min(100%, 720px);
  max-height: min(90vh, 760px);
  overflow: auto;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(10, 16, 24, 0.28);
  padding: 24px;
  display: grid;
  gap: 18px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const TitleRow = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0;
  color: #123126;
  font-size: 1.2rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #5c6b66;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const FileBadge = styled.div`
  border: 1px solid #d5e2dd;
  background: #f7fbf9;
  color: #214236;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MessageBox = styled.div`
  border: 1px solid #dfe7e3;
  background: #f8faf9;
  border-radius: 16px;
  padding: 14px 16px;
  display: grid;
  gap: 6px;
`;

const MessageLabel = styled.div`
  color: #286052;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const MessageText = styled.div`
  color: #243b35;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
`;

const MessageCode = styled.div`
  color: #5c6b66;
  font-size: 0.76rem;
  font-weight: 700;
`;

const Field = styled.div`
  display: grid;
  gap: 10px;
`;

const FieldLabel = styled.div`
  color: #286052;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Suggestions = styled.div`
  display: grid;
  gap: 10px;
`;

const SuggestionsLabel = styled.div`
  color: #286052;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const SuggestionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const SuggestionChip = styled.button`
  border: 1px solid #d5e2dd;
  background: #f7fbf9;
  color: #214236;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
`;

const SecondaryButton = styled.button`
  border: 1px solid #c9d7d2;
  background: #ffffff;
  color: #284238;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  border: 0;
  background: linear-gradient(135deg, #1f7a63, #2d9c73);
  color: #ffffff;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;