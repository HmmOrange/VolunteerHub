export const isRequired = (v) => (v === undefined || v === null || (typeof v === 'string' && !v.trim()) ? 'Trường này là bắt buộc' : '');
export const minLength = (v, len) => (typeof v === 'string' && v.trim().length < len ? `Phải có tối thiểu ${len} ký tự` : '');
export const isEmail = (v) => {
  if (!v) return '';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(v) ? '' : 'Email không hợp lệ';
};
export const isUsername = (v) => {
  if (!v) return '';
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  return re.test(v) ? '' : 'Tên đăng nhập 3-20 ký tự, chỉ chữ/số/_';
};
export const isStrongPassword = (v) => {
  if (!v) return '';
  const re = /^(?=.*[0-9])(?=.*[!@#$%^&*()_\-+={}\[\]|\\:;"'<>.,.?/~`]).{8,}$/;
  return re.test(v) ? '' : 'Mật khẩu phải >=8 ký tự, chứa số và ký tự đặc biệt';
};
export const isNotFutureDate = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
  const today = new Date();
  const dNoTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const tNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dNoTime > tNoTime ? 'Ngày không thể ở tương lai' : '';
};

export default {
  isRequired,
  minLength,
  isEmail,
  isUsername,
  isStrongPassword,
  isNotFutureDate,
};
