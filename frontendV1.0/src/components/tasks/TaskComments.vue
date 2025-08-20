<template>
  <div class="task-comments">
    <h3>任务评论</h3>
    
    <!-- 添加评论表单 -->
    <div class="add-comment-form">
      <el-input
        type="textarea"
        :rows="3"
        placeholder="添加评论..."
        v-model="newComment.content"
        class="comment-input"
      ></el-input>
      <div class="form-actions">
        <el-button 
          type="primary" 
          @click="addComment" 
          :loading="saving"
          :disabled="!newComment.content.trim()"
        >
          {{ saving ? '提交中...' : '提交评论' }}
        </el-button>
      </div>
    </div>
    
    <!-- 评论列表 -->
    <div class="comments-list" v-loading="loading">
      <div 
        v-for="comment in comments" 
        :key="comment.id" 
        class="comment-item"
      >
        <div class="comment-header">
          <span class="comment-author">{{ comment.user.username }}</span>
          <span class="comment-time">{{ formatDateTime(comment.created_at) }}</span>
          <div class="comment-actions" v-if="canEditComment(comment)">
            <el-button type="text" @click="editComment(comment)" size="small">编辑</el-button>
            <el-button type="text" @click="deleteComment(comment)" size="small">删除</el-button>
          </div>
        </div>
        <div class="comment-content" v-if="!editingComment || editingComment.id !== comment.id">
          {{ comment.content }}
        </div>
        <div class="edit-comment-form" v-else>
          <el-input
            type="textarea"
            :rows="3"
            v-model="editingComment.content"
            class="comment-input"
          ></el-input>
          <div class="form-actions">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
          </div>
        </div>
      </div>
      
      <div v-if="comments.length === 0" class="no-comments">
        还没有评论，快来添加第一条评论吧！
      </div>
    </div>
    
    <!-- 分页 -->
    <el-pagination
      v-if="total > pagination.pageSize"
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[5, 10, 20]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getComments, createComment, updateComment, deleteComment } from '@/services/comments'

export default {
  name: 'TaskComments',
  props: {
    taskId: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      comments: [],
      loading: false,
      saving: false,
      newComment: {
        content: ''
      },
      editingComment: null,
      pagination: {
        currentPage: 1,
        pageSize: 5,
        total: 0
      }
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  watch: {
    taskId: {
      handler() {
        this.loadComments()
      },
      immediate: true
    }
  },
  methods: {
    async loadComments() {
      if (!this.taskId) return
      
      this.loading = true
      try {
        const params = {
          skip: (this.pagination.currentPage - 1) * this.pagination.pageSize,
          limit: this.pagination.pageSize
        }
        
        const response = await getTaskComments(this.taskId, params)
        this.comments = response.data.items || response.data
        this.pagination.total = response.data.total || this.comments.length
      } catch (error) {
        console.error('Failed to load comments:', error)
        this.$message.error('加载评论失败')
      } finally {
        this.loading = false
      }
    },
    
    async addComment() {
      if (!this.newComment.content.trim()) {
        this.$message.warning('请输入评论内容')
        return
      }
      
      this.saving = true
      try {
        const commentData = {
          task_id: this.taskId,
          content: this.newComment.content
        }
        
        await createComment(commentData)
        this.$message.success('评论添加成功')
        this.newComment.content = ''
        this.loadComments()
      } catch (error) {
        console.error('Failed to add comment:', error)
        this.$message.error('评论添加失败')
      } finally {
        this.saving = false
      }
    },
    
    editComment(comment) {
      this.editingComment = { ...comment }
    },
    
    cancelEdit() {
      this.editingComment = null
    },
    
    async saveEdit() {
      if (!this.editingComment.content.trim()) {
        this.$message.warning('请输入评论内容')
        return
      }
      
      this.saving = true
      try {
        await updateComment(this.editingComment.id, {
          content: this.editingComment.content
        })
        this.$message.success('评论更新成功')
        this.editingComment = null
        this.loadComments()
      } catch (error) {
        console.error('Failed to update comment:', error)
        this.$message.error('评论更新失败')
      } finally {
        this.saving = false
      }
    },
    
    deleteComment(comment) {
      this.$confirm(
        '确定要删除这条评论吗？',
        '确认删除',
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
        // 用户取消删除
      })
    },
    
    canEditComment(comment) {
      // 用户可以编辑自己的评论或者管理员可以编辑所有评论
      return this.user && (this.user.id === comment.user.id || this.user.is_admin)
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadComments()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadComments()
    },
    
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return ''
      const date = new Date(dateTimeString)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.task-comments {
  margin-top: 30px;
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

.add-comment-form {
  margin-bottom: 20px;
}

.comment-input {
  margin-bottom: 10px;
}

.form-actions {
  text-align: right;
}

.comments-list {
  margin-top: 20px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: bold;
  color: #409eff;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  line-height: 1.6;
  white-space: pre-wrap;
}

.edit-comment-form {
  margin-top: 10px;
}

.no-comments {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>