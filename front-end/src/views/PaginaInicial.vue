<template>
  <!--Diálogo para remover ação da lista -->
  <v-dialog v-model="dialogoRemocao" id="dialogo-remocao">
    <v-card rounded="lg" max-width="400" class="align-center ma-auto" elevation="24">
      <v-icon class="ma-5" color="warning" size="100px"> mdi-alert-outline </v-icon>
      <v-card-title>Remover ação da lista</v-card-title>
      <v-card-text class="text-center">
        Confirmar remoção do ticker
        <span class="font-weight-bold ma-0">{{ tickerParaRemover }}</span>
        ?
        <br />(Você poderá adicioná-lo novamente depois)
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn @click="dialogoRemocao = false">Cancelar</v-btn>
        <v-btn variant="outlined" @click="removerAcao" prepend-icon="mdi-delete" color="error"
          >Remover</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!--Conteúdo principal da página-->
  <div class="tabela-wrapper">
    <v-container class="pa-0 tabela-container">
      <h2 class="text-h2 text-center ma-2">Mercado de Ações</h2>
      <h4 class="text-h4 text-center ma-2">
        <v-icon size="30px">mdi-clock-outline</v-icon
        >{{ `14:${String(minutoNegociacao).padStart(2, '0')}` }}
      </h4>
      <div class="tabela-box">
        <!-- Cabeçalho fixo -->
        <v-row class="text-subtitle-2 bg-primary font-weight-bold pa-2 pt-1 pb-1" no-gutters>
          <v-col cols="2">Ticker</v-col>
          <v-col cols="2" class="text-end">Preço</v-col>
          <v-col class="text-end">Variação $</v-col>
          <v-col class="text-end">Variação %</v-col>
          <v-col cols="3" class="text-end"></v-col>
        </v-row>

        <!-- Parte rolável -->
        <div class="scroll-tabela d-flex h-100 flex-column">
          <LinhaAcaoInteresse
            class="pl-2 pr-2"
            @removerAcao="abrirDialogoRemocao"
            @comprarAcao="abrirDialogoCompra"
            v-for="(acao, i) in acoesInteresse"
            :key="i"
            :acao="acao"
            :index="i"
          />
          <div
            class="d-flex bg-secondary flex-column align-center justify-center w-100 h-100"
            v-if="acoesInteresse.length === 0"
          >
            <v-card class="pa-5 text-center" elevation="0">
              <v-icon size="75px">mdi-alert-box-outline</v-icon>
              <v-card-text
                >Parece que sua lista está vazia <br />Adicione ações para visualizá-las nessa
                lista!</v-card-text
              >
            </v-card>
          </div>
          <div
            class="opacity-60 d-flex bg-secondary flex-column align-center w-100 h-100"
            v-if="acoesInteresse.length !== 0"
          >
            <v-card class="d-flex text-center opacity-60" min-height="75" elevation="0">
              <v-icon class="pt-5" size="30px">mdi-information-outline</v-icon>
              <v-card-text class="text-caption">Nenhuma ação a mais para exibir.</v-card-text>
            </v-card>
          </div>
        </div>
      </div>
    </v-container>

    <!-- Botões de relógio e de adição de ação + Diálogo adição de ação-->
    <div class="d-flex">
      <div>
        <v-btn @click="abrirDialogoAdicao" class="ma-5 bg-primary" prepend-icon="mdi-plus-box">
          Adicionar ação
        </v-btn>
      </div>

      <v-dialog v-model="dialogoAdicao" max-width="400">
        <v-card rounded="lg" class="align-center ma-auto" elevation="24">
          <v-card-title class="text-h6 text-center" style="font-size: 1rem">
            Qual ação deseja adicionar?
          </v-card-title>

          <v-card-text
            class="lista-outline"
            style="max-height: 600px; overflow-y: auto; padding-top: 0"
          >
            <v-row
              class="align-center justify-center py-1"
              v-for="acao in acoesMercado.filter(
                (acaoMercado) =>
                  !acoesInteresse.some(
                    (acaoInteresse) => acaoInteresse.ticker === acaoMercado.ticker,
                  ),
              )"
              :key="acao.ticker"
              no-gutters
            >
              <v-col cols="7" class="px-2" style="font-size: 0.9rem">
                {{ acao.ticker }}
              </v-col>
              <v-col cols="5" class="px-2 text-right">
                <v-btn
                  @click="adicionarAcaoInteresse(acao.ticker)"
                  size="small"
                  min-width="80px"
                  color="success"
                  variant="outlined"
                  dense
                >
                  Adicionar
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="dialogoAdicao = false">Cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <div>
        <span></span>
        <v-btn
          text="+1 Min"
          :disabled="minutoNegociacao + 1 >= 60"
          @click="avancarRelogio(1)"
          class="mt-5 mr-1 bg-secondary-lighten-2"
        />
        <v-btn
          text="+5 Min"
          :disabled="minutoNegociacao + 5 >= 60"
          @click="avancarRelogio(5)"
          class="mt-5 ml-1 bg-secondary-lighten-2"
        />
      </div>
    </div>
  </div>

  <DialogoCompra
    :ticker="tickerParaComprar"
    :preco="precoTickerParaComprar"
    v-model="dialogoCompra"
    @compraFinalizada="mostrarMensagem"
  ></DialogoCompra>
  <MensagemSucesso class="popup-mensagem" v-if="mensagemSucesso" :mensagem="mensagemSucesso" />
  <MensagemErro class="popup-mensagem" v-if="mensagemErro" :mensagem="mensagemErro" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LinhaAcaoInteresse from '@/components/LinhaAcaoInteresse.vue';
import axios from 'axios';
import { config } from '@/config';
import DialogoCompra from '@/components/DialogoCompra.vue';
import MensagemErro from '@/components/MensagemErro.vue';
import MensagemSucesso from '@/components/MensagemSucesso.vue';

const mensagemSucesso = ref('');
const mensagemErro = ref('');

function mostrarMensagem({ sucesso, mensagem }) {
  if (sucesso) {
    mensagemSucesso.value = mensagem;
    setTimeout(() => (mensagemSucesso.value = ''), 10000);
  } else {
    mensagemErro.value = mensagem;
    setTimeout(() => (mensagemErro.value = ''), 10000);
  }
}

const acoesInteresse = ref([]);
const minutoNegociacao = ref(0);
const acoesMercado = ref([]);

const dialogoRemocao = ref(false);
const tickerParaRemover = ref('');
const indexParaRemover = ref('');

const dialogoAdicao = ref(false);
const dialogoCompra = ref(false);
const tickerParaComprar = ref('');
const precoTickerParaComprar = ref(0);
function abrirDialogoCompra(ticker, preco) {
  tickerParaComprar.value = ticker;
  precoTickerParaComprar.value = preco;
  dialogoCompra.value = true;
}

async function removerAcao() {
  try {
    await axios.delete(`${config.apiUrl}/acoes/acaoInteresse/remover`, {
      data: {
        ordemAcao: indexParaRemover.value + 1,
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    acoesInteresse.value.splice(indexParaRemover.value, 1);
    dialogoRemocao.value = false;
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function buscarAcoesInteresse() {
  try {
    const response = await axios.get(`${config.apiUrl}/acoes/acaoInteresse`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function buscarAcoesMercado() {
  try {
    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/0.json`;
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    return [];
  }
}

function abrirDialogoRemocao(ticker, index) {
  tickerParaRemover.value = ticker;
  indexParaRemover.value = index;
  dialogoRemocao.value = true;
}

async function abrirDialogoAdicao() {
  acoesMercado.value = await buscarAcoesMercado();
  dialogoAdicao.value = true;
}

async function adicionarAcaoInteresse(ticker) {
  try {
    await axios.post(
      `${config.apiUrl}/acoes/acaoInteresse/adicionar`,
      { ticker: ticker },
      {
        headers: {
          Authorization: `Bearer: ${localStorage.getItem('token')}`,
        },
      },
    );
    acoesInteresse.value = await buscarAcoesInteresse();
  } catch (err) {
    console.log(err);
  } finally {
    dialogoAdicao.value = false;
  }
}

async function obterMinutoNegociacao() {
  const response = await axios.get(`${config.apiUrl}/acoes/horaNegociacao`, {
    headers: {
      Authorization: `Bearer: ${localStorage.getItem('token')}`,
    },
  });
  const minuto = response.data;
  return minuto;
}

async function avancarRelogio(acrescimo) {
  const token = localStorage.getItem('token');
  const novoMinuto = minutoNegociacao.value + parseInt(acrescimo);

  try {
    const response = await axios.put(
      `${config.apiUrl}/acoes/horaNegociacao/atualizar`,
      { novoMinuto },
      {
        headers: {
          Authorization: `Bearer: ${token}`, // com dois pontos, conforme seu backend
        },
      },
    );

    console.log(response.data.message); // "Hora de negociação atualizada para 14:xx com sucesso."
    // aqui você pode atualizar UI, exibir alerta, etc.
  } catch (err) {
    if (err.response) {
      console.error('Erro do servidor:', err.response.data.message);
    } else {
      console.error('Erro de rede:', err.message);
    }
  }

  minutoNegociacao.value = await obterMinutoNegociacao();
  acoesInteresse.value = await buscarAcoesInteresse();
}

onMounted(async () => {
  acoesInteresse.value = await buscarAcoesInteresse();
  minutoNegociacao.value = await obterMinutoNegociacao();
});
</script>

<style scoped>
.popup-mensagem {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  width: auto;
  max-width: 300px;
}

.tabela-wrapper {
  height: 100vh;
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.tabela-container {
  width: 99%;
  max-width: 1080px;
}

.tabela-box {
  border: 2px solid #3f51b5;
  height: 380px;
  overflow: hidden;
  border-radius: 5px;
}

.scroll-tabela {
  max-height: 480px;
  overflow-y: auto;
}

.bg-secondary-lighten-2 {
  background-color: #303030;
}

.lista-outline {
  max-height: 300px;
  border-radius: 5px;
  border: 1px solid #303030;
}

::v-deep(.v-btn.v-btn--disabled) {
  opacity: 0.3 !important; /* evita que fique apagado demais */
  background-color: #272727 !important; /* cor de fundo quando desativado */
  cursor: not-allowed;
}
</style>
