<template>
  <div>
    <div class="card">
      <h2>Buy a Pixel Cat</h2>
      <p>Supply: {{ state.supply }} / {{ state.max }}</p>
      <p>Price: {{ state.priceEth }} ETH</p>
      <p v-if="state.paused" class="status err">Sale is paused.</p>
      <div v-if="!connected">
        <button @click="handleConnect">Connect Wallet</button>
      </div>
      <div v-else>
        <p class="status ok">Connected: {{ shortAddress }}</p>
        <button :disabled="state.paused || buying" @click="handleBuy">
          {{ buying ? 'Buying…' : `Buy a Pixel Cat (${state.priceEth} ETH)` }}
        </button>
      </div>
      <p class="status" :class="statusClass">{{ message }}</p>
    </div>

    <div v-if="purchasedToken" class="card">
      <h3>Artwork Preview</h3>
      <Artwork :image="purchasedToken.image" :title="'PixelCatworks Token ' + purchasedToken.tokenId" />
      <button @click="purchaseConfirmed">Confirm Purchase</button>
      <button class="ghost" @click="clearPreview">Discard</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Artwork from '@/components/Artwork.vue'
import { connect, getState, purchase, fetchTokenMetadata } from '@/lib/ethers'

const router = useRouter()
const connected = ref(false)
const address = ref('')
const buying = ref(false)
const message = ref('')
const messageType = ref('')
const state = ref({ supply: 0, max: 98, priceEth: '0', paused: false })
const purchasedToken = ref(null)

const shortAddress = computed(() =>
  address.value ? address.value.slice(0, 6) + '…' + address.value.slice(-4) : '',
)

const statusClass = computed(() => messageType.value)

function setMessage(msg, type = '') {
  message.value = msg
  messageType.value = type
}

async function refreshState() {
  try {
    state.value = await getState()
  } catch (err) {
    setMessage(err.message || String(err), 'err')
  }
}

async function handleConnect() {
  try {
    const { address: addr } = await connect()
    address.value = addr
    connected.value = true
    setMessage('Connected: ' + addr.slice(0, 6) + '…' + addr.slice(-4), 'ok')
    await refreshState()
  } catch (err) {
    setMessage(err.message || String(err), 'err')
  }
}

async function handleBuy() {
  buying.value = true
  setMessage('Buying… please confirm in your wallet')
  try {
    const tokenId = await purchase()
    setMessage('Purchased token ' + tokenId + '! Fetching artwork…', 'ok')
    const meta = await fetchTokenMetadata(tokenId)
    purchasedToken.value = meta
    await refreshState()
  } catch (err) {
    setMessage(err.reason || err.message || String(err), 'err')
  } finally {
    buying.value = false
  }
}

function clearPreview() {
  purchasedToken.value = null
}

function purchaseConfirmed() {
  router.push('/dashboard')
}

onMounted(refreshState)
</script>

<style scoped>
.ghost {
  background: transparent;
  border: 1px solid #3a4150;
  margin-left: 10px;
  color: #b8c2d9;
}
</style>