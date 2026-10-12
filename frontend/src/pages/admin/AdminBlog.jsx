import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import { usePermissions } from "@/hooks/usePermissions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ImageUploadField from "@/components/admin/ImageUploadField";
import AdminTable from "@/components/admin/AdminTable";
import LocalizedTextFields from "@/components/admin/LocalizedTextFields";

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function usePosts(filters) {
  return useQuery({
    queryKey: ["admin", "posts", filters],
    queryFn: () => api.get("/blog/admin/all", { params: { limit: 100, ...filters } }),
  });
}

function useCategories() {
  return useQuery({ queryKey: ["admin", "categories"], queryFn: () => api.get("/categories").then((r) => r.data) });
}

function useTags() {
  return useQuery({ queryKey: ["admin", "tags"], queryFn: () => api.get("/tags").then((r) => r.data) });
}

function PostForm({ post, categories, tags, onClose, onSaved }) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      translations: post?.translations || { fa: {}, ps: {} },
      title: post?.title || "",
      slug: post?.slug || "",
      cover: post?.cover || "",
      excerpt: post?.excerpt || "",
      content: post?.content || "",
      seoTitle: post?.seoTitle || "",
      seoDescription: post?.seoDescription || "",
      seoKeywords: post?.seoKeywords?.join(", ") || "",
      category: post?.category?._id || post?.category || "",
      tags: post?.tags?.map((t) => t._id || t) || [],
      readingTime: post?.readingTime || 5,
      published: post?.published ?? false,
      publishedAt: toInputDate(post?.publishedAt),
    },
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      post ? api.put(`/blog/${post._id}`, payload) : api.post("/blog", payload),
    onSuccess: () => {
      toast.success(post ? t("admin.postUpdated") : t("admin.postCreated"));
      onSaved();
    },
    onError: (err) => {
      const details = err?.details || err?.response?.data?.details || [];
      details.forEach((detail) => {
        const field = String(detail.field || detail.path || "").split(".").pop();
        if (["title", "slug", "excerpt", "content", "seoTitle", "seoDescription", "readingTime"].includes(field)) {
          const label = t(`adminValidation.fields.${field}`, { defaultValue: field });
          setError(field, { type: "server", message: detail.message === "duplicate" ? t("adminValidation.duplicate") : t("adminValidation.invalid", { field: label }) });
        }
      });
      toast.error(details.length ? t("adminValidation.invalid", { field: t(`adminValidation.fields.${details[0].field}`, { defaultValue: details[0].field || "" }) }) : err.message || t("common.saveFailed"));
    },
  });

  function submit(values) {
    mutation.mutate({
      ...values,
      translations: Object.fromEntries(["fa", "ps"].map((locale) => {
        const localized = Object.fromEntries(Object.entries(values.translations?.[locale] || {}).filter(([, value]) => String(value || "").trim()).map(([key, value]) => [key, String(value).trim()]));
        return [locale, localized];
      }).filter(([, localized]) => Object.keys(localized).length)),
      tags: Array.isArray(values.tags) ? values.tags : [values.tags].filter(Boolean),
      seoKeywords: values.seoKeywords
        ? values.seoKeywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean)
        : [],
      readingTime: values.readingTime === "" ? undefined : Number(values.readingTime),
      publishedAt: values.publishedAt || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-form-title"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="blog-form-title" className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">
            {post ? t("admin.editPost") : t("admin.newPost")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("common.cancel")} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="admin-form space-y-4">
          <div>
            <label htmlFor="post-title" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.titleRequired")}</label>
            <input
              id="post-title"
              {...register("title", { required: t("adminValidation.required", { field: t("adminValidation.fields.title") }), minLength: { value: 1, message: t("adminValidation.minLength", { field: t("adminValidation.fields.title"), min: 1 }) }, maxLength: { value: 200, message: t("adminValidation.maxLength", { field: t("adminValidation.fields.title"), max: 200 }) } })}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "post-title-error" : undefined}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
            {errors.title && <p id="post-title-error" role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{errors.title.message}</p>}
            <LocalizedTextFields name="title" label={t("admin.blog.titleRequired")} register={register} watch={watch} errors={errors} maxLength={200} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-slug" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.slug")}</label>
              <input
                id="post-slug"
                {...register("slug", { maxLength: { value: 200, message: t("adminValidation.maxLength", { field: t("adminValidation.fields.slug"), max: 200 }) }, pattern: { value: /^[a-z0-9-]*$/, message: t("adminValidation.slug", { field: t("adminValidation.fields.slug") }) } })}
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={errors.slug ? "post-slug-error" : undefined}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              {errors.slug && <p id="post-slug-error" role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{errors.slug.message}</p>}
            </div>
            <div>
              <label id="post-cover-label" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.coverImage")}</label>
              <Controller
                name="cover"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <ImageUploadField label="Cover" ariaLabelledBy="post-cover-label" value={value} onChange={onChange} usedIn="blog" />
                )}
              />
            </div>
          </div>

          <div>
            <label htmlFor="post-excerpt" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.excerpt")}</label>
            <textarea
              id="post-excerpt"
              rows={2}
              {...register("excerpt")}
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
            <LocalizedTextFields name="excerpt" label={t("admin.blog.excerpt")} register={register} watch={watch} errors={errors} maxLength={500} multiline />
          </div>

          <div>
            <label htmlFor="post-content" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.contentRequired")}</label>
            <textarea
              id="post-content"
              rows={8}
              {...register("content", { required: t("adminValidation.required", { field: t("adminValidation.fields.content") }), minLength: { value: 1, message: t("adminValidation.minLength", { field: t("adminValidation.fields.content"), min: 1 }) }, maxLength: { value: 50000, message: t("adminValidation.maxLength", { field: t("adminValidation.fields.content"), max: 50000 }) } })}
              aria-invalid={Boolean(errors.content)}
              aria-describedby={errors.content ? "post-content-error" : undefined}
              placeholder={t("admin.blog.paragraphHint")}
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
            {errors.content && <p id="post-content-error" role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{errors.content.message}</p>}
            <LocalizedTextFields name="content" label={t("admin.blog.contentRequired")} register={register} watch={watch} errors={errors} maxLength={50000} multiline />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-seo-title" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.seoTitle")}</label>
              <input
                id="post-seo-title"
                {...register("seoTitle")}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              <LocalizedTextFields name="seoTitle" label={t("admin.blog.seoTitle")} register={register} watch={watch} errors={errors} maxLength={200} />
            </div>
            <div>
              <label htmlFor="post-seo-keywords" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.seoKeywords")}</label>
              <input
                id="post-seo-keywords"
                {...register("seoKeywords")}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="post-seo-description" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.seoDescription")}</label>
            <textarea
              id="post-seo-description"
              rows={2}
              {...register("seoDescription")}
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
            <LocalizedTextFields name="seoDescription" label={t("admin.blog.seoDescription")} register={register} watch={watch} errors={errors} maxLength={300} multiline />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-category" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.category")}</label>
              <select
                id="post-category"
                {...register("category")}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">{t("phase4.misc.noCategory")}</option>
                {categories?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="post-reading-time" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.readingTime")}</label>
              <input
                id="post-reading-time"
                type="number"
                min={1}
                {...register("readingTime", { min: { value: 1, message: t("adminValidation.minValue", { field: t("adminValidation.fields.readingTime"), min: 1 }) }, max: { value: 999, message: t("adminValidation.maxValue", { field: t("adminValidation.fields.readingTime"), max: 999 }) }, validate: (v) => !v || Number.isInteger(Number(v)) || t("adminValidation.number", { field: t("adminValidation.fields.readingTime") }) })}
                aria-invalid={Boolean(errors.readingTime)}
                aria-describedby={errors.readingTime ? "post-reading-time-error" : undefined}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              {errors.readingTime && <p id="post-reading-time-error" role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{errors.readingTime.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="post-tags" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.tags")}</label>
            <select
              id="post-tags"
              multiple
              {...register("tags")}
              className="h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            >
              {tags?.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <label className="admin-form-inline-label flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            <input type="checkbox" {...register("published")} className="h-4 w-4 accent-[var(--color-primary)]" />
            {t("admin.published")}
          </label>

          <div>
            <label htmlFor="post-published-date" className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">{t("admin.blog.publishedDate")}</label>
            <input
              id="post-published-date"
              type="date"
              {...register("publishedAt")}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {mutation.isPending ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlog() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canDelete = can("content:delete");
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", status: "all", category: "", tag: "" });
  const activeFilters = {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.tag ? { tag: filters.tag } : {}),
  };
  const { data: response, isLoading, isError, refetch } = usePosts(activeFilters);
  const posts = response?.data || [];

  const [editing, setEditing] = useState(null); // null closed, {} new, {...} edit
  const [deleting, setDeleting] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/blog/${id}`),
    onSuccess: () => {
      toast.success(t("admin.postDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      setDeleting(null);
    },
    onError: (err) => toast.error(err.message || t("common.deleteFailed")),
  });

  async function handleEditPost(post) {
    try {
      const response = await api.get(`/cms-translations/blog/${post._id}`);
      setEditing({ ...post, translations: response.data?.translations || {} });
    } catch {
      setEditing(post);
    }
  }

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["post"] });
    setEditing(null);
  }

  const postColumns = [
    {
      key: "title",
      label: t("common.title"),
      width: "35%",
      render: (post) => <span className="block truncate" title={post.title}>{post.title}</span>,
    },
    {
      key: "category",
      label: t("common.category"),
      width: "19%",
      render: (post) => <span className="block truncate" title={post.category?.name || "â€”"}>{post.category?.name || "â€”"}</span>,
    },
    {
      key: "published",
      label: t("admin.published"),
      width: "15%",
      render: (post) => post.published ? t("common.yes") : t("common.no"),
    },
    {
      key: "views",
      label: t("common.views"),
      width: "12%",
      align: "end",
      render: (post) => post.views,
    },
    {
      key: "actions",
      label: "",
      width: "6.5rem",
      align: "end",
      render: (post) => (
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => handleEditPost(post)}
            aria-label={`${t("admin.editPost")}: ${post.title}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          >
            <FiEdit2 size={14} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleting(post)}
              aria-label={`${t("common.delete")}: ${post.title}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setEditing({})}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
        >
          <FiPlus size={15} /> {t("admin.newPost")}
        </button>
      </div>

      <div className="mb-5 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_150px_180px_180px]">
        <label className="relative block">
          <FiSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent py-2 ps-9 pe-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            placeholder={t("admin.searchPosts")}
          />
        </label>
        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
        >
          <option value="all">{t("admin.allStatus")}</option>
          <option value="published">{t("admin.published")}</option>
          <option value="draft">{t("admin.drafts")}</option>
        </select>
        <select
          value={filters.category}
          onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">{t("admin.allCategories")}</option>
          {categories?.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={filters.tag}
          onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">{t("admin.allTags")}</option>
          {tags?.map((tag) => (
            <option key={tag._id} value={tag._id}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <SectionLoader label={t("common.loading")} />}
      {isError && <ErrorState message={t("admin.couldntLoadPosts")} onRetry={refetch} />}

      {!isLoading && !isError && posts.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">{t("admin.noPostsYet")}</p>
      )}

      {!isLoading && !isError && posts.length > 0 && (
        <AdminTable columns={postColumns} rows={posts} />
      )}

      {editing !== null && (
        <PostForm
          post={editing._id ? editing : null}
          categories={categories}
          tags={tags}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t("admin.deletePostTitle")}
          message={t("common.deleteConfirmMessage")}
          onConfirm={() => deleteMutation.mutate(deleting._id)}
          onCancel={() => setDeleting(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}


