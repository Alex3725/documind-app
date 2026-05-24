"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { css, keyframes } from "styled-components";
import {
  DEFAULT_ONBOARDING_SELECTION,
  ONBOARDING_FOLDER_OPTIONS,
  buildOnboardingFolderPayload,
} from "@/lib/onboardingFolders";

type Step = "form" | "folders";

type FormState = {
  name: string;
  surname: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ============================================================
// VALIDAZIONE
// ============================================================

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = "Il nome è obbligatorio.";
  if (!form.surname.trim()) errors.surname = "Il cognome è obbligatorio.";

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email.trim()) {
    errors.email = "L'email è obbligatoria.";
  } else if (!emailRe.test(form.email)) {
    errors.email = "Inserisci un'email valida.";
  }

  const telRe = /^\+?[0-9]{8,15}$/;
  if (form.telephone && !telRe.test(form.telephone.replace(/\s/g, ""))) {
    errors.telephone = "Numero di telefono non valido (es. +39 333 1234567).";
  }

  if (!form.password) {
    errors.password = "La password è obbligatoria.";
  } else if (form.password.length < 8) {
    errors.password = "La password deve avere almeno 8 caratteri.";
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = "Deve contenere almeno una lettera maiuscola.";
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = "Deve contenere almeno un numero.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Conferma la password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Le password non corrispondono.";
  }

  return errors;
}

function passwordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "#e0e0e0" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Molto debole", color: "#ef4444" };
  if (score === 2) return { score, label: "Debole", color: "#f97316" };
  if (score === 3) return { score, label: "Discreta", color: "#eab308" };
  if (score === 4) return { score, label: "Buona", color: "#22c55e" };
  return { score, label: "Ottima", color: "#16a34a" };
}

// ============================================================
// COMPONENT
// ============================================================

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>({
    name: "",
    surname: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<string[]>(DEFAULT_ONBOARDING_SELECTION);

  const pwdStrength = passwordStrength(form.password);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          surname: form.surname.trim(),
          email: form.email.trim().toLowerCase(),
          telephone: form.telephone.trim() || undefined,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          setServerError("Email o numero di telefono già in uso. Prova ad accedere.");
        } else {
          setServerError(data?.message || "Registrazione fallita. Riprova.");
        }
        return;
      }

      setStep("folders");
    } catch {
      setServerError("Impossibile contattare il server. Verifica la connessione.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setSelectedFolders((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId]
    );
  };

  const finalizeArchive = async () => {
    setIsFinalizing(true);
    setServerError("");

    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Accesso automatico fallito dopo la registrazione.");
      }

      const folderPayloads = selectedFolders
        .map((folderId) => buildOnboardingFolderPayload(folderId))
        .filter((payload): payload is NonNullable<typeof payload> => Boolean(payload));

      for (const payload of folderPayloads) {
        const createResponse = await fetch("/api/folders", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!createResponse.ok) {
          throw new Error("Non è stato possibile creare le cartelle iniziali.");
        }
      }

      localStorage.setItem("documind:privacy", "1");
      localStorage.setItem("documind:onboarding", "1");
      localStorage.setItem(
        "documind:folders",
        JSON.stringify(
          selectedFolders
            .map((folderId) => buildOnboardingFolderPayload(folderId)?.fullPath)
            .filter((folderPath): folderPath is string => Boolean(folderPath))
        )
      );

      router.push("/dashboard");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Impossibile completare la configurazione iniziale.");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (step === "folders") {
    return (
      <Page>
        <Glow />
        <ExplorerCard>
          <ExplorerHeader>
            <ExplorerBadge>DocuMind</ExplorerBadge>
            <ExplorerTitle>Configura l&apos;archivio iniziale</ExplorerTitle>
            <ExplorerText>
              Scegli le cartelle da vedere subito nell&apos;explorer. Le creeremo davvero nel tuo account.
            </ExplorerText>
          </ExplorerHeader>

          <ExplorerLayout>
            <ExplorerPanel>
              <PanelLabel>Cartelle disponibili</PanelLabel>
              <FolderList>
                {ONBOARDING_FOLDER_OPTIONS.map((folder) => {
                  const selected = selectedFolders.includes(folder.id);

                  return (
                    <FolderRow
                      key={folder.id}
                      type="button"
                      $selected={selected}
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <FolderRowIcon $color={folder.color}>{folder.icon}</FolderRowIcon>
                      <FolderRowBody>
                        <FolderRowTitle>{folder.label}</FolderRowTitle>
                        <FolderRowDesc>{folder.description}</FolderRowDesc>
                      </FolderRowBody>
                      <FolderRowCheck $selected={selected}>{selected ? "✓" : "+"}</FolderRowCheck>
                    </FolderRow>
                  );
                })}
              </FolderList>
            </ExplorerPanel>

            <PreviewPanel>
              <PanelLabel>Anteprima explorer</PanelLabel>
              <PreviewTree>
                {selectedFolders.map((folderId) => {
                  const folder = ONBOARDING_FOLDER_OPTIONS.find((option) => option.id === folderId);
                  if (!folder) return null;

                  return (
                    <PreviewRow key={folder.id}>
                      <PreviewFolderIcon $color={folder.color}>{folder.icon}</PreviewFolderIcon>
                      <PreviewBody>
                        <PreviewName>{folder.fullPath}</PreviewName>
                        <PreviewMeta>{folder.description}</PreviewMeta>
                      </PreviewBody>
                    </PreviewRow>
                  );
                })}
                <PreviewHint>
                  Verranno aggiunte anche le cartelle di sistema <strong>Non classificati</strong> e <strong>Tutti i file</strong>.
                </PreviewHint>
              </PreviewTree>
            </PreviewPanel>
          </ExplorerLayout>

          <ExplorerActions>
            <SecondaryButton type="button" onClick={() => router.push("/")}>Fallo dopo</SecondaryButton>
            <PrimaryButton type="button" onClick={finalizeArchive} disabled={isFinalizing || selectedFolders.length === 0}>
              {isFinalizing ? "Creo l'archivio..." : "Crea archivio →"}
            </PrimaryButton>
          </ExplorerActions>
        </ExplorerCard>
      </Page>
    );
  }

  return (
    <Page>
      <Glow />
      <Card>
        <BackLink onClick={() => router.push("/")}>← Accedi</BackLink>
        <Eyebrow>DocuMind</Eyebrow>
        <Title>Crea il tuo account</Title>
        <Subtitle>Archivio intelligente per i tuoi documenti.</Subtitle>

        <Form onSubmit={handleSubmit} noValidate>
          <Row>
            <Field>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Mario"
                value={form.name}
                onChange={handleChange("name")}
                $hasError={!!errors.name}
                autoComplete="given-name"
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <Label htmlFor="surname">Cognome *</Label>
              <Input
                id="surname"
                type="text"
                placeholder="Rossi"
                value={form.surname}
                onChange={handleChange("surname")}
                $hasError={!!errors.surname}
                autoComplete="family-name"
              />
              {errors.surname && <FieldError>{errors.surname}</FieldError>}
            </Field>
          </Row>

          <Field>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="mario@esempio.it"
              value={form.email}
              onChange={handleChange("email")}
              $hasError={!!errors.email}
              autoComplete="email"
            />
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>

          <Field>
            <Label htmlFor="telephone">
              Telefono <Optional>(opzionale)</Optional>
            </Label>
            <Input
              id="telephone"
              type="tel"
              placeholder="+39 333 1234567"
              value={form.telephone}
              onChange={handleChange("telephone")}
              $hasError={!!errors.telephone}
              autoComplete="tel"
            />
            {errors.telephone && <FieldError>{errors.telephone}</FieldError>}
          </Field>

          <Field>
            <Label htmlFor="password">Password *</Label>
            <PasswordWrap>
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="Almeno 8 caratteri"
                value={form.password}
                onChange={handleChange("password")}
                $hasError={!!errors.password}
                autoComplete="new-password"
                style={{ paddingRight: "44px" }}
              />
              <ShowPassBtn
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Nascondi password" : "Mostra password"}
              >
                {showPass ? "🙈" : "👁️"}
              </ShowPassBtn>
            </PasswordWrap>
            {form.password && (
              <PasswordStrengthBar>
                {[1, 2, 3, 4, 5].map((i) => (
                  <StrengthSegment
                    key={i}
                    $active={i <= pwdStrength.score}
                    $color={pwdStrength.color}
                  />
                ))}
                <StrengthLabel $color={pwdStrength.color}>{pwdStrength.label}</StrengthLabel>
              </PasswordStrengthBar>
            )}
            {errors.password && <FieldError>{errors.password}</FieldError>}
          </Field>

          <Field>
            <Label htmlFor="confirmPassword">Conferma password *</Label>
            <Input
              id="confirmPassword"
              type={showPass ? "text" : "password"}
              placeholder="Ripeti la password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              $hasError={!!errors.confirmPassword}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <FieldError>{errors.confirmPassword}</FieldError>}
          </Field>

          {serverError && (
            <ServerError role="alert">
              <span>⚠️</span>
              <span>{serverError}</span>
            </ServerError>
          )}

          <SubmitBtn type="submit" disabled={isLoading}>
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Spinner /> Creazione account...
              </span>
            ) : (
              "Crea account"
            )}
          </SubmitBtn>
        </Form>

        <LoginLink>
          Hai già un account?{" "}
          <LoginAnchor onClick={() => router.push("/")}>Accedi</LoginAnchor>
        </LoginLink>
      </Card>
    </Page>
  );
}

// ============================================================
// STYLES
// ============================================================

const fadeIn = keyframes`from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(130deg, #f0f4f2 0%, #e8f0fe 50%, #e5f7f0 100%);
  padding: 24px;
  position: relative;
  overflow: hidden;
`;

const Glow = styled.div`
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(27,111,92,0.12) 0%, transparent 70%);
  top: -200px; right: -200px;
  pointer-events: none;
`;

const Card = styled.section`
  width: min(100%, 520px);
  background: rgba(255,255,255,0.95);
  border: 1px solid rgba(13,53,43,0.1);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(7,43,44,0.12);
  padding: 32px;
  animation: ${fadeIn} 0.3s ease;
  z-index: 1;
`;

const BackLink = styled.button`
  background: none; border: none;
  color: #4d7f72; font-size: 0.85rem;
  cursor: pointer; padding: 0;
  margin-bottom: 16px;
  display: block;

  &:hover { color: #1b6f5c; }
`;

const Eyebrow = styled.p`
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  color: #4d7f72;
  font-weight: 700;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: #113f36;
  margin: 10px 0 6px;
`;

const Subtitle = styled.p`
  color: #555;
  font-size: 0.9rem;
  margin: 0 0 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 460px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 0.84rem;
  color: #286052;
  font-weight: 700;
`;

const Optional = styled.span`
  font-weight: 400;
  color: #aaa;
  font-size: 0.78rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  border: 1.5px solid ${({ $hasError }) => ($hasError ? "#ef4444" : "#bfd6ce")};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.92rem;
  outline: none;
  color: #123d33;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;

  &:focus {
    border-color: ${({ $hasError }) => ($hasError ? "#ef4444" : "#1e6f5f")};
    box-shadow: 0 0 0 3px ${({ $hasError }) => ($hasError ? "rgba(239,68,68,0.15)" : "rgba(30,111,95,0.15)")};
  }
`;

const PasswordWrap = styled.div`position: relative;`;

const ShowPassBtn = styled.button`
  position: absolute;
  right: 10px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer; font-size: 1rem;
  padding: 2px;
  opacity: 0.6;
  &:hover { opacity: 1; }
`;

const PasswordStrengthBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
`;

const StrengthSegment = styled.div<{ $active: boolean; $color: string }>`
  flex: 1;
  height: 4px;
  border-radius: 99px;
  background: ${({ $active, $color }) => ($active ? $color : "#e0e0e0")};
  transition: background 0.2s;
`;

const StrengthLabel = styled.span<{ $color: string }>`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
  margin-left: 6px;
  white-space: nowrap;
`;

const FieldError = styled.span`
  font-size: 0.76rem;
  color: #ef4444;
  font-weight: 600;
`;

const ServerError = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.88rem;
  font-weight: 600;
`;

const SubmitBtn = styled.button`
  margin-top: 4px;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(29,88,90,0.24);
  }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const Spinner = styled.div`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const LoginLink = styled.p`
  margin: 18px 0 0;
  text-align: center;
  font-size: 0.86rem;
  color: #666;
`;

const ExplorerCard = styled.section`
  width: min(100%, 980px);
  background: rgba(255,255,255,0.95);
  border: 1px solid rgba(13,53,43,0.1);
  border-radius: 22px;
  box-shadow: 0 20px 60px rgba(7,43,44,0.12);
  padding: 32px;
  animation: ${fadeIn} 0.3s ease;
  z-index: 1;
`;

const ExplorerHeader = styled.div`
  margin-bottom: 22px;
`;

const ExplorerBadge = styled.p`
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  color: #4d7f72;
  font-weight: 700;
`;

const ExplorerTitle = styled.h1`
  font-size: 1.75rem;
  color: #113f36;
  margin: 10px 0 6px;
`;

const ExplorerText = styled.p`
  color: #555;
  font-size: 0.9rem;
  margin: 0;
`;

const ExplorerLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 16px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const ExplorerPanel = styled.div`
  border: 1px solid #dbe7e2;
  background: #f8fbfa;
  border-radius: 18px;
  padding: 16px;
`;

const PreviewPanel = styled.div`
  border: 1px solid #dbe7e2;
  background: linear-gradient(180deg, #fdfefe 0%, #f5fbf8 100%);
  border-radius: 18px;
  padding: 16px;
`;

const PanelLabel = styled.div`
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #4d7f72;
  font-weight: 700;
  margin-bottom: 12px;
`;

const FolderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FolderRow = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid ${({ $selected }) => ($selected ? "#1b6f5c" : "#d7e1dd")};
  background: ${({ $selected }) => ($selected ? "#eef9f4" : "#fff")};
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: #1b6f5c;
    background: #f7fcf9;
  }
`;

const FolderRowIcon = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const FolderRowBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const FolderRowTitle = styled.div`
  font-weight: 800;
  color: #113f36;
  font-size: 0.92rem;
`;

const FolderRowDesc = styled.div`
  color: #5f716c;
  font-size: 0.78rem;
  margin-top: 2px;
  line-height: 1.35;
`;

const FolderRowCheck = styled.div<{ $selected: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.78rem;
  background: ${({ $selected }) => ($selected ? "#1b6f5c" : "#edf1ef")};
  color: ${({ $selected }) => ($selected ? "#fff" : "#6b7280")};
  flex-shrink: 0;
`;

const PreviewTree = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e1ece7;
`;

const PreviewFolderIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: ${({ $color }) => `${$color}14`};
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const PreviewBody = styled.div`
  min-width: 0;
`;

const PreviewName = styled.div`
  font-weight: 800;
  color: #113f36;
  font-size: 0.9rem;
`;

const PreviewMeta = styled.div`
  color: #64756f;
  font-size: 0.78rem;
  margin-top: 2px;
  line-height: 1.35;
`;

const PreviewHint = styled.div`
  margin-top: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fffbf0;
  border: 1px solid #f0d88a;
  color: #7a5f10;
  font-size: 0.82rem;
  line-height: 1.45;
`;

const ExplorerActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
`;

const SecondaryButton = styled.button`
  padding: 11px 20px;
  border: 1px solid #cfd9d5;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  color: #55635f;
  font-size: 0.9rem;

  &:hover { background: #f5f7f6; }
`;

const PrimaryButton = styled.button`
  padding: 11px 24px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const LoginAnchor = styled.button`
  background: none; border: none;
  color: #1b6f5c; font-weight: 700;
  cursor: pointer; font-size: 0.86rem;

  &:hover { text-decoration: underline; }
`;

// Success state
const SuccessCard = styled.div`
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 48px 40px;
  text-align: center;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(7,43,44,0.12);
  animation: ${fadeIn} 0.3s ease;
  z-index: 1;
`;

const SuccessIcon = styled.div`font-size: 3rem; margin-bottom: 16px;`;
const SuccessTitle = styled.h2`font-size: 1.6rem; color: #113f36; margin: 0 0 12px;`;
const SuccessText = styled.p`color: #555; font-size: 0.96rem; line-height: 1.6; margin-bottom: 24px;`;
const SuccessBtn = styled.button`
  padding: 12px 28px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.96rem;
  font-weight: 800;
  cursor: pointer;

  &:hover { opacity: 0.9; }
`;
