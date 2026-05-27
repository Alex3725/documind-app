"use client";

import { useState } from "react";
import styled from "styled-components";

type Props = {
  defaultName?: string;
  onCreate: (payload: { name: string; description: string; semanticRules: string; autoUpdateType: boolean; autoTags: string[] }) => Promise<boolean>;
  onClose: () => void;
};

export default function GuidedCreateFolder({ defaultName = "", onCreate, onClose }: Props) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [semanticRules, setSemanticRules] = useState("");
  const [autoTagsRaw, setAutoTagsRaw] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const autoTags = autoTagsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const created = await onCreate({
        name: name.trim(),
        description: description.trim(),
        semanticRules: semanticRules.trim(),
        autoUpdateType: autoUpdate,
        autoTags,
      });
      if (created) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay>
      <Modal>
        <HeaderRow>
          <h3>Creiamo la tua prima cartella</h3>
          <p>Ti mostro i campi principali: i checkbox e la descrizione servono per il comportamento dell'AI.</p>
        </HeaderRow>

        <Form>
          <Label>Nome cartella</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es: Personale, Fatture" />

          <Label>Tag automatici (separati da virgola)</Label>
          <Input
            value={autoTagsRaw}
            onChange={(e) => setAutoTagsRaw(e.target.value)}
            placeholder="es: fattura, lavoro"
          />

          <CheckboxRow>
            <input
              id="autoUpdate"
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
            />
            <label htmlFor="autoUpdate">Usa tag automatici per aggiornare i file spostati qui</label>
          </CheckboxRow>
          <Hint>Se attivo, quando l'AI suggerisce questa cartella il sistema può aggiungere i tag automatici.</Hint>

          <Label>Descrizione semantica</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Spiega brevemente cosa contiene questa cartella (aiuta l'AI a classificare)"
          />

          <Label>Regole semantiche (opzionale)</Label>
          <Textarea
            value={semanticRules}
            onChange={(e) => setSemanticRules(e.target.value)}
            placeholder="Esempio: solo fatture B2B in PDF con intestazione aziendale"
          />

          <Controls>
            <CancelBtn onClick={onClose} disabled={busy}>Annulla</CancelBtn>
            <SaveBtn onClick={handleSave} disabled={busy || !name.trim()}>{busy ? 'Salvo...' : 'Crea cartella'}</SaveBtn>
          </Controls>
        </Form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 14px;
  width: min(100%, 720px);
  padding: 22px;
  box-shadow: 0 20px 48px rgba(0,0,0,0.28);
  max-height: 90vh;
  overflow-y: auto;
`;

const HeaderRow = styled.div`margin-bottom: 14px; h3{margin:0;color:#123; } p{margin:6px 0 0;color:#555;font-size:0.95rem}`;
const Form = styled.div`display:flex;flex-direction:column;gap:10px;`;
const Label = styled.div`font-size:0.9rem;color:#223;font-weight:700;`;
const Input = styled.input`padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;`;
const Textarea = styled.textarea`padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;min-height:80px;`;
const CheckboxRow = styled.div`display:flex;align-items:center;gap:8px;`;
const Hint = styled.div`font-size:0.85rem;color:#666;background:#fbfbfb;padding:8px;border-radius:8px;border:1px solid #f0f0f0;`;
const Controls = styled.div`display:flex;justify-content:flex-end;gap:10px;margin-top:6px;`;
const CancelBtn = styled.button`padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer;`;
const SaveBtn = styled.button`padding:9px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#1b6f5c,#245c99);color:#fff;cursor:pointer;`;
