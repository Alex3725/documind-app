"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { css } from "styled-components";
import { clearAuthError, loginUser } from "@/lib/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

type IdentifierType = "email" | "telephone";

type BackendStatus = {
  online: boolean;
  connected: boolean;
  backendUrl: string;
  statusCode: number | null;
  responseTimeMs: number;
  message: string;
};

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, status, error } = useAppSelector((state) => state.auth);

  const [identifierType, setIdentifierType] = useState<IdentifierType>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  const isLoading = status === "loading";
  const canSubmit = identifier.trim().length > 0 && password.trim().length > 0 && !isLoading;

  const submitLabel = useMemo(() => {
    if (isLoading) return "Accesso in corso...";
    if (user) return "Rifai login";
    return "Accedi";
  }, [isLoading, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(clearAuthError());

    const payload =
      identifierType === "email"
        ? { email: identifier.trim(), password }
        : { telephone: identifier.trim(), password };

    const result = await dispatch(loginUser(payload));
    if (loginUser.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  const handleCheckBackend = async () => {
    setIsCheckingBackend(true);
    try {
      const response = await fetch("/api/backend/status", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as BackendStatus;
      setBackendStatus(data);
    } catch {
      setBackendStatus({
        online: false, connected: false,
        backendUrl: "http://localhost:8080",
        statusCode: null, responseTimeMs: 0,
        message: "Errore durante la verifica del backend.",
      });
    } finally {
      setIsCheckingBackend(false);
    }
  };

  return (
    <Page>
      <Glow />
      <Card>
        <Eyebrow>DocuMind</Eyebrow>
        <Title>Accedi al tuo archivio</Title>
        <Description>
          Sistema di classificazione intelligente documenti con AI locale.
        </Description>

        <HealthRow>
          <HealthButton type="button" onClick={handleCheckBackend} disabled={isCheckingBackend}>
            {isCheckingBackend ? "Verifica..." : "Verifica backend"}
          </HealthButton>
          <HealthState $online={backendStatus?.online ?? false}>
            {backendStatus ? (backendStatus.online ? "Online ✓" : "Offline ✗") : "Non verificato"}
          </HealthState>
        </HealthRow>

        {backendStatus && (
          <HealthInfo $online={backendStatus.online}>
            <p>{backendStatus.message}</p>
            <small>
              URL: {backendStatus.backendUrl} · HTTP {backendStatus.statusCode ?? "—"} · {backendStatus.responseTimeMs}ms
            </small>
          </HealthInfo>
        )}

        <ToggleRow>
          <ToggleButton type="button" $active={identifierType === "email"} onClick={() => setIdentifierType("email")}>
            Email
          </ToggleButton>
          <ToggleButton type="button" $active={identifierType === "telephone"} onClick={() => setIdentifierType("telephone")}>
            Telefono
          </ToggleButton>
        </ToggleRow>

        <Form onSubmit={handleSubmit}>
          <Label htmlFor="identifier">
            {identifierType === "email" ? "Email" : "Numero di telefono"}
          </Label>
          <Input
            id="identifier" name="identifier"
            type={identifierType === "email" ? "email" : "text"}
            autoComplete={identifierType === "email" ? "email" : "tel"}
            placeholder={identifierType === "email" ? "nome@dominio.it" : "+39 333 1234567"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <Label htmlFor="password">Password</Label>
          <Input
            id="password" name="password"
            type="password" autoComplete="current-password"
            placeholder="Inserisci password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <SubmitButton type="submit" disabled={!canSubmit}>
            {submitLabel}
          </SubmitButton>
        </Form>

        {error && <ErrorBox role="alert">{error}</ErrorBox>}

        {user && (
          <SuccessBox>
            <p>✅ Login riuscito! Reindirizzamento...</p>
            <GoBtn onClick={() => router.push("/dashboard")}>
              Vai alla Dashboard →
            </GoBtn>
          </SuccessBox>
        )}

        <DemoNote>
          <strong>Demo:</strong> email <code>test@documind.local</code> · password <code>test123</code>
        </DemoNote>
      </Card>
    </Page>
  );
}

// ===== STYLES (identici all'originale + nuovi) =====

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(125deg, #f3f4ee 0%, #f1f8ff 43%, #e5f7f0 100%);
  padding: 24px;
  position: relative;
  overflow: hidden;
`;

const Glow = styled.div`
  position: absolute;
  width: 520px; height: 520px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(19,82,67,0.18) 0%, rgba(19,82,67,0) 72%);
  top: -130px; right: -140px;
`;

const Card = styled.section`
  width: min(100%, 480px);
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(13,53,43,0.1);
  border-radius: 20px;
  box-shadow: 0 20px 70px rgba(7,43,44,0.14);
  padding: 28px;
  backdrop-filter: blur(3px);
  z-index: 1;
`;

const Eyebrow = styled.p`
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  color: #4d7f72;
  font-weight: 700;
`;

const Title = styled.h1`
  margin: 12px 0 10px;
  font-size: clamp(1.5rem, 5vw, 1.9rem);
  line-height: 1.2;
  color: #113f36;
`;

const Description = styled.p`
  margin: 0;
  color: #2a5a50;
  line-height: 1.55;
  font-size: 0.92rem;
`;

const HealthRow = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const HealthButton = styled.button`
  border: 1px solid #b5cec5;
  background: #fff;
  color: #1d5a4d;
  border-radius: 10px;
  font-weight: 700;
  padding: 8px 12px;
  font-size: 0.82rem;
  cursor: pointer;

  &:disabled { opacity: 0.65; cursor: not-allowed; }
`;

const HealthState = styled.span<{ $online: boolean }>`
  font-size: 0.8rem;
  font-weight: 800;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid ${({ $online }) => ($online ? "#8ac4a8" : "#efb7bc")};
  color: ${({ $online }) => ($online ? "#0e5b3b" : "#9d1b25")};
  background: ${({ $online }) => ($online ? "#e8f9f0" : "#ffecee")};
`;

const HealthInfo = styled.div<{ $online: boolean }>`
  margin-top: 8px;
  border-radius: 10px;
  padding: 9px 12px;
  border: 1px solid ${({ $online }) => ($online ? "#b8ddcc" : "#f0c2c6")};
  background: ${({ $online }) => ($online ? "#f0faf5" : "#fff2f4")};
  color: ${({ $online }) => ($online ? "#1f5d4f" : "#98222a")};
  font-size: 0.82rem;

  p { margin: 0 0 3px; font-weight: 600; }
  small { opacity: 0.85; }
`;

const ToggleRow = styled.div`
  margin-top: 18px;
  margin-bottom: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  border: 1px solid #bfd6ce;
  border-radius: 11px;
  padding: 10px 12px;
  font-weight: 700;
  font-size: 0.88rem;
  color: #1a574a;
  background: #edf7f4;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $active }) =>
    $active &&
    css`
      border-color: #1e6f5f;
      background: #1e6f5f;
      color: #fff;
      box-shadow: 0 8px 20px rgba(30,111,95,0.22);
    `}
`;

const Form = styled.form`
  margin-top: 8px;
  display: grid;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 0.86rem;
  color: #286052;
  font-weight: 700;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #bfd6ce;
  border-radius: 11px;
  padding: 11px 13px;
  font-size: 0.94rem;
  outline: none;
  color: #123d33;

  &:focus { border-color: #1e6f5f; box-shadow: 0 0 0 3px rgba(30,111,95,0.15); }
`;

const SubmitButton = styled.button`
  margin-top: 8px;
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.98rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  cursor: pointer;
  transition: transform 0.16s, box-shadow 0.16s, opacity 0.16s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(29,88,90,0.24);
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ErrorBox = styled.p`
  margin: 14px 0 0;
  background: #ffe9ea;
  border: 1px solid #f3bdc1;
  color: #a31a24;
  border-radius: 11px;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 0.88rem;
`;

const SuccessBox = styled.div`
  margin-top: 14px;
  background: #f0faf5;
  border: 1px solid #bde0d4;
  border-radius: 12px;
  padding: 14px;

  p { margin: 0 0 10px; color: #1a584b; font-weight: 600; font-size: 0.9rem; }
`;

const GoBtn = styled.button`
  width: 100%;
  padding: 10px;
  background: #1b6f5c;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover { background: #155c4b; }
`;

const DemoNote = styled.div`
  margin-top: 16px;
  padding: 10px 14px;
  background: #fffbf0;
  border: 1px solid #f5d87a;
  border-radius: 10px;
  font-size: 0.78rem;
  color: #7a5f10;

  code {
    background: #f0e4a0;
    padding: 1px 5px;
    border-radius: 4px;
    font-family: monospace;
  }
`;
