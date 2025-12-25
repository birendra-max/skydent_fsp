export function logoutUser() {
  localStorage.removeItem('skydent_designer');
  localStorage.removeItem('skydent_designer_token');
  localStorage.removeItem('skydent_designer_base_url');
  localStorage.removeItem('theme');
  window.location.href = "/designer/login";
}
