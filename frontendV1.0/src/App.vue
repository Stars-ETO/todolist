<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <template v-if="Component">
        <Suspense>
          <component :is="Component" />
        </Suspense>
      </template>
    </router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
  background-color: #fff;
  color: #000;
}

/* 夜间模式下的全白背景 */
.night-mode {
  background-color: #fff;
  color: #000;
}

/* 表单元素样式 */
input, textarea, select {
  background-color: #fff;
  color: #000;
  border: 1px solid #ddd;
}

input::placeholder, textarea::placeholder {
  color: #999;
}

button {
  cursor: pointer;
}

/* 返回按钮样式 */
.return-button {
  background-color: #6c757d;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
}

/* 错误边界样式 */
.error-boundary {
  padding: 2rem;
  text-align: center;
  color: #f56c6c;
}
</style>