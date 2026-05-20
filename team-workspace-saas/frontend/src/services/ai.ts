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

export const sendAIChatMessage = async (
  token: string,
  message: string,
  workspaceId: number
) => {
  const response = await api.post(
    "/ai/chat",
    { message, workspace_id: workspaceId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const predictWorkspaceRisks = async (
  token: string,
  workspaceId: number
) => {
  const response = await api.post(
    `/ai/predict-risks/${workspaceId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const parseMeetingNotes = async (
  token: string,
  transcript: string
) => {
  const response = await api.post(
    "/ai/parse-meeting",
    { transcript },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
