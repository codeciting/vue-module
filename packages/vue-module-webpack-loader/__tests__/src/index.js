import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import { plugin } from '@codeciting/vue-module-core'

Vue.use(Vuex)
Vue.use(VueRouter)

const store = new Vuex.Store({})
const router = new VueRouter({
  routes: [
    {
      path: '/',
      component: {
        render (h) {return h('vue-router')}
      }
    }]
})

new Vue({
  el: document.getElementById('app'),
  components: {
    SimpleModule: () => import('./module/vue-module-info.json')
  },
  render (h) {
    return h('div', [
      h('router-link', {props: {to: '/module/test/test'}}, ['go']),
      h('router-view'),
      h('SimpleModule')
    ])
  },
  store,
  router
})

// hackInstallVueModule(document.body, {})
