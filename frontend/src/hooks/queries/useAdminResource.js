import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

function humanizeTitle(title) {
  return String(title || "Record").replace(/s$/, "").trim();
}

function getActionMessage(config, action) {
  const label = humanizeTitle(config.title);

  switch (action) {
    case "create":
      return `${label} created successfully.`;
    case "update":
      return `${label} updated successfully.`;
    case "delete":
      return `${label} deleted successfully.`;
    default:
      return `${label} saved successfully.`;
  }
}

function getErrorMessage(err, action, config) {
  const status = err?.status || err?.response?.status;
  const label = humanizeTitle(config.title).toLowerCase();

  if (status === 400) return "Please fix the highlighted fields.";
  if (status === 401) return "You are not authorized to perform this action.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 409) return `${label} already exists. Please choose a different value.`;
  if (status >= 500) return `Unable to ${action} the ${label}. Please try again.`;

  if (err?.message) return err.message;
  return `Unable to ${action} the ${label}. Please try again.`;
}

function hasFieldValidationDetails(err) {
  const details = err?.details || err?.response?.data?.details;
  return (err?.status || err?.response?.status) === 400 && Array.isArray(details) && details.length > 0;
}

export function useAdminResource(config, params = {}) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [...config.queryKey, params],
    queryFn: () => config.service.list(params),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: config.queryKey });
    (config.publicCacheKeys || []).forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }

  const createMutation = useMutation({
    mutationFn: config.service.create,
    onSuccess: () => {
      toast.success(getActionMessage(config, "create"));
      invalidate();
    },
    onError: (err) => { if (!hasFieldValidationDetails(err)) toast.error(getErrorMessage(err, "create", config)); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => config.service.update(id, payload),
    onSuccess: () => {
      toast.success(getActionMessage(config, "update"));
      invalidate();
    },
    onError: (err) => { if (!hasFieldValidationDetails(err)) toast.error(getErrorMessage(err, "update", config)); },
  });

  const deleteMutation = useMutation({
    mutationFn: config.service.remove,
    onSuccess: () => {
      toast.success(getActionMessage(config, "delete"));
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, "delete", config)),
  });

  return {
    items: Array.isArray(listQuery.data) ? listQuery.data : Array.isArray(listQuery.data?.items) ? listQuery.data.items : [],
    pagination: listQuery.data?.meta || {},
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    create: createMutation.mutateAsync,
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}


