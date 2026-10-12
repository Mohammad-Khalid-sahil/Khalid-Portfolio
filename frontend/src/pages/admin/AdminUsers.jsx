import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import api from "@/services/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "editor",
  avatar: "",
};

function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await api.get("/users");
      const list = response?.data;
      return Array.isArray(list) ? list : [];
    },
  });
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, isError } = useUsers();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedId) ?? users[0] ?? null,
    [selectedId, users]
  );

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/users", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(t("phase4.users.created"));
      resetForm();
    },
    onError: (error) => {
      const duplicate = error?.status === 409 || error?.response?.status === 409;
      if (duplicate) setFieldErrors({ email: t("adminValidation.duplicate") });
      toast.error(duplicate ? t("adminValidation.duplicate") : t("phase4.users.createError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/users/${id}`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(t("phase4.users.updated"));
      resetForm();
    },
    onError: (error) => {
      const duplicate = error?.status === 409 || error?.response?.status === 409;
      if (duplicate) setFieldErrors({ email: t("adminValidation.duplicate") });
      toast.error(duplicate ? t("adminValidation.duplicate") : t("phase4.users.updateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(t("phase4.users.deleted"));
      setSelectedId(null);
    },
    onError: () => toast.error(t("phase4.users.deleteError")),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSelectUser(user) {
    setSelectedId(user.id);
  }

  function handleEdit(user) {
    setEditingId(user.id);
    setSelectedId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      avatar: user.avatar || "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim() || form.name.trim().length > 100) nextErrors.name = t("adminValidation.invalid", { field: t("adminValidation.fields.name") });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = t("adminValidation.email", { field: t("adminValidation.fields.email") });
    if ((!editingId && form.password.length < 8) || (editingId && form.password && form.password.length < 8)) nextErrors.password = t("phase4.users.passwordShort");
    if (form.avatar && !/^https?:\/\/[^\s]+$/i.test(form.avatar)) nextErrors.avatar = t("adminValidation.url", { field: t("adminValidation.fields.avatar") });
    if (Object.keys(nextErrors).length) { setFieldErrors(nextErrors); return; }
    setFieldErrors({});

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      avatar: form.avatar || null,
    };

    if (form.password) payload.password = form.password;

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, payload });
      return;
    }

    if (!form.password || form.password.length < 8) {
      toast.error(t("phase4.users.passwordShort"));
      return;
    }

    await createMutation.mutateAsync(payload);
  }

  function renderError(message) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-sm text-[var(--color-text-muted)]">
        {message}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{t("phase4.users.description")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
        >
          <FiPlus size={15} /> {t("phase4.users.new")}
        </button>
      </div>

      {isError && renderError(t("phase4.users.loadError"))}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-sm text-[var(--color-primary)]">{t("phase4.users.list")}</h2>
            {users.length > 0 && <span className="font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.users.total", { count: users.length })}</span>}
          </div>

          {isLoading ? (
            <div className="text-sm text-[var(--color-text-muted)]">{t("phase4.users.loading")}</div>
          ) : users.length ? (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-start transition-colors ${
                    selectedUser?.id === user.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15"
                      : "border-[var(--color-border)] bg-transparent hover:border-[var(--color-border)]/80"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--color-text-primary)]">{user.name}</p>
                    <p dir="ltr" className="truncate text-start text-xs text-[var(--color-text-muted)]">{user.email}</p>
                  </div>
                  <div className="shrink-0 text-end">
                    <span className="inline-flex rounded-full border border-[var(--color-border)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-primary)]">
                      {user.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">{t("phase4.users.empty")}</p>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-sm text-[var(--color-primary)]">{editingId ? t("phase4.users.edit") : t("phase4.users.new")}</h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                {t("common.cancel")}
              </button>
            )}
          </div>

          <form className="admin-form space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.users.name")}</span>
              <input
                id="admin-user-name"
                name="name"
                value={form.name}
                onChange={handleFieldChange}
                required
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "admin-user-name-error" : undefined}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              {fieldErrors.name && <span id="admin-user-name-error" role="alert" className="mt-1 block text-xs text-[var(--color-danger)]">{fieldErrors.name}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.users.email")}</span>
              <input
                id="admin-user-email"
                type="email"
                dir="ltr"
                name="email"
                value={form.email}
                onChange={handleFieldChange}
                required
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "admin-user-email-error" : undefined}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              {fieldErrors.email && <span id="admin-user-email-error" role="alert" className="mt-1 block text-xs text-[var(--color-danger)]">{fieldErrors.email}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.users.password")}{editingId ? ` (${t("phase4.users.optional")})` : ""}</span>
              <input
                id="admin-user-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleFieldChange}
                required={!editingId}
                minLength={editingId ? undefined : 8}
                placeholder={editingId ? t("phase4.users.keepPassword") : t("phase4.users.passwordMinimum")}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "admin-user-password-error" : undefined}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              {fieldErrors.password && <span id="admin-user-password-error" role="alert" className="mt-1 block text-xs text-[var(--color-danger)]">{fieldErrors.password}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.users.role")}</span>
              <select
                id="admin-user-role"
                name="role"
                value={form.role}
                onChange={handleFieldChange}
                aria-invalid={Boolean(fieldErrors.role)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="editor">{t("phase4.users.editor")}</option>
                <option value="admin">{t("phase4.users.admin")}</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.users.avatar")}</span>
              <input
                id="admin-user-avatar"
                name="avatar"
                dir="ltr"
                value={form.avatar}
                onChange={handleFieldChange}
                aria-invalid={Boolean(fieldErrors.avatar)}
                aria-describedby={fieldErrors.avatar ? "admin-user-avatar-error" : undefined}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              {fieldErrors.avatar && <span id="admin-user-avatar-error" role="alert" className="mt-1 block text-xs text-[var(--color-danger)]">{fieldErrors.avatar}</span>}
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 font-mono text-sm text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-70"
              >
                {editingId ? t("phase4.users.save") : t("phase4.users.create")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(editingId)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-danger)] disabled:opacity-70"
                >
                  <FiTrash2 size={14} /> {t("common.delete")}
                </button>
              )}
            </div>
          </form>

          {selectedUser && !editingId && (
            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs text-[var(--color-primary)]">{t("phase4.users.selected")}</h3>
                <button type="button" onClick={() => handleEdit(selectedUser)} className="flex items-center gap-1 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <FiEdit2 size={12} /> {t("phase4.users.edit")}
                </button>
              </div>
              <dl className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex justify-between gap-4">
                  <dt>{t("phase4.users.name")}</dt>
                  <dd className="text-[var(--color-text-primary)]">{selectedUser.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("phase4.users.email")}</dt>
                  <dd className="truncate text-[var(--color-text-primary)]">{selectedUser.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("phase4.users.role")}</dt>
                  <dd className="text-[var(--color-text-primary)]">{selectedUser.role}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("phase4.users.lastLogin")}</dt>
                  <dd className="text-[var(--color-text-primary)]">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : t("phase4.users.never")}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

