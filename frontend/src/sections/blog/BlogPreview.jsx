import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiBookOpen, FiTrendingUp } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { usePosts } from "@/hooks/queries/usePosts";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function BlogPreview() {
  const { t } = useTranslation();
  const { data: response, isLoading, isError, refetch } = usePosts({ limit: 3 });
  const posts = (response?.data || []).slice(0, 3);

  return (
    <section id="blog" className="relative overflow-hidden bg-[var(--color-background)] py-24 sm:py-28">
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
          <SectionHeading eyebrow={t("pages.blog.eyebrow")} title={t("pages.blog.heroTitle")} description={t("pages.blog.heroDescription")} />
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
          <motion.div 
            className={posts.length === 1 ? "mx-auto mt-12 grid max-w-sm grid-cols-1 gap-5" : posts.length === 2 ? "mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2" : "mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 xl:grid-cols-3"}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {posts.map((post, index) => (
              <motion.article
                key={post._id}
                variants={itemVariants}
                className="group flex flex-col h-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] via-[var(--color-card)] to-[var(--color-surface-muted)] shadow-sm transition-all duration-500 hover:-translate-y-3 hover:border-[var(--color-primary)]/40 hover:shadow-2xl hover:shadow-[var(--color-primary)]/15"
              >
                {/* Image container with category overlay */}
                <div className="relative block overflow-hidden bg-[var(--color-surface)]">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
                    {post.cover ? (
                      <motion.img 
                        src={post.cover} 
                        alt="" 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1 }}
                      />
                    ) : (
                      <div className="h-full w-full bg-[conic-gradient(from_0deg,var(--color-primary)/20,var(--color-secondary)/20,var(--color-primary)/20)]" />
                    )}
                    
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-transparent opacity-60" />
                    
                    {/* Category badge */}
                    {post.category?.name && (
                      <motion.span 
                        className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] backdrop-blur-md"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                      >
                        <FiTrendingUp size={13} />
                        {post.category.name}
                      </motion.span>
                    )}

                    {/* Featured badge for first post */}
                    {index === 0 && (
                      <motion.div 
                        className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--color-secondary)]"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                      >
                        ⭐ Featured
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                  >
                    <h3 className="line-clamp-2 font-[var(--font-display)] text-xl font-bold leading-tight text-[var(--color-text-primary)]">
                      <Link 
                        to={`/blog/${post.slug}`} 
                        className="transition-colors duration-300 hover:text-[var(--color-primary)]"
                      >
                        {post.title}
                      </Link>
                    </h3>
                  </motion.div>

                  {/* Excerpt */}
                  <motion.p 
                    className="line-clamp-3 flex-1 text-sm leading-7 text-[var(--color-text-muted)]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    {post.excerpt}
                  </motion.p>

                  {/* Meta footer */}
                  <motion.div 
                    className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                        <FiClock size={13} className="text-[var(--color-primary)]" />
                        {t("pages.blog.minRead", { count: post.readingTime })}
                      </span>
                      <span className="text-[var(--color-border)]">•</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                        <FiBookOpen size={13} className="text-[var(--color-secondary)]" />
                        {post.readingTime > 1 ? t("pages.blog.words") : t("pages.blog.word")}
                      </span>
                    </div>
                    <Link 
                      to={`/blog/${post.slug}`} 
                      className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)] transition-all duration-300 hover:gap-3"
                    >
                      {t("pages.blog.read")} <FiArrowRight className="rtl-flip" size={14} />
                    </Link>
                  </motion.div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
