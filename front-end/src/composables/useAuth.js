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

const isTokenExpired = computed(() => {
  if (!token.value) return true;
  try {
    if (!user.value || !user.value.exp) return true;

    //Pois Date.now() é medido em milissegundos, e exp em segundos
    const nowInSeconds = Date.now() / 1000
    return nowInSeconds > user.value.exp;
  } catch (e) {
    return true;
  }
})

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
    setToken,
    isTokenExpired,
  };
}
