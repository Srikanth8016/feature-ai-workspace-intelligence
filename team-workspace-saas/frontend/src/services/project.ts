import api from "@/lib/api";

export const createProject = async (
  token: string,
  name: string,
  workspace_id: number
) => {
  const response = await api.post(
    "/projects",
    {
      name,
      workspace_id,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getProjects = async (
  token: string,
  workspace_id: number
) => {
  // Using the /projects/workspace/{id} endpoint we created earlier
  const response = await api.get(`/projects/workspace/${workspace_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
