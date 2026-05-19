import api from "@/lib/api";

export const uploadFile = async (
  token: string,
  taskId: number,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/upload/${taskId}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
