const API_URL = "http://localhost:5000/api/events";

export const createEvent = async (data) => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getAllEvents = async () => {
  const res = await fetch(`${API_URL}/all`);
  return res.json();
};

// === HÀM MỚI BẮT BUỘC PHẢI THÊM ===
// Hàm này lấy 1 sự kiện bằng ID
export const getEventById = async ({ eventId }) => {
  // Hàm này sẽ gọi đến: GET http://localhost:5000/api/events/[ID_CUA_SU_KIEN]
  const res = await fetch(`${API_URL}/${eventId}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch event with ID ${eventId}`);
  }
  
  return res.json();
};
// ===================================

export const updateEvent = async (data) => {
  const res = await fetch(`${API_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteEvent = async (data) => {
  const res = await fetch(`${API_URL}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};