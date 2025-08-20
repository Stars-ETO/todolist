<template>
  <div class="collaboration-container">
    <header class="collaboration-header">
      <h1>任务协同</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="collaboration-content">
      <el-card class="task-info-card">
        <div slot="header" class="clearfix">
          <span>任务信息</span>
        </div>
        <div v-if="currentTask">
          <h3>{{ currentTask.title }}</h3>
          <p>{{ currentTask.description }}</p>
          <el-tag :type="getPriorityType(currentTask.priority)">
            {{ getPriorityText(currentTask.priority) }}
          </el-tag>
          <el-tag :type="getStatusType(currentTask.status)">
            {{ getStatusText(currentTask.status) }}
          </el-tag>
        </div>
      </el-card>
      
      <el-card class="collaborators-card">
        <div slot="header" class="clearfix">
          <span>协作者</span>
          <el-button 
            style="float: right; padding: 3px 0" 
            type="text"
            @click="showInviteDialog = true"
          >
            邀请协作者
          </el-button>
        </div>
        
        <el-table
          :data="collaborators"
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="user.username" label="用户名" width="180" />
          <el-table-column prop="user.email" label="邮箱" width="200" />
          <el-table-column prop="permission" label="权限" width="120">
            <template #default="scope">
              {{ getPermissionText(scope.row.permission) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="邀请时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button 
                size="small" 
                type="danger" 
                @click="removeCollaborator(scope.row)"
                :disabled="scope.row.user_id === currentTask.owner_id"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <!-- 邀请协作者对话框 -->
    <el-dialog 
      v-model="showInviteDialog" 
      title="邀请协作者" 
      width="500px"
    >
      <el-form :model="inviteForm" :rules="inviteRules" ref="inviteFormRef">
        <el-form-item label="用户名或邮箱" prop="invitee">
          <el-input 
            v-model="inviteForm.invitee" 
            placeholder="请输入用户名或邮箱"
          />
        </el-form-item>
        
        <el-form-item label="权限" prop="permission">
          <el-select v-model="inviteForm.permission" placeholder="请选择权限">
            <el-option label="只读" value="read" />
            <el-option label="读写" value="write" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showInviteDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="sendInvite" 
            :loading="inviting"
          >
            {{ inviting ? '邀请中...' : '发送邀请' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { 
  getTaskCollaborators,
  inviteCollaborator,
  removeCollaborator
} from '@/services/tasks'

export default {
  name: 'TaskCollaboration',
  data() {
    return {
      taskId: null,
      currentTask: null,
      collaborators: [],
      loading: false,
      inviting: false,
      showInviteDialog: false,
      
      inviteForm: {
        invitee: '',
        permission: 'read'
      },
      inviteRules: {
        invitee: [
          { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
        ],
        permission: [
          { required: true, message: '请选择权限', trigger: 'change' }
        ]
      },
      inviteFormRef: null
    }
  },
  computed: {
    ...mapGetters(['user', 'tasks'])
  },
  created() {
    this.taskId = this.$route.params.taskId
    this.loadTask()
    this.loadCollaborators()
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    
    loadTask() {
      // 从store中获取任务信息
      this.currentTask = this.tasks.find(task => task.id === parseInt(this.taskId))
    },
    
    async loadCollaborators() {
      if (!this.taskId) return
      
      this.loading = true
      try {
        const response = await getTaskCollaborators(this.taskId)
        this.collaborators = response.data.items || response.data
      } catch (error) {
        console.error('Failed to load collaborators:', error)
        this.$message.error('加载协作者列表失败')
      } finally {
        this.loading = false
      }
    },
    
    async sendInvite() {
      this.$refs.inviteFormRef.validate(async (valid) => {
        if (valid) {
          this.inviting = true
          try {
            const inviteData = {
              task_id: this.taskId,
              invitee: this.inviteForm.invitee,
              permission: this.inviteForm.permission
            }
            
            await inviteCollaborator(inviteData)
            this.$message.success('邀请已发送')
            this.showInviteDialog = false
            this.resetInviteForm()
            this.loadCollaborators()
          } catch (error) {
            console.error('Failed to send invite:', error)
            this.$message.error('邀请发送失败')
          } finally {
            this.inviting = false
          }
        }
      })
    },
    
    async removeCollaborator(collaborator) {
      this.$confirm(
        `确定要移除协作者 "${collaborator.user.username}" 吗？`, 
        '确认移除', 
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await removeCollaborator(this.taskId, collaborator.user_id)
          this.$message.success('协作者移除成功')
          this.loadCollaborators()
        } catch (error) {
          console.error('Failed to remove collaborator:', error)
          this.$message.error('协作者移除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    resetInviteForm() {
      this.inviteForm = {
        invitee: '',
        permission: 'read'
      }
    },
    
    // 工具方法
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return ''
      const date = new Date(dateTimeString)
      return date.toLocaleString('zh-CN')
    },
    
    getPriorityType(priority) {
      switch (priority) {
        case 'high': return 'danger'
        case 'medium': return 'warning'
        case 'low': return 'success'
        default: return 'info'
      }
    },
    
    getPriorityText(priority) {
      switch (priority) {
        case 'high': return '高优先级'
        case 'medium': return '中优先级'
        case 'low': return '低优先级'
        default: return priority
      }
    },
    
    getStatusType(status) {
      switch (status) {
        case 'todo': return 'info'
        case 'in_progress': return 'warning'
        case 'done': return 'success'
        default: return 'info'
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'todo': return '待处理'
        case 'in_progress': return '进行中'
        case 'done': return '已完成'
        default: return status
      }
    },
    
    getPermissionText(permission) {
      switch (permission) {
        case 'read': return '只读'
        case 'write': return '读写'
        default: return permission
      }
    }
  }
}
</script>

<style scoped>
.collaboration-container {
  padding: 20px;
}

.collaboration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.collaboration-header h1 {
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

.collaboration-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.task-info-card,
.collaborators-card {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .collaboration-content {
    grid-template-columns: 1fr;
  }
}
</style>