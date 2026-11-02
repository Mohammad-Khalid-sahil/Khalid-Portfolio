import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiBookOpen, FiTrendingUp } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { usePosts } from "@/hooks/queries/usePosts";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import ExperienceTimeline from "@/components/common/ExperienceTimeline";

function countWords(content = "") {
  const text = String(content)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();

  return text ? text.split(/\s+/u).filter(Boolean).length : 0;
}

export default function BlogPreview() {
  const { t } = useTranslation();
  const { data: response, isLoading, isError, refetch } = usePosts({ limit: 3 });
  const posts = (response?.data || []).slice(0, 3);

  return (
    <section id="blog" className="ds-section scroll-mt-20 overflow-hidden bg-[var(--color-background)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute start-0 top-0 h-80 w-80 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <div className="absolute end-0 bottom-1/3 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
      
      <div className="container-page">
        <motion.div 
          className="flex flex-wrap items-end justify-between gap-6 pb-0 md:pb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading index="06" eyebrow={t("pages.blog.eyebrow")} title={t("pages.blog.heroTitle")} description={t("pages.blog.heroDescription")} maxWidth="max-w-3xl" />
          <Button href="/blog" variant="outline">{t("nav.blog")} <FiArrowRight className="rtl-flip" /></Button>
        </motion.div>

        {isError && <div className="mt-10"><ErrorState message={t("pages.blog.error")} onRetry={refetch} /></div>}
        {!isError && isLoading && (
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => <CardSkeleton key={item} />)}
          </div>
        )}
        {!isError && !isLoading && posts.length === 0 && (
          <p className="mt-12 text-center text-[var(--color-text-muted)]">{t("pages.blog.empty")}</p>
        )}

        {!isError && !isLoading && posts.length > 0 && (
          <ExperienceTimeline items={posts} className="mt-12" getMeta={(post) => post.category?.name || t("pages.blog.minRead", { count: post.readingTime })} renderItem={(post, index) => {
              const wordCount = countWords(post.content);
              return (
              <article
                className="ds-card ds-experience-card ds-blog-card group flex h-full flex-col overflow-hidden rounded-2xl"
              >
                <header className="flex items-start gap-4 border-b border-[var(--color-border)] p-5 sm:p-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]"><FiBookOpen size={19} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 font-[var(--font-display)] text-lg font-bold leading-snug text-[var(--color-text-primary)] sm:text-xl">
                      <Link to={`/blog/${post.slug}`} className="transition-colors duration-300 hover:text-[var(--color-primary)]">{post.title}</Link>
                    </h3>
                    {post.category?.name && <p className="mt-1.5 text-xs font-semibold text-[var(--color-primary)]">{post.category.name}</p>}
                  </div>
                </header>
                {/* Image container with category overlay */}
                <div className="relative block overflow-hidden bg-[var(--color-surface)]">
                  <div className="ds-blog-card__media relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
                    {post.cover ? (
                      <img
                        src={post.cover} 
                        alt="" 
                        loading="lazy" 
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-[conic-gradient(from_0deg,var(--color-primary)/20,var(--color-secondary)/20,var(--color-primary)/20)]" />
                    )}
                    
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-transparent opacity-60" />
                    
                    {/* Category badge */}
                    {post.category?.name && (
                      <span
                        className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] backdrop-blur-md"
                      >
                        <FiTrendingUp size={13} />
                        {post.category.name}
                      </span>
                    )}

                    {/* Featured badge for first post */}
                    {index === 0 && (
                      <span
                        className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--color-secondary)]"
                      >
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
                  {/* Excerpt */}
                  <p className="line-clamp-3 flex-1 text-sm leading-7 text-[var(--color-text-muted)]">
                    {post.excerpt}
                  </p>

                  {/* Meta footer */}
                  <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                        <FiClock size={13} className="text-[var(--color-primary)]" />
                        {t("pages.blog.minRead", { count: post.readingTime })}
                      </span>
                      <span className="text-[var(--color-border)]">•</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                        <FiBookOpen size={13} className="text-[var(--color-secondary)]" />
                        {t(`pages.blog.${wordCount === 1 ? "word" : "words"}`, { count: wordCount })}
                      </span>
                    </div>
                    <Link 
                      to={`/blog/${post.slug}`} 
                      className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)] transition-all duration-300 hover:gap-3"
                    >
                      {t("pages.blog.read")} <FiArrowRight className="rtl-flip" size={14} />
                    </Link>
                  </div>
                </div>
              </article>
              );
            }} />
        )}
      </div>
    </section>
  );
}
