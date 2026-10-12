import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiClock, FiCalendar, FiEye } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { usePost } from "@/hooks/queries/usePosts";
import { useSettings } from "@/hooks/queries/useSettings";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import { useContentAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import Seo, { buildArticleSchema, buildBreadcrumbSchema } from "@/components/seo/Seo";
import { formatLocaleDateLong } from "@/utils/formatDate";
import NotFound from "./NotFound";

/**
 * Renders post content as paragraphs. Content is treated as plain
 * text/markdown-lite (split on blank lines) rather than raw HTML, so no
 * dangerouslySetInnerHTML / sanitization concerns.
 */
function PostBody({ content }) {
  const paragraphs = (content || "").split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-4 leading-relaxed text-[var(--color-text-muted)]">
      {paragraphs.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}

export default function BlogDetails() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { data: post, isLoading, isError, error, refetch } = usePost(slug);
  const { data: settings } = useSettings();
  useContentAnalyticsTracking({
    enabled: Boolean(post?._id),
    path: `/blog/${slug}`,
    eventType: "blog_view",
    contentType: "blog",
    contentId: post?._id,
    contentTitle: post?.title,
  });

  if (isLoading) {
    return (
      <section className="container-page py-24">
        <SectionLoader label={t("pages.blogDetails.loading")} />
      </section>
    );
  }

  if (isError) {
    if (error?.message?.toLowerCase().includes("not found")) return <NotFound />;
    return (
      <section className="container-page py-24">
        <ErrorState message={t("pages.blogDetails.error")} onRetry={refetch} />
      </section>
    );
  }

  if (!post) return <NotFound />;
  const seoTitle = post.seoTitle || post.title;
  const seoDescription = post.seoDescription || post.excerpt;
  const canonicalPath = `/blog/${post.slug}`;

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={post.seoKeywords?.length ? post.seoKeywords : post.tags?.map((tag) => tag.name)}
        path={canonicalPath}
        image={post.cover}
        type="article"
        article={{
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt,
          author: post.author?.name || "Mohammad Khalid",
          section: post.category?.name,
          tags: post.tags?.map((tag) => tag.name),
        }}
        jsonLd={[
          buildBreadcrumbSchema([
            { name: t("nav.home"), path: "/" },
            { name: t("nav.blog"), path: "/blog" },
            { name: post.title, path: canonicalPath },
          ], settings),
          buildArticleSchema({
            post,
            title: seoTitle,
            description: seoDescription,
            canonical: canonicalPath,
            image: post.cover,
          }, settings),
        ]}
      />
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="container-page py-16 md:py-24">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          >
            <FiArrowLeft className="rtl-flip" size={14} /> {t("pages.blogDetails.back")}
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto mt-8 max-w-4xl text-center">
            {post.category?.name && (
              <span className="inline-flex rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
                {post.category.name}
              </span>
            )}
            <h1 className="mt-5 font-[var(--font-display)] text-4xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-5xl md:text-6xl">
              {post.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <FiCalendar size={12} /> {formatLocaleDateLong(post.publishedAt)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <FiClock size={12} /> {t("pages.blogDetails.minRead", { count: post.readingTime })}
              </span>
              <span className="flex items-center gap-1.5">
                <FiEye size={12} /> {t("pages.blogDetails.views", { count: post.views })}
              </span>
            </div>

            {post.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag._id}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-text-muted)]"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="container-page max-w-3xl py-16 md:py-20">
        {post.cover && <img src={post.cover} alt={post.title} className="mb-12 aspect-[16/9] w-full rounded-2xl border border-[var(--color-border)] object-cover shadow-2xl shadow-black/10" loading="lazy" />}
        <div className="mx-auto max-w-3xl"><PostBody content={post.content} /></div>

        {post.author?.name && (
          <div className="mt-12 flex items-center gap-3 border-t border-[var(--color-border)] pt-6">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] font-mono text-xs text-[var(--color-text-muted)]">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text-primary)]">
                {post.author.name}
              </p>
              <p className="font-mono text-xs text-[var(--color-text-muted)]">{t("pages.blogDetails.author")}</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
