<template>
  <div class="task-create-container">
    <header class="task-create-header">
      <h1>创建任务</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="task-create-content">
      <el-form 
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
              {{ submitting ? '创建中...' : '创建任务' }}
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { createTask } from '@/services/tasks'
import { getCategories } from '@/services/categories'
import { TASK_PRIORITY, TASK_STATUS } from '@/utils/constants'

export default {
  name: 'TaskCreate',
  data() {
    return {
      taskForm: {
        title: '',
        description: '',
        due_date: '',
        priority: TASK_PRIORITY.MEDIUM,
        category_id: null,
        is_public: false,
        status: TASK_STATUS.PENDING
      },
      taskRules: {
        title: [
          { required: true, message: '请输入任务标题', trigger: 'blur' }
        ],
        priority: [
          { required: true, message: '请选择任务优先级', trigger: 'change' }
        ]
      },
      submitting: false,
      categories: []
    }
  },
  computed: {
    ...mapGetters(['taskCategories'])
  },
  created() {
    this.loadCategories()
  },
  methods: {
    ...mapActions(['setTasks']),
    
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
            const response = await createTask(this.taskForm)
            this.$message.success('任务创建成功')
            
            // 跳转到任务详情页
            this.$router.push(`/tasks/${response.data.id}`)
          } catch (error) {
            console.error('Failed to create task:', error)
            this.$message.error('任务创建失败')
          } finally {
            this.submitting = false
          }
        }
      })
    },
    
    resetForm() {
      this.$refs.taskFormRef.resetFields()
    },
    
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.task-create-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.task-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.task-create-header h1 {
  margin: 0;
  color: #333;
}

.task-create-content {
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
</style>