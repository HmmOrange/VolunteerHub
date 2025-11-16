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

// === THAY THẾ HÀM CŨ BẰNG HÀM NÀY ===
// Hàm này lấy 1 sự kiện bằng SLUG
export const getEventBySlug = async ({ slug }) => {
  // Hàm này sẽ gọi đến: GET http://localhost:5000/api/events/ten-su-kien
  const res = await fetch(`${API_URL}/${slug}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch event with slug ${slug}`);
  }
  
  return res.json();
};
// ===================================

export const updateEvent = async (data) => {
  // LƯU Ý: Đảm bảo data gửi lên chứa 'slug' thay vì 'eventId'
  const res = await fetch(`${API_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteEvent = async (data) => {
  // LƯU Ý: Đảm bảo data gửi lên chứa 'slug' thay vì 'eventId'
  const res = await fetch(`${API_URL}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};