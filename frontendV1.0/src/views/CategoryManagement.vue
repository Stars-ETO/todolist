<template>
  <div class="category-management-container">
    <header class="category-management-header">
      <h1>分类管理</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="category-management-content">
      <div class="toolbar">
        <el-button type="primary" @click="showCreateDialog = true">
          添加分类
        </el-button>
      </div>
      
      <el-table
        :data="categories"
        style="width: 100%; margin-top: 1rem;"
        v-loading="loading"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="task_count" label="任务数量" width="120" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="editCategory(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteCategory(scope.row)"
              :disabled="scope.row.task_count > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 创建分类对话框 -->
    <el-dialog v-model="showCreateDialog" title="添加分类" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入分类名称" 
            id="create-category-name"
            name="create-category-name"
            autocomplete="off" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="createForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入分类描述"
            id="create-category-description"
            name="create-category-description"
            autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="createCategory" :loading="creating">
            {{ creating ? '创建中...' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑分类对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑分类" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入分类名称"
            id="edit-category-name"
            name="edit-category-name"
            autocomplete="off" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入分类描述"
            id="edit-category-description"
            name="edit-category-description"
            autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="updateCategory" :loading="updating">
            {{ updating ? '更新中...' : '更新' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categories'

export default {
  name: 'CategoryManagement',
  data() {
    return {
      categories: [],
      loading: false,
      showCreateDialog: false,
      showEditDialog: false,
      creating: false,
      updating: false,
      
      // 创建表单
      createForm: {
        name: '',
        description: ''
      },
      createRules: {
        name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' }
        ]
      },
      createFormRef: null,
      
      // 编辑表单
      editForm: {
        id: null,
        name: '',
        description: ''
      },
      editRules: {
        name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' }
        ]
      },
      editFormRef: null
    }
  },
  created() {
    this.loadCategories()
  },
  methods: {
    ...mapActions(['setCategories', 'addCategory', 'updateCategory', 'removeCategory']),
    
    async loadCategories() {
      this.loading = true
      try {
        const response = await getCategories()
        this.categories = response.data.items || response.data
        
        // 更新 Vuex 状态
        this.setCategories(this.categories)
      } catch (error) {
        console.error('Failed to load categories:', error)
        this.$message.error('加载分类列表失败')
      } finally {
        this.loading = false
      }
    },
    
    goBack() {
      this.$router.go(-1)
    },
    
    editCategory(category) {
      this.editForm = { ...category }
      this.showEditDialog = true
    },
    
    async deleteCategory(category) {
      this.$confirm(
        `确定要删除分类 "${category.name}" 吗？`, 
        '警告', 
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await deleteCategory(category.id)
          if (response && (response.data === true || response.status === 200)) {
            this.$message.success('分类删除成功')
            // 从本地列表中移除
            const index = this.categories.findIndex(c => c.id === category.id)
            if (index > -1) {
              this.categories.splice(index, 1)
            }
            // 更新 Vuex 状态
            this.removeCategory(category.id)
          } else {
            this.$message.error('分类删除失败')
          }
        } catch (error) {
          console.error('Failed to delete category:', error)
          if (error.response && error.response.status === 404) {
            this.$message.error('分类不存在或已被删除')
            // 重新加载列表以同步状态
            this.loadCategories()
          } else {
            this.$message.error('分类删除失败: ' + (error.response?.data?.detail || error.message))
          }
        }
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    async createCategory() {
      this.$refs.createFormRef.validate(async (valid) => {
        if (valid) {
          this.creating = true
          try {
            const response = await createCategory(this.createForm)
            this.$message.success('分类创建成功')
            this.showCreateDialog = false
            
            // 重置表单
            this.createForm = {
              name: '',
              description: ''
            }
            
            // 直接添加到本地列表，避免重复请求服务器
            if (response.data) {
              this.categories.push(response.data)
              // 更新 Vuex 状态
              this.addCategory(response.data)
            } else {
              // 如果响应中没有数据，重新加载列表
              this.loadCategories()
            }
          } catch (error) {
            console.error('Failed to create category:', error)
            this.$message.error('分类创建失败')
          } finally {
            this.creating = false
          }
        }
      })
    },
    
    async updateCategory() {
      this.$refs.editFormRef.validate(async (valid) => {
        if (valid) {
          this.updating = true
          try {
            const response = await updateCategory(this.editForm.id, this.editForm)
            this.$message.success('分类更新成功')
            this.showEditDialog = false
            
            // 重新加载分类列表
            this.loadCategories()
            
            // 更新 Vuex 状态
            this.updateCategory(response.data)
          } catch (error) {
            console.error('Failed to update category:', error)
            this.$message.error('分类更新失败')
          } finally {
            this.updating = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.category-management-container {
  background-color: #fff;
  color: #000;
  min-height: 100vh;
}

.category-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaecef;
}

.category-management-header h1 {
  margin: 0;
  color: #333;
}

.category-management-content {
  padding: 2rem;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}
</style>