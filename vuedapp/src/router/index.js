import { createRouter, createWebHashHistory } from 'vue-router'
import PurchaseView from '@/views/PurchaseView.vue'
import DashboardView from '@/views/DashboardView.vue'

const routes = [
  { path: '/', name: 'purchase', component: PurchaseView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router