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

export const getEventBySlug = async ({ slug }) => {
  const res = await fetch(`${API_URL}/${slug}`);
  if (!res.ok) throw new Error(`Failed to fetch event with slug ${slug}`);
  return res.json();
};

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

export const joinEvent = async ({ eventId, userId }) => {
  const res = await fetch(`${API_URL}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, userId }),
  });
  return res.json();
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
