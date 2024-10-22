import axios from "axios";

axios.interceptors.request.use(function (config) {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
  }

  // config.headers['Cookie'] = `user=${localStorage.getItem("token")}`;
  // config.withCredentials = true;

  return config;
}, function (error) {
  return Promise.reject(error);
});
