<template>
  <v-row
    :class="[
      index % 2 !== 0 ? 'bg-secondary-lighten' : 'bg-secondary',
      'align-center',
      'linha-acao',
    ]"
    no-gutters
  >
    <v-col cols="2">{{ acao.ticker }}</v-col>

    <v-col cols="2" class="text-end">
      {{ acao.preco.toFixed(2) }}
    </v-col>

    <v-col class="text-end" :class="classePorVariacao(acao.variacaoNominal)">
      <v-icon
        v-if="acao.variacaoNominal !== 0"
        size="x-small"
        class="icon-achatado font-weight-bold"
      >
        {{ iconeVariacao(acao.variacaoNominal) }}
      </v-icon>
      <span class="numero-fixo-largura">{{ acao.variacaoNominal.toFixed(2) }}</span>
    </v-col>

    <v-col class="text-end" :class="classePorVariacao(acao.variacaoPercentual)">
      <v-icon
        v-if="acao.variacaoPercentual !== 0"
        size="x-small"
        class="icon-achatado text-weight-bold"
      >
        {{ iconeVariacao(acao.variacaoPercentual) }}
      </v-icon>
      <span class="numero-fixo-largura">{{ acao.variacaoPercentual.toFixed(2) }}%</span>
    </v-col>

    <v-col cols="3" class="text-end">
      <div class="ml-2 mr-2 d-flex justify-space-evenly">
      <v-btn
        class="mr-1"
        variant="text"
        @click="emit('removerAcao', acao.ticker, index)"
        size="normal"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
      <v-btn
        text="Comprar"
        class="ml-1 text-caption"
        color="white"
        @click="emit('comprarAcao', acao.ticker)"
        variant="outlined"
        size="x-small"
      />
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps(['acao', 'index']);
const emit = defineEmits(['removerAcao', 'trocarOrdem', 'comprarAcao']);

function classePorVariacao(valor) {
  valor = Math.round(valor * 100) / 100; //2 casas decimais
  if (valor > 0) return 'text-success';
  if (valor < 0) return 'text-error';
  return '';
}

function iconeVariacao(valor) {
  valor = Math.round(valor * 100) / 100; // 2 casas decimais
  if (valor > 0) return 'mdi-triangle-outline';
  else if (valor < 0) return 'mdi-triangle-down-outline';
  else return 'mdi-triangle-outline';
}
</script>

<style scoped>
.linha-acao {
  min-height: 35px;
}

.icon-achatado {
  transform: scaleX(0.8);
}
.bg-secondary-lighten {
  background-color: #252525;
}
.numero-fixo-largura {
  display: inline-block;
  width: 50%;
  min-width: 55px;
  max-width: 60px;
  text-align: right;
}
</style>
