<template>
  <div class="statistics-container">
    <header class="statistics-header">
      <h1>数据统计</h1>
      <button @click="goBack" class="return-button">返回</button>
    </header>
    
    <div class="statistics-content">
      <!-- 统计概览 -->
      <div class="statistics-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.total_tasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.completed_tasks }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.in_progress_tasks }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.pending_tasks }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-container" v-if="hasECharts">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="chart-card">
              <h3>任务状态分布</h3>
              <div ref="statusChart" class="chart-wrapper"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-card">
              <h3>任务优先级分布</h3>
              <div ref="priorityChart" class="chart-wrapper"></div>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <div class="chart-card">
              <h3>分类任务统计</h3>
              <div ref="categoryChart" class="chart-wrapper"></div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 当ECharts不可用时显示替代内容 -->
      <div class="charts-unavailable" v-else>
        <el-alert
          title="图表功能不可用"
          type="warning"
          description="图表库未正确加载，请检查依赖安装情况。"
          show-icon
        />
      </div>
      
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getTaskStatistics } from '@/services/tasks'

export default {
  name: 'Statistics',
  data() {
    return {
      stats: {
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        pending_tasks: 0
      },
      detailedStats: [],
      loading: false,
      hasECharts: false,
      statusChart: null,
      priorityChart: null,
      categoryChart: null
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  async mounted() {
    // 尝试导入ECharts
    try {
      await import('echarts')
      this.hasECharts = true
    } catch (error) {
      console.warn('ECharts not available:', error)
      this.hasECharts = false
    }
    
    this.loadStatistics()
  },
  beforeUnmount() {
    // 销图表实例
    if (this.statusChart) {
      this.statusChart.dispose()
    }
    if (this.priorityChart) {
      this.priorityChart.dispose()
    }
    if (this.categoryChart) {
      this.categoryChart.dispose()
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    
    async loadStatistics() {
      this.loading = true
      try {
        const response = await getTaskStatistics()
        const data = response.data
        
        // 更新统计数据
        this.stats = {
          total_tasks: data.task_completion?.total_tasks || 0,
          completed_tasks: data.task_completion?.completed_tasks || 0,
          in_progress_tasks: data.task_completion?.in_progress_tasks || 0,
          pending_tasks: data.task_completion?.pending_tasks || 0
        }
        
        // 更新详细统计数据
        this.detailedStats = data.daily_stats || []
        
        // 如果ECharts可用，绘制图表
        if (this.hasECharts) {
          this.$nextTick(() => {
            this.drawCharts(data)
          })
        }
      } catch (error) {
        console.error('Failed to load statistics:', error)
        this.$message.error('加载统计数据失败')
      } finally {
        this.loading = false
      }
    },
    
    async drawCharts(data) {
      // 动态导入ECharts
      const echarts = await import('echarts')
      
      this.drawStatusChart(echarts, data.task_completion)
      this.drawPriorityChart(echarts, data.priority_stats)
      this.drawCategoryChart(echarts, data.category_stats)
    },
    
    drawStatusChart(echarts, data) {
      if (!this.$refs.statusChart) return
      
      // 销毁之前的实例
      if (this.statusChart) {
        this.statusChart.dispose()
      }
      
      // 初始化图表
      this.statusChart = echarts.init(this.$refs.statusChart)
      
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: '任务状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: data?.pending_tasks || 0, name: '待处理' },
              { value: data?.in_progress_tasks || 0, name: '进行中' },
              { value: data?.completed_tasks || 0, name: '已完成' }
            ]
          }
        ]
      }
      
      this.statusChart.setOption(option)
    },
    
    drawPriorityChart(echarts, data) {
      if (!this.$refs.priorityChart) return
      
      // 销毁之前的实例
      if (this.priorityChart) {
        this.priorityChart.dispose()
      }
      
      // 初始化图表
      this.priorityChart = echarts.init(this.$refs.priorityChart)
      
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: '未完成任务优先级',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: data?.high || data['high'] || 0, name: '高优先级' },
              { value: data?.medium || data['medium'] || 0, name: '中优先级' },
              { value: data?.low || data['low'] || 0, name: '低优先级' }
            ]
          }
        ]
      }
      
      this.priorityChart.setOption(option)
    },
    
    
    drawCategoryChart(echarts, data) {
      if (!this.$refs.categoryChart || !data) return
      
      // 销毁之前的实例
      if (this.categoryChart) {
        this.categoryChart.dispose()
      }
      
      // 初始化图表
      this.categoryChart = echarts.init(this.$refs.categoryChart)
      
      // 处理数据
      const categories = data.map(item => item.category_name || '未分类')
      const counts = data.map(item => item.task_count || 0)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          boundaryGap: [0, 0.01]
        },
        yAxis: {
          type: 'category',
          data: categories
        },
        series: [
          {
            name: '任务数',
            type: 'bar',
            data: counts
          }
        ]
      }
      
      this.categoryChart.setOption(option)
    }
  }
}
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.statistics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.statistics-header h1 {
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

.statistics-overview {
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.charts-container {
  margin-bottom: 30px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.chart-wrapper {
  width: 100%;
  height: 300px;
}

.statistics-table {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.statistics-table h3 {
  margin-top: 0;
}
</style>