import api from "@/lib/api";

export const loginUser = async (
  email: string,
  password: string
) => {

  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
};

export const registerUser = async (
  username: string,
  email: string,
  password: string
) => {
  const response = await api.post(
    `/auth/register?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  );
  return response.data;
};