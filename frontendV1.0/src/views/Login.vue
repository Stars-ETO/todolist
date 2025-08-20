<template>
  <div class="login-container">
    <div class="login-form">
      <h2>用户登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名:</label>
          <input 
            type="text" 
            id="username" 
            v-model="loginForm.username" 
            required 
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码:</label>
          <input 
            type="password" 
            id="password" 
            v-model="loginForm.password" 
            required 
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>
        
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <div class="register-link">
          还没有账户？ <router-link to="/register">立即注册</router-link>
        </div>
      </form>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { login, getCurrentUser } from '@/services/auth'
import { mapActions } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loading: false,
      error: ''
    }
  },
  methods: {
    ...mapActions(['login']),
    
    async handleLogin() {
      // 防止表单重复提交
      if (this.loading) return;
      
      this.loading = true
      this.error = ''
      
      try {
        const response = await login(this.loginForm.username, this.loginForm.password)
        const { access_token } = response.data
        
        // 保存 token 到 localStorage
        localStorage.setItem('token', access_token)
        
        // 获取用户信息
        await this.fetchUserInfo()
        
        // 使用 nextTick 确保状态更新后再进行跳转
        this.$nextTick(() => {
          // 根据用户角色跳转到不同界面
          const user = this.$store.getters.currentUser;
          if (user && user.role === 'admin') {
            this.$router.push('/admin/users')
          } else {
            this.$router.push('/home')
          }
        })
      } catch (err) {
        // 提供更详细的错误信息
        if (err.response) {
          // 服务器响应了错误状态码
          if (err.response.data && err.response.data.detail) {
            if (typeof err.response.data.detail === 'string') {
              this.error = `登录失败: ${err.response.data.detail}`
            } else if (Array.isArray(err.response.data.detail)) {
              // 如果是验证错误数组
              this.error = `登录失败: ${err.response.data.detail[0].msg || '输入信息有误'}`
            } else {
              this.error = `登录失败: ${JSON.stringify(err.response.data.detail)}`
            }
          } else {
            this.error = `登录失败: 服务器错误 (${err.response.status})`
          }
        } else if (err.request) {
          // 请求已发出但没有收到响应
          this.error = '登录失败: 无法连接到服务器，请检查网络连接'
        } else {
          // 其他错误
          this.error = `登录失败: ${err.message || '未知错误'}`
        }
        console.error('Login error:', err)
      } finally {
        this.loading = false
      }
    },
    
    async fetchUserInfo() {
      try {
        // 调用真实的API获取用户信息
        const response = await getCurrentUser()
        const user = response.data
        
        // 保存用户信息到 Vuex
        await this.login(user)
        
        // 保存管理员状态到 localStorage
        localStorage.setItem('isAdmin', user.role === 'admin')
      } catch (err) {
        console.error('Failed to fetch user info:', err)
        if (err.response && err.response.status === 401) {
          // Token无效，清除本地存储
          localStorage.removeItem('token')
          localStorage.removeItem('isAdmin')
        }
        // 即使获取用户信息失败，也要继续跳转到主页
        // 因为token已经获取成功，可以在其他地方重新获取用户信息
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
  color: #000;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.login-button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.register-link a {
  color: #409eff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: #f56c6c;
  text-align: center;
  margin-top: 1rem;
}
</style>