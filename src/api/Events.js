/**
 * API Events - các hàm gọi tới backend liên quan tới Event
 * Bao gồm: tạo/cập nhật/xóa event, join/leave, upload banner/badge, quản lý requests, tìm kiếm và lấy events của user.
 */
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

// --- HÀM CHỈ LẤY AUTH (CHO UPLOAD) ---
const getAuthOnlyHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Not authenticated");
  }
  return {
    "Authorization": `Bearer ${token}`,
  };
};

/**
 * Tạo Event mới (createEvent)
 * - Input: `data` là object chứa fields của event.
 * - Output: trả về object kết quả từ backend hoặc ném Error khi thất bại.
 */
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

/**
 * Lấy danh sách events (getAllEvents)
 * - Param: `approvedOnly` - nếu true thì chỉ lấy events đã approved.
 */
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

/**
 * Tìm kiếm events (searchEvents)
 * - Input: `query` (string)
 * - Output: mảng events hoặc ném Error.
 */
// Search events
export const searchEvents = async (query = "") => {
  try {
    const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: getHeaders(),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Lỗi tìm kiếm");
    }
    
    const result = await res.json();
    console.log("API searchEvents result:", result);
    return result;
  } catch (error) {
    console.error("searchEvents API error:", error);
    throw error;
  }
};


/**
 * Lấy chi tiết Event theo slug hoặc id (getEventBySlug)
 * - Input: `{ slug, userId }` (userId optional để tính isJoined/isManager ở backend)
 * - Output: object event hoặc ném Error (kèm status).
 */
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

/**
 * Cập nhật Event (updateEvent)
 * - Input: object `updateData` chứa slug và các trường cần cập nhật hoặc action.
 */
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

/**
 * Xóa Event (deleteEvent)
 * - Input: `data` chứa slug và username của người thao tác.
 */
export const deleteEvent = async (data) => {
  const res = await fetch(`${API_URL}/delete`, {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// --- CÁC HÀM TƯƠNG TÁC ---

/**
 * Gửi yêu cầu tham gia / join Event (joinEvent)
 * - Input: `{ slug, userId, answer }`. Trả về trạng thái hoặc ném Error.
 */
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

/**
 * Lấy danh sách pending join requests cho event (getPendingRequests)
 */
export const getPendingRequests = async (slug) => {
  const res = await fetch(`${API_URL}/${slug}/requests`, {
    method: "GET",
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi tải danh sách yêu cầu");
  return json;
};

/**
 * Manager xử lý join request (respondToJoinRequest)
 * - Input: `{ requestId, action, managerId }`.
 */
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

/**
 * Rời event (leaveEvent)
 */
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

/**
 * Xóa thành viên khỏi event (removeMember)
 */
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

/**
 * Cập nhật attendance cho một member (updateMemberAttendance)
 */
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

// --- UPLOAD BANNER ---
export const uploadBanner = async (slug, file) => {
  // Tạo FormData để upload file
  const formData = new FormData();
  formData.append("banner", file);

  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/${slug}/banner`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      // Không set Content-Type, browser tự set với boundary cho multipart/form-data
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Upload banner failed");
  }
  return res.json();
};

// --- UPLOAD BADGE ---
export const uploadBadge = async (slug, file) => {
  const formData = new FormData();
  formData.append('badge', file);
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${slug}/badge`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Lỗi tải ảnh badge');
  }
  return res.json();
};

// --- SAVE CONTRIBUTIONS ---
export const saveContributions = async (slug, contributions) => {
  const res = await fetch(`${API_URL}/${slug}/contributions`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ contributions })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Lỗi lưu đóng góp');
  return json;
};

// --- GET USER'S JOINED EVENTS ---
export const getUserEvents = async (userId) => {
  const res = await fetch(`${API_URL}/user/${userId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi tải sự kiện của người dùng");
  return json;
};
