import api from "@/lib/api";

export const createTask = async (
  token: string,
  taskData: any
) => {
  const response = await api.post(
    "/tasks",
    taskData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getTasks = async (
  token: string,
  projectId: number
) => {
  const response = await api.get(
    `/tasks/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const updateTaskStatus = async (
  token: string,
  taskId: number,
  status: string
) => {
  const response = await api.put(
    `/tasks/${taskId}?status=${status}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const deleteTask = async (
  token: string,
  taskId: number
) => {
  const response = await api.delete(
    `/tasks/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getTaskActivity = async (
  token: string,
  taskId: number
) => {
  const response = await api.get(
    `/tasks/${taskId}/activity`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const updateTask = async (
  token: string,
  taskId: number,
  taskData: any
) => {
  const response = await api.put(
    `/tasks/${taskId}`,
    taskData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
