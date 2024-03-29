'use strict'

const { getOptions } = require('loader-utils')
const fs = require('fs')
const path = require('path')

const Module = require('module')

function exec (code, filename) {
  const module = new Module(filename, this)
  module.paths = Module._nodeModulePaths(this.context)
  module.filename = filename
  module._compile(code, filename)
  return module.exports
}

module.exports = function (content) {
  const data = JSON.parse(content)

  const {
    name,
    description = 'No description.',
    route = 'src/routes.js',
    vuex = 'src/store.js',
    extendsDir = 'src/extends',
    lifecycle = 'src/module-lifecycle.js',
    vuexNamespace = 'module',
    entry = 'src/Entry.vue',
    vueRouterBasePath = '/module'
  } = data

  const dir = path.dirname(this.resourcePath)

  const routePath = path.join(dir, route)
  const storePath = path.join(dir, vuex)
  const extendsPath = path.join(dir, extendsDir)
  const lifecyclePath = path.join(dir, lifecycle)
  const entryPath = path.join(dir, entry)

  const options = getOptions(this) || {}
  if (typeof options.export === 'undefined') {
    options.export = true
  }

  return `// This file is generated by vue-module.
// See 'https://github.com/codeciting/vue-module' for more information.

${genImport(options.export)}

var vueModule = new VueModule();

${genAddComponent('routes', routePath)}
${genAddComponent('store', storePath)}
${genAddComponent('lifecycle', lifecyclePath)}
${genAddComponent('component', entryPath)}
vueModule.add('name', ${JSON.stringify(name)});
vueModule.add('description', ${JSON.stringify(description)});
vueModule.add('vuexNamespace', ${JSON.stringify(vuexNamespace)});
vueModule.add('vueRouterBasePath', ${JSON.stringify(vueRouterBasePath)});

${genRequireDir(extendsPath, (key, module) => `vueModule.add(${key}, ${module});`)}

loadModule(vueModule);
${options.export !== 'web' ? 'module.exports = vueModule.moduleInfo.component' : ''}
`
}

/**
 * Generate add component code, when the path is exists.
 *
 * @param name
 * @param path
 * @return {string}
 */
function genAddComponent (name, path) {
  if (fs.existsSync(path)) {
    return `vueModule.add(${JSON.stringify(name)}, (function unwrap_require() { 
  var m = require(${JSON.stringify(path)});
  ${genUnwrapEsModule('m')}
  return m;
})())`
  } else {
    return `// ${name} not provided.`
  }
}

/**
 * Generate ***require*** method depends on loader option ***export***. When ***exportOption*** is ***true***, the vue
 * module is exported to another project, it will provide it's own require function to import library. When
 * ***exportOption*** is false, the vue module is included in current project, and using the semantic ***require*** will
 * import the exactly library used by the project. When the ***exportOptions*** is 'web', this vue module may imported
 * like `<script src="path/to/vue-module.js"></script>` and the require keyword is not defined, the library should
 * provide global api interface. Therefore, when ***exportOptions*** is 'web', this function should not be called.
 *
 * @param {boolean | 'web'} exportOption
 * @param path
 * @return {string}
 */
function genRequire (exportOption, path) {
  if (exportOption !== 'web') {
    return `${exportOption ? '__non_webpack_require__' : 'require'}(${JSON.stringify(path)})`
  } else {
    throw new Error('unsupported')
  }
}

/**
 * Generate import dependencies code, declare ***Vue***, ***VueModule*** and ***loadModule***. {@link genRequire}
 * describes the require logic. Especially, when ***exportOptions*** is 'web', these libraries will be imported in a
 * callback way.
 *
 * @param {boolean | 'web'}exportOption
 * @return {string}
 */
function genImport (exportOption) {
  if (typeof exportOption === 'boolean') {
    return `var Vue = ${genRequire(exportOption, 'vue')};
${genUnwrapEsModule('Vue')}
if (!Vue.__vueModuleLoadModuleCallback) {
  if (typeof window === 'undefined' || !window.hackInstallVueModule) {
    throw new Error('VueModule is not installed.');
  }
  hackInstallVueModule(document.body, {})
}
var VueModuleCoreDefault = ${genRequire(exportOption, '@codeciting/vue-module-core')};

var VueModule = VueModuleCoreDefault.default;
var loadModule = VueModuleCoreDefault.loadModule;`
  } else if (exportOption === 'web') {
    return `var VueModule, loadModule, Vue;
if (!window.__vueModuleLoadModuleCallback) {
  if (!window.hackInstallVueModule) {
     throw new Error('VueModule is not installed.');
  }
  hackInstallVueModule(document.body, {})
}
__vueModuleLoadModuleCallback(function (_vue, _ctor, _load) {
  VueModule = _ctor;
  loadModule = _load;
  Vue = _vue;
})`
  }
}

/**
 * Generate require.context and inject callback loop.
 *
 * @param dir
 * @param {function(key: string, module: string): string} genCallback
 * @return {string}
 */
function genRequireDir (dir, genCallback) {
  if (fs.existsSync(dir)) {
    return `var ctx = require.context(${JSON.stringify(dir)}, false, /\\.js(?:on)?$/)
ctx.keys().forEach(function (key) {
  var m = ctx(key);
  ${genUnwrapEsModule('m')}
  ${genCallback(`key.replace(/^\\.\\//, '').replace(/\\.js$/, '')`, 'm')}
})`
  } else {
    return `// extends not provided.`
  }
}

/**
 * Unwrap a esModule variable, will take only default and ignore all named exports.
 *
 * @param {string} varName
 * @return {string}
 */
function genUnwrapEsModule (varName) {
  return `${varName} = ${varName}.__esModule ? ${varName}.default : ${varName};`
}
