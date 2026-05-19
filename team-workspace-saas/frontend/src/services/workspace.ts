import api from "@/lib/api";

export const createWorkspace = async (token: string, name: string) => {
  const response = await api.post(
    "/workspaces",
    { name },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getWorkspaces = async (token: string) => {
  const response = await api.get("/workspaces", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getWorkspaceMembers = async (token: string, workspaceId: number) => {
  const response = await api.get(`/workspaces/${workspaceId}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateWorkspaceMemberRole = async (token: string, workspaceId: number, userId: number, role: string) => {
  const response = await api.put(
    `/workspaces/${workspaceId}/members/${userId}?role=${role}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const removeWorkspaceMember = async (token: string, workspaceId: number, userId: number) => {
  const response = await api.delete(`/workspaces/${workspaceId}/members/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
