<template>
  <div class="reminder-management-container">
    <header class="reminder-management-header">
      <h1>提醒管理</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="reminder-management-content">
      <div class="filters">
        <div class="filter-group">
          <label for="task-filter">任务:</label>
          <el-select 
            v-model="filters.task_id" 
            placeholder="选择任务" 
            clearable
            filterable
          >
            <el-option
              v-for="task in tasks"
              :key="task.id"
              :label="task.title"
              :value="task.id"
            />
          </el-select>
        </div>
        
        <div class="filter-group">
          <label for="status-filter">状态:</label>
          <el-select v-model="filters.is_active" placeholder="选择状态" clearable>
            <el-option label="激活" :value="true" />
            <el-option label="未激活" :value="false" />
          </el-select>
        </div>
        
        <el-button type="primary" @click="applyFilters">应用筛选</el-button>
      </div>
      
      <el-table
        :data="reminders"
        style="width: 100%; margin-top: 1rem;"
        v-loading="loading"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="task.title" label="任务标题" min-width="200" />
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
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <div class="action-buttons">
              <el-button 
                size="small" 
                @click="toggleReminderStatus(scope.row)"
                :type="scope.row.is_active ? 'warning' : 'success'"
              >
                {{ scope.row.is_active ? '停用' : '激活' }}
              </el-button>
              <el-button size="small" @click="editReminder(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteReminder(scope.row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="total > 0"
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </div>
    
    <!-- 创建/编辑提醒对话框 -->
    <el-dialog 
      v-model="showReminderDialog" 
      :title="editingReminder ? '编辑提醒' : '创建提醒'" 
      width="600px"
    >
      <el-form :model="reminderForm" :rules="reminderRules" ref="reminderFormRef" label-width="120px">
        <el-form-item label="任务" prop="task_id">
          <el-select 
            v-model="reminderForm.task_id" 
            placeholder="选择任务" 
            filterable
            :disabled="!!taskIdFromRoute"
            id="reminder-task-id"
            name="reminder-task-id"
            autocomplete="off"
          >
            <el-option
              v-for="task in tasks"
              :key="task.id"
              :label="task.title"
              :value="task.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="提醒时间" prop="reminder_time">
          <el-date-picker
            v-model="reminderForm.reminder_time"
            type="datetime"
            placeholder="选择提醒时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
            id="reminder-time"
            name="reminder-time"
            autocomplete="off"
          />
        </el-form-item>
        
        <el-form-item label="提醒类型" prop="reminder_type">
          <el-select v-model="reminderForm.reminder_type" placeholder="选择提醒类型"
            id="reminder-type"
            name="reminder-type"
            autocomplete="off">
            <el-option label="一次性" value="once" />
            <el-option label="每日" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="提醒方式" prop="method">
          <el-select v-model="reminderForm.method" placeholder="选择提醒方式"
            id="reminder-method"
            name="reminder-method"
            autocomplete="off">
            <el-option label="弹窗" value="popup" />
            <el-option label="声音" value="sound" />
            <el-option label="标记" value="mark" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="reminderForm.is_active"
            id="reminder-is-active"
            name="reminder-is-active"
            autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReminderDialog = false">取消</el-button>
          <el-button type="primary" @click="saveReminder" :loading="saving">
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getTasks } from '@/services/tasks'

export default {
  name: 'ReminderManagement',
  data() {
    return {
      tasks: [],
      reminders: [],
      loading: false,
      saving: false,
      showReminderDialog: false,
      editingReminder: null,
      
      // 筛选条件
      filters: {
        task_id: null,
        is_active: null
      },
      
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      
      // 提醒表单
      reminderForm: {
        task_id: null,
        reminder_time: '',
        reminder_type: 'once',
        method: 'popup',
        is_active: true
      },
      reminderRules: {
        task_id: [
          { required: true, message: '请选择任务', trigger: 'change' }
        ],
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
  computed: {
    ...mapGetters(['allTasks', 'allReminders']),
    taskIdFromRoute() {
      return this.$route.params.taskId
    }
  },
  created() {
    this.loadReminders()
    this.loadTasks()
    
    // 如果是通过任务详情页进入，则预选该任务
    if (this.taskIdFromRoute) {
      this.filters.task_id = parseInt(this.taskIdFromRoute)
      this.reminderForm.task_id = parseInt(this.taskIdFromRoute)
    }
  },
  methods: {
    ...mapActions(['setTasks', 'fetchReminders', 'createReminder', 'updateReminder', 'deleteReminder', 'activateReminder', 'deactivateReminder']),
    
    async loadReminders() {
      this.loading = true
      try {
        const params = {
          skip: (this.pagination.currentPage - 1) * this.pagination.pageSize,
          limit: this.pagination.pageSize,
          ...this.filters
        }
        
        await this.fetchReminders(params)
        // 从store获取提醒数据
        this.reminders = this.allReminders
      } catch (error) {
        console.error('Failed to load reminders:', error)
        this.$message.error('加载提醒列表失败')
      } finally {
        this.loading = false
      }
    },
    
    async loadTasks() {
      try {
        const response = await getTasks()
        this.tasks = response.data.items || response.data
        this.setTasks(this.tasks)
      } catch (error) {
        console.error('Failed to load tasks:', error)
        this.$message.error('加载任务列表失败')
      }
    },
    
    goBack() {
      this.$router.push('/home')
    },
    
    applyFilters() {
      this.pagination.currentPage = 1
      this.loadReminders()
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadReminders()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadReminders()
    },
    
    editReminder(reminder) {
      this.editingReminder = reminder
      this.reminderForm = { ...reminder }
      this.showReminderDialog = true
    },
    
    async deleteReminderUI(reminder) {
      this.$confirm(
        `确定要删除任务 "${reminder.task.title}" 的提醒吗？`, 
        '警告', 
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await this.deleteReminder(reminder.id)
          this.$message.success('提醒删除成功')
          this.loadReminders()
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
          await this.deactivateReminder(reminder.id)
          this.$message.success('提醒已停用')
        } else {
          await this.activateReminder(reminder.id)
          this.$message.success('提醒已激活')
        }
        this.loadReminders()
      } catch (error) {
        console.error('Failed to toggle reminder status:', error)
        this.$message.error('操作失败')
      }
    },
    
    async saveReminder() {
      this.$refs.reminderFormRef.validate(async (valid) => {
        if (valid) {
          this.saving = true
          try {
            let response
            if (this.editingReminder) {
              response = await this.updateReminder({ 
                reminderId: this.editingReminder.id, 
                reminderData: this.reminderForm 
              })
              this.$message.success('提醒更新成功')
            } else {
              response = await this.createReminder(this.reminderForm)
              this.$message.success('提醒创建成功')
            }
            
            this.showReminderDialog = false
            this.editingReminder = null
            this.reminderForm = {
              task_id: null,
              reminder_time: '',
              reminder_type: 'once',
              method: 'popup',
              is_active: true
            }
            
            this.loadReminders()
          } catch (error) {
            console.error('Failed to save reminder:', error)
            this.$message.error('提醒保存失败')
          } finally {
            this.saving = false
          }
        }
      })
    },
    
    resetReminderForm() {
      this.reminderForm = {
        task_id: this.taskIdFromRoute ? parseInt(this.taskIdFromRoute) : null,
        reminder_time: '',
        reminder_type: 'once',
        method: 'popup',
        is_active: true
      }
    },
    
    // 工具方法
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return ''
      const date = new Date(dateTimeString)
      return date.toLocaleString('zh-CN')
    },
    
    getReminderTypeText(type) {
      switch (type) {
        case 'once': return '一次性'
        case 'daily': return '每日'
        case 'weekly': return '每周'
        case 'monthly': return '每月'
        case 'yearly': return '每年'
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
    }
  }
}
</script>