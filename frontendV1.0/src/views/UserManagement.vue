<template>
  <div class="user-management-container">
    <header class="user-management-header">
      <h1>用户管理</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="user-management-content">
      <div class="toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户..."
          style="width: 300px; margin-right: 1rem;"
          clearable
        />
        <el-button type="primary" @click="loadUsers">搜索</el-button>
        <el-button @click="showCreateUserDialog = true" type="success" style="margin-left: auto;">
          添加用户
        </el-button>
      </div>
      
      <el-table
        :data="users"
        style="width: 100%; margin-top: 1rem;"
        v-loading="loading"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="is_admin" label="管理员" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_admin ? 'success' : 'info'">
              {{ scope.row.is_admin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="editUser(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteUser(scope.row)"
              :disabled="scope.row.is_admin && users.filter(u => u.is_admin).length <= 1"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 1rem; justify-content: center;"
      />
    </div>
    
    <!-- 创建用户对话框 -->
    <el-dialog v-model="showCreateUserDialog" title="添加用户" width="500px">
      <el-form :model="createUserForm" :rules="createUserRules" ref="createUserFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createUserForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createUserForm.email" type="email" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createUserForm.password" type="password" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="createUserForm.confirmPassword" type="password" />
        </el-form-item>
        <el-form-item label="管理员">
          <el-switch v-model="createUserForm.is_admin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateUserDialog = false">取消</el-button>
          <el-button type="primary" @click="createUser" :loading="creatingUser">
            {{ creatingUser ? '创建中...' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditUserDialog" title="编辑用户" width="500px">
      <el-form :model="editUserForm" :rules="editUserRules" ref="editUserFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editUserForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editUserForm.email" type="email" />
        </el-form-item>
        <el-form-item label="管理员">
          <el-switch v-model="editUserForm.is_admin" :disabled="isCurrentUser(editUserForm.id)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditUserDialog = false">取消</el-button>
          <el-button type="primary" @click="updateUser" :loading="updatingUser">
            {{ updatingUser ? '更新中...' : '更新' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { createUser, updateUser, deleteUser } from '@/services/auth'

export default {
  name: 'UserManagement',
  data() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 10,
      searchKeyword: '',
      
      // 创建用户相关
      showCreateUserDialog: false,
      creatingUser: false,
      createUserForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        is_admin: false
      },
      createUserRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { 
            validator: (rule, value, callback) => {
              if (value !== this.createUserForm.password) {
                callback(new Error('两次输入的密码不一致'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      },
      createUserFormRef: null,
      
      // 编辑用户相关
      showEditUserDialog: false,
      updatingUser: false,
      editUserForm: {
        id: null,
        username: '',
        email: '',
        is_admin: false
      },
      editUserRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      editUserFormRef: null
    }
  },
  computed: {
    ...mapGetters(['allUsers', 'usersTotal', 'currentUser']),
    users() {
      return this.allUsers
    },
    total() {
      return this.usersTotal
    },
    adminUsersCount() {
      return this.users.filter(user => user.is_admin).length
    }
  },
  created() {
    this.loadUsers()
  },
  methods: {
    ...mapActions(['fetchAllUsers', 'createUser', 'updateUser', 'deleteUser']),
    
    goBack() {
      this.$router.go(-1)
    },
    
    async loadUsers() {
      this.loading = true
      try {
        await this.fetchAllUsers({
          page: this.currentPage,
          size: this.pageSize,
          keyword: this.searchKeyword
        })
      } catch (error) {
        this.$message.error('加载用户列表失败')
      } finally {
        this.loading = false
      }
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.loadUsers()
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadUsers()
    },
    
    editUser(user) {
      this.editUserForm = { ...user }
      this.showEditUserDialog = true
    },
    
    async deleteUser(user) {
      this.$confirm(`确定要删除用户 "${user.username}" 吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await this.deleteUser(user.id)
          this.$message.success('删除成功')
          // 如果删除的是当前页的最后一条数据且不是第一页，则返回上一页
          if (this.users.length === 1 && this.currentPage > 1) {
            this.currentPage--
          }
          this.loadUsers()
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => {
        // 用户取消删除
      })
    },
    
    isCurrentUser(userId) {
      return this.currentUser && this.currentUser.id === userId
    },
    
    async createUser() {
      this.$refs.createUserFormRef.validate(async (valid) => {
        if (valid) {
          this.creatingUser = true
          try {
            // 准备用户数据（移除确认密码字段）
            const userData = { ...this.createUserForm }
            delete userData.confirmPassword
            
            await this.createUser(userData)
            this.$message.success('用户创建成功')
            this.showCreateUserDialog = false
            
            // 重置表单
            this.createUserForm = {
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
              is_admin: false
            }
            
            // 重新加载用户列表
            this.loadUsers()
          } catch (error) {
            this.$message.error('创建用户失败')
          } finally {
            this.creatingUser = false
          }
        }
      })
    },
    
    async updateUser() {
      this.$refs.editUserFormRef.validate(async (valid) => {
        if (valid) {
          this.updatingUser = true
          try {
            await this.updateUser({
              userId: this.editUserForm.id,
              userData: {
                username: this.editUserForm.username,
                email: this.editUserForm.email,
                is_admin: this.editUserForm.is_admin
              }
            })
            
            this.$message.success('用户信息更新成功')
            this.showEditUserDialog = false
            
            // 重新加载用户列表
            this.loadUsers()
          } catch (error) {
            this.$message.error('更新用户信息失败')
          } finally {
            this.updatingUser = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.user-management-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.user-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.user-management-header h1 {
  margin: 0;
  color: #333;
}

.user-management-content {
  padding: 2rem;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}
</style>