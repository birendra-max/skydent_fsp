export function logoutUser() {
  localStorage.removeItem('skydent_admin');
  localStorage.removeItem('skydent_admin_token');
  localStorage.removeItem('skydent_admin_base_url');
  localStorage.removeItem('theme');
  window.location.href = "/admin";
}
