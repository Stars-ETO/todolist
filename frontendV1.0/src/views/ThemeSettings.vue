<template>
  <div class="theme-settings-container">
    <header class="theme-settings-header">
      <h1>主题设置</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <el-card class="theme-settings-card">
      <div class="setting-group">
        <h3>主题模式</h3>
        <el-radio-group v-model="settings.theme" @change="applyTheme">
          <el-radio label="light">浅色</el-radio>
          <el-radio label="dark">深色</el-radio>
          <el-radio label="auto">自动</el-radio>
        </el-radio-group>
      </div>
      
      <div class="setting-group">
        <h3>主题颜色</h3>
        <div class="color-options">
          <div 
            v-for="color in themeColors" 
            :key="color.name"
            class="color-option"
            :class="{ active: settings.themeColor === color.value }"
            @click="selectThemeColor(color.value)"
          >
            <div 
              class="color-preview" 
              :style="{ backgroundColor: color.value }"
            ></div>
            <span>{{ color.name }}</span>
          </div>
        </div>
      </div>
      
      <div class="setting-group">
        <h3>夜间模式亮度</h3>
        <el-radio-group 
          v-model="settings.nightModeBrightness" 
          @change="applyNightModeBrightness"
          :disabled="settings.theme === 'light'"
        >
          <el-radio label="normal">正常</el-radio>
          <el-radio label="dim">微暗</el-radio>
          <el-radio label="dark">较暗</el-radio>
        </el-radio-group>
      </div>
      
      <div class="setting-group">
        <h3>通知设置</h3>
        <el-switch
          v-model="settings.notification_enabled"
          active-text="启用通知"
          inactive-text="禁用通知"
          @change="applyNotificationSetting"
        />
      </div>
      
      <div class="setting-group">
        <h3>默认提醒方式</h3>
        <el-select 
          v-model="settings.default_reminder_method" 
          placeholder="请选择默认提醒方式"
          @change="applyReminderMethod"
        >
          <el-option label="弹窗" value="popup" />
          <el-option label="声音" value="sound" />
          <el-option label="标记" value="mark" />
        </el-select>
      </div>
      
      <div class="setting-actions">
        <el-button 
          type="primary" 
          @click="saveSettings"
          :loading="saving"
        >
          保存设置
        </el-button>
        <el-button @click="resetSettings">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { updateProfileSettings } from '@/services/auth'

export default {
  name: 'ThemeSettings',
  data() {
    return {
      settings: {
        theme: 'light',
        themeColor: '#409eff',
        nightModeBrightness: 'normal',
        notification_enabled: true,
        default_reminder_method: 'popup'
      },
      saving: false,
      predefinedColors: [
        '#409eff', // 蓝色
        '#67c23a', // 绿色
        '#e6a23c', // 橙色
        '#f56c6c', // 红色
        '#909399', // 灰色
        '#ff78ff'  // 粉色
      ]
    }
  },
  computed: {
    ...mapGetters(['settings']),
    themeColors() {
      return [
        { name: '蓝色', value: '#409eff' },
        { name: '绿色', value: '#67c23a' },
        { name: '橙色', value: '#e6a23c' },
        { name: '红色', value: '#f56c6c' },
        { name: '灰色', value: '#909399' },
        { name: '粉色', value: '#ff78ff' }
      ]
    }
  },
  created() {
    // 初始化设置
    this.initializeSettings()
  },
  methods: {
    ...mapActions(['updateUserSettings']),
    
    goBack() {
      this.$router.go(-1)
    },
    
    initializeSettings() {
      // 从 Vuex 获取当前设置
      if (this.settings) {
        Object.assign(this.settings, this.settings)
      }
    },
    
    async saveSettings() {
      this.saving = true
      try {
        // 保存设置到后端
        const response = await updateProfileSettings(this.settings)
        
        // 更新 Vuex 中的设置
        this.updateUserSettings(response.data)
        
        // 应用设置
        this.applyAllSettings()
        
        this.$message.success('设置保存成功')
      } catch (error) {
        console.error('Failed to save settings:', error)
        this.$message.error('设置保存失败')
      } finally {
        this.saving = false
      }
    },
    
    resetSettings() {
      this.$confirm('确定要重置所有设置吗？', '确认重置', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 重置为默认设置
        const defaultSettings = {
          theme: 'light',
          themeColor: '#409eff',
          nightModeBrightness: 'normal',
          notification_enabled: true,
          default_reminder_method: 'popup'
        }
        
        Object.assign(this.settings, defaultSettings)
        this.applyAllSettings()
        this.$message.success('设置已重置')
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    // 应用所有设置
    applyAllSettings() {
      this.applyTheme()
      this.applyThemeColor()
      this.applyNightModeBrightness()
      this.applyNotificationSetting()
      this.applyReminderMethod()
    },
    
    // 应用主题设置
    applyTheme() {
      const theme = this.settings.theme
      if (theme === 'auto') {
        // 自动模式：根据时间切换
        const hour = new Date().getHours()
        document.body.setAttribute('data-theme', (hour >= 18 || hour <= 6) ? 'dark' : 'light')
      } else {
        document.body.setAttribute('data-theme', theme)
      }
    },
    
    // 应用主题颜色
    applyThemeColor() {
      document.documentElement.style.setProperty('--theme-color', this.settings.themeColor)
    },
    
    // 应用夜间模式亮度
    applyNightModeBrightness() {
      if (this.settings.theme !== 'light') {
        document.body.setAttribute('data-brightness', this.settings.nightModeBrightness)
      }
    },
    
    // 应用通知设置
    applyNotificationSetting() {
      // 这里可以添加通知设置的逻辑
      console.log('Notification setting changed:', this.settings.notification_enabled)
    },
    
    // 应用提醒方式
    applyReminderMethod() {
      // 这里可以添加提醒方式的逻辑
      console.log('Reminder method changed:', this.settings.default_reminder_method)
    },
    
    // 选择主题颜色
    selectThemeColor(color) {
      this.settings.themeColor = color
      this.applyThemeColor()
    }
  }
}
</script>

<style scoped>
.theme-settings-container {
  padding: 20px;
  background-color: #fff;
  min-height: 100vh;
}

.theme-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.theme-settings-header h1 {
  margin: 0;
  color: #000;
}

.return-button {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.return-button:hover {
  background-color: #5a6268;
}

.theme-settings-card {
  background-color: #fff;
  color: #000;
}

.setting-group {
  margin-bottom: 30px;
}

.setting-group h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #000;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.color-option.active .color-preview {
  border: 2px solid #409eff;
  transform: scale(1.1);
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.setting-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

/* 主题相关样式 */
:root {
  --theme-color: #409eff;
}

body[data-theme="dark"] {
  background-color: #ffffff;
  color: #000000;
}

body[data-theme="dark"] .theme-settings-container,
body[data-theme="dark"] .theme-settings-card {
  background-color: #ffffff;
  color: #000000;
}

body[data-brightness="dim"] {
  opacity: 0.9;
}

body[data-brightness="dark"] {
  opacity: 0.8;
}
</style>