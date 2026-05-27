"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { loadFolders } from "@/lib/features/fileSlice";

const PRESET_ICONS = ["📁", "💼", "💻", "📄", "📊", "🎨", "🔐", "📧", "🏥", "⚖️", "📚", "🚀", "🏷️", "📝", "🧾", "🎵"];
const PRESET_COLORS = ["#1b6f5c", "#245c99", "#7c3aed", "#dc2626", "#d97706", "#0891b2", "#db2777", "#16a34a", "#64748b", "#a16207"];

type FormState = {
  name: string;
  description: string;
  semanticRules: string;
  icon: string;
  color: string;
  autoTags: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  semanticRules: "",
  icon: "🏷️",
  color: "#1b6f5c",
  autoTags: "",
};

type Itag = {
  id: number;
  name: string;
  description?: string;
  semanticRules?: string;
  icon?: string;
  color?: string;
  autoTags?: string[];
};

export default function SmartTagsPage() {
  const dispatch = useAppDispatch();
  const { folders } = useAppSelector((s) => s.files);

  const [itags, setItags] = useState<Itag[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("documind_itags") : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!folders.length) dispatch(loadFolders());
  }, [dispatch, folders.length]);

  useEffect(() => {
    // keep localStorage in sync if changed elsewhere
    const onStorage = (e: StorageEvent) => {
      if (e.key === "documind_itags") {
        try {
          setItags(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSave = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const autoTags = form.autoTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const uniqueAutoTags = Array.from(new Set(autoTags));

      if (editingId) {
        const next = itags.map((it) => (it.id === editingId ? { ...it, name: form.name.trim(), description: form.description, semanticRules: form.semanticRules, icon: form.icon, color: form.color, autoTags: uniqueAutoTags } : it));
        setItags(next);
        localStorage.setItem("documind_itags", JSON.stringify(next));
      } else {
        const newItag: Itag = {
          id: Date.now(),
          name: form.name.trim(),
          description: form.description,
          semanticRules: form.semanticRules,
          icon: form.icon,
          color: form.color,
          autoTags: uniqueAutoTags,
        };
        const next = [...itags, newItag];
        setItags(next);
        localStorage.setItem("documind_itags", JSON.stringify(next));
      }

      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id: number) => {
    const it = itags.find((i) => i.id === id);
    if (!it) return;
    setEditingId(it.id);
    setForm({ name: it.name, description: it.description ?? "", semanticRules: it.semanticRules ?? "", icon: it.icon ?? "🏷️", color: it.color ?? "#1b6f5c", autoTags: (it.autoTags ?? []).join(", ") });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm(`Eliminare il tag "${itags.find((t) => t.id === id)?.name}"?`)) return;
    const next = itags.filter((t) => t.id !== id);
    setItags(next);
    localStorage.setItem("documind_itags", JSON.stringify(next));
  };

  const filtered = itags.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q);
  });

  return (
    <PageContainer>
      <Header>
        <TitleRow>
          <PageTitle>🎯 Smart Tags (itag)</PageTitle>
          <Actions>
            <PrimaryBtn onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>+ Nuovo itag</PrimaryBtn>
          </Actions>
        </TitleRow>
        <PageDesc>
          Gli <strong>itag</strong> sono tag intelligenti che puoi definire per aiutare l&apos;AI nella classificazione.
          Qui crei ed editi solo <em>itag</em>; non vengono create cartelle sul server.
        </PageDesc>
      </Header>

      {showForm && (
        <FormCard>
          <FormTitle>{editingId ? "✏️ Modifica itag" : "➕ Nuovo itag"}</FormTitle>

          <FormGrid>
            <FormGroup>
              <FormLabel>Nome *</FormLabel>
              <FormInput placeholder="es: fattura, contratto" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </FormGroup>

            <FormGroup $full>
              <FormLabel>📝 Descrizione semantica — <Hint>usata dall&apos;AI per classificare</Hint></FormLabel>
              <FormTextarea rows={3} placeholder='es: "Documenti fiscali con numeri fattura, importi e partita IVA"' value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </FormGroup>

            <FormGroup $full>
              <FormLabel>🔧 Regole semantiche aggiuntive — <Hint>opzionale</Hint></FormLabel>
              <FormTextarea rows={2} placeholder='es: "Solo documenti B2B"' value={form.semanticRules} onChange={(e) => setForm((f) => ({ ...f, semanticRules: e.target.value }))} />
            </FormGroup>

            <FormGroup>
              <FormLabel>🏷️ Tag automatici</FormLabel>
              <FormInput placeholder="es: fattura, 2024" value={form.autoTags} onChange={(e) => setForm((f) => ({ ...f, autoTags: e.target.value }))} />
              <HintText>Tag secondari assegnati automaticamente quando un file riceve questo itag.</HintText>
            </FormGroup>

            <FormGroup>
              <FormLabel>Icona e colore</FormLabel>
              <IconColorRow>
                <IconGrid>
                  {PRESET_ICONS.map((icon) => (
                    <IconBtn key={icon} $selected={form.icon === icon} onClick={() => setForm((f) => ({ ...f, icon }))}>{icon}</IconBtn>
                  ))}
                </IconGrid>
                <ColorGrid>
                  {PRESET_COLORS.map((color) => (
                    <ColorDot key={color} $color={color} $selected={form.color === color} onClick={() => setForm((f) => ({ ...f, color }))} />
                  ))}
                </ColorGrid>
              </IconColorRow>
            </FormGroup>
          </FormGrid>

          <FormActions>
            <CancelBtn onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>Annulla</CancelBtn>
            <SaveBtn onClick={handleSave} disabled={!form.name.trim() || saving}>{saving ? "Salvataggio..." : editingId ? "Salva modifiche" : "Crea itag"}</SaveBtn>
          </FormActions>
        </FormCard>
      )}

      <SearchRow>
        <SearchInput placeholder="🔍 Cerca itag..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <CountLabel>{filtered.length} itag</CountLabel>
      </SearchRow>

      {filtered.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🏷️</EmptyIcon>
          <EmptyText>{search ? `Nessun itag trovato per "${search}"` : "Nessun itag. Crea un nuovo itag con \"+ Nuovo itag\"."}</EmptyText>
        </EmptyState>
      ) : (
        <FolderTree>
          {filtered.map((it) => (
            <TreeItem key={it.id}>
              <TreeRow $depth={0}>
                <TreeLeft>
                  <FolderIcon $color={it.color ?? "#1b6f5c"}>{it.icon ?? "🏷️"}</FolderIcon>
                  <TreeInfo>
                    <TreeName>{it.name}</TreeName>
                    {it.description && <TreeDesc>{it.description}</TreeDesc>}
                  </TreeInfo>
                </TreeLeft>
                <TreeActions>
                  <ActionBtn onClick={() => handleEdit(it.id)}>✏️</ActionBtn>
                  <ActionBtn $danger onClick={() => handleDelete(it.id)}>🗑️</ActionBtn>
                </TreeActions>
              </TreeRow>
              {it.semanticRules && (
                <ExpandedDetail $depth={0}>
                  <DetailSection>
                    <DetailLabel>🔧 Regole semantiche:</DetailLabel>
                    <DetailText>{it.semanticRules}</DetailText>
                  </DetailSection>
                  {it.autoTags && it.autoTags.length > 0 && (
                    <DetailSection>
                      <DetailLabel>🏷️ Tag automatici:</DetailLabel>
                      <TagsRow>
                        {it.autoTags.map((t) => <Tag key={t}>{t}</Tag>)}
                      </TagsRow>
                    </DetailSection>
                  )}
                </ExpandedDetail>
              )}
            </TreeItem>
          ))}
        </FolderTree>
      )}
    </PageContainer>
  );
}

// ============================================================
// STYLES (kept compact)
// ============================================================

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const PageContainer = styled.div`max-width: 900px; margin: 0 auto; padding: 32px 24px;`;

const Header = styled.div`margin-bottom: 28px;`;
const TitleRow = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 12px;`;
const PageTitle = styled.h1`font-size: 1.6rem; font-weight: 800; color: #113f36; margin: 0;`;
const PageDesc = styled.p`color: #555; font-size: 0.9rem; line-height: 1.6; margin: 0;`;

const Actions = styled.div`display: flex; gap: 8px;`;

const PrimaryBtn = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #1b6f5c, #245c99);
  color: #fff; border: none; border-radius: 10px;
  font-weight: 700; font-size: 0.9rem; cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const Hint = styled.span`font-size: 0.74rem; font-weight: 400; color: #8b5cf6;`;
const HintText = styled.p`font-size: 0.74rem; color: #8b5cf6; margin: 4px 0 0; line-height: 1.4;`;

const FormCard = styled.div`
  background: #fff; border: 1px solid #d4ece5; border-radius: 16px;
  padding: 24px; margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(27,111,92,0.07);
  animation: ${fadeIn} 0.2s ease;
`;

const FormTitle = styled.h3`font-size: 1rem; font-weight: 700; color: #1a3a30; margin: 0 0 18px;`;
const FormGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 16px; @media(max-width:600px){grid-template-columns:1fr;}`;
const FormGroup = styled.div<{ $full?: boolean }>`${({ $full }) => $full && "grid-column: 1 / -1;"}`;
const FormLabel = styled.label`display: block; font-size: 0.8rem; font-weight: 700; color: #286052; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;`;
const FormInput = styled.input`width: 100%; border: 1px solid #ccc; border-radius: 10px; padding: 9px 12px; font-size: 0.9rem; outline: none; &:focus{border-color:#1b6f5c;box-shadow:0 0 0 3px rgba(27,111,92,0.1);}`;
const FormSelect = styled.select`width: 100%; border: 1px solid #ccc; border-radius: 10px; padding: 9px 12px; font-size: 0.9rem; outline: none; background: #fff; &:focus{border-color:#1b6f5c;}`;
const FormTextarea = styled.textarea`width: 100%; border: 1px solid #ccc; border-radius: 10px; padding: 9px 12px; font-size: 0.88rem; outline: none; resize: vertical; font-family: inherit; &:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,0.1);}`;

const IconColorRow = styled.div`display: flex; gap: 12px; flex-direction: column;`;
const IconGrid = styled.div`display: flex; flex-wrap: wrap; gap: 6px;`;
const ColorGrid = styled.div`display: flex; flex-wrap: wrap; gap: 6px;`;
const IconBtn = styled.button<{ $selected: boolean }>`
  width: 32px; height: 32px; border-radius: 8px; border: 2px solid ${({ $selected }) => $selected ? "#1b6f5c" : "#e0e0e0"};
  background: ${({ $selected }) => $selected ? "#f0faf5" : "#fff"}; cursor: pointer; font-size: 1.1rem;
  &:hover{border-color:#1b6f5c;}
`;
const ColorDot = styled.div<{ $color: string; $selected: boolean }>`
  width: 26px; height: 26px; background: ${({ $color }) => $color}; border-radius: 50%; cursor: pointer;
  border: 3px solid ${({ $selected }) => $selected ? "#1a3a30" : "transparent"};
  outline: ${({ $selected, $color }) => $selected ? `2px solid ${$color}` : "none"};
  outline-offset: 2px;
  &:hover{transform:scale(1.1);}
`;

const Preview = styled.div`display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px 14px; background: #f5faf8; border-radius: 10px;`;
const FolderPreviewDot = styled.span<{ $color: string }>`font-size: 1.4rem; color: ${({ $color }) => $color};`;
const PreviewPath = styled.span`font-size: 0.88rem; font-weight: 600; color: #1a3a30;`;

const FormActions = styled.div`display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;`;
const CancelBtn = styled.button`padding: 9px 18px; border: 1px solid #ddd; background: #fff; border-radius: 10px; cursor: pointer; color: #666; &:hover{background:#f5f5f5;}`;
const SaveBtn = styled.button`padding: 9px 20px; background: linear-gradient(135deg,#1b6f5c,#245c99); color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer; &:hover:not(:disabled){opacity:0.9;} &:disabled{opacity:0.45;cursor:not-allowed;}`;

const SearchRow = styled.div`display: flex; align-items: center; gap: 12px; margin-bottom: 16px;`;
const SearchInput = styled.input`flex:1; border:1px solid #d0ddd9; border-radius:10px; padding:9px 14px; font-size:0.9rem; outline:none; background:#fff; &:focus{border-color:#1b6f5c;box-shadow:0 0 0 3px rgba(27,111,92,0.1);}`;
const CountLabel = styled.span`font-size:0.82rem;color:#888;white-space:nowrap;`;

const FolderTree = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const TreeItem = styled.div``;
const TreeRow = styled.div<{ $depth: number }>`
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: #fff; border: 1px solid #e5ede9; border-radius: 12px;
`;
const TreeLeft = styled.div`display:flex; align-items:center; gap:10px; flex:1;`;
const FolderIcon = styled.span<{ $color: string }>`font-size:1.3rem; color:${({ $color }) => $color}; flex-shrink:0;`;
const TreeInfo = styled.div`flex:1; min-width:0;`;
const TreeName = styled.div`font-weight:700; font-size:0.95rem; color:#1a3a30;`;
const TreeDesc = styled.div`font-size:0.82rem; color:#666; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;
const TreeActions = styled.div`display:flex; gap:8px; flex-shrink:0; margin-left:8px;`;
const ActionBtn = styled.button<{ $danger?: boolean }>`background:none;border:none;cursor:pointer;font-size:0.95rem;padding:6px 8px;border-radius:8px;&:hover{background:${({ $danger }) => $danger ? "#fee" : "#f5f5f5"};}`;

const ExpandedDetail = styled.div<{ $depth: number }>`
  padding: 12px 14px; background: #f9fdf9; border: 1px solid #d4ece5; border-radius: 8px; margin-top: 6px;
`;
const DetailSection = styled.div`margin-bottom: 8px; &:last-child{margin-bottom:0;}`;
const DetailLabel = styled.div`font-size:0.73rem; font-weight:700; color:#8b5cf6; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px;`;
const DetailText = styled.p`font-size:0.82rem; color:#444; margin:0; line-height:1.4;`;
const TagsRow = styled.div`display:flex; flex-wrap:wrap; gap:6px;`;
const Tag = styled.span`background:#f0faf5; color:#1b6f5c; border:1px solid #b8ddd4; border-radius:999px; padding:4px 10px; font-size:0.78rem; font-weight:600;`;

const EmptyState = styled.div`text-align:center; padding:48px 20px; background:#fff; border:1px dashed #d0ddd9; border-radius:14px;`;
const EmptyIcon = styled.div`font-size:2.5rem; margin-bottom:10px;`;
const EmptyText = styled.p`color:#888; font-size:0.92rem;`;
