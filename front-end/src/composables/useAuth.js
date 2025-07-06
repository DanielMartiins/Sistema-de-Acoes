import { jwtDecode } from 'jwt-decode';
import { computed, ref } from 'vue';

const token = ref(localStorage.getItem('token') || null);

const user = computed(() => {
  if (!token.value) return null;
  try {
    return jwtDecode(token.value);
  } catch (e) {
    return null;
  }
});

function setToken(novoToken) {
  token.value = novoToken;
  localStorage.setItem('token', novoToken);
}

function logout() {
  token.value = null;
  localStorage.removeItem('token');
}

export function useAuth() {
  return {
    user,
    logout,
    token,
    setToken
  };
}
