import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from '@/services/auth'

// 路由组件
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const Home = () => import('@/views/Home.vue')
const TaskList = () => import('@/views/TaskList.vue')
const TaskDetail = () => import('@/views/TaskDetail.vue')
const TaskCreate = () => import('@/views/TaskCreate.vue')
const TaskEdit = () => import('@/views/TaskEdit.vue')
const Trash = () => import('@/views/Trash.vue')
const Settings = () => import('@/views/Settings.vue')
const Statistics = () => import('@/views/Statistics.vue')
const UserManagement = () => import('@/views/UserManagement.vue')
const CategoryManagement = () => import('@/views/CategoryManagement.vue')
const ReminderManagement = () => import('@/views/ReminderManagement.vue')
const CommentManagement = () => import('@/views/CommentManagement.vue')
const TaskCollaboration = () => import('@/views/TaskCollaboration.vue')
const ThemeSettings = () => import('@/views/ThemeSettings.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/register',
    component: Register
  },
  {
    path: '/home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks',
    component: TaskList,
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks/:id',
    component: TaskDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks/create',
    component: TaskCreate,
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks/:id/edit',
    component: TaskEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks/:id/collaboration',
    component: TaskCollaboration,
    meta: { requiresAuth: true }
  },
  {
    path: '/trash',
    component: Trash,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings/theme',
    component: ThemeSettings,
    meta: { requiresAuth: true }
  },
  {
    path: '/statistics',
    component: Statistics,
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    component: CategoryManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/reminders',
    component: ReminderManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/reminders/tasks/:taskId',
    component: ReminderManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    component: UserManagement,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/comments',
    component: CommentManagement,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 这里应该检查用户是否已登录 (JWT token)
    const token = localStorage.getItem('token')
    if (!token) {
      next('/login')
      return
    }
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin) {
    // 首先检查localStorage中的值作为初步判断
    const isAdminLocal = localStorage.getItem('isAdmin') === 'true'
    if (!isAdminLocal) {
      next('/home')
      return
    }
    
    // 通过API验证用户是否真的是管理员
    try {
      const response = await getCurrentUser()
      const user = response.data
      if (user.role !== 'admin') {
        next('/home')
        return
      }
    } catch (error) {
      console.error('Failed to verify admin status:', error)
      // 如果验证失败，清除本地存储并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('isAdmin')
      next('/login')
      return
    }
  }
  
  next()
})

export default router