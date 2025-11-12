export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("admin");
  
  // redirect to login
  window.location.href = "/admin";
}
