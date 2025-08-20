<template>
  <div class="task-edit-container">
    <header class="task-edit-header">
      <h1>编辑任务</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="task-edit-content" v-loading="loading">
      <el-form 
        v-if="task"
        :model="taskForm" 
        :rules="taskRules" 
        ref="taskFormRef" 
        label-width="100px"
        class="task-form"
      >
        <el-form-item label="任务标题" prop="title">
          <el-input 
            v-model="taskForm.title" 
            placeholder="请输入任务标题"
            id="task-title"
            name="task-title"
            autocomplete="off"
          />
        </el-form-item>
        
        <el-form-item label="任务描述" prop="description">
          <el-input 
            v-model="taskForm.description" 
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述"
            id="task-description"
            name="task-description"
            autocomplete="off"
          />
        </el-form-item>
        
        <el-form-item label="截止日期" prop="due_date">
          <el-date-picker
            v-model="taskForm.due_date"
            type="datetime"
            placeholder="请选择截止日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
            id="task-due-date"
            name="task-due-date"
            autocomplete="off"
          />
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="请选择优先级"
            id="task-priority"
            name="task-priority"
            autocomplete="off">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="taskForm.status" placeholder="请选择状态"
            id="task-status"
            name="task-status"
            autocomplete="off">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="taskForm.category_id" placeholder="请选择分类" clearable
            id="task-category"
            name="task-category"
            autocomplete="off">
            <el-option 
              v-for="category in categories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="是否公开" prop="is_public">
          <el-switch v-model="taskForm.is_public"
            id="task-is-public"
            name="task-is-public"
            autocomplete="off" />
        </el-form-item>
        
        <el-form-item>
          <div class="form-actions">
            <el-button 
              @click="submitForm" 
              type="primary" 
              :loading="submitting"
            >
              {{ submitting ? '更新中...' : '更新任务' }}
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <div v-else class="no-task">
        未找到任务
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getTask, updateTask } from '@/services/tasks'
import { getCategories } from '@/services/categories'
import { TASK_STATUS, TASK_PRIORITY } from '@/utils/constants'

export default {
  name: 'TaskEdit',
  data() {
    return {
      taskId: this.$route.params.id,
      task: null,
      taskForm: {
        title: '',
        description: '',
        due_date: '',
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.PENDING,
        category_id: null,
        is_public: false
      },
      taskRules: {
        title: [
          { required: true, message: '请输入任务标题', trigger: 'blur' }
        ],
        priority: [
          { required: true, message: '请选择任务优先级', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择任务状态', trigger: 'change' }
        ]
      },
      loading: false,
      submitting: false,
      categories: []
    }
  },
  computed: {
    ...mapGetters(['taskCategories'])
  },
  created() {
    this.loadTask()
    this.loadCategories()
  },
  methods: {
    ...mapActions(['setCurrentTask']),
    
    async loadTask() {
      this.loading = true
      try {
        const response = await getTask(this.taskId)
        this.task = response.data
        
        // 填充表单数据
        this.taskForm = { ...this.task }
      } catch (error) {
        console.error('Failed to load task:', error)
        this.$message.error('加载任务详情失败')
      } finally {
        this.loading = false
      }
    },
    
    async loadCategories() {
      try {
        const response = await getCategories()
        this.categories = response.data.items || response.data
      } catch (error) {
        console.error('Failed to load categories:', error)
        this.$message.error('加载分类列表失败')
      }
    },
    
    submitForm() {
      this.$refs.taskFormRef.validate(async (valid) => {
        if (valid) {
          this.submitting = true
          try {
            const response = await updateTask(this.taskId, this.taskForm)
            this.task = response.data
            this.$message.success('任务更新成功')
            
            // 更新 Vuex 状态
            this.setCurrentTask(this.task)
            
            // 跳转到任务详情页
            this.$router.push(`/tasks/${this.taskId}`)
          } catch (error) {
            console.error('Failed to update task:', error)
            this.$message.error('任务更新失败')
          } finally {
            this.submitting = false
          }
        }
      })
    },
    
    resetForm() {
      if (this.task) {
        this.taskForm = { ...this.task }
      }
    },
    
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.task-edit-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.task-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.task-edit-header h1 {
  margin: 0;
  color: #333;
}

.task-edit-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.task-form {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.no-task {
  text-align: center;
  padding: 2rem;
  color: #909399;
  font-size: 1.2rem;
}
</style>