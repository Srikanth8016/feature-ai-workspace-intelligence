import api from "@/lib/api";

export const getSubscription = async (token: string) => {
  const response = await api.get("/billing/subscription", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createCheckoutSession = async (token: string) => {
  const response = await api.post(
    "/billing/create-checkout-session",
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const createPortalSession = async (token: string) => {
  const response = await api.post(
    "/billing/create-portal-session",
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
