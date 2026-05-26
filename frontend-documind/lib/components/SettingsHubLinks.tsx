"use client";

import Link from "next/link";
import styled from "styled-components";

const items = [
  { title: "Profilo utente", description: "Dati, foto e identità", href: "/settings/profile" },
  { title: "Sicurezza", description: "Password e accessi", href: "/settings/security" },
  { title: "Notifiche", description: "Email e avvisi", href: "/settings/notifications" },
  { title: "Workspace", description: "Preferenze dell'area di lavoro", href: "/settings/workspace" },
  { title: "AI Preferences", description: "Comportamento e automazioni", href: "/settings/ai" },
];

export default function SettingsHubLinks() {
  return (
    <Grid>
      {items.map((item) => (
        <Card key={item.title} href={item.href}>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
          <CardAction>Apri</CardAction>
        </Card>
      ))}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #d8e3ec;
  text-decoration: none;
  color: inherit;
`;

const CardTitle = styled.div`
  font-size: 0.96rem;
  font-weight: 800;
  color: #0f172a;
`;

const CardDescription = styled.div`
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.5;
`;

const CardAction = styled.div`
  margin-top: auto;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
`;