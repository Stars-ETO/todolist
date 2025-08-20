<template>
  <div class="register-container">
    <div class="register-form">
      <h2>用户注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">用户名:</label>
          <input 
            type="text" 
            id="username" 
            v-model="registerForm.username" 
            required 
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label for="email">邮箱:</label>
          <input 
            type="email" 
            id="email" 
            v-model="registerForm.email" 
            required 
            placeholder="请输入邮箱"
            autocomplete="email"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码:</label>
          <input 
            type="password" 
            id="password" 
            v-model="registerForm.password" 
            required 
            placeholder="请输入密码"
            minlength="6"
            autocomplete="new-password"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码:</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="registerForm.confirmPassword" 
            required 
            placeholder="请再次输入密码"
            autocomplete="new-password"
          />
        </div>
        
        <button type="submit" class="register-button" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        
        <div class="login-link">
          已有账户？ <router-link to="/login">立即登录</router-link>
        </div>
      </form>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </div>
  </div>
</template>

<script>
import { register } from '@/services/auth'

export default {
  name: 'Register',
  data() {
    return {
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    async handleRegister() {
      // 重置消息
      this.error = ''
      this.success = ''
      
      // 验证密码确认
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.error = '两次输入的密码不一致'
        return
      }
      
      // 基本验证
      if (this.registerForm.username.length < 3) {
        this.error = '用户名至少需要3个字符'
        return
      }
      
      if (this.registerForm.password.length < 6) {
        this.error = '密码至少需要6个字符'
        return
      }
      
      // 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.registerForm.email)) {
        this.error = '请输入有效的邮箱地址'
        return
      }
      
      this.loading = true
      
      try {
        await register(
          this.registerForm.username,
          this.registerForm.email,
          this.registerForm.password
        )
        
        this.success = '注册成功！即将跳转到登录页面...'
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
          this.$router.push('/login')
        }, 3000)
      } catch (err) {
        // 提供更详细的错误信息
        if (err.response) {
          // 服务器响应了错误状态码
          if (err.response.data && err.response.data.detail) {
            if (typeof err.response.data.detail === 'string') {
              this.error = `注册失败: ${err.response.data.detail}`
            } else if (Array.isArray(err.response.data.detail)) {
              // 如果是验证错误数组
              this.error = `注册失败: ${err.response.data.detail[0].msg || '输入信息有误'}`
            } else {
              this.error = `注册失败: ${JSON.stringify(err.response.data.detail)}`
            }
          } else {
            this.error = `注册失败: 服务器错误 (${err.response.status})`
          }
        } else if (err.request) {
          // 请求已发出但没有收到响应
          this.error = '注册失败: 无法连接到服务器，请检查网络连接'
        } else {
          // 其他错误
          this.error = `注册失败: ${err.message || '未知错误'}`
        }
        console.error('Register error:', err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.register-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.register-form h2 {
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

.register-button {
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

.register-button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.login-link a {
  color: #409eff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: #f56c6c;
  text-align: center;
  margin-top: 1rem;
}

.success-message {
  color: #67c23a;
  text-align: center;
  margin-top: 1rem;
}
</style>