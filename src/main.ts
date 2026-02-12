import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './assets/main.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin)

if (import.meta.env.DEV) {
  const VueScan = await import('z-vue-scan')
  app.use(VueScan.default, {})
}

app.mount('#app')
