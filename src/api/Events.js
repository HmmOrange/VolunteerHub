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

  const res = await fetch(url, {
      headers: getHeaders()
  });

  // TRƯỜNG HỢP 1: Thành công (200-299)
  // Trả về JSON ngay lập tức, không làm gì thêm để tránh lỗi parse
  if (res.ok) {
    return res.json();
  }

  // TRƯỜNG HỢP 2: Có lỗi (403, 404, 500...)
  // Chúng ta cố gắng đọc body để lấy message lỗi từ backend
  let errorMessage = `Lỗi tải sự kiện (Mã: ${res.status})`;
  
  try {
    const errorData = await res.json(); // Cố đọc JSON lỗi
    if (errorData && errorData.message) {
      errorMessage = errorData.message; // Lấy message từ backend nếu có
    }
  } catch (e) {
    // Nếu backend trả về lỗi dạng HTML hoặc text thường (không phải JSON)
    // thì bỏ qua bước parse JSON và dùng message mặc định ở trên
    console.error("Không thể đọc lỗi chi tiết từ backend:", e);
  }

  // Tạo object lỗi và gắn status code vào để VNavBar nhận diện (403 hay 404)
  const error = new Error(errorMessage);
  error.status = res.status; 
  throw error;
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

export const updateMemberAttendance = async ({ slug, userId, attendance, requesterId }) => {
  const res = await fetch(`${API_URL}/${slug}/attendance`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ userId, attendance, requesterId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi cập nhật trạng thái tham gia");
  return json;
};

