import FeaturePageFrame from "@/lib/components/FeaturePageFrame";

type Props = {
  params: Promise<{ section: string }>;
};

function formatSection(section: string) {
  return section
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function SettingsSectionPage({ params }: Props) {
  const { section } = await params;
  const label = formatSection(section);

  return (
    <FeaturePageFrame
      eyebrow="Settings"
      title={label}
      description={`La sezione ${label} e' in work in progress. La struttura e i collegamenti sono pronti, ma i controlli specifici verranno aggiunti nel prossimo passaggio.`}
      actions={[
        { label: "Torna alle Settings", href: "/settings", variant: "primary" },
        { label: "Vai alla Dashboard", href: "/dashboard" },
      ]}
    />
  );
}