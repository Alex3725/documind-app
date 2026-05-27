"use client";

import { useState } from "react";
import styled from "styled-components";
import TagInput from "@/lib/components/TagInput";

export interface ManualTagAssignmentPopupProps {
  filename: string;
  onAssign: (tags: string[]) => void;
  onSkip?: () => void;
  onCancel: () => void;
  /** Lista di tag esistenti usati per l'autocomplete */
  availableTags?: { name: string; description?: string }[];
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Modal = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #333;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 16px;
`;

const Filename = styled.span`
  font-weight: 600;
  color: #0066cc;
`;

const TagsContainer = styled.div`
  margin-bottom: 16px;
`;

const TagsLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
`;

const TagsHint = styled.p`
  font-size: 12px;
  color: #999;
  margin: 4px 0 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const CancelBtn = styled.button`
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: #f5f5f5;
  }
`;

const SkipBtn = styled.button`
  padding: 8px 16px;
  border: 1px solid #d6e2dd;
  background: #f6fbf8;
  color: #245145;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background: #ecf7f1;
  }
`;

const AssignBtn = styled.button`
  padding: 8px 16px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background: #0052a3;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export default function ManualTagAssignmentPopup({
  filename,
  onAssign,
  onSkip,
  onCancel,
  availableTags = [],
}: ManualTagAssignmentPopupProps) {
  const [selected, setSelected] = useState<{ name: string }[]>([]);

  const handleAssign = () => {
    if (selected.length === 0) {
      alert("Per favore assegna almeno un tag.");
      return;
    }
    onAssign(selected.map((t) => t.name));
  };

  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Title>⚠️ Assegnazione manuale tag</Title>
        <Description>
          L&apos;AI non ha potuto classificare con sicurezza <Filename>{filename}</Filename>.
          Assegna manualmente uno o più tag.
        </Description>

        <TagsContainer>
          <TagsLabel>Assegna tag:</TagsLabel>
          <TagInput
            selected={selected}
            onChange={(tags) => setSelected(tags.map((t) => ({ name: t.name })))}
            tags={availableTags.map((t) => ({ name: t.name, description: t.description }))}
            placeholder="#tag esistente"
            allowFreeText={false}
          />
          <TagsHint>Seleziona solo tag esistenti nel workspace.</TagsHint>
        </TagsContainer>

        <Actions>
          {onSkip && <SkipBtn onClick={onSkip}>Salva senza tag</SkipBtn>}
          <CancelBtn onClick={onCancel}>Annulla</CancelBtn>
          <AssignBtn onClick={handleAssign} disabled={selected.length === 0}>
            ✓ Assegna e riordina
          </AssignBtn>
        </Actions>
      </Modal>
    </Overlay>
  );
}
