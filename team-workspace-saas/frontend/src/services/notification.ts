import api from "@/lib/api";

export const getNotifications = async (
  token: string
) => {
  const response = await api.get(
    "/notifications",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const markNotificationAsRead = async (
  token: string,
  notificationId: number
) => {
  const response = await api.put(
    `/notifications/${notificationId}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const deleteNotification = async (
  token: string,
  notificationId: number
) => {
  const response = await api.delete(
    `/notifications/${notificationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
