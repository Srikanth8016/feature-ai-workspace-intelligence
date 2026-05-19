import api from "@/lib/api";

export const getCurrentUser = async (
  token: string
) => {

  const response = await api.get(
    "/users/me",
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateCurrentUser = async (
  token: string,
  username?: string,
  email?: string
) => {
  const params = new URLSearchParams();
  if (username) params.append("username", username);
  if (email) params.append("email", email);

  const response = await api.put(
    `/users/me?${params.toString()}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
