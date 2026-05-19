import api from "@/lib/api";

export const getWorkspaceAnalytics = async (
  token: string,
  workspaceId: number
) => {
  const response = await api.get(
    `/analytics/workspace/${workspaceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
