import FeaturePageFrame from "@/lib/components/FeaturePageFrame";

type Props = {
  params: Promise<{ feature: string }>;
};

function formatFeature(feature: string) {
  return feature
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function WorkingProgressPage({ params }: Props) {
  const { feature } = await params;
  const label = formatFeature(feature);

  return (
    <FeaturePageFrame
      eyebrow="Work in progress"
      title={label}
      description={`La sezione ${label} non e' ancora pronta. Qui inseriremo la struttura definitiva, i contenuti e le azioni operative quando il modulo sara' completato.`}
      actions={[
        { label: "Torna alla Dashboard", href: "/dashboard", variant: "primary" },
        { label: "Apri Settings", href: "/settings" },
      ]}
    />
  );
}