'use strict'

export default class VueModule {
  /**
   * @param {string} entry
   * @param {Vue} rootComponent
   * @param {*}other
   */
  constructor ({ entry, rootComponent, ...other } = {}) {
    this.moduleInfo = {
      entry,
      ...other
    }
  }

  add (name, options) {
    this.moduleInfo[name] = options
  }
}

let _router, _store
let handlers

export function plugin (Vue, { router, routes, store, component, lifecycle, ...restHandlers }) {
  if (Vue.__vueModuleLoadModuleCallback) {
    return
  }
  _router = router
  _store = store
  handlers = restHandlers

  handlers.routes = function (routes) {
    if (!_router) {
      console.warn('[vue-module] App does not support router.')
    } else {
      _router.addRoutes([
        {
          name: this.name,
          path: this.vueRouterBasePath,
          children: routes,
          component: {
            render (h) {
              return h('router-view')
            }
          }
        }
      ])
      console.log([
        {
          name: this.name,
          path: this.vueRouterBasePath,
          children: routes,
          component: {
            functional: true,
            render (h) {
              return h('router-view')
            }
          }
        }
      ])
    }
  }

  handlers.store = function (store) {
    if (!_store) {
      console.warn('[vue-module] App does not support vuex.')
    } else {
      _store.registerModule(this.vuexNamespace, Object.assign(store, { namespace: true }))
    }
  }

  Vue.__vueModuleLoadModuleCallback = function (cb) {
    cb(Vue, VueModule, loadModule)
  }

  if (typeof window !== 'undefined') {
    window.__vueModuleLoadModuleCallback = Vue.__vueModuleLoadModuleCallback
  }
}

export function loadModule (vueModule) {
  const moduleInfo = vueModule.moduleInfo
  if (moduleInfo.name) {
    console.debug('[vue-module] Loading vue module "%s": %s', moduleInfo.name, moduleInfo.description)
  }
  for (const key in handlers) {
    if (handlers.hasOwnProperty(key)) {
      if (key in moduleInfo) {
        handlers[key].call(moduleInfo, moduleInfo[key])
      }
    }
  }

  // Call lifecycle.
  if ('lifecycle' in moduleInfo) {
    if ('onLoad' in moduleInfo.lifecycle) {
      moduleInfo.lifecycle.onLoad.call(vueModule)
      return
    }
  }
  console.debug('[vue-module] "%s" Loaded.', moduleInfo.name)
}

if (typeof window !== 'undefined') {

  /**
   * TODO: Use BFS
   * @param el
   * @param {{[string]: function}} handlers
   */
  window.hackInstallVueModule = function (el = document.body, handlers) {
    function hackInstall (el, handlers) {
      for (const e of el.children) {
        if ('__vue__' in e) {
          plugin(e.__vue__.constructor,
            Object.assign({}, handlers, {
              store: e.__vue__.$store,
              router: e.__vue__.$router
            }))
          return true
        }
        if (hackInstall(e, handlers)) {
          return true
        }
      }
      return false
    }

    if (hackInstall(el, handlers)) {
      console.warn('[vue-module:hack-install] VueModule is not installed previously, hackInstallVueModule will use' +
        ' default options. See https://github.com/codeciting/vue-module')
    } else {
      console.error('[vue-module:hack-install] No vue instance detected.')
    }
  }
}
