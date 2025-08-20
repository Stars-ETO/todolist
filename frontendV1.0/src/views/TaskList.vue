<template>
  <div class="task-list-container">
    <header class="task-list-header">
      <h1>任务管理</h1>
      <div class="header-actions">
        <button @click="goBack" class="return-button">返回</button>
        <router-link to="/tasks/create" class="create-task-button">
          创建任务
        </router-link>
        <button @click="goToTrash" class="trash-button">
          回收站 ({{ deletedTasksCount }})
        </button>
      </div>
    </header>
    
    <div class="task-list-content">
      <div class="filters">
        <div class="filter-group">
          <label for="status-filter">状态:</label>
          <select id="status-filter" v-model="filters.status">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="priority-filter">优先级:</label>
          <select id="priority-filter" v-model="filters.priority">
            <option value="">全部</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="category-filter">分类:</label>
          <select id="category-filter" v-model="filters.category_id">
            <option value="">全部</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="search-input">搜索:</label>
          <input 
            id="search-input" 
            type="text" 
            v-model="filters.search" 
            placeholder="搜索任务标题或描述"
          />
        </div>
        
        <button @click="applyFilters" class="apply-filters-button">
          应用筛选
        </button>
      </div>
      
      <div class="task-actions" v-if="selectedTasks.length > 0">
        <span>已选择 {{ selectedTasks.length }} 项任务</span>
        <div class="bulk-actions">
          <button @click="openBatchEditDialog" class="bulk-edit-button">
            批量编辑
          </button>
          <button @click="batchDelete" class="bulk-delete-button">
            批量删除
          </button>
        </div>
      </div>
      
      <el-table
        :data="tasks"
        style="width: 100%"
        v-loading="loading"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="任务标题" min-width="200">
          <template #default="scope">
            <router-link :to="`/tasks/${scope.row.id}`" class="task-title-link">
              {{ scope.row.title }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="250">
          <template #default="scope">
            <span class="task-description">
              {{ truncateText(scope.row.description, 50) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="scope">
            <el-tag :type="getPriorityTagType(scope.row.priority)">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="截止日期" width="120">
          <template #default="scope">
            <span :class="{ 'overdue': isOverdue(scope.row.due_date) && scope.row.status !== 'completed' }">
              {{ formatDate(scope.row.due_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <div class="task-actions">
              <router-link :to="`/tasks/${scope.row.id}/edit`" class="edit-link">
                编辑
              </router-link>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteTask(scope.row)"
                plain
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </div>
    
    <!-- 批量编辑对话框 -->
    <el-dialog v-model="showBatchEditDialog" title="批量编辑任务" width="500px">
      <el-form :model="batchEditForm">
        <el-form-item label="优先级:">
          <el-select v-model="batchEditForm.priority" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBatchEditDialog = false">取消</el-button>
          <el-button type="primary" @click="batchUpdate" :loading="batchUpdating">
            {{ batchUpdating ? '更新中...' : '更新' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { 
  getTasks, 
  getDeletedTasks,
  deleteTask, 
  batchUpdateTasks, 
  batchDeleteTasks 
} from '@/services/tasks'
import { getCategories } from '@/services/categories'
import { TASK_STATUS, TASK_PRIORITY } from '@/utils/constants'

export default {
  name: 'TaskList',
  data() {
    return {
      tasks: [],
      loading: false,
      filters: {
        status: '',
        priority: '',
        category_id: '',
        search: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      selectedTasks: [],
      deletedTasksCount: 0,
      categories: [],
      
      // 批量编辑相关
      showBatchEditDialog: false,
      batchUpdating: false,
      batchEditForm: {
        priority: '',
        category_id: null
      }
    }
  },
  computed: {
    ...mapGetters(['taskCategories'])
  },
  created() {
    this.loadTasks()
    this.loadCategories()
    this.loadDeletedTasksCount()
  },
  methods: {
    ...mapActions(['setTasks', 'setCategories']),
    
    goBack() {
      this.$router.push('/home')
    },
    
    goToTrash() {
      this.$router.push('/trash')
    },

    async loadTasks() {
      this.loading = true
      try {
        const params = {
          skip: (this.pagination.currentPage - 1) * this.pagination.pageSize,
          limit: this.pagination.pageSize,
          ...this.filters
        }
        
        // 处理category_id参数，如果为空则不传递
        if (!params.category_id) {
          delete params.category_id
        }
        
        const response = await getTasks(params)
        this.tasks = response.data.items || response.data
        this.pagination.total = response.data.total || this.tasks.length
        
        // 更新 Vuex 状态
        this.setTasks(this.tasks)
      } catch (error) {
        console.error('Failed to load tasks:', error)
        this.$message.error('加载任务列表失败')
      } finally {
        this.loading = false
      }
    },
    
    async loadCategories() {
      try {
        const response = await getCategories()
        this.categories = response.data.items || response.data
        
        // 更新 Vuex 状态
        this.setCategories(this.categories)
      } catch (error) {
        console.error('Failed to load categories:', error)
        this.$message.error('加载分类列表失败')
      }
    },
    
    async loadDeletedTasksCount() {
      try {
        const response = await getDeletedTasks()
        const deletedTasks = response.data.items || response.data
        this.deletedTasksCount = deletedTasks.length
      } catch (error) {
        console.error('Failed to load deleted tasks count:', error)
      }
    },
    
    handleSelectionChange(selection) {
      this.selectedTasks = selection
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadTasks()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadTasks()
    },
    
    applyFilters() {
      this.pagination.currentPage = 1
      this.loadTasks()
    },
    
    openBatchEditDialog() {
      this.batchEditForm = {
        priority: '',
        category_id: null
      }
      this.showBatchEditDialog = true
    },
    
    async batchUpdate() {
      if (!this.batchEditForm.priority && !this.batchEditForm.category_id) {
        this.$message.warning('请至少选择一个要更新的字段')
        return
      }
      
      this.batchUpdating = true
      try {
        const taskIds = this.selectedTasks.map(task => task.id)
        const updateData = {
          task_ids: taskIds,
          priority: this.batchEditForm.priority
        }
        
        // 移除空值字段
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === '' || updateData[key] === null) {
            delete updateData[key]
          }
        })
        
        await batchUpdateTasks(updateData)
        this.$message.success('批量更新成功')
        this.showBatchEditDialog = false
        this.selectedTasks = []
        this.loadTasks()
      } catch (error) {
        console.error('Failed to batch update tasks:', error)
        this.$message.error('批量更新失败')
      } finally {
        this.batchUpdating = false
      }
    },
    
    async batchDelete() {
      this.$confirm(`确定要删除选中的 ${this.selectedTasks.length} 个任务吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const taskIds = this.selectedTasks.map(task => task.id)
          await batchDeleteTasks(taskIds)
          this.$message.success('任务已移至回收站')
          this.selectedTasks = []
          this.loadTasks()
          this.loadDeletedTasksCount()
        } catch (error) {
          console.error('Failed to batch delete tasks:', error)
          this.$message.error('批量删除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    async deleteTask(task) {
      this.$confirm(`确定要删除任务 "${task.title}" 吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteTask(task.id)
          this.$message.success('任务已移至回收站')
          this.loadTasks()
          this.loadDeletedTasksCount()
        } catch (error) {
          console.error('Failed to delete task:', error)
          this.$message.error('删除任务失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    // 工具方法
    truncateText(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    },
    
    getPriorityTagType(priority) {
      switch (priority) {
        case TASK_PRIORITY.HIGH: return 'danger'
        case TASK_PRIORITY.MEDIUM: return 'warning'
        case TASK_PRIORITY.LOW: return 'success'
        default: return 'info'
      }
    },
    
    getPriorityText(priority) {
      switch (priority) {
        case TASK_PRIORITY.HIGH: return '高'
        case TASK_PRIORITY.MEDIUM: return '中'
        case TASK_PRIORITY.LOW: return '低'
        default: return priority
      }
    },
    
    getStatusTagType(status) {
      switch (status) {
        case TASK_STATUS.PENDING: return 'info'
        case TASK_STATUS.IN_PROGRESS: return 'warning'
        case TASK_STATUS.COMPLETED: return 'success'
        case TASK_STATUS.DELETED: return 'danger'
        default: return 'info'
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case TASK_STATUS.PENDING: return '待处理'
        case TASK_STATUS.IN_PROGRESS: return '进行中'
        case TASK_STATUS.COMPLETED: return '已完成'
        case TASK_STATUS.DELETED: return '已删除'
        default: return status
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    },
    
    isOverdue(dateString) {
      if (!dateString) return false
      const dueDate = new Date(dateString)
      const now = new Date()
      return dueDate < now
    }
  }
}
</script>

<style scoped>
.task-list-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.task-list-header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.create-task-button {
  padding: 0.5rem 1rem;
  background-color: #409eff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.create-task-button:hover {
  background-color: #66b1ff;
}

.trash-button {
  padding: 0.5rem 1rem;
  background-color: #909399;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.trash-button:hover {
  background-color: #a6a9ad;
}

.task-list-content {
  padding: 2rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  white-space: nowrap;
}

.filter-group select,
.filter-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  color: #000;
}

.apply-filters-button {
  padding: 0.5rem 1rem;
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.apply-filters-button:hover {
  background-color: #85ce61;
}

.task-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
}

.bulk-edit-button,
.bulk-delete-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bulk-edit-button {
  background-color: #409eff;
  color: white;
}

.bulk-edit-button:hover {
  background-color: #66b1ff;
}

.bulk-delete-button {
  background-color: #f56c6c;
  color: white;
}

.bulk-delete-button:hover {
  background-color: #f78989;
}

.task-title-link {
  color: #409eff;
  text-decoration: none;
}

.task-title-link:hover {
  text-decoration: underline;
}

.task-description {
  color: #666;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-link {
  color: #409eff;
  text-decoration: none;
}

.edit-link:hover {
  text-decoration: underline;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
</style>