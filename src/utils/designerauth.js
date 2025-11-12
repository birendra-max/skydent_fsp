export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("designer");
  
  // redirect to login
  window.location.href = "/designer/login";
}
