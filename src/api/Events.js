const API_URL = "http://localhost:5000/api/events";

// --- HÀM LẤY HEADER KÈM TOKEN ---
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    // Nếu có token thì gửi, không thì thôi
    "Authorization": token ? `Bearer ${token}` : "", 
  };
};

export const createEvent = async (data) => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: getHeaders(), // <--- Đã thay bằng getHeaders()
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Lỗi tạo sự kiện");
  return result;
};

export const getAllEvents = async () => {
  const res = await fetch(`${API_URL}/all`, {
      headers: getHeaders() // Thêm vào cả hàm GET để server biết ai đang gọi
  });
  return res.json();
};

export const getEventBySlug = async ({ slug, userId }) => {
  const url = userId 
    ? `${API_URL}/${slug}?userId=${userId}` 
    : `${API_URL}/${slug}`;

  const res = await fetch(url, {
      headers: getHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch event with slug ${slug}`);
  return res.json();
};

export const updateEvent = async (updateData) => {
  const res = await fetch(`${API_URL}/update`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi cập nhật sự kiện");
  return json;
};

export const deleteEvent = async (data) => {
  const res = await fetch(`${API_URL}/delete`, {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// --- CÁC HÀM TƯƠNG TÁC ---

export const joinEvent = async ({ slug, userId, answer }) => {
  const res = await fetch(`${API_URL}/join`, {
    method: "POST",
    headers: getHeaders(), // <--- QUAN TRỌNG: Cần Token để biết ai Join
    body: JSON.stringify({ slug, userId, answer }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi tham gia sự kiện");
  return json; 
};

export const getPendingRequests = async (slug) => {
  const res = await fetch(`${API_URL}/${slug}/requests`, {
    method: "GET",
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi tải danh sách yêu cầu");
  return json;
};

export const respondToJoinRequest = async ({ requestId, action, managerId }) => {
  const res = await fetch(`${API_URL}/request/respond`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ requestId, action, managerId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi xử lý yêu cầu");
  return json;
};

export const leaveEvent = async ({ slug, userId }) => {
  const res = await fetch(`${API_URL}/leave`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ slug, userId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi rời sự kiện");
  return json;
};

export const removeMember = async ({ slug, memberId, managerId }) => {
  const res = await fetch(`${API_URL}/remove-member`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ slug, memberId, managerId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi xóa thành viên");
  return json;
};