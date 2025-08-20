<template>
  <div class="home-container">
    <header class="header">
      <h1>TodoList 应用</h1>
      <div class="user-info">
        <span v-if="currentUser">欢迎, {{ currentUser?.username || '用户' }}!</span>
        <button @click="handleLogout" class="logout-button">退出登录</button>
      </div>
    </header>
    
    <nav class="navigation">
      <router-link to="/tasks" class="nav-link" @click.prevent="$router.push('/tasks')">任务管理</router-link>
      <router-link to="/categories" class="nav-link" @click.prevent="$router.push('/categories')">分类管理</router-link>
      <router-link to="/reminders" class="nav-link" @click.prevent="$router.push('/reminders')">提醒管理</router-link>
      <router-link to="/trash" class="nav-link" @click.prevent="$router.push('/trash')">回收站</router-link>
      <router-link to="/statistics" class="nav-link" @click.prevent="$router.push('/statistics')">数据统计</router-link>
      <router-link to="/settings" class="nav-link" @click.prevent="$router.push('/settings')">个人设置</router-link>
      <router-link v-if="isAdmin" to="/admin/users" class="nav-link" @click.prevent="$router.push('/admin/users')">用户管理</router-link>
    </nav>
    
    <main class="main-content">
      <div class="welcome-message">
        <h2>欢迎使用 TodoList 应用</h2>
        <p>在这里您可以高效地管理您的任务和时间。</p>
      </div>
      
      <div class="quick-actions">
        <h3>快速操作</h3>
        <div class="action-buttons">
          <router-link to="/tasks/create" class="action-button" @click.prevent="$router.push('/tasks/create')">
            创建新任务
          </router-link>
          <router-link to="/tasks" class="action-button" @click.prevent="$router.push('/tasks')">
            查看所有任务
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Home',
  computed: {
    ...mapGetters(['currentUser', 'isAdmin'])
  },
  methods: {
    ...mapActions(['logout']),
    
    handleLogout() {
      this.logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #fff;
  color: #000;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #409eff;
  color: white;
}

.header h1 {
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-button {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #f78989;
}

.navigation {
  display: flex;
  background-color: #f5f5f5;
  padding: 0 2rem;
}

.nav-link {
  padding: 1rem;
  text-decoration: none;
  color: #333;
  border-bottom: 2px solid transparent;
}

.nav-link:hover {
  border-bottom-color: #409eff;
}

.nav-link.router-link-exact-active {
  border-bottom-color: #409eff;
  font-weight: bold;
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-message {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-message h2 {
  margin-bottom: 1rem;
  color: #333;
}

.welcome-message p {
  color: #666;
  font-size: 1.1rem;
}

.quick-actions h3 {
  margin-bottom: 1rem;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.75rem 1.5rem;
  background-color: #409eff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.action-button:hover {
  background-color: #66b1ff;
}
</style>