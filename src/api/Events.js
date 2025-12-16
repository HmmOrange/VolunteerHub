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

export const getEventBySlug = async ({ slug, userId }) => {
  const url = userId 
    ? `${API_URL}/${slug}?userId=${userId}` 
    : `${API_URL}/${slug}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch event with slug ${slug}`);
  return res.json();
};

export const updateEvent = async (updateData) => {
  const res = await fetch(`${API_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lỗi cập nhật sự kiện");
  }
  return json;
};

export const deleteEvent = async (data) => {
  const res = await fetch(`${API_URL}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const joinEvent = async ({ eventId, userId, answer }) => {
  const res = await fetch(`${API_URL}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, userId, answer }), // Gửi kèm answer
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lỗi khi tham gia sự kiện");
  }
  return json; // Trả về { message, status: 'joined' | 'pending' }
};

export const getPendingRequests = async (eventId) => {
  const res = await fetch(`${API_URL}/${eventId}/requests`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lỗi tải danh sách yêu cầu");
  }
  return json; // Trả về mảng các request
};

export const respondToJoinRequest = async ({ requestId, action, managerId }) => {
  const res = await fetch(`${API_URL}/request/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, action, managerId }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lỗi xử lý yêu cầu");
  }
  return json;
};

export const leaveEvent = async ({ eventId, userId }) => {
  const res = await fetch(`${API_URL}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, userId }),
  });
  return res.json();
};

export const removeMember = async ({ eventId, memberId, managerId }) => {
  const res = await fetch(`${API_URL}/remove-member`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, memberId, managerId }),
  });
  return res.json();
};
