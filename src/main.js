import { createApp } from 'vue';
import App from './App.vue';

import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';

const app = createApp(App);

// 使用 inject 方法加载全局变量

const apiUrl = 'http://192.168.31.214:24999';

const globalData = {
    apiUrl,
    clientUrl: apiUrl + '/DaenWxHook/client/'
}

app.provide('global', globalData);

app.use(ElementPlus);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.mount('#app');
