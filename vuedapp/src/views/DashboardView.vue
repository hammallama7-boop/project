<template>
  <div>
    <div class="card">
      <h2>Dashboard</h2>
      <p>Supply: {{ state.supply }} / {{ state.max }}</p>
      <p>Price: {{ state.priceEth }} ETH</p>
      <p>You own: {{ state.balance }} Pixe Cat(s)</p>
      <button v-if="!connected" @click="handleConnect">Connect Wallet</button>
      <p v-else class="status ok">Connected: {{ shortAddress }}</p>
    </div>

    <div class="card">
      <h2>Your Cats</h2>
      <div v-if="owned.length" class="gallery">
        <Artwork
          v-for="cat in owned"
          :key="cat.tokenId"
          :image="cat.image"
          :title="cat.name"
        />
      </div>
      <p v-else class="status">No cats owned yet. Head to the Buy page!</p>
    </div>

    <div class="card">
      <h2>Collection Gallery</h2>
      <div class="gallery">
        <Artwork
          v-for="cat in gallery"
          :key="cat.tokenId"
          :image="cat.image"
          :title="cat.name"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Artwork from '@/components/Artwork.vue'
import { connect, getState, fetchTokenMetadata, readContract } from '@/lib/ethers'

const connected = ref(false)
const address = ref('')
const state = ref({ supply: 0, max: 98, priceEth: '0', paused: false, balance: 0 })
const gallery = ref([])
const owned = ref([])

const shortAddress = computed(() =>
  address.value ? address.value.slice(0, 6) + '…' + address.value.slice(-4) : '',
)

async function handleConnect() {
  const { address: addr } = await connect()
  address.value = addr
  connected.value = true
  await refresh()
}

async function refresh() {
  state.value = await getState()

  // Load metadata for every minted token (0..supply-1).
  const contract = await readContract()
  const supply = state.value.supply
  const metas = []
  for (let id = 0; id < supply; id++) {
    try {
      metas.push(await fetchTokenMetadata(id, contract))
    } catch {
      // skip entries whose metadata fails to load
    }
  }
  gallery.value = metas

  // Determine ownership for each minted token.
  const ownerMap = {}
  for (let id = 0; id < supply; id++) {
    try {
      ownerMap[id] = (await contract.ownerOf(id)).toLowerCase()
    } catch {
      ownerMap[id] = null
    }
  }
  if (address.value) {
    const mine = address.value.toLowerCase()
    owned.value = metas.filter((m) => ownerMap[m.tokenId] === mine)
  } else {
    owned.value = []
  }
}

onMounted(refresh)
</script>

<style scoped>
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}
</style>