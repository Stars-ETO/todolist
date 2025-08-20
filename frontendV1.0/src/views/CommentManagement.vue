<template>
  <div class="comment-management-container">
    <header class="comment-management-header">
      <h1>评论管理</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="comment-management-content">
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
          <label for="user-filter">用户:</label>
          <el-select 
            v-model="filters.user_id" 
            placeholder="选择用户" 
            clearable
            filterable
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </div>
        
        <el-button type="primary" @click="applyFilters">应用筛选</el-button>
      </div>
      
      <el-table
        :data="comments"
        style="width: 100%; margin-top: 1rem;"
        v-loading="loading"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="task.title" label="任务标题" min-width="200" />
        <el-table-column prop="user.username" label="用户" width="120" />
        <el-table-column prop="content" label="评论内容" min-width="250">
          <template #default="scope">
            <div class="comment-content">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" @click="editComment(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteComment(scope.row)">
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
    
    <!-- 创建/编辑评论对话框 -->
    <el-dialog 
      v-model="showCommentDialog" 
      :title="editingComment ? '编辑评论' : '创建评论'" 
      width="600px"
    >
      <el-form :model="commentForm" :rules="commentRules" ref="commentFormRef" label-width="120px">
        <el-form-item label="任务" prop="task_id">
          <el-select 
            v-model="commentForm.task_id" 
            placeholder="选择任务" 
            filterable
            :disabled="!!taskIdFromRoute"
          >
            <el-option
              v-for="task in tasks"
              :key="task.id"
              :label="task.title"
              :value="task.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="评论内容" prop="content">
          <el-input
            v-model="commentForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入评论内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCommentDialog = false">取消</el-button>
          <el-button type="primary" @click="saveComment" :loading="saving">
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment
} from '@/services/comments'
import { getTasks } from '@/services/tasks'
import { getUsers } from '@/services/users'

export default {
  name: 'CommentManagement',
  data() {
    return {
      comments: [],
      tasks: [],
      users: [],
      loading: false,
      saving: false,
      showCommentDialog: false,
      editingComment: null,
      
      // 筛选条件
      filters: {
        task_id: null,
        user_id: null
      },
      
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      
      // 评论表单
      commentForm: {
        task_id: null,
        content: ''
      },
      commentRules: {
        task_id: [
          { required: true, message: '请选择任务', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入评论内容', trigger: 'blur' }
        ]
      },
      commentFormRef: null
    }
  },
  computed: {
    ...mapGetters(['allTasks']),
    taskIdFromRoute() {
      return this.$route.params.taskId
    }
  },
  created() {
    this.loadComments()
    this.loadTasks()
    this.loadUsers()
    
    // 如果是通过任务详情页进入，则预选该任务
    if (this.taskIdFromRoute) {
      this.filters.task_id = parseInt(this.taskIdFromRoute)
      this.commentForm.task_id = parseInt(this.taskIdFromRoute)
    }
  },
  methods: {
    ...mapActions(['setTasks']),
    
    async loadComments() {
      this.loading = true
      try {
        const params = {
          skip: (this.pagination.currentPage - 1) * this.pagination.pageSize,
          limit: this.pagination.pageSize,
          ...this.filters
        }
        
        const response = await getComments(params)
        this.comments = response.data.items || response.data
        this.pagination.total = response.data.total || this.comments.length
      } catch (error) {
        console.error('Failed to load comments:', error)
        this.$message.error('加载评论列表失败')
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
    
    async loadUsers() {
      try {
        const response = await getUsers()
        this.users = response.data.items || response.data
      } catch (error) {
        console.error('Failed to load users:', error)
        this.$message.error('加载用户列表失败')
      }
    },
    
    goBack() {
      this.$router.go(-1)
    },
    
    applyFilters() {
      this.pagination.currentPage = 1
      this.loadComments()
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadComments()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadComments()
    },
    
    editComment(comment) {
      this.editingComment = comment
      this.commentForm = { ...comment }
      this.showCommentDialog = true
    },
    
    async deleteComment(comment) {
      this.$confirm(
        `确定要删除"${comment.user.username}"在任务"${comment.task.title}"中的评论吗？`, 
        '警告', 
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await deleteComment(comment.id)
          this.$message.success('评论删除成功')
          this.loadComments()
        } catch (error) {
          console.error('Failed to delete comment:', error)
          this.$message.error('评论删除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    async saveComment() {
      this.$refs.commentFormRef.validate(async (valid) => {
        if (valid) {
          this.saving = true
          try {
            let response
            if (this.editingComment) {
              response = await updateComment(this.editingComment.id, this.commentForm)
              this.$message.success('评论更新成功')
            } else {
              response = await createComment(this.commentForm)
              this.$message.success('评论创建成功')
            }
            
            this.showCommentDialog = false
            this.editingComment = null
            this.resetCommentForm()
            this.loadComments()
          } catch (error) {
            console.error('Failed to save comment:', error)
            this.$message.error(this.editingComment ? '评论更新失败' : '评论创建失败')
          } finally {
            this.saving = false
          }
        }
      })
    },
    
    resetCommentForm() {
      this.commentForm = {
        task_id: this.taskIdFromRoute ? parseInt(this.taskIdFromRoute) : null,
        content: ''
      }
    },
    
    // 工具方法
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return ''
      const date = new Date(dateTimeString)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.comment-management-container {
  padding: 20px;
}

.comment-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.comment-management-header h1 {
  margin: 0;
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

.filters {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  white-space: nowrap;
}

.comment-content {
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>