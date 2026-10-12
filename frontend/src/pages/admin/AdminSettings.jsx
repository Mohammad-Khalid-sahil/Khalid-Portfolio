import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import ImageUploadField from "@/components/admin/ImageUploadField";
import PdfUploadField from "@/components/admin/PdfUploadField";
import LocalizedTextFields from "@/components/admin/LocalizedTextFields";
import { getProfile } from "@/services/profileService";
import { getSettings } from "@/services/settingsService";
import { cleanBrandName } from "@/utils/displayContent";
import { PROFILE_SOCIAL_PLATFORMS, SOCIAL_PLATFORMS } from "@/config/socialLinks";

function useProfileAdmin() {
  return useQuery({ queryKey: ["admin", "profile"], queryFn: async () => {
    const [profile, translationResponse] = await Promise.all([getProfile("en"), api.get("/profile/translations")]);
    return profile ? { ...profile, translations: translationResponse.data?.translations || {} } : null;
  } });
}

function useSettingsAdmin() {
  return useQuery({ queryKey: ["admin", "settings"], queryFn: getSettings });
}

function statsToText(stats = []) {
  return stats.map((s) => `${s.label}|${s.value}|${s.suffix || ""}`).join("\n");
}

function textToStats(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value, suffix] = line.split("|").map((s) => s?.trim());
      return { label: label || "", value: Number(value) || 0, suffix: suffix || "" };
    });
}

function languagesToText(languages = []) {
  return languages.map((l) => `${l.name}|${l.level || ""}`).join("\n");
}

function textToLanguages(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, level] = line.split("|").map((s) => s?.trim());
      return { name: name || "", level: level || "" };
    })
    .filter((l) => l.name);
}

function socialFormValues(profile) {
  return Object.fromEntries(SOCIAL_PLATFORMS.filter(({ key }) => key !== "email").map((platform) => {
    const saved = profile?.socialSettings?.some((item) => item.platform === platform.key);
    const isManagedPlatform = PROFILE_SOCIAL_PLATFORMS.some(({ key }) => key === platform.key);
    const url = saved
      ? (profile?.social?.[platform.key] || platform.url)
      : isManagedPlatform
        ? platform.url
        : (profile?.social?.[platform.key] || platform.url);
    return [platform.key, url || ""];
  }));
}

function socialSettingsValues(profile) {
  return PROFILE_SOCIAL_PLATFORMS.map(({ key }, index) => {
    const saved = profile?.socialSettings?.find((item) => item.platform === key);
    const fallbackUrl = SOCIAL_PLATFORMS.find((item) => item.key === key)?.url;
    return {
      platform: key,
      enabled: saved?.enabled ?? Boolean(fallbackUrl),
      order: saved?.order ?? index,
    };
  });
}

function isValidSocialUrl(value) {
  if (!value) return false;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; }
  catch { return false; }
}
function profileTranslationValues(profile) {
  const translations = { fa: {}, ps: {} };
  for (const locale of ["fa", "ps"]) {
    for (const field of ["title", "tagline", "bio", "specialization", "careerGoals", "interests"]) {
      const value = profile?.translations?.[locale]?.[field];
      translations[locale][field] = field === "interests" && Array.isArray(value) ? value.join(", ") : value || "";
    }
  }
  return translations;
}

function ProfileForm({ profile }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      translations: profileTranslationValues(profile),
      name: profile?.name || "",
      title: profile?.title || "",
      tagline: profile?.tagline || "",
      bio: profile?.bio || "",
      specialization: profile?.specialization || "",
      careerGoals: profile?.careerGoals || "",
      interestsText: (profile?.interests || []).join(", "),
      languagesText: languagesToText(profile?.languages),
      location: profile?.location || "",
      availability: profile?.availability ?? true,
      email: profile?.email || "",
      phone: profile?.phone || "",
      avatar: profile?.avatar || "",
      resumeUrl: profile?.resumeUrl || "",
      social: socialFormValues(profile),
      socialSettings: socialSettingsValues(profile),
      statsText: statsToText(profile?.stats),
    },
  });

  useEffect(() => {
    reset({
      translations: profileTranslationValues(profile),
      name: profile?.name || "",
      title: profile?.title || "",
      tagline: profile?.tagline || "",
      bio: profile?.bio || "",
      specialization: profile?.specialization || "",
      careerGoals: profile?.careerGoals || "",
      interestsText: (profile?.interests || []).join(", "),
      languagesText: languagesToText(profile?.languages),
      location: profile?.location || "",
      availability: profile?.availability ?? true,
      email: profile?.email || "",
      phone: profile?.phone || "",
      avatar: profile?.avatar || "",
      resumeUrl: profile?.resumeUrl || "",
      social: socialFormValues(profile),
      socialSettings: socialSettingsValues(profile),
      statsText: statsToText(profile?.stats),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (payload) => api.put("/profile", payload),
    onSuccess: () => {
      toast.success(t("admin.profileUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] }); // refresh public site cache too
    },
    onError: (err) => toast.error(err.message || t("common.updateFailed")),
  });

  function submit(values) {
    mutation.mutate({
      translations: Object.fromEntries(["fa", "ps"].map((locale) => {
        const fields = values.translations?.[locale] || {};
        const result = {};
        for (const field of ["title", "tagline", "bio", "specialization", "careerGoals"]) if (fields[field]?.trim()) result[field] = fields[field].trim();
        const interests = fields.interests ? fields.interests.split(",").map((item) => item.trim()).filter(Boolean) : [];
        if (interests.length) result.interests = interests;
        return [locale, result];
      }).filter(([, localized]) => Object.keys(localized).length)),
      name: cleanBrandName(values.name),
      title: values.title,
      tagline: values.tagline,
      bio: values.bio,
      specialization: values.specialization,
      careerGoals: values.careerGoals,
      interests: values.interestsText
        ? values.interestsText.split(",").map((v) => v.trim()).filter(Boolean)
        : [],
      languages: textToLanguages(values.languagesText),
      location: values.location,
      availability: values.availability,
      email: values.email,
      phone: values.phone,
      avatar: values.avatar,
      resumeUrl: values.resumeUrl,
      social: {
        ...values.social,
      },
      socialSettings: values.socialSettings,
      stats: textToStats(values.statsText),
    });
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]";
  const labelClass = "mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]";

  return (
    <form onSubmit={handleSubmit(submit)} className="admin-form space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className={labelClass}>{t("admin.profile.fullName")}</label>
          <input id="profile-name" {...register("name")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-title" className={labelClass}>{t("admin.profile.professionalTitle")}</label>
          <input id="profile-title" {...register("title")} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="profile-tagline" className={labelClass}>{t("admin.profile.tagline")}</label>
        <input id="profile-tagline" {...register("tagline")} className={inputClass} />
      </div>

      <div>
        <label htmlFor="profile-bio" className={labelClass}>{t("admin.profile.bio")}</label>
        <textarea id="profile-bio" rows={4} {...register("bio")} className={`${inputClass} resize-none`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="profile-specialization" className={labelClass}>{t("admin.profile.specialization")}</label>
          <input
            id="profile-specialization"
            {...register("specialization")}
            placeholder={t("phase4.misc.specializationExample")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-interests" className={labelClass}>{t("admin.profile.interests")}</label>
          <input id="profile-interests" {...register("interestsText")} placeholder={t("phase4.misc.interestsExample")} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="profile-career-goals" className={labelClass}>{t("admin.profile.careerGoals")}</label>
        <textarea id="profile-career-goals" rows={3} {...register("careerGoals")} className={`${inputClass} resize-none`} />
      </div>

      <fieldset className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <legend className="px-2 font-mono text-xs text-[var(--color-primary)]">{t("admin.cmsTranslationsHint")}</legend>
        <LocalizedTextFields name="title" label={t("admin.profile.professionalTitle")} register={register} watch={watch} errors={errors} maxLength={150} />
        <LocalizedTextFields name="tagline" label={t("admin.profile.tagline")} register={register} watch={watch} errors={errors} maxLength={250} />
        <LocalizedTextFields name="bio" label={t("admin.profile.bio")} register={register} watch={watch} errors={errors} maxLength={3000} multiline />
        <LocalizedTextFields name="specialization" label={t("admin.profile.specialization")} register={register} watch={watch} errors={errors} maxLength={200} />
        <LocalizedTextFields name="careerGoals" label={t("admin.profile.careerGoals")} register={register} watch={watch} errors={errors} maxLength={1000} multiline />
        <LocalizedTextFields name="interests" label={t("admin.profile.interests")} register={register} watch={watch} errors={errors} maxLength={1200} />
      </fieldset>

      <div>
        <label id="profile-image-label" className={labelClass}>{t("admin.profile.profileImage")}</label>
        <Controller
          name="avatar"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ImageUploadField label={t("admin.profile.profileImage")} ariaLabelledBy="profile-image-label" value={value} onChange={onChange} usedIn="profile" />
          )}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="profile-location" className={labelClass}>{t("admin.profile.location")}</label>
          <input id="profile-location" {...register("location")} className={inputClass} />
        </div>
        <div>
          <label id="profile-resume-label" className={labelClass}>{t("admin.profile.resumePdf")}</label>
          <Controller
            name="resumeUrl"
            control={control}
            render={({ field: { value, onChange } }) => <PdfUploadField ariaLabelledBy="profile-resume-label" value={value} onChange={onChange} />}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className={labelClass}>{t("admin.profile.email")}</label>
          <input id="profile-email" {...register("email")} dir="ltr" className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-phone" className={labelClass}>{t("admin.profile.phone")}</label>
          <input id="profile-phone" {...register("phone")} dir="ltr" className={inputClass} />
        </div>
      </div>

        <label htmlFor="profile-availability" className="admin-form-inline-label flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
        <input id="profile-availability" type="checkbox" {...register("availability")} className="h-4 w-4 accent-[var(--color-primary)]" />
        {t("admin.profile.availableFreelance")}
      </label>

      <div>
        <label htmlFor="profile-languages" className={labelClass}>{t("admin.profile.languagesFormat")}</label>
        <textarea id="profile-languages" rows={3} {...register("languagesText")} className={`${inputClass} resize-none font-mono`} />
      </div>

            <div>
        <p className="font-mono text-sm text-[var(--color-primary)]">{t("admin.profile.socialLinks")}</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t("admin.profile.socialSettingsHelp")}</p>
        <div className="mt-3 space-y-3">
          {PROFILE_SOCIAL_PLATFORMS.map(({ key }, index) => {
            const label = t("social." + key);
            const urlField = "social." + key;
            const enabledField = "socialSettings." + index + ".enabled";
            const orderField = "socialSettings." + index + ".order";
            return (
              <fieldset key={key} className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:grid-cols-[minmax(0,1fr)_6rem]">
                <legend className="sr-only">{label}</legend>
                <div className="min-w-0">
                  <label htmlFor={"profile-social-" + key} className={labelClass}>{label} URL</label>
                  <input id={"profile-social-" + key} type="url" dir="ltr" placeholder="https://" {...register(urlField, { validate: (value) => (!watch(enabledField) && !value) || isValidSocialUrl(value) || t("validation.url", { field: label }) })} className={inputClass} aria-invalid={Boolean(errors.social?.[key])} />
                  {errors.social?.[key] && <p role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{errors.social[key].message}</p>}
                  <label htmlFor={"profile-social-enabled-" + key} className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <input id={"profile-social-enabled-" + key} type="checkbox" {...register(enabledField)} className="h-4 w-4 accent-[var(--color-primary)]" />
                    {t("admin.profile.socialEnabled")}
                  </label>
                </div>
                <div>
                  <label htmlFor={"profile-social-order-" + key} className={labelClass}>{t("phase4.fields.order")}</label>
                  <input id={"profile-social-order-" + key} type="number" min="0" max="99" {...register(orderField, { valueAsNumber: true, min: 0, max: 99 })} className={inputClass} />
                </div>
              </fieldset>
            );
          })}
        </div>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div><label htmlFor="profile-linkedin" className={labelClass}>{t("admin.profile.linkedIn")}</label><input id="profile-linkedin" type="url" {...register("social.linkedin")} dir="ltr" className={inputClass} /></div>
          <div><label htmlFor="profile-instagram" className={labelClass}>{t("admin.profile.instagram")}</label><input id="profile-instagram" type="url" {...register("social.instagram")} dir="ltr" className={inputClass} /></div>
        </div>
      </div>

      <div>
        <label htmlFor="profile-stats" className={labelClass}>{t("admin.profile.statsFormat")}</label>
        <textarea id="profile-stats" rows={4} {...register("statsText")} className={`${inputClass} resize-none font-mono`} />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {mutation.isPending ? t("common.saving") : `${t("common.save")} ${t("admin.profileTab")}`}
      </button>
    </form>
  );
}

function SettingsForm({ settings }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      siteTitle: settings?.siteTitle || "",
      siteDescription: settings?.siteDescription || "",
      defaultLanguage: settings?.defaultLanguage || "en",
      siteUrl: settings?.seo?.siteUrl || "",
      metaTitle: settings?.seo?.metaTitle || "",
      metaDescription: settings?.seo?.metaDescription || "",
      keywords: settings?.seo?.keywords?.join(", ") || "",
      ogImage: settings?.seo?.ogImage || "",
      maintenanceMode: settings?.maintenanceMode ?? false,
    },
  });

  useEffect(() => {
    reset({
      siteTitle: settings?.siteTitle || "",
      siteDescription: settings?.siteDescription || "",
      defaultLanguage: settings?.defaultLanguage || "en",
      siteUrl: settings?.seo?.siteUrl || "",
      metaTitle: settings?.seo?.metaTitle || "",
      metaDescription: settings?.seo?.metaDescription || "",
      keywords: settings?.seo?.keywords?.join(", ") || "",
      ogImage: settings?.seo?.ogImage || "",
      maintenanceMode: settings?.maintenanceMode ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (payload) => api.put("/settings", payload),
    onSuccess: () => {
      toast.success(t("admin.settingsUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message || t("common.updateFailed")),
  });

  function submit(values) {
    mutation.mutate({
      siteTitle: cleanBrandName(values.siteTitle),
      siteDescription: values.siteDescription,
      defaultLanguage: values.defaultLanguage,
      maintenanceMode: values.maintenanceMode,
      seo: {
        siteUrl: values.siteUrl,
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        keywords: values.keywords
          ? values.keywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [],
        ogImage: values.ogImage,
      },
    });
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]";
  const labelClass = "mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]";

  return (
    <form onSubmit={handleSubmit(submit)} className="admin-form space-y-5">
      <div>
        <label htmlFor="settings-site-title" className={labelClass}>{t("admin.settings.siteTitle")}</label>
        <input id="settings-site-title" {...register("siteTitle")} className={inputClass} />
      </div>
      <div>
        <label htmlFor="settings-site-description" className={labelClass}>{t("admin.settings.siteDescription")}</label>
        <textarea id="settings-site-description" rows={2} {...register("siteDescription")} className={`${inputClass} resize-none`} />
      </div>
      <div>
        <label htmlFor="settings-language" className={labelClass}>{t("admin.settings.defaultLanguage")}</label>
        <select id="settings-language" {...register("defaultLanguage")} className={`${inputClass} bg-[var(--color-background)]`}>
          <option value="en">{t("common.english")}</option>
          <option value="fa">{t("common.dari")}</option>
          <option value="ps">{t("common.pashto")}</option>
        </select>
      </div>

      <div>
        <p className="font-mono text-sm text-[var(--color-primary)]">{t("admin.settings.seoDefaults")}</p>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="settings-site-url" className={labelClass}>{t("admin.settings.canonicalUrl")}</label>
            <input id="settings-site-url" {...register("siteUrl")} dir="ltr" placeholder="https://example.com" className={inputClass} />
          </div>
          <div>
            <label htmlFor="settings-meta-title" className={labelClass}>{t("admin.settings.metaTitle")}</label>
            <input id="settings-meta-title" {...register("metaTitle")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="settings-meta-description" className={labelClass}>{t("admin.settings.metaDescription")}</label>
            <textarea id="settings-meta-description" rows={2} {...register("metaDescription")} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label htmlFor="settings-keywords" className={labelClass}>{t("admin.settings.keywords")}</label>
            <input id="settings-keywords" {...register("keywords")} className={inputClass} />
          </div>
          <div>
            <label id="settings-og-image-label" className={labelClass}>{t("admin.settings.ogImage")}</label>
            <Controller
              name="ogImage"
              control={control}
              render={({ field: { value, onChange } }) => (
                <ImageUploadField label={t("admin.settings.ogImage")} ariaLabelledBy="settings-og-image-label" value={value} onChange={onChange} usedIn="other" />
              )}
            />
          </div>
        </div>
      </div>

      <label htmlFor="settings-maintenance-mode" className="admin-form-inline-label flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
        <input id="settings-maintenance-mode" type="checkbox" {...register("maintenanceMode")} className="h-4 w-4 accent-[var(--color-primary)]" />
        {t("admin.settings.maintenanceMode")}
      </label>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {mutation.isPending ? t("common.saving") : `${t("common.save")} ${t("admin.settingsTab")}`}
      </button>
    </form>
  );
}

export default function AdminSettings() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("profile");
  const { data: profile, isLoading: loadingProfile, isError: errorProfile, refetch: refetchProfile } =
    useProfileAdmin();
  const { data: settings, isLoading: loadingSettings, isError: errorSettings, refetch: refetchSettings } =
    useSettingsAdmin();

  return (
    <div>
      <div className="flex gap-2">
        {[
          { id: "profile", label: t("admin.profileTab") },
          { id: "settings", label: t("admin.settingsTab") },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`rounded-full border px-4 py-2 font-mono text-xs transition-colors ${
              tab === tabItem.id
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        {tab === "profile" && (
          <>
            {loadingProfile && <SectionLoader label={t("common.loading")} />}
            {errorProfile && <ErrorState message={t("admin.couldntLoadProfile")} onRetry={refetchProfile} />}
            {!loadingProfile && !errorProfile && <ProfileForm profile={profile} />}
          </>
        )}
        {tab === "settings" && (
          <>
            {loadingSettings && <SectionLoader label={t("common.loading")} />}
            {errorSettings && <ErrorState message={t("admin.couldntLoadSettings")} onRetry={refetchSettings} />}
            {!loadingSettings && !errorSettings && <SettingsForm settings={settings} />}
          </>
        )}
      </div>
    </div>
  );
}
