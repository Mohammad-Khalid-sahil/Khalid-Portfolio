import { FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import Seo from "@/components/seo/Seo";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("pages.notFound.title")} description={t("pages.notFound.description")} noIndex />
      <section className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="font-mono text-7xl font-semibold text-[var(--color-primary)]">{t("pages.notFound.heading")}</p>
        <h1 className="mt-4 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-text-primary)]">
          {t("pages.notFound.title")}
        </h1>
        <p className="mt-2 max-w-sm text-[var(--color-text-muted)]">{t("pages.notFound.message")}</p>
        <Button href="/" className="mt-8">
          <FiArrowLeft className="rtl-flip" /> {t("pages.notFound.button")}
        </Button>
      </section>
    </>
  );
}
