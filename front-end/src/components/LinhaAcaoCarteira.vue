<template>
  <v-row
    :class="[
      index % 2 !== 0 ? 'bg-secondary-lighten' : 'bg-secondary',
      'align-center',
      'linha-acao',
    ]"
    no-gutters
  >
    <v-col cols="1" class="text-start">{{ acao.ticker }}</v-col>

    <v-col class="text-center">
      {{ acao.precoMedioCompra.toFixed(2) }}
    </v-col>

    <v-col class="text-center">
      <span class="numero-fixo-largura">{{ acao.precoMedioVenda.toFixed(2) }}</span>
    </v-col>

    <v-col class="text-center">
      <span class="numero-fixo-largura">{{ acao.qtde }}</span>
    </v-col>

    <v-col class="text-center">
      <span class="numero-fixo-largura">{{ acao.qtdeVendida }}</span>
    </v-col>

    <v-col class="text-center">
      <span class="numero-fixo-largura" :class="classeCorPorValor(acao.resultado.toFixed())">{{
        acao.resultado.toFixed(2)
      }}</span>
    </v-col>

    <v-col class="text-end">
      <div class="ml-2 mr-2 d-flex justify-end">
        <v-btn
          :disabled="acao.qtde === 0"
          text="Vender"
          class="ml-1 text-caption"
          color="white"
          @click="emit('venderAcao', acao.ticker)"
          variant="outlined"
          size="x-small"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps(['acao', 'index']);
const emit = defineEmits(['venderAcao']);

function classeCorPorValor(valor) {
  valor = Math.round(valor * 100) / 100; //2 casas decimais
  if (valor > 0) return 'text-success';
  if (valor < 0) return 'text-error';
  return '';
}

function iconeVariacao(valor) {
  valor = Math.round(valor * 100) / 100; // 2 casas decimais
  if (valor > 0) return 'mdi-cash-plus';
  else if (valor < 0) return 'mdi-cash-minus';
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
  text-align: center;
}
</style>
