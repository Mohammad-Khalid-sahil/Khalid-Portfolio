import { useState } from "react";
import { FiSend, FiStar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { createTestimonial } from "@/services/testimonialService";
import { useProjects } from "@/hooks/queries/useProjects";

const fieldClass = "mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]";

export default function TestimonialSubmissionForm() {
  const { t } = useTranslation();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [projectName, setProjectName] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSubmitting(true);
    setStatus("");
    try {
      await createTestimonial({
        name: String(values.get("name") || "").trim(),
        position: String(values.get("position") || "").trim(),
        company: String(values.get("company") || "").trim(),
        topic: "project",
        subject: String(values.get("subject") || "").trim(),
        rating,
        message: String(values.get("message") || "").trim(),
      });
      form.reset();
      setProjectName("");
      setRating(5);
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="submit-testimonial" className="ds-card mx-auto max-w-3xl rounded-2xl p-5 sm:p-8">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-primary)]">{t("pages.testimonials.formEyebrow")}</p>
        <h2 className="mt-2 font-[var(--font-display)] text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">{t("pages.testimonials.formTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{t("pages.testimonials.formDescription")}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("pages.testimonials.name")} <span aria-hidden="true" className="text-[var(--color-danger)]">*</span>
          <input name="name" autoComplete="name" required maxLength={100} className={fieldClass} />
        </label>
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("pages.testimonials.topic")}
          <select name="subject" required value={projectName} onChange={(event) => setProjectName(event.target.value)} aria-busy={projectsLoading} className={fieldClass}>
            <option value="" disabled>{projectsLoading ? t("pages.testimonials.projectsLoading") : t("pages.testimonials.projectPlaceholder")}</option>
            {projects.map((project) => <option key={project._id} value={project.title}>{project.title}</option>)}
          </select>
          {!projectsLoading && projects.length === 0 && <span className="mt-2 block text-xs text-[var(--color-text-muted)]">{t("pages.testimonials.noProjects")}</span>}
        </label>
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("pages.testimonials.position")}
          <input name="position" autoComplete="organization-title" maxLength={100} className={fieldClass} />
        </label>
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("pages.testimonials.company")}
          <input name="company" autoComplete="organization" maxLength={100} className={fieldClass} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-[var(--color-text-secondary)]">{t("pages.testimonials.rating")}</legend>
          <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label={t("pages.testimonials.rating")}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={t("pages.testimonials.ratingValue", { count: value })}
                onClick={() => setRating(value)}
                className="rounded-md p-1.5 text-[var(--color-highlight)] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                <FiStar size={20} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </fieldset>

        <label className="text-sm font-medium text-[var(--color-text-secondary)] sm:col-span-2">
          {t("pages.testimonials.message")} <span aria-hidden="true" className="text-[var(--color-danger)]">*</span>
          <textarea name="message" required minLength={5} maxLength={1000} rows={5} placeholder={t("pages.testimonials.messagePlaceholder")} className={`${fieldClass} resize-y`} />
        </label>

        {status === "success" && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600 sm:col-span-2">{t("pages.testimonials.submitted")}</p>}
        {status === "error" && <p role="alert" className="rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)] sm:col-span-2">{t("pages.testimonials.submitError")}</p>}

        <p className="text-xs leading-5 text-[var(--color-text-muted)] sm:col-span-2">{t("pages.testimonials.moderationNote")}</p>
        <button type="submit" disabled={submitting || projectsLoading || projects.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
          <FiSend size={15} /> {submitting ? t("pages.testimonials.submitting") : t("pages.testimonials.submit")}
        </button>
      </form>
    </div>
  );
}
