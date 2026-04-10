"use client";

import { useState } from "react";
import styled from "styled-components";
import { useAppSelector } from "@/lib/hooks";

type CustomTag = {
  id: string;
  name: string;
  color: string;
  description: string;
  influenceAI: boolean;
  createdAt: string;
};

const PRESET_COLORS = [
  "#1b6f5c", "#245c99", "#db2777", "#d97706",
  "#7c3aed", "#dc2626", "#0891b2", "#64748b",
];

const DEFAULT_TAGS: CustomTag[] = [
  { id: "1", name: "urgente", color: "#dc2626", description: "Documenti urgenti", influenceAI: true, createdAt: new Date().toISOString() },
  { id: "2", name: "archivio", color: "#64748b", description: "Da archiviare", influenceAI: false, createdAt: new Date().toISOString() },
  { id: "3", name: "da-firmare", color: "#d97706", description: "Richiede firma", influenceAI: true, createdAt: new Date().toISOString() },
];

export default function TagManagementPage() {
  const { files } = useAppSelector((s) => s.files);
  const [tags, setTags] = useState<CustomTag[]>(DEFAULT_TAGS);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
  const [form, setForm] = useState({ name: "", color: PRESET_COLORS[0], description: "", influenceAI: true });
  const [search, setSearch] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) return;
    const normalized = form.name.trim().toLowerCase().replace(/\s+/g, "-");

    if (editingTag) {
      setTags((prev) =>
        prev.map((t) =>
          t.id === editingTag.id
            ? { ...t, name: normalized, color: form.color, description: form.description, influenceAI: form.influenceAI }
            : t
        )
      );
    } else {
      const newTag: CustomTag = {
        id: Date.now().toString(),
        name: normalized,
        color: form.color,
        description: form.description,
        influenceAI: form.influenceAI,
        createdAt: new Date().toISOString(),
      };
      setTags((prev) => [newTag, ...prev]);
    }

    setForm({ name: "", color: PRESET_COLORS[0], description: "", influenceAI: true });
    setShowForm(false);
    setEditingTag(null);
  };

  const handleEdit = (tag: CustomTag) => {
    setEditingTag(tag);
    setForm({ name: tag.name, color: tag.color, description: tag.description, influenceAI: tag.influenceAI });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Eliminare questo tag?")) {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTag(null);
    setForm({ name: "", color: PRESET_COLORS[0], description: "", influenceAI: true });
  };

  const tagUsage = (tagName: string) =>
    files.filter((f) => f.tags.includes(tagName)).length;

  const filteredTags = tags.filter(
    (t) => !search || t.name.includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );

  const allTagsInUse = Array.from(
    new Set(files.flatMap((f) => f.tags))
  ).filter((t) => !tags.find((ct) => ct.name === t));

  return (
    <PageContainer>
      <Header>
        <TitleRow>
          <PageTitle>🏷️ Gestione Tag</PageTitle>
          <AddButton onClick={() => { setShowForm(true); setEditingTag(null); }}>
            + Nuovo tag
          </AddButton>
        </TitleRow>
        <PageDesc>
          Crea e gestisci tag personalizzati. I tag con &quot;influenza AI&quot; attiva vengono
          considerati dal modello per migliorare la classificazione futura.
        </PageDesc>
      </Header>

      {showForm && (
        <FormCard>
          <FormTitle>{editingTag ? "✏️ Modifica tag" : "➕ Nuovo tag"}</FormTitle>
          <FormGrid>
            <FormGroup>
              <FormLabel>Nome tag *</FormLabel>
              <FormInput
                placeholder="es: importante, 2024, cliente-rossi"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <FormHint>Sarà convertito in minuscolo con trattini (es: mio-tag)</FormHint>
            </FormGroup>

            <FormGroup>
              <FormLabel>Descrizione</FormLabel>
              <FormInput
                placeholder="A cosa serve questo tag?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </FormGroup>

            <FormGroup $full>
              <FormLabel>Colore</FormLabel>
              <ColorPicker>
                {PRESET_COLORS.map((color) => (
                  <ColorDot
                    key={color}
                    $color={color}
                    $selected={form.color === color}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                  />
                ))}
                <CustomColorInput
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  title="Colore personalizzato"
                />
              </ColorPicker>
            </FormGroup>

            <FormGroup $full>
              <ToggleRow>
                <div>
                  <FormLabel style={{ margin: 0 }}>🤖 Influenza classificazione AI</FormLabel>
                  <FormHint>Il modello terrà conto di questo tag quando classifica i documenti</FormHint>
                </div>
                <Toggle
                  $active={form.influenceAI}
                  onClick={() => setForm((f) => ({ ...f, influenceAI: !f.influenceAI }))}
                >
                  <ToggleKnob $active={form.influenceAI} />
                </Toggle>
              </ToggleRow>
            </FormGroup>
          </FormGrid>

          {form.name && (
            <PreviewRow>
              <span>Anteprima:</span>
              <TagPreview $color={form.color}>
                {form.name.trim().toLowerCase().replace(/\s+/g, "-") || "tag"}
              </TagPreview>
            </PreviewRow>
          )}

          <FormActions>
            <CancelBtn onClick={handleCancel}>Annulla</CancelBtn>
            <SaveBtn onClick={handleSave} disabled={!form.name.trim()}>
              {editingTag ? "Salva modifiche" : "Crea tag"}
            </SaveBtn>
          </FormActions>
        </FormCard>
      )}

      <SearchRow>
        <SearchInput
          placeholder="🔍 Cerca tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <CountLabel>{filteredTags.length} tag personalizzati</CountLabel>
      </SearchRow>

      <SectionTitle>Tag personalizzati</SectionTitle>
      {filteredTags.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🏷️</EmptyIcon>
          <EmptyText>
            {search ? `Nessun tag trovato per "${search}"` : "Nessun tag ancora. Creane uno!"}
          </EmptyText>
        </EmptyState>
      ) : (
        <TagsGrid>
          {filteredTags.map((tag) => {
            const usage = tagUsage(tag.name);
            return (
              <TagCard key={tag.id}>
                <TagCardHeader>
                  <TagBadge $color={tag.color}>{tag.name}</TagBadge>
                  <TagActions>
                    <ActionBtn onClick={() => handleEdit(tag)} title="Modifica">✏️</ActionBtn>
                    <ActionBtn onClick={() => handleDelete(tag.id)} title="Elimina" $danger>🗑️</ActionBtn>
                  </TagActions>
                </TagCardHeader>

                {tag.description && <TagDesc>{tag.description}</TagDesc>}

                <TagMeta>
                  <MetaItem>
                    <MetaIcon>📁</MetaIcon>
                    <MetaVal>{usage} {usage === 1 ? "file" : "file"}</MetaVal>
                  </MetaItem>
                  <MetaItem>
                    <MetaIcon>🤖</MetaIcon>
                    <MetaVal $ok={tag.influenceAI}>
                      {tag.influenceAI ? "Influenza AI" : "Solo manuale"}
                    </MetaVal>
                  </MetaItem>
                  <MetaItem>
                    <MetaIcon>📅</MetaIcon>
                    <MetaVal>{new Date(tag.createdAt).toLocaleDateString("it-IT")}</MetaVal>
                  </MetaItem>
                </TagMeta>
              </TagCard>
            );
          })}
        </TagsGrid>
      )}

      {allTagsInUse.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 32 }}>
            Tag generati automaticamente dall&apos;AI
            <AutoTagNote>Non modificabili — assegnati dalla classificazione</AutoTagNote>
          </SectionTitle>
          <AutoTagsRow>
            {allTagsInUse.map((tag) => (
              <AutoTag key={tag}>
                {tag}
                <AutoTagCount>{tagUsage(tag)}</AutoTagCount>
              </AutoTag>
            ))}
          </AutoTagsRow>
        </>
      )}
    </PageContainer>
  );
}

const PageContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
`;

const Header = styled.div`margin-bottom: 28px;`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 12px;
`;

const PageTitle = styled.h1`font-size: 1.6rem; font-weight: 800; color: #113f36; margin: 0;`;

const PageDesc = styled.p`color: #666; font-size: 0.92rem; margin: 0; line-height: 1.6;`;

const AddButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
`;

const FormCard = styled.div`
  background: #fff;
  border: 1px solid #d4ece5;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(27,111,92,0.07);
`;

const FormTitle = styled.h3`font-size: 1rem; font-weight: 700; color: #1a3a30; margin: 0 0 18px;`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div<{ $full?: boolean }>`
  ${({ $full }) => $full && "grid-column: 1 / -1;"}
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #286052;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const FormInput = styled.input`
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 0.9rem;
  outline: none;

  &:focus { border-color: #1b6f5c; box-shadow: 0 0 0 3px rgba(27,111,92,0.1); }
`;

const FormHint = styled.p`font-size: 0.74rem; color: #aaa; margin: 4px 0 0;`;

const ColorPicker = styled.div`display: flex; gap: 8px; align-items: center; flex-wrap: wrap;`;

const ColorDot = styled.div<{ $color: string; $selected: boolean }>`
  width: 28px; height: 28px;
  background: ${({ $color }) => $color};
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid ${({ $selected }) => ($selected ? "#1a3a30" : "transparent")};
  outline: ${({ $selected, $color }) => ($selected ? `2px solid ${$color}` : "none")};
  outline-offset: 2px;
  transition: transform 0.15s;

  &:hover { transform: scale(1.1); }
`;

const CustomColorInput = styled.input`
  width: 28px; height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #f5faf8;
  border-radius: 12px;
  border: 1px solid #d4ece5;
`;

const Toggle = styled.div<{ $active: boolean }>`
  width: 44px; height: 24px;
  background: ${({ $active }) => ($active ? "#1b6f5c" : "#ddd")};
  border-radius: 999px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
`;

const ToggleKnob = styled.div<{ $active: boolean }>`
  width: 18px; height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: ${({ $active }) => ($active ? "23px" : "3px")};
  transition: left 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 0;
  font-size: 0.84rem;
  color: #888;
`;

const TagPreview = styled.span<{ $color: string }>`
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => `${$color}50`};
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 0.82rem;
  font-weight: 700;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
`;

const CancelBtn = styled.button`
  padding: 9px 18px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  color: #666;

  &:hover { background: #f5f5f5; }
`;

const SaveBtn = styled.button`
  padding: 9px 20px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: 1px solid #d0ddd9;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.9rem;
  outline: none;
  background: #fff;

  &:focus { border-color: #1b6f5c; box-shadow: 0 0 0 3px rgba(27,111,92,0.1); }
`;

const CountLabel = styled.span`font-size: 0.82rem; color: #888; white-space: nowrap;`;

const SectionTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a3a30;
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AutoTagNote = styled.span`
  font-size: 0.74rem;
  font-weight: 400;
  color: #aaa;
`;

const TagsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
`;

const TagCard = styled.div`
  background: #fff;
  border: 1px solid #e5ede9;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
`;

const TagCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const TagBadge = styled.span<{ $color: string }>`
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => `${$color}40`};
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 0.82rem;
  font-weight: 700;
`;

const TagActions = styled.div`display: flex; gap: 4px;`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  background: none; border: none; cursor: pointer;
  font-size: 0.85rem; padding: 3px 5px;
  opacity: 0.5; border-radius: 6px;

  &:hover {
    opacity: 1;
    background: ${({ $danger }) => ($danger ? "#fee" : "#f5f5f5")};
  }
`;

const TagDesc = styled.p`font-size: 0.82rem; color: #666; margin: 0 0 10px;`;

const TagMeta = styled.div`display: flex; gap: 12px; flex-wrap: wrap;`;

const MetaItem = styled.div`display: flex; align-items: center; gap: 4px;`;
const MetaIcon = styled.span`font-size: 0.8rem;`;
const MetaVal = styled.span<{ $ok?: boolean }>`
  font-size: 0.76rem;
  color: ${({ $ok }) => ($ok === true ? "#1b6f5c" : $ok === false ? "#888" : "#666")};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background: #fff;
  border: 1px dashed #d0ddd9;
  border-radius: 14px;
`;

const EmptyIcon = styled.div`font-size: 2.5rem; margin-bottom: 10px;`;
const EmptyText = styled.p`color: #888; font-size: 0.92rem;`;

const AutoTagsRow = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;

const AutoTag = styled.span`
  background: #f0f0f0;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const AutoTagCount = styled.span`
  background: #ddd;
  border-radius: 999px;
  padding: 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #555;
`;
