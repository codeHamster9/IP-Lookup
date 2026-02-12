import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './assets/main.css'
import App from './App.vue'
import VueScan, { type VueScanOptions } from 'z-vue-scan'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin)
app.use<VueScanOptions>(VueScan, {})

app.mount('#app')
