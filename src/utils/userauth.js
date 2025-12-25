export function logoutUser() {
  localStorage.removeItem('skydent_user');
  localStorage.removeItem('skydent_user_token');
  localStorage.removeItem('skydent_user_base_url');
  localStorage.removeItem('theme');
  window.location.href = "/user";
}
