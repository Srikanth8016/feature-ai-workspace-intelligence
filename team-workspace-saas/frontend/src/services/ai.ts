import api from "@/lib/api";

export const generateAITasks = async (
  token: string,
  prompt: string
) => {
  const response = await api.post(
    "/ai/generate-tasks",
    { prompt },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const summarizeWorkspaceProgress = async (
  token: string,
  workspaceId: number
) => {
  const response = await api.post(
    `/ai/summarize/workspace/${workspaceId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const generateAISprintPlan = async (
  token: string,
  scope: string
) => {
  const response = await api.post(
    "/ai/generate-sprint",
    { scope },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
