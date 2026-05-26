import FeaturePageFrame from "@/lib/components/FeaturePageFrame";
import SettingsHubLinks from "@/lib/components/SettingsHubLinks";

export default function SettingsPage() {
  return (
    <FeaturePageFrame
      eyebrow="User Settings"
      title="Settings"
      description="Qui raccogliamo le impostazioni utente e le aree collegate al tuo profilo. Le sezioni sotto sono pronte come struttura e portano alle schermate in work in progress."
      actions={[
        { label: "Vai alla Dashboard", href: "/dashboard", variant: "primary" },
        { label: "Apri Smart Tags", href: "/tags" },
      ]}
    >
      <SettingsHubLinks />
    </FeaturePageFrame>
  );
}