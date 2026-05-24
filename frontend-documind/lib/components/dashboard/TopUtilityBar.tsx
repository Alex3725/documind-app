"use client";

import styled from "styled-components";

type Props = {
  userName?: string;
  onLogout: () => void;
  onOpenTutorial: () => void;
};

export default function TopUtilityBar({ userName, onLogout, onOpenTutorial }: Props) {
  return (
    <Bar>
      <Left>
        <Title>DocuMind Dashboard</Title>
        <Subtitle>Funzioni account e sessione</Subtitle>
      </Left>

      <Right>
        <UserChip>
          <Avatar>{(userName?.[0] ?? "U").toUpperCase()}</Avatar>
          <UserName>{userName ?? "Utente"}</UserName>
        </UserChip>
        <ActionBtn type="button" onClick={onOpenTutorial}>Guida</ActionBtn>
        <LogoutBtn type="button" onClick={onLogout}>Logout</LogoutBtn>
      </Right>
    </Bar>
  );
}

const Bar = styled.div`
  background: #facc15;
  border: 1px solid #eab308;
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
`;

const Left = styled.div`display:flex;flex-direction:column;gap:2px;`;
const Title = styled.div`font-weight:800;color:#453200;font-size:1rem;`;
const Subtitle = styled.div`color:#5d4700;font-size:0.82rem;`;

const Right = styled.div`display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;`;

const UserChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #fef08a;
  background: #fef9c3;
`;

const Avatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.76rem;
  font-weight: 800;
  color: #fff;
  background: #1f2937;
`;

const UserName = styled.div`font-size:0.82rem;color:#453200;font-weight:700;`;

const ActionBtn = styled.button`
  border: 1px solid #fde047;
  background: #fff7ae;
  color: #594500;
  padding: 7px 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
`;

const LogoutBtn = styled(ActionBtn)`
  border-color: #fca5a5;
  background: #fee2e2;
  color: #991b1b;
`;
