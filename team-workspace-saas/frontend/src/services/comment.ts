import api from "@/lib/api";

export const createComment = async (
  token: string,
  taskId: number,
  content: string
) => {
  const response = await api.post(
    `/comments/${taskId}`,
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getComments = async (
  token: string,
  taskId: number
) => {
  const response = await api.get(
    `/comments/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
