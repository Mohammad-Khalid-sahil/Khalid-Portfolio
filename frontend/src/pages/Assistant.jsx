import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertTriangle, FiArrowUpRight, FiCommand, FiLoader, FiSend } from "react-icons/fi";
import Button from "@/components/ui/Button";
import api from "@/services/api";

export default function AssistantPage() {
  const { t } = useTranslation();
  const defaultSuggestions = useMemo(
    () => [
      t("assistant.suggestion1"),
      t("assistant.suggestion2"),
      t("assistant.suggestion3"),
      t("assistant.suggestion4"),
      t("assistant.suggestion5"),
    ],
    [t],
  );

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: t("assistant.welcome"),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestions = useMemo(() => defaultSuggestions, [defaultSuggestions]);

  async function submitPrompt(nextPrompt) {
    const value = (nextPrompt ?? draft).trim();
    if (!value || isLoading) return;

    const nextUserMessage = { role: "user", content: value };
    // The current prompt is sent separately as `message`; keep only earlier turns here.
    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, nextUserMessage]);
    setDraft("");
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/ai/chat", { message: value, conversation: history });
      const answer = response?.data?.answer || t("assistant.defaultResponse");
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (err) {
      const message = err?.message || t("assistant.requestError");
      setError(message);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: t("assistant.defaultResponse") },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitPrompt();
    }
  }

  return (
    <section className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/75 px-5 py-5 md:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-primary)]/10 text-[var(--color-primary)]">
              <FiCommand size={18} />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{t("nav.assistant")}</p>
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)] md:text-2xl">{t("assistant.title")}</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)] md:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-success)]" />
            {t("assistant.secureLabel")}
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 md:px-6">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => submitPrompt(item)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {item}
              </button>
            ))}
          </div>

          <div aria-live="polite" className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl border px-4 py-3.5 text-sm leading-7 md:max-w-[82%] md:px-5 md:py-4 md:text-[15px] ${
                      message.role === "user"
                        ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-primary)]"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              <FiLoader className="animate-spin" size={14} />
              {t("assistant.thinking")}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-error)]/40 bg-[color:var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-text-primary)]">
              <FiAlertTriangle size={14} className="text-[var(--color-error)]" />
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitPrompt();
          }}
          className="border-t border-[var(--color-border)] p-5 md:p-6"
        >
          <div className="flex flex-col gap-3 md:flex-row">
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t("assistant.promptPlaceholder")}
              className="min-h-[52px] flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 font-mono text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
              aria-label={t("assistant.promptAriaLabel")}
            />
            <Button type="submit" variant="primary" className="min-w-[140px]" disabled={isLoading} icon={<FiSend size={14} />}>
              {isLoading ? t("assistant.sending") : t("assistant.send")}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-end text-xs text-[var(--color-text-muted)]">
        <a href="/resume" className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
          {t("assistant.openResume")}
          <FiArrowUpRight className="rtl-flip" size={12} />
        </a>
      </div>
    </section>
  );
}

