<script setup>
import { ref, onMounted, getCurrentInstance, computed } from 'vue'
import axios from 'axios'

const { appContext } = getCurrentInstance()
const config = appContext.config.globalProperties.config
const credentials = appContext.config.globalProperties.credentials

const acoes = ref([])
const minutoAtual = ref(0)
const estadoAnterior = ref({})
const mudancas = ref({})
const erroMinuto = ref(null)

const horaFormatada = computed(() => {
  const hora = 14
  const minuto = (minutoAtual.value).toString().padStart(2, '0')
  return `${hora}:${minuto}`
})

onMounted(async () => {
  await carregarMinutoInicial()
  await carregarAcoes()
})

async function carregarMinutoInicial() {
  try {
    const resp = await axios.get(`${config.url}/usuario/hora`, {
      headers: { Authorization: `Bearer ${credentials.value}` },
    })
    const horaStr = resp.data?.ultima_hora_negociacao
    const minuto = parseInt(horaStr?.split(':')[1]) || 0
    minutoAtual.value = minuto
  } catch (err) {
    console.error('Erro ao obter minuto inicial:', err)
  }
}

async function carregarAcoes() {
  try {
    const response = await axios.get(`${config.url}/acoes`, {
      headers: { Authorization: `Bearer ${credentials.value}` },
    })
    const novaLista = response.data
    detectarMudancas(novaLista)
    estadoAnterior.value = mapearPorTicker(novaLista)
    acoes.value = novaLista
  } catch (err) {
    console.error('Erro ao carregar ações:', err)
  }
}

async function avancarMinuto(qtde) {
  const novoMinuto = minutoAtual.value + qtde
  if (novoMinuto > 59) return

  try {
    const resp = await axios.put(
      `${config.url}/acoes/atualizar-hora-negociacao`,
      { novoMinuto },
      {
        headers: { Authorization: `Bearer ${credentials.value}` },
      }
    )

    minutoAtual.value = novoMinuto
    erroMinuto.value = null
    await carregarAcoes()
  } catch (err) {
    console.error('Erro ao avançar minuto:', err)
    erroMinuto.value =
      err.response?.data?.message || 'Erro ao tentar atualizar o horário.'
  }
}

function detectarMudancas(novas) {
  mudancas.value = {}

  novas.forEach((nova) => {
    const antiga = estadoAnterior.value[nova.ticker]
    if (!antiga) return

    const campos = ['preco', 'variacao_valor', 'variacao_percentual']
    campos.forEach((campo) => {
      if (nova[campo] !== antiga[campo]) {
        const id = `${nova.ticker}-${campo}`
        mudancas.value[id] = true
        setTimeout(() => delete mudancas.value[id], 1000)
      }
    })
  })
}

function mapearPorTicker(lista) {
  const map = {}
  lista.forEach((a) => {
    map[a.ticker] = a
  })
  return map
}

function formatarPreco(valor, sinal = false) {
  const numero = Number(valor).toFixed(2).replace('.', ',')
  return `${sinal && valor > 0 ? '+' : ''}${numero}`
}

function formatarPorcentagem(valor) {
  const numero = Number(valor).toFixed(2).replace('.', ',')
  return `${valor >= 0 ? '+' : ''}${numero}%`
}

function getClasseVariacao(valor) {
  return valor >= 0 ? 'text-green' : 'text-red'
}

function getCellClass(ticker, campo) {
  const id = `${ticker}-${campo}`
  return mudancas.value[id] ? 'flash' : ''
}
</script>

<template>
  <v-app>
    <v-container>
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-h5 font-weight-bold">Mercado - {{ horaFormatada }}</h2>
        <div>
          <v-btn @click="avancarMinuto(1)" class="mr-2" color="primary">+1 min</v-btn>
          <v-btn @click="avancarMinuto(5)" color="secondary">+5 min</v-btn>
        </div>
      </div>

      <v-alert v-if="erroMinuto" type="error" class="mb-4">
        {{ erroMinuto }}
      </v-alert>

      <v-card>
        <v-table>
          <thead class="bg-grey-darken-3 white--text">
            <tr>
              <th>Ticker</th>
              <th>Preço</th>
              <th>Variação $</th>
              <th>Variação %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="acao in acoes" :key="acao.ticker">
              <td>{{ acao.ticker }}</td>
              <td :class="getCellClass(acao.ticker, 'preco')">
                {{ formatarPreco(acao.preco) }}
              </td>
              <td
                :class="[
                  getClasseVariacao(acao.variacao_valor),
                  getCellClass(acao.ticker, 'variacao_valor'),
                ]"
              >
                <span v-if="acao.variacao_valor >= 0">▲</span>
                <span v-else>▼</span>
                {{ formatarPreco(acao.variacao_valor, true) }}
              </td>
              <td
                :class="[
                  getClasseVariacao(acao.variacao_percentual),
                  getCellClass(acao.ticker, 'variacao_percentual'),
                ]"
              >
                <span v-if="acao.variacao_percentual >= 0">▲</span>
                <span v-else>▼</span>
                {{ formatarPorcentagem(acao.variacao_percentual) }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-container>
  </v-app>
</template>

<style>
.flash {
  animation: flash-change 1s ease-in-out;
}
@keyframes flash-change {
  0% {
    background-color: #ffff99;
  }
  100% {
    background-color: transparent;
  }
}
</style>
