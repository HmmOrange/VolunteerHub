const API_URL = "http://localhost:5000/api/events";

export const createEvent = async (data) => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  // Quan trọng: Parse JSON trước
  const result = await res.json();

  // Nếu status không phải 2xx (ví dụ 400, 500) thì throw lỗi kèm message từ backend
  if (!res.ok) {
    throw new Error(result.message || "Lỗi không xác định khi tạo sự kiện");
  }

  return result;
};

export const getAllEvents = async ({ approvedOnly = true } = {}) => {
  const url = approvedOnly
    ? `${API_URL}/all?approved=true`
    : `${API_URL}/all`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }
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

// Update: Giữ nguyên, đảm bảo updateData có chứa field 'slug'
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

// Delete: Backend cần slug và username
export const deleteEvent = async (data) => {
  const res = await fetch(`${API_URL}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// --- CÁC HÀM DƯỚI ĐÂY ĐÃ SỬA ĐỂ DÙNG SLUG ---

export const joinEvent = async ({ slug, userId, answer }) => {
  const res = await fetch(`${API_URL}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, userId, answer }), // Đổi eventId thành slug
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lỗi khi tham gia sự kiện");
  }
  return json; 
};

export const getPendingRequests = async (slug) => {
  // URL đổi thành /:slug/requests
  const res = await fetch(`${API_URL}/${slug}/requests`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lỗi tải danh sách yêu cầu");
  }
  return json;
};

// Hàm này giữ nguyên requestId (ID của request riêng biệt, không cần slug)
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

export const leaveEvent = async ({ slug, userId }) => {
  const res = await fetch(`${API_URL}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, userId }), // Đổi eventId thành slug
  });
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi rời sự kiện");
  return json;
};

export const removeMember = async ({ slug, memberId, managerId }) => {
  const res = await fetch(`${API_URL}/remove-member`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, memberId, managerId }), // Đổi eventId thành slug
  });
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi xóa thành viên");
  return json;
};