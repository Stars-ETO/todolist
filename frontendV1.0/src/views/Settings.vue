<template>
  <div class="settings-container">
    <header class="settings-header">
      <h1>个人设置</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="个人信息" name="profile">
          <div class="settings-section">
            <h2>个人信息</h2>
            <form @submit.prevent="updateProfile">
              <div class="form-group">
                <label for="username">用户名:</label>
                <input 
                  type="text" 
                  id="username" 
                  v-model="profileForm.username" 
                  :disabled="updatingProfile"
                />
              </div>
              
              <div class="form-group">
                <label for="email">邮箱:</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="profileForm.email" 
                  :disabled="updatingProfile"
                />
              </div>
              
              <div class="form-group">
                <label for="nickname">昵称:</label>
                <input 
                  type="text" 
                  id="nickname" 
                  v-model="profileForm.nickname" 
                  :disabled="updatingProfile"
                />
              </div>
              
              <div class="form-group">
                <label for="bio">个人简介:</label>
                <textarea 
                  id="bio" 
                  v-model="profileForm.bio" 
                  rows="3"
                  :disabled="updatingProfile"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                class="update-button" 
                :disabled="updatingProfile"
              >
                {{ updatingProfile ? '更新中...' : '更新个人信息' }}
              </button>
            </form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="界面设置" name="interface">
          <div class="settings-section">
            <h2>界面设置</h2>
            <form @submit.prevent="updateInterfaceSettings">
              <div class="form-group">
                <label>主题:</label>
                <div class="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      v-model="settingsForm.theme" 
                      value="light"
                      :disabled="updatingSettings"
                    /> 浅色
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      v-model="settingsForm.theme" 
                      value="dark"
                      :disabled="updatingSettings"
                    /> 深色
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      v-model="settingsForm.theme" 
                      value="auto"
                      :disabled="updatingSettings"
                    /> 自动
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label for="themeColor">主题颜色:</label>
                <input 
                  type="color" 
                  id="themeColor" 
                  v-model="settingsForm.themeColor" 
                  :disabled="updatingSettings"
                />
              </div>
              
              <div class="form-group">
                <label>夜间模式亮度:</label>
                <div class="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      v-model="settingsForm.nightModeBrightness" 
                      value="normal"
                      :disabled="updatingSettings"
                    /> 正常
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      v-model="settingsForm.nightModeBrightness" 
                      value="dim"
                      :disabled="updatingSettings"
                    /> 微暗
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      v-model="settingsForm.nightModeBrightness" 
                      value="dark"
                      :disabled="updatingSettings"
                    /> 较暗
                  </label>
                </div>
              </div>
              
              <button 
                type="submit" 
                class="update-button" 
                :disabled="updatingSettings"
              >
                {{ updatingSettings ? '更新中...' : '更新界面设置' }}
              </button>
              
              <div class="form-group">
                <button 
                  type="button" 
                  class="advanced-settings-button" 
                  @click="goToThemeSettings"
                >
                  高级主题设置
                </button>
              </div>
            </form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="提醒设置" name="notification">
          <div class="settings-section">
            <h2>提醒设置</h2>
            <form @submit.prevent="updateNotificationSettings">
              <div class="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    v-model="notificationForm.notification_enabled"
                    :disabled="updatingNotification"
                  /> 启用提醒
                </label>
              </div>
              
              <div class="form-group">
                <label>默认提醒方式:</label>
                <div class="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      v-model="notificationForm.default_reminder_method" 
                      value="popup"
                      :disabled="updatingNotification"
                    /> 弹窗
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      v-model="notificationForm.default_reminder_method" 
                      value="sound"
                      :disabled="updatingNotification"
                    /> 声音
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      v-model="notificationForm.default_reminder_method" 
                      value="mark"
                      :disabled="updatingNotification"
                    /> 标记
                  </label>
                </div>
              </div>
              
              <button 
                type="submit" 
                class="update-button" 
                :disabled="updatingNotification"
              >
                {{ updatingNotification ? '更新中...' : '更新提醒设置' }}
              </button>
            </form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="安全设置" name="security">
          <div class="settings-section">
            <h2>安全设置</h2>
            <form @submit.prevent="changePassword">
              <div class="form-group">
                <label for="currentPassword">当前密码:</label>
                <input 
                  type="password" 
                  id="currentPassword" 
                  v-model="passwordForm.current_password" 
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="newPassword">新密码:</label>
                <input 
                  type="password" 
                  id="newPassword" 
                  v-model="passwordForm.new_password" 
                  required
                  minlength="6"
                />
              </div>
              
              <div class="form-group">
                <label for="confirmNewPassword">确认新密码:</label>
                <input 
                  type="password" 
                  id="confirmNewPassword" 
                  v-model="passwordForm.confirm_new_password" 
                  required
                />
              </div>
              
              <button 
                type="submit" 
                class="update-button" 
                :disabled="changingPassword"
              >
                {{ changingPassword ? '修改中...' : '修改密码' }}
              </button>
            </form>
            
            <div class="danger-zone">
              <h3>危险操作</h3>
              <button @click="deleteAccount" class="delete-account-button">
                删除账户
              </button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { 
  updateCurrentUser, 
  updateProfileSettings, 
  changePassword,
  deleteAccount
} from '@/services/auth'

export default {
  name: 'Settings',
  data() {
    return {
      activeTab: 'profile',
      updatingProfile: false,
      updatingSettings: false,
      updatingNotification: false,
      changingPassword: false,
      profileForm: {
        username: '',
        email: '',
        nickname: '',
        avatar_url: '',
        bio: ''
      },
      settingsForm: {
        theme: 'light',
        themeColor: '#ffffff',
        nightModeBrightness: 'normal'
      },
      notificationForm: {
        notification_enabled: true,
        default_reminder_method: 'popup'
      },
      passwordForm: {
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      },
      message: '',
      messageType: 'success'
    }
  },
  computed: {
    ...mapGetters(['currentUser', 'appSettings'])
  },
  created() {
    this.initializeForms()
  },
  methods: {
    ...mapActions(['fetchCurrentUser', 'updateSetting']),
    
    goBack() {
      this.$router.go(-1)
    },
    
    initializeForms() {
      // 初始化个人信息表单
      if (this.currentUser) {
        this.profileForm.username = this.currentUser.username || ''
        this.profileForm.email = this.currentUser.email || ''
        this.profileForm.nickname = this.currentUser.nickname || ''
        this.profileForm.avatar_url = this.currentUser.avatar_url || ''
        this.profileForm.bio = this.currentUser.bio || ''
      }
      
      // 初始化界面设置表单
      this.settingsForm.theme = this.appSettings.theme || 'light'
      this.settingsForm.themeColor = this.appSettings.themeColor || '#ffffff'
      this.settingsForm.nightModeBrightness = this.appSettings.nightModeBrightness || 'normal'
      
      // 初始化提醒设置表单
      this.notificationForm.notification_enabled = this.appSettings.notification_enabled !== false
      this.notificationForm.default_reminder_method = this.appSettings.default_reminder_method || 'popup'
    },
    
    async updateProfile() {
      this.updatingProfile = true
      this.message = ''
      
      try {
        await updateCurrentUser(this.profileForm)
        await this.fetchCurrentUser()
        this.showMessage('个人信息更新成功', 'success')
      } catch (error) {
        console.error('Failed to update profile:', error)
        this.showMessage('更新个人信息失败', 'error')
      } finally {
        this.updatingProfile = false
      }
    },
    
    async updateInterfaceSettings() {
      this.updatingSettings = true
      this.message = ''
      
      try {
        await updateProfileSettings(this.settingsForm)
        // 更新 Vuex 中的设置
        this.updateSetting(this.settingsForm)
        this.showMessage('界面设置更新成功', 'success')
        
        // 应用主题设置
        this.applyThemeSettings()
      } catch (error) {
        console.error('Failed to update interface settings:', error)
        this.showMessage('更新界面设置失败', 'error')
      } finally {
        this.updatingSettings = false
      }
    },
    
    async updateNotificationSettings() {
      this.updatingNotification = true
      this.message = ''
      
      try {
        await updateProfileSettings(this.notificationForm)
        // 更新 Vuex 中的设置
        this.updateSetting(this.notificationForm)
        this.showMessage('提醒设置更新成功', 'success')
      } catch (error) {
        console.error('Failed to update notification settings:', error)
        this.showMessage('更新提醒设置失败', 'error')
      } finally {
        this.updatingNotification = false
      }
    },
    
    async changePassword() {
      // 验证新密码和确认密码是否一致
      if (this.passwordForm.new_password !== this.passwordForm.confirm_new_password) {
        this.showMessage('新密码和确认密码不一致', 'error')
        return
      }
      
      this.changingPassword = true
      this.message = ''
      
      try {
        await changePassword({
          current_password: this.passwordForm.current_password,
          new_password: this.passwordForm.new_password
        })
        this.showMessage('密码修改成功', 'success')
        // 清空密码表单
        this.passwordForm.current_password = ''
        this.passwordForm.new_password = ''
        this.passwordForm.confirm_new_password = ''
      } catch (error) {
        console.error('Failed to change password:', error)
        this.showMessage('密码修改失败', 'error')
      } finally {
        this.changingPassword = false
      }
    },
    
    deleteAccount() {
      this.$confirm('确定要删除账户吗？此操作不可撤销。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 这里应该弹出对话框要求用户输入密码进行确认
          const password = prompt('请输入密码以确认删除账户:')
          if (password) {
            await deleteAccount(password)
            this.$message.success('账户删除成功')
            // 退出登录
            this.$store.dispatch('logout')
            this.$router.push('/login')
          }
        } catch (error) {
          console.error('Failed to delete account:', error)
          this.$message.error('删除账户失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    applyThemeSettings() {
      // 应用主题设置到页面
      document.body.className = document.body.className.replace(/theme-\w+/, '')
      document.body.classList.add(`theme-${this.settingsForm.theme}`)
      
      if (this.settingsForm.theme === 'dark') {
        document.body.classList.add('night-mode')
      } else {
        document.body.classList.remove('night-mode')
      }
    },
    
    showMessage(text, type) {
      this.message = text
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 3000)
    },
    
    goToThemeSettings() {
      this.$router.push('/settings/theme')
    }
  }
}
</script>

<style scoped>
.settings-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.settings-header h1 {
  margin: 0;
  color: #333;
}

.settings-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.settings-section h3 {
  margin-bottom: 1rem;
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
  color: #000;
}

.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0;
  font-weight: normal;
}

.update-button {
  padding: 0.75rem 1.5rem;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.update-button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.update-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.danger-zone {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #f56c6c;
  border-radius: 4px;
}

.delete-account-button {
  padding: 0.75rem 1.5rem;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.delete-account-button:hover {
  background-color: #f78989;
}

.advanced-settings-button {
  padding: 0.75rem 1.5rem;
  background-color: #909399;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.advanced-settings-button:hover:not(:disabled) {
  background-color: #a6a9ad;
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  z-index: 1000;
}

.message.success {
  background-color: #67c23a;
}

.message.error {
  background-color: #f56c6c;
}
</style>