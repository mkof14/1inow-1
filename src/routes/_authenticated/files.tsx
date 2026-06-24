import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { VaultMark } from "@/components/icons/compass-icons";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/files")({
  component: FilesPage,
});

function FilesPage() {
  const t = useT();
  return (
    <ComingSoon
      eyebrow={t("page.files.eyebrow")}
      title={t("page.files.title")}
      description={t("page.files.desc")}
      icon={<VaultMark size={140} />}
    />
  );
}
