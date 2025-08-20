<template>
  <div class="task-detail-container">
    <header class="task-detail-header">
      <h1>任务详情</h1>
      <div class="header-actions">
        <button @click="goBack" class="return-button">返回</button>
        <router-link 
          v-if="task && task.status !== 'deleted'" 
          :to="`/tasks/${taskId}/edit`" 
          class="edit-button"
        >
          编辑任务
        </router-link>
      </div>
    </header>
    
    <div class="task-detail-content" v-loading="loading">
      <div v-if="task" class="task-card">
        <div class="task-header">
          <h2 :class="{ 'completed': task.status === 'completed' }">
            {{ task.title }}
          </h2>
          <div class="task-meta">
            <el-tag :type="getPriorityTagType(task.priority)" class="meta-item">
              {{ getPriorityText(task.priority) }}优先级
            </el-tag>
            <el-tag :type="getStatusTagType(task.status)" class="meta-item">
              {{ getStatusText(task.status) }}
            </el-tag>
            <span v-if="task.category" class="category meta-item">
              {{ task.category.name }}
            </span>
          </div>
        </div>
        
        <div class="task-info">
          <div class="info-row">
            <label>描述:</label>
            <div class="info-value">
              {{ task.description || '无描述' }}
            </div>
          </div>
          
          <div class="info-row">
            <label>截止日期:</label>
            <div class="info-value" :class="{ 'overdue': isOverdue(task.due_date) && task.status !== 'completed' }">
              {{ task.due_date ? formatDate(task.due_date) : '未设置' }}
            </div>
          </div>
          
          <div class="info-row">
            <label>创建时间:</label>
            <div class="info-value">
              {{ formatDate(task.created_at) }}
            </div>
          </div>
          
          <div class="info-row">
            <label>更新时间:</label>
            <div class="info-value">
              {{ formatDate(task.updated_at) }}
            </div>
          </div>
          
          <div class="info-row">
            <label>是否公开:</label>
            <div class="info-value">
              {{ task.is_public ? '是' : '否' }}
            </div>
          </div>
        </div>
        
        <div class="task-reminders">
          <div class="section-header">
            <h3>任务提醒</h3>
            <el-button 
              type="primary" 
              size="small" 
              @click="addReminder"
              :disabled="task.status === 'deleted'"
            >
              添加提醒
            </el-button>
          </div>
          
          <el-table :data="taskReminders" style="width: 100%" v-if="taskReminders.length > 0">
            <el-table-column prop="reminder_time" label="提醒时间" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.reminder_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="reminder_type" label="提醒类型" width="120">
              <template #default="scope">
                {{ getReminderTypeText(scope.row.reminder_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="method" label="提醒方式" width="120">
              <template #default="scope">
                {{ getReminderMethodText(scope.row.method) }}
              </template>
            </el-table-column>
            <el-table-column prop="is_active" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.is_active ? 'success' : 'info'">
                  {{ scope.row.is_active ? '激活' : '未激活' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button 
                    size="small" 
                    @click="toggleReminderStatus(scope.row)"
                    :type="scope.row.is_active ? 'warning' : 'success'"
                    plain
                  >
                    {{ scope.row.is_active ? '停用' : '激活' }}
                  </el-button>
                  <el-button size="small" @click="editReminder(scope.row)" plain>
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteReminder(scope.row)" plain>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-else class="no-reminders">
            <p>该任务暂无提醒</p>
          </div>
        </div>
        
        <div class="task-actions">
          <button 
            v-if="task.status !== 'completed' && task.status !== 'deleted'"
            @click="markAsCompleted"
            class="complete-button"
          >
            标记为已完成
          </button>
          <button 
            v-if="task.status === 'completed'"
            @click="markAsPending"
            class="reopen-button"
          >
            重新打开
          </button>
          <button 
            v-if="task.status !== 'deleted'"
            @click="goToCollaboration"
            class="collaboration-button"
          >
            协同管理
          </button>
          <button 
            v-if="task.status !== 'deleted'"
            @click="deleteTask"
            class="delete-button"
          >
            删除任务
          </button>
        </div>
      </div>
      
      <div v-else class="no-task">
        未找到任务
      </div>
    </div>
    
    <!-- 创建/编辑提醒对话框 -->
    <el-dialog 
      v-model="showReminderDialog" 
      :title="editingReminder ? '编辑提醒' : '创建提醒'" 
      width="600px"
    >
      <el-form :model="reminderForm" :rules="reminderRules" ref="reminderFormRef" label-width="120px">
        <el-form-item label="提醒时间" prop="reminder_time">
          <el-date-picker
            v-model="reminderForm.reminder_time"
            type="datetime"
            placeholder="选择提醒时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="提醒类型" prop="reminder_type">
          <el-select v-model="reminderForm.reminder_type" placeholder="选择提醒类型">
            <el-option label="一次性" value="once" />
            <el-option label="每日" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="提醒方式" prop="method">
          <el-select v-model="reminderForm.method" placeholder="选择提醒方式">
            <el-option label="弹窗" value="popup" />
            <el-option label="声音" value="sound" />
            <el-option label="标记" value="mark" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="reminderForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReminderDialog = false">取消</el-button>
          <el-button type="primary" @click="saveReminder" :loading="savingReminder">
            {{ savingReminder ? '保存中...' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { 
  getTask, 
  updateTask, 
  deleteTask 
} from '@/services/tasks'
import { 
  getTaskReminders, 
  createReminder, 
  updateReminder, 
  deleteReminder as deleteReminderAPI,
  activateReminder,
  deactivateReminder
} from '@/services/reminders'

export default {
  name: 'TaskDetail',
  data() {
    return {
      taskId: this.$route.params.id,
      task: null,
      taskReminders: [],
      loading: false,
      savingReminder: false,
      showReminderDialog: false,
      editingReminder: null,
      
      // 提醒表单
      reminderForm: {
        reminder_time: '',
        reminder_type: 'once',
        method: 'popup',
        is_active: true
      },
      reminderRules: {
        reminder_time: [
          { required: true, message: '请选择提醒时间', trigger: 'change' }
        ],
        reminder_type: [
          { required: true, message: '请选择提醒类型', trigger: 'change' }
        ],
        method: [
          { required: true, message: '请选择提醒方式', trigger: 'change' }
        ]
      },
      reminderFormRef: null
    }
  },
  created() {
    this.loadTask()
  },
  methods: {
    ...mapActions(['setCurrentTask']),
    
    async loadTask() {
      this.loading = true
      try {
        const response = await getTask(this.taskId)
        this.task = response.data
        
        // 更新 Vuex 状态
        this.setCurrentTask(this.task)
        
        // 加载任务提醒
        this.loadTaskReminders()
      } catch (error) {
        console.error('Failed to load task:', error)
        this.$message.error('加载任务详情失败')
      } finally {
        this.loading = false
      }
    },
    
    async loadTaskReminders() {
      try {
        const response = await getTaskReminders(this.taskId)
        this.taskReminders = response.data.items || response.data
      } catch (error) {
        console.error('Failed to load task reminders:', error)
        this.$message.error('加载任务提醒失败')
      }
    },
    
    goBack() {
      this.$router.go(-1)
    },
    
    async markAsCompleted() {
      try {
        const response = await updateTask(this.taskId, { status: 'completed' })
        this.task = response.data
        this.$message.success('任务已标记为已完成')
        
        // 更新 Vuex 状态
        this.setCurrentTask(this.task)
      } catch (error) {
        console.error('Failed to mark task as completed:', error)
        this.$message.error('更新任务状态失败')
      }
    },
    
    async markAsPending() {
      try {
        const response = await updateTask(this.taskId, { status: 'pending' })
        this.task = response.data
        this.$message.success('任务已重新打开')
        
        // 更新 Vuex 状态
        this.setCurrentTask(this.task)
      } catch (error) {
        console.error('Failed to mark task as pending:', error)
        this.$message.error('更新任务状态失败')
      }
    },
    
    deleteTask() {
      this.$confirm(`确定要删除任务 "${this.task.title}" 吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteTask(this.taskId)
          this.$message.success('任务已移至回收站')
          this.$router.push('/tasks')
        } catch (error) {
          console.error('Failed to delete task:', error)
          this.$message.error('删除任务失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    // 提醒相关方法
    addReminder() {
      this.editingReminder = null
      this.reminderForm = {
        reminder_time: '',
        reminder_type: 'once',
        method: 'popup',
        is_active: true
      }
      this.showReminderDialog = true
    },
    
    editReminder(reminder) {
      this.editingReminder = reminder
      this.reminderForm = { ...reminder }
      this.showReminderDialog = true
    },
    
    async deleteReminder(reminder) {
      this.$confirm(
        `确定要删除该提醒吗？`, 
        '警告', 
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await deleteReminderAPI(reminder.id)
          this.$message.success('提醒删除成功')
          this.loadTaskReminders()
        } catch (error) {
          console.error('Failed to delete reminder:', error)
          this.$message.error('提醒删除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    async toggleReminderStatus(reminder) {
      try {
        if (reminder.is_active) {
          await deactivateReminder(reminder.id)
          this.$message.success('提醒已停用')
        } else {
          await activateReminder(reminder.id)
          this.$message.success('提醒已激活')
        }
        this.loadTaskReminders()
      } catch (error) {
        console.error('Failed to toggle reminder status:', error)
        this.$message.error('操作失败')
      }
    },
    
    async saveReminder() {
      this.$refs.reminderFormRef.validate(async (valid) => {
        if (valid) {
          this.savingReminder = true
          try {
            // 添加任务ID到表单数据
            const reminderData = {
              ...this.reminderForm,
              task_id: this.taskId
            }
            
            let response
            if (this.editingReminder) {
              response = await updateReminder(this.editingReminder.id, reminderData)
              this.$message.success('提醒更新成功')
            } else {
              response = await createReminder(reminderData)
              this.$message.success('提醒创建成功')
            }
            
            this.showReminderDialog = false
            this.editingReminder = null
            this.loadTaskReminders()
          } catch (error) {
            console.error('Failed to save reminder:', error)
            this.$message.error(this.editingReminder ? '提醒更新失败' : '提醒创建失败')
          } finally {
            this.savingReminder = false
          }
        }
      })
    },
    
    // 工具方法
    getPriorityTagType(priority) {
      switch (priority) {
        case 'high': return 'danger'
        case 'medium': return 'warning'
        case 'low': return 'success'
        default: return 'info'
      }
    },
    
    getPriorityText(priority) {
      switch (priority) {
        case 'high': return '高'
        case 'medium': return '中'
        case 'low': return '低'
        default: return priority
      }
    },
    
    getStatusTagType(status) {
      switch (status) {
        case 'pending': return 'info'
        case 'in_progress': return 'warning'
        case 'completed': return 'success'
        case 'deleted': return 'danger'
        default: return 'info'
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'pending': return '待处理'
        case 'in_progress': return '进行中'
        case 'completed': return '已完成'
        case 'deleted': return '已删除'
        default: return status
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return ''
      const date = new Date(dateTimeString)
      return date.toLocaleString('zh-CN')
    },
    
    isOverdue(dateString) {
      if (!dateString) return false
      const dueDate = new Date(dateString)
      const now = new Date()
      return dueDate < now
    },
    
    getReminderTypeText(type) {
      switch (type) {
        case 'once': return '一次性'
        case 'daily': return '每日'
        case 'weekly': return '每周'
        case 'monthly': return '每月'
        default: return type
      }
    },
    
    getReminderMethodText(method) {
      switch (method) {
        case 'popup': return '弹窗'
        case 'sound': return '声音'
        case 'mark': return '标记'
        default: return method
      }
    },
    
    goToCollaboration() {
      this.$router.push(`/tasks/${this.taskId}/collaboration`)
    }
  }
}
</script>

<style scoped>
.task-detail-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.task-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.task-detail-header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.edit-button {
  padding: 0.5rem 1rem;
  background-color: #409eff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.edit-button:hover {
  background-color: #66b1ff;
}

.task-detail-content {
  padding: 2rem;
}

.task-card {
  background-color: #fff;
  border: 1px solid #eaecef;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-header {
  margin-bottom: 2rem;
}

.task-header h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.task-header h2.completed {
  text-decoration: line-through;
  color: #909399;
}

.task-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  margin-right: 0.5rem;
}

.category {
  padding: 0.25rem 0.5rem;
  background-color: #f0f2f5;
  border-radius: 4px;
  color: #606266;
}

.task-info {
  margin-bottom: 2rem;
}

.info-row {
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.info-row label {
  width: 100px;
  font-weight: bold;
  color: #666;
}

.info-row .info-value {
  flex: 1;
  color: #333;
}

.info-row .info-value.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.task-reminders {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.no-reminders {
  text-align: center;
  padding: 1rem;
  color: #909399;
}

.task-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.complete-button,
.reopen-button,
.delete-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.complete-button {
  background-color: #67c23a;
  color: white;
}

.complete-button:hover {
  background-color: #85ce61;
}

.reopen-button {
  background-color: #409eff;
  color: white;
}

.reopen-button:hover {
  background-color: #66b1ff;
}

.delete-button {
  background-color: #f56c6c;
  color: white;
}

.delete-button:hover {
  background-color: #f78989;
}

.collaboration-button {
  background-color: #909399;
  color: white;
}

.collaboration-button:hover {
  background-color: #a6a9ad;
}

.no-task {
  text-align: center;
  padding: 2rem;
  color: #909399;
  font-size: 1.2rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}
</style>