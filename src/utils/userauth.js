export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // redirect to login
  window.location.href = "/user";
}
