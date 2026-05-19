import api from "@/lib/api";

export const inviteUser = async (
  token: string,
  data: any
) => {
  const response = await api.post(
    "/invitations",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getPendingInvitations = async (token: string) => {
  const response = await api.get(
    "/invitations/pending",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const acceptInvitation = async (token: string, inviteToken: string) => {
  const response = await api.post(
    `/invitations/accept/${inviteToken}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
