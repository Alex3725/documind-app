"use client";

import { useState } from "react";
import styled from "styled-components";

type Props = {
  onAccept: () => void;
};

export default function PrivacyConsentModal({ onAccept }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Overlay>
      <Modal>
        <Header>
          <ShieldIcon>🔒</ShieldIcon>
          <Title>Privacy e utilizzo dei dati</Title>
        </Header>

        <Body>
          <p>
            Prima di continuare, leggi come <strong>DocuMind</strong> tratta i tuoi documenti:
          </p>

          <PolicyList>
            <PolicyItem>
              <span>📁</span>
              <span>
                I file caricati vengono analizzati dall&apos;AI <strong>solo per la classificazione</strong>.
                Il testo estratto non viene conservato permanentemente.
              </span>
            </PolicyItem>
            <PolicyItem>
              <span>🔐</span>
              <span>
                I metadati (nome file, tipo, tag) sono salvati in modo <strong>sicuro e associato al tuo account</strong>.
              </span>
            </PolicyItem>
            <PolicyItem>
              <span>🤖</span>
              <span>
                Il modello AI gira <strong>localmente tramite Ollama</strong>. I tuoi dati non vengono
                inviati a server esterni.
              </span>
            </PolicyItem>
            <PolicyItem>
              <span>🗑️</span>
              <span>
                Puoi eliminare qualsiasi file e i suoi dati in qualsiasi momento dal tuo account.
              </span>
            </PolicyItem>
          </PolicyList>

          <CheckRow>
            <Checkbox
              type="checkbox"
              id="accept-privacy"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <label htmlFor="accept-privacy">
              Ho letto e accetto l&apos;informativa sulla privacy e il trattamento dei dati
            </label>
          </CheckRow>
        </Body>

        <Footer>
          <AcceptButton disabled={!accepted} onClick={onAccept}>
            Continua
          </AcceptButton>
        </Footer>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 20px;
  width: min(100%, 560px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.25);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  padding: 28px 32px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const ShieldIcon = styled.span`font-size: 2rem;`;

const Title = styled.h2`
  color: #fff;
  font-size: 1.4rem;
  margin: 0;
`;

const Body = styled.div`
  padding: 28px 32px;

  > p {
    color: #444;
    margin-bottom: 20px;
    font-size: 0.96rem;
  }
`;

const PolicyList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PolicyItem = styled.li`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;

  span:first-child {
    font-size: 1.1rem;
    flex-shrink: 0;
  }
`;

const CheckRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  background: #f0faf5;
  border-radius: 12px;
  border: 1px solid #c0ddd4;
  font-size: 0.88rem;
  color: #2a5a50;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  margin-top: 1px;
  accent-color: #1b6f5c;
`;

const Footer = styled.div`
  padding: 16px 32px 28px;
`;

const AcceptButton = styled.button`
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
