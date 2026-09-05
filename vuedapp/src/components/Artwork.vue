<template>
  <div class="artwork-container">
    <img :src="image" :alt="title" />
    <p>{{ title }}</p>
  </div>
</template>

<script>
export default {
  name: 'Artwork',
  props: {
    image: { type: String, required: true },
    title: { type: String, default: '' },
  },
}
</script>

<style>
.artwork-container {
  text-align: center;
  margin-bottom: 20px;
}

img {
  max-width: 100%;
  height: auto;
}
</style>