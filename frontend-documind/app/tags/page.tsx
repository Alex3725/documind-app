"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  loadFolders,
  createFolder,
  seedFolderProfile,
  removeFolder,
  updateFolder,
  type FolderType,
} from "@/lib/features/fileSlice";

const PRESET_ICONS = ["📁", "💼", "💻", "📄", "📊", "🎨", "🔐", "📧", "🏥", "⚖️", "📚", "🚀", "🏷️", "📝", "🧾", "🎵"];
const PRESET_COLORS = ["#1b6f5c", "#245c99", "#7c3aed", "#dc2626", "#d97706", "#0891b2", "#db2777", "#16a34a", "#64748b", "#a16207"];

const PROFILES = [
  { id: "developer", label: "👨‍💻 Sviluppatore", desc: "Lavoro, Codice (Java/Python/JS), Note, Corsi, Progetti" },
  { id: "designer", label: "🎨 Designer", desc: "Progetti Design, Brief, Risorse, Ispirazione" },
  { id: "student", label: "🎓 Studente", desc: "Appunti, Guide, Esercizi, Relazioni, Personale" },
  { id: "business", label: "📊 Business", desc: "Fatture, Contratti, Report, Comunicazioni, HR" },
  { id: "default", label: "📂 Generico", desc: "Documenti, Personale, Lavoro, Note" },
];

type FormState = {
  name: string;
  fullPath: string;
  parentPath: string;
  description: string;
  semanticRules: string;
  icon: string;
  color: string;
  useFolderNameAsTag: boolean;
  customTagName: string;
  autoTags: string;
};

const emptyForm: FormState = {
  name: "",
  fullPath: "",
  parentPath: "",
  description: "",
  semanticRules: "",
  icon: "📁",
  color: "#1b6f5c",
  useFolderNameAsTag: true,
  customTagName: "",
  autoTags: "",
};

export default function TypeManagementPage() {
  const dispatch = useAppDispatch();
  const { folders, foldersStatus } = useAppSelector((s) => s.files);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showSeeding, setShowSeeding] = useState(false);
  const [seedingProfile, setSeedingProfile] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!folders.length) {
      dispatch(loadFolders());
    }
  }, [dispatch, folders.length]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const secondaryAutoTags = form.autoTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const primaryTag = form.useFolderNameAsTag
        ? form.name.trim().toLowerCase()
        : form.customTagName.trim().toLowerCase() || form.name.trim().toLowerCase();

      const autoTags = Array.from(new Set([primaryTag, ...secondaryAutoTags].filter(Boolean)));

      const fullPath = form.fullPath.trim() || (
        form.parentPath ? `${form.parentPath}/${form.name.trim()}` : form.name.trim()
      );

      if (editingId) {
        const response = await fetch(`/api/folders/${editingId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            fullPath,
            parentPath: form.parentPath || undefined,
            description: form.description,
            semanticRules: form.semanticRules,
            icon: form.icon,
            color: form.color,
            autoTags,
            autoUpdateType: form.useFolderNameAsTag,
          }),
        });

        if (!response.ok) {
          throw new Error("Errore aggiornamento cartella.");
        }

        const updatedFolder = (await response.json()) as FolderType;
        dispatch(updateFolder(updatedFolder));
      } else {
        await dispatch(createFolder({
          name: form.name.trim(),
          fullPath,
          parentPath: form.parentPath || undefined,
          description: form.description,
          semanticRules: form.semanticRules,
          icon: form.icon,
          color: form.color,
          autoTags,
          autoUpdateType: form.useFolderNameAsTag,
        })).unwrap();
      }

      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
    } catch {
      // error handled by redux
    } finally {
      setSaving(false);
    }
  };

  const handleSeedProfile = async (profileId: string) => {
    setSeedingProfile(profileId);
    try {
      await dispatch(seedFolderProfile(profileId)).unwrap();
      setShowSeeding(false);
    } finally {
      setSeedingProfile(null);
    }
  };

  const handleDelete = async (folder: FolderType) => {
    if (folder.system) {
      alert("Non è possibile eliminare cartelle di sistema.");
      return;
    }
    if (!confirm(`Eliminare la cartella "${folder.fullPath}"?`)) return;
    await fetch(`/api/folders/${folder.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    dispatch(removeFolder(folder.id));
  };

  const handleEdit = (folder: FolderType) => {
    setEditingId(folder.id);
    setForm({
      name: folder.name,
      fullPath: folder.fullPath,
      parentPath: folder.parentPath ?? "",
      description: folder.description ?? "",
      semanticRules: folder.semanticRules ?? "",
      icon: folder.icon,
      color: folder.color,
      useFolderNameAsTag: folder.autoUpdateType,
      customTagName: folder.autoUpdateType ? "" : (folder.autoTags?.[0] ?? folder.name),
      autoTags: (folder.autoTags ?? []).join(", "),
    });
    setShowForm(true);
  };

  const filtered = folders.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.fullPath.toLowerCase().includes(q) ||
      (f.description ?? "").toLowerCase().includes(q)
    );
  });

  // Raggruppa per root
  const rootFolders = filtered.filter((f) => f.depth === 0);
  const childrenOf = (path: string) => filtered.filter((f) => f.parentPath === path);

  return (
    <PageContainer>
      {/* HEADER */}
      <Header>
        <TitleRow>
          <PageTitle>🗂️ Tipi e Cartelle</PageTitle>
          <Actions>
            <SecondaryBtn onClick={() => setShowSeeding(true)}>
              ✨ Usa profilo
            </SecondaryBtn>
            <PrimaryBtn onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
              + Nuova cartella
            </PrimaryBtn>
          </Actions>
        </TitleRow>
        <PageDesc>
          Le cartelle in DocuMind sono <strong>tipi semantici</strong>. La loro descrizione viene usata
          dall&apos;AI per classificare automaticamente i documenti. Più la descrizione è dettagliata, meglio l&apos;AI classifica.
        </PageDesc>
      </Header>

      {/* SEEDING MODAL */}
      {showSeeding && (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && setShowSeeding(false)}>
          <SeedModal>
            <SeedTitle>✨ Crea struttura da profilo</SeedTitle>
            <SeedDesc>
              Scegli un profilo per creare automaticamente la struttura di cartelle ottimizzata con
              le descrizioni semantiche già configurate per l&apos;AI.
            </SeedDesc>
            <ProfileGrid>
              {PROFILES.map((p) => (
                <ProfileCard
                  key={p.id}
                  onClick={() => handleSeedProfile(p.id)}
                  $loading={seedingProfile === p.id}
                >
                  <ProfileLabel>{p.label}</ProfileLabel>
                  <ProfileDesc>{p.desc}</ProfileDesc>
                  {seedingProfile === p.id && <ProfileSpinner />}
                </ProfileCard>
              ))}
            </ProfileGrid>
            <SeedClose onClick={() => setShowSeeding(false)}>Annulla</SeedClose>
          </SeedModal>
        </ModalOverlay>
      )}

      {/* CREATE/EDIT FORM */}
      {showForm && (
        <FormCard>
          <FormTitle>{editingId ? "✏️ Modifica cartella" : "➕ Nuova cartella / tipo"}</FormTitle>

          <FormGrid>
            <FormGroup>
              <FormLabel>Nome *</FormLabel>
              <FormInput
                placeholder="es: Fatture, Java, Note personali"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>Percorso padre (opzionale)</FormLabel>
              <FormSelect
                value={form.parentPath}
                onChange={(e) => setForm((f) => ({ ...f, parentPath: e.target.value }))}
              >
                <option value="">-- Cartella radice --</option>
                {folders
                  .filter((f) => !f.system && f.depth < 3)
                  .map((f) => (
                    <option key={f.id} value={f.fullPath}>{f.fullPath}</option>
                  ))}
              </FormSelect>
            </FormGroup>

            <FormGroup $full>
              <FormLabel>
                📝 Descrizione semantica — <Hint>usata dall&apos;AI per classificare i file</Hint>
              </FormLabel>
              <FormTextarea
                rows={3}
                placeholder='es: "Fatture commerciali con importi IVA, partita IVA, numero fattura. Include note di credito e ricevute B2B."'
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <HintText>
                💡 Più dettagliata è la descrizione, meglio l&apos;AI classificherà i file in questa cartella.
                Includi: tipo di documenti, caratteristiche specifiche, esempi.
              </HintText>
            </FormGroup>

            <FormGroup $full>
              <FormLabel>
                🔧 Regole semantiche aggiuntive — <Hint>opzionale, vincoli per l&apos;AI</Hint>
              </FormLabel>
              <FormTextarea
                rows={2}
                placeholder='es: "Esclude fatture personali. Solo documenti B2B. Formato PDF con intestazione aziendale."'
                value={form.semanticRules}
                onChange={(e) => setForm((f) => ({ ...f, semanticRules: e.target.value }))}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>🏷️ Tag automatici</FormLabel>
              <FormInput
                placeholder="es: fattura, lavoro, 2024 (separati da virgola)"
                value={form.autoTags}
                onChange={(e) => setForm((f) => ({ ...f, autoTags: e.target.value }))}
              />
              <HintText>Tag secondari assegnati automaticamente quando un file viene spostato qui.</HintText>
            </FormGroup>

            <FormGroup>
              <FormLabel>Comportamento tag primario</FormLabel>
              <SwitchRow>
                <SwitchLabel>
                  <SwitchInput
                    type="checkbox"
                    checked={form.useFolderNameAsTag}
                    onChange={(e) => setForm((f) => ({ ...f, useFolderNameAsTag: e.target.checked }))}
                  />
                  <span>Usa nome cartella come tag</span>
                </SwitchLabel>
              </SwitchRow>
              {!form.useFolderNameAsTag && (
                <FormInput
                  placeholder="Nome tag personalizzato"
                  value={form.customTagName}
                  onChange={(e) => setForm((f) => ({ ...f, customTagName: e.target.value }))}
                />
              )}
              <HintText>
                Se disattivato, il tag primario sarà quello personalizzato e la descrizione semantica guiderà l&apos;assegnazione.
              </HintText>
            </FormGroup>

            <FormGroup>
              <FormLabel>Icona e colore</FormLabel>
              <IconColorRow>
                <IconGrid>
                  {PRESET_ICONS.map((icon) => (
                    <IconBtn
                      key={icon}
                      $selected={form.icon === icon}
                      onClick={() => setForm((f) => ({ ...f, icon }))}
                    >
                      {icon}
                    </IconBtn>
                  ))}
                </IconGrid>
                <ColorGrid>
                  {PRESET_COLORS.map((color) => (
                    <ColorDot
                      key={color}
                      $color={color}
                      $selected={form.color === color}
                      onClick={() => setForm((f) => ({ ...f, color }))}
                    />
                  ))}
                </ColorGrid>
              </IconColorRow>
            </FormGroup>
          </FormGrid>

          {form.name && (
            <Preview>
              <FolderPreviewDot $color={form.color}>{form.icon}</FolderPreviewDot>
              <PreviewPath>
                {form.parentPath ? `${form.parentPath}/` : ""}{form.name}
              </PreviewPath>
            </Preview>
          )}

          <FormActions>
            <CancelBtn onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
              Annulla
            </CancelBtn>
            <SaveBtn onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? "Salvataggio..." : editingId ? "Salva modifiche" : "Crea cartella"}
            </SaveBtn>
          </FormActions>
        </FormCard>
      )}

      {/* SEARCH */}
      <SearchRow>
        <SearchInput
          placeholder="🔍 Cerca cartelle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <CountLabel>{filtered.length} cartelle</CountLabel>
      </SearchRow>

      {/* FOLDER TREE */}
      {foldersStatus === "loading" ? (
        <EmptyState><EmptyIcon>⏳</EmptyIcon><EmptyText>Caricamento...</EmptyText></EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🗂️</EmptyIcon>
          <EmptyText>
            {search ? `Nessuna cartella trovata per "${search}"` : "Nessuna cartella. Creane una o usa un profilo!"}
          </EmptyText>
        </EmptyState>
      ) : (
        <FolderTree>
          {rootFolders.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              children_={childrenOf(folder.fullPath)}
              allFolders={filtered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              expanded={expandedId}
              onToggle={setExpandedId}
            />
          ))}
        </FolderTree>
      )}
    </PageContainer>
  );
}

// ============================================================
// FOLDER TREE ITEM
// ============================================================

function FolderTreeItem({
  folder,
  children_,
  allFolders,
  onEdit,
  onDelete,
  expanded,
  onToggle,
}: {
  folder: FolderType;
  children_: FolderType[];
  allFolders: FolderType[];
  onEdit: (f: FolderType) => void;
  onDelete: (f: FolderType) => void;
  expanded: number | null;
  onToggle: (id: number | null) => void;
}) {
  const isExpanded = expanded === folder.id;
  const hasChildren = children_.length > 0;

  return (
    <TreeItem>
      <TreeRow $depth={folder.depth}>
        <TreeLeft onClick={() => onToggle(isExpanded ? null : folder.id)}>
          <FolderIcon $color={folder.color}>{folder.icon}</FolderIcon>
          <TreeInfo>
            <TreeName>{folder.fullPath}</TreeName>
            {folder.description && (
              <TreeDesc>{folder.description.slice(0, 100)}{folder.description.length > 100 ? "…" : ""}</TreeDesc>
            )}
          </TreeInfo>
          {hasChildren && (
            <Chevron $open={isExpanded}>{isExpanded ? "▾" : "▸"}</Chevron>
          )}
          {folder.system && <SystemBadge>sistema</SystemBadge>}
        </TreeLeft>
        <TreeActions>
          {!folder.system && (
            <>
              <ActionBtn onClick={() => onEdit(folder)}>✏️</ActionBtn>
              <ActionBtn $danger onClick={() => onDelete(folder)}>🗑️</ActionBtn>
            </>
          )}
        </TreeActions>
      </TreeRow>

      {isExpanded && folder.description && (
        <ExpandedDetail $depth={folder.depth}>
          <DetailSection>
            <DetailLabel>📝 Descrizione semantica (usata dall&apos;AI):</DetailLabel>
            <DetailText>{folder.description}</DetailText>
          </DetailSection>
          {folder.semanticRules && (
            <DetailSection>
              <DetailLabel>🔧 Regole semantiche:</DetailLabel>
              <DetailText>{folder.semanticRules}</DetailText>
            </DetailSection>
          )}
          {folder.autoTags && folder.autoTags.length > 0 && (
            <DetailSection>
              <DetailLabel>🏷️ Tag automatici:</DetailLabel>
              <TagsRow>
                {folder.autoTags.map((t) => <Tag key={t}>{t}</Tag>)}
              </TagsRow>
            </DetailSection>
          )}
        </ExpandedDetail>
      )}

      {hasChildren && isExpanded && (
        <ChildrenContainer>
          {children_.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              children_={allFolders.filter((f) => f.parentPath === child.fullPath)}
              allFolders={allFolders}
              onEdit={onEdit}
              onDelete={onDelete}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </ChildrenContainer>
      )}
    </TreeItem>
  );
}

// ============================================================
// STYLES
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

const SecondaryBtn = styled.button`
  padding: 10px 16px;
  border: 1px solid #d0ddd9;
  background: #fff; color: #444; border-radius: 10px;
  font-size: 0.88rem; cursor: pointer;
  &:hover { background: #f5f5f5; }
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
const SwitchRow = styled.div`display:flex;align-items:center;gap:10px;`;
const SwitchLabel = styled.label`display:flex;align-items:center;gap:10px;font-size:0.86rem;color:#334155;font-weight:600;`;
const SwitchInput = styled.input`width:16px;height:16px;accent-color:#1b6f5c;`;

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

const FolderTree = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const TreeItem = styled.div``;
const TreeRow = styled.div<{ $depth: number }>`
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 10px 14px;
  padding-left: ${({ $depth }) => 14 + $depth * 20}px;
  background: #fff; border: 1px solid #e5ede9; border-radius: 12px;
  cursor: pointer; transition: all 0.15s;
  &:hover{border-color:#1b6f5c; box-shadow:0 2px 8px rgba(27,111,92,0.08);}
`;
const TreeLeft = styled.div`display:flex; align-items:flex-start; gap:10px; flex:1;`;
const FolderIcon = styled.span<{ $color: string }>`font-size:1.3rem; color:${({ $color }) => $color}; flex-shrink:0; margin-top:1px;`;
const TreeInfo = styled.div`flex:1; min-width:0;`;
const TreeName = styled.div`font-weight:700; font-size:0.88rem; color:#1a3a30;`;
const TreeDesc = styled.div`font-size:0.77rem; color:#888; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;
const Chevron = styled.span<{ $open: boolean }>`font-size:0.9rem; color:#aaa; flex-shrink:0; margin-top:2px; transition:transform 0.2s; transform:${({ $open }) => $open ? "rotate(0)" : "rotate(0)"};`;
const SystemBadge = styled.span`font-size:0.66rem; background:#f0f0f0; color:#888; border-radius:999px; padding:1px 7px; border:1px solid #ddd; flex-shrink:0;`;

const TreeActions = styled.div`display:flex; gap:4px; flex-shrink:0; margin-left:8px;`;
const ActionBtn = styled.button<{ $danger?: boolean }>`background:none;border:none;cursor:pointer;font-size:0.85rem;padding:3px 5px;opacity:0.5;border-radius:6px;&:hover{opacity:1;background:${({ $danger }) => $danger ? "#fee" : "#f5f5f5"};}`;

const ExpandedDetail = styled.div<{ $depth: number }>`
  padding: 12px 14px 12px ${({ $depth }) => 14 + $depth * 20 + 38}px;
  background: #f9fdf9; border: 1px solid #d4ece5; border-top: none;
  border-radius: 0 0 12px 12px; margin-top: -4px;
`;
const DetailSection = styled.div`margin-bottom: 8px; &:last-child{margin-bottom:0;}`;
const DetailLabel = styled.div`font-size:0.73rem; font-weight:700; color:#8b5cf6; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:3px;`;
const DetailText = styled.p`font-size:0.82rem; color:#444; margin:0; line-height:1.5;`;
const TagsRow = styled.div`display:flex; flex-wrap:wrap; gap:4px;`;
const Tag = styled.span`background:#f0faf5; color:#1b6f5c; border:1px solid #b8ddd4; border-radius:999px; padding:2px 10px; font-size:0.75rem; font-weight:600;`;

const ChildrenContainer = styled.div`margin-left: 20px; display:flex; flex-direction:column; gap:4px; margin-top:4px;`;

const EmptyState = styled.div`text-align:center; padding:48px 20px; background:#fff; border:1px dashed #d0ddd9; border-radius:14px;`;
const EmptyIcon = styled.div`font-size:2.5rem; margin-bottom:10px;`;
const EmptyText = styled.p`color:#888; font-size:0.92rem;`;

// SEEDING MODAL
const ModalOverlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;`;
const SeedModal = styled.div`background:#fff;border-radius:20px;width:min(100%,580px);padding:32px;box-shadow:0 24px 60px rgba(0,0,0,0.25);animation:${fadeIn} 0.2s ease;`;
const SeedTitle = styled.h2`font-size:1.3rem;font-weight:800;color:#113f36;margin:0 0 8px;`;
const SeedDesc = styled.p`color:#666;font-size:0.9rem;line-height:1.5;margin:0 0 20px;`;
const ProfileGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;`;
const ProfileCard = styled.div<{ $loading: boolean }>`
  padding:14px;border:1.5px solid #e0e8e5;border-radius:14px;cursor:pointer;position:relative;
  transition:all 0.15s; opacity:${({ $loading }) => $loading ? 0.6 : 1};
  &:hover{border-color:#1b6f5c;background:#f5fdf9;}
`;
const ProfileLabel = styled.div`font-weight:700;font-size:0.9rem;color:#1a3a30;margin-bottom:4px;`;
const ProfileDesc = styled.div`font-size:0.76rem;color:#777;line-height:1.4;`;
const ProfileSpinner = styled.div`width:16px;height:16px;border:2px solid #d0ddd9;border-top-color:#1b6f5c;border-radius:50%;animation:${spin} 0.7s linear infinite;position:absolute;top:10px;right:10px;`;
const SeedClose = styled.button`display:block;width:100%;padding:11px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer;color:#666;&:hover{background:#f5f5f5;}`;
