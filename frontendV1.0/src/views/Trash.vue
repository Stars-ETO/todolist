<template>
  <div class="trash-container">
    <header class="trash-header">
      <h1>回收站</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="trash-content">
      <div class="trash-actions" v-if="selectedTasks.length > 0">
        <span>已选择 {{ selectedTasks.length }} 项任务</span>
        <div class="bulk-actions">
          <button @click="batchRestore" class="bulk-restore-button">
            批量恢复
          </button>
          <button @click="batchDelete" class="bulk-delete-button">
            永久删除
          </button>
        </div>
      </div>
      
      <el-table
        :data="deletedTasks"
        style="width: 100%"
        v-loading="loading"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="任务标题" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="250">
          <template #default="scope">
            <span class="task-description">
              {{ truncateText(scope.row.description, 50) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deleted_at" label="删除时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.deleted_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <div class="task-actions">
              <el-button 
                size="small" 
                @click="restoreTask(scope.row)"
                plain
              >
                恢复
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="permanentlyDeleteTask(scope.row)"
                plain
              >
                永久删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="deletedTasks.length === 0 && !loading" class="no-tasks">
        回收站为空
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { 
  getTasks, 
  getDeletedTasks,
  restoreTask, 
  permanentlyDeleteTask 
} from '@/services/tasks'

export default {
  name: 'Trash',
  data() {
    return {
      deletedTasks: [],
      loading: false,
      selectedTasks: []
    }
  },
  created() {
    this.loadDeletedTasks()
  },
  methods: {
    ...mapActions(['setTasks']),
    
    async loadDeletedTasks() {
      this.loading = true
      try {
        const response = await getDeletedTasks()
        this.deletedTasks = response.data.items || response.data
      } catch (error) {
        console.error('Failed to load deleted tasks:', error)
        this.$message.error('加载回收站任务失败')
      } finally {
        this.loading = false
      }
    },
    
    handleSelectionChange(selection) {
      this.selectedTasks = selection
    },
    
    async restoreTask(task) {
      try {
        await restoreTask(task.id)
        this.$message.success('任务恢复成功')
        this.loadDeletedTasks()
      } catch (error) {
        console.error('Failed to restore task:', error)
        this.$message.error('任务恢复失败')
      }
    },
    
    async permanentlyDeleteTask(task) {
      this.$confirm(`确定要永久删除任务 "${task.title}" 吗？此操作不可撤销。`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await permanentlyDeleteTask(task.id)
          this.$message.success('任务已永久删除')
          this.loadDeletedTasks()
        } catch (error) {
          console.error('Failed to permanently delete task:', error)
          this.$message.error('任务永久删除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    async batchRestore() {
      this.$confirm(`确定要恢复选中的 ${this.selectedTasks.length} 个任务吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const promises = this.selectedTasks.map(task => restoreTask(task.id))
          await Promise.all(promises)
          this.$message.success('批量恢复成功')
          this.selectedTasks = []
          this.loadDeletedTasks()
        } catch (error) {
          console.error('Failed to batch restore tasks:', error)
          this.$message.error('批量恢复失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    async batchDelete() {
      this.$confirm(
        `确定要永久删除选中的 ${this.selectedTasks.length} 个任务吗？此操作不可撤销。`, 
        '警告', 
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error'
        }
      ).then(async () => {
        try {
          const promises = this.selectedTasks.map(task => permanentlyDeleteTask(task.id))
          await Promise.all(promises)
          this.$message.success('批量永久删除成功')
          this.selectedTasks = []
          this.loadDeletedTasks()
        } catch (error) {
          console.error('Failed to batch permanently delete tasks:', error)
          this.$message.error('批量永久删除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    goBack() {
      this.$router.go(-1)
    },
    
    // 工具方法
    truncateText(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.trash-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.trash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.trash-header h1 {
  margin: 0;
  color: #333;
}

.trash-content {
  padding: 2rem;
}

.trash-actions {
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

.bulk-restore-button,
.bulk-delete-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bulk-restore-button {
  background-color: #409eff;
  color: white;
}

.bulk-restore-button:hover {
  background-color: #66b1ff;
}

.bulk-delete-button {
  background-color: #f56c6c;
  color: white;
}

.bulk-delete-button:hover {
  background-color: #f78989;
}

.task-description {
  color: #666;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.no-tasks {
  text-align: center;
  padding: 2rem;
  color: #909399;
  font-size: 1.2rem;
}
</style>