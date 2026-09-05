<template>
  <div id="app">
    <header class="app-header">
      <h1>Pixelated Catworks</h1>
      <nav>
        <RouterLink to="/">Buy</RouterLink>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #14161c;
  color: #eef1f6;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: #1d2028;
  border-bottom: 1px solid #2c303b;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
}

.app-header nav a {
  color: #b8c2d9;
  text-decoration: none;
  margin-left: 18px;
  font-weight: 600;
}

.app-header nav a.router-link-exact-active {
  color: #7aa2ff;
}

main {
  max-width: 920px;
  margin: 0 auto;
  padding: 28px;
}

button {
  background: #3b5bd8;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card {
  background: #1d2028;
  border: 1px solid #2c303b;
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 18px;
}

.status {
  min-height: 20px;
  margin-top: 14px;
  font-size: 14px;
}

.status.ok {
  color: #6fe3a1;
}

.status.err {
  color: #ff7b7b;
}
</style>