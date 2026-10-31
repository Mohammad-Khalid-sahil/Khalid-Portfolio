import { motion } from "framer-motion";
import { FiClock, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import { usePosts } from "@/hooks/queries/usePosts";
import { CardSkeleton } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";

export default function Blog() {
  const { t } = useTranslation();
  const { data: response, isLoading, isError, refetch } = usePosts();
  const posts = response?.data || [];
  const hasSinglePost = posts.length === 1;

  return (
    <>
      <Seo
        title={t("pages.blog.title")}
        description={t("pages.blog.seo")}
        keywords={["software engineering blog", "React", "Node.js", "MongoDB", "Flutter", "technical writing"]}
        path="/blog"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.blog"), path: "/blog" }])]}
      />
      <PageHero
        eyebrow={t("pages.blog.eyebrow")}
        title={t("pages.blog.heroTitle")}
        description={t("pages.blog.heroDescription")}
      />

      <section className="container-page py-16 md:py-20">
        {isError && <ErrorState message={t("pages.blog.error")} onRetry={refetch} />}

        {!isError && isLoading && (
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 xl:max-w-6xl xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isError && !isLoading && posts.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)]">{t("pages.blog.empty")}</p>
        )}

        {!isError && !isLoading && posts.length > 0 && (
          <div className={posts.length === 1 ? "mx-auto grid max-w-md grid-cols-1 gap-6" : posts.length === 2 ? "mx-auto grid max-w-4xl gap-6 sm:grid-cols-2" : "mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 xl:max-w-6xl xl:grid-cols-3"}>
            {posts.map((post, i) => (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/50 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface)]">
                  {post.cover ? <img src={post.cover} alt={post.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /> : <div className="h-full min-h-40 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-primary)_18%,transparent),transparent_65%)]" />}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-950/50 to-transparent" />
                  {post.category?.name && <span className="absolute start-4 top-4 rounded-full border border-white/20 bg-gray-950/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">{post.category.name}</span>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mt-2 line-clamp-2 font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{post.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between font-mono text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <FiClock size={12} /> {t("pages.blog.minRead", { count: post.readingTime })}
                    </span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="flex items-center gap-1 text-[var(--color-primary)] transition-colors hover:text-[var(--color-secondary)]"
                    >
                      {t("pages.blog.read")} <FiArrowRight className="rtl-flip" size={12} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
