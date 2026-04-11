"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { css } from "styled-components";
import { clearAuthError, loginUser } from "@/lib/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

type IdentifierType = "email" | "telephone";

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, status, error } = useAppSelector((state) => state.auth);

  const [identifierType, setIdentifierType] = useState<IdentifierType>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const isLoading = status === "loading";
  const canSubmit = identifier.trim().length > 0 && password.trim().length > 0 && !isLoading;

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

  return (
    <Page>
      <Glow />
      <Card>
        <Eyebrow>DocuMind</Eyebrow>
        <Title>Accedi al tuo archivio</Title>
        <Description>
          Classificazione intelligente documenti con AI locale.
        </Description>

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
            id="identifier"
            type={identifierType === "email" ? "email" : "text"}
            autoComplete={identifierType === "email" ? "email" : "tel"}
            placeholder={identifierType === "email" ? "nome@dominio.it" : "+39 333 1234567"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Inserisci password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <SubmitButton type="submit" disabled={!canSubmit}>
            {isLoading ? "Accesso in corso..." : "Accedi"}
          </SubmitButton>
        </Form>

        {error && <ErrorBox role="alert">{error}</ErrorBox>}

        {user && (
          <SuccessBox>
            <p>✅ Login riuscito! Reindirizzamento...</p>
            <GoBtn onClick={() => router.push("/dashboard")}>Vai alla Dashboard →</GoBtn>
          </SuccessBox>
        )}

        <Divider />

        <SignupRow>
          Non hai un account?{" "}
          <SignupLink onClick={() => router.push("/signup")}>
            Registrati gratuitamente →
          </SignupLink>
        </SignupRow>

        <DemoNote>
          <strong>Demo:</strong> email <code>test@documind.local</code> · password <code>test123</code>
        </DemoNote>
      </Card>
    </Page>
  );
}

// ===== STYLES =====

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
  width: min(100%, 460px);
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
  margin: 12px 0 8px;
  font-size: 1.8rem;
  color: #113f36;
`;

const Description = styled.p`
  margin: 0 0 20px;
  color: #2a5a50;
  font-size: 0.9rem;
`;

const ToggleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
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
  margin-top: 6px;
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
  margin: 12px 0 0;
  background: #ffe9ea;
  border: 1px solid #f3bdc1;
  color: #a31a24;
  border-radius: 11px;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 0.88rem;
`;

const SuccessBox = styled.div`
  margin-top: 12px;
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
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 20px 0;
`;

const SignupRow = styled.p`
  text-align: center;
  font-size: 0.88rem;
  color: #555;
  margin: 0 0 14px;
`;

const SignupLink = styled.button`
  background: none; border: none;
  color: #1b6f5c; font-weight: 700;
  cursor: pointer; font-size: 0.88rem;

  &:hover { text-decoration: underline; }
`;

const DemoNote = styled.div`
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
