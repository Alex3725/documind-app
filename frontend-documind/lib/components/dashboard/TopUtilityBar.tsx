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
        <BrandMark>
          <BrandIcon>DM</BrandIcon>
          <BrandText>
            <BrandName>DocuMind</BrandName>
            <BrandSubtitle>workspace</BrandSubtitle>
          </BrandText>
        </BrandMark>
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
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #dbe4e0;
  border-radius: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
`;

const Left = styled.div`display:flex;align-items:center;gap:12px;`;

const BrandMark = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BrandIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #eef2ff, #c7d2fe);
  color: #1f2937;
  font-weight: 900;
  font-size: 0.72rem;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BrandName = styled.div`font-weight:800;color:#0f172a;font-size:0.98rem;`;
const BrandSubtitle = styled.div`color:#64748b;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.08em;`;

const Right = styled.div`display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;`;

const UserChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #dbe4e0;
  background: #fff;
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
  background: #0f172a;
`;

const UserName = styled.div`font-size:0.82rem;color:#0f172a;font-weight:700;`;

const ActionBtn = styled.button`
  border: 1px solid #dbe4e0;
  background: #ffffff;
  color: #334155;
  padding: 7px 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
`;

const LogoutBtn = styled(ActionBtn)`
  border-color: #fecaca;
  background: #fff5f5;
  color: #991b1b;
`;
