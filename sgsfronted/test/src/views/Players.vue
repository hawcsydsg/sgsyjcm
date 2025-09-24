<template>
  <div class="players-container">
    <div class="players-header">
      <h1>玩家列表</h1>
      <div class="header-actions">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="搜索玩家..." 
          class="search-input"
        />
        <button class="add-btn" @click="showAddModal">新增玩家</button>
      </div>
    </div>

    <!-- 新增玩家模态框 -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>新增玩家</h2>
        <form @submit.prevent="savePlayer">
          <div class="form-group">
            <label>用户名:</label>
            <input type="text" v-model="currentUser.username" required />
          </div>
          <div class="form-group">
            <label>密码:</label>
            <input type="password" v-model="currentUser.password" required />
          </div>
          <div class="form-group">
            <label>邮箱:</label>
            <input type="email" v-model="currentUser.email" />
          </div>
          <div class="form-group">
            <label>电话:</label>
            <input type="text" v-model="currentUser.phone" />
          </div>
          <div class="form-group">
            <label>等级:</label>
            <input type="number" v-model.number="currentUser.level" />
          </div>
          <div class="form-group">
            <label>经验:</label>
            <input type="number" v-model.number="currentUser.experience" />
          </div>
          <div class="form-actions">
            <button type="submit" class="save-btn">保存</button>
            <button type="button" class="cancel-btn" @click="closeModal">取消</button>
          </div>
        </form>
      </div>
    </div>

    <div class="players-content">
      <div class="players-table">
        <div class="table-header">
          <div class="table-cell">ID</div>
          <div class="table-cell">用户名</div>
          <div class="table-cell">邮箱</div>
          <div class="table-cell">电话</div>
          <div class="table-cell">等级</div>
          <div class="table-cell">经验</div>
          <div class="table-cell">创建时间</div>
          <div class="table-cell">操作</div>
        </div>
        <div 
          class="table-row" 
          v-for="player in filteredPlayers" 
          :key="player.id"
        >
          <div class="table-cell">{{ player.id }}</div>
          <div class="table-cell">{{ player.username }}</div>
          <div class="table-cell">{{ player.email || '-' }}</div>
          <div class="table-cell">{{ player.phone || '-' }}</div>
          <div class="table-cell">{{ player.level }}</div>
          <div class="table-cell">{{ player.experience }}</div>
          <div class="table-cell">{{ formatDate(player.createdAt) }}</div>
          <div class="table-cell">
            <button class="delete-btn" @click="deletePlayer(player.id)">删除</button>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="paginatedPlayers.length > 0">
        <button 
          :disabled="currentPage === 1" 
          @click="currentPage--"
          class="page-btn"
        >
          上一页
        </button>
        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>
        <button 
          :disabled="currentPage === totalPages" 
          @click="currentPage++"
          class="page-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Players',
  data() {
    return {
      searchTerm: '',
      currentPage: 1,
      pageSize: 10,
      players: [],
      showModal: false,
      currentUser: {
        username: '',
        password: '',
        email: '',
        phone: '',
        level: 1,
        experience: 0
      }
    }
  },
  computed: {
    filteredPlayers() {
      return this.players.filter(player => {
        const matchesSearch = player.username.includes(this.searchTerm) || 
                             (player.email && player.email.includes(this.searchTerm)) ||
                             (player.phone && player.phone.includes(this.searchTerm));
        
        return matchesSearch;
      });
    },
    paginatedPlayers() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredPlayers.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredPlayers.length / this.pageSize);
    }
  },
  watch: {
    filteredPlayers() {
      this.currentPage = 1;
    }
  },
  methods: {
    async fetchPlayers() {
      try {
        const response = await fetch('/api/users/list');
        if (response.ok) {
          this.players = await response.json();
        } else {
          console.error('获取玩家列表失败:', response.status);
          // 如果是404错误，可能需要检查后端服务是否正常运行
          if (response.status === 404) {
            alert('无法获取玩家列表，请检查后端服务是否正常运行');
          }
        }
      } catch (error) {
        console.error('获取玩家列表时发生错误:', error);
        alert('获取玩家列表时发生网络错误，请检查后端服务是否正常运行');
      }
    },
    showAddModal() {
      this.currentUser = {
        username: '',
        password: '',
        email: '',
        phone: '',
        level: 1,
        experience: 0
      };
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async savePlayer() {
      try {
        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.currentUser)
        });
        
        if (response.ok) {
          this.closeModal();
          this.fetchPlayers(); // 重新加载数据
          alert('玩家创建成功');
        } else {
          const errorText = await response.text();
          let errorMessage = `创建玩家失败: ${response.status} ${response.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage = `创建玩家失败: ${errorJson.message}`;
            }
          } catch (e) {
            // 如果不是JSON格式，使用原始文本
            if (errorText) {
              errorMessage = `创建玩家失败: ${errorText}`;
            }
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error('保存玩家时发生错误:', error);
        alert('保存玩家时发生网络错误: ' + error.message);
      }
    },
    async deletePlayer(id) {
      if (confirm('确定要删除这个玩家吗？')) {
        try {
          const response = await fetch(`/api/users/delete/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            this.fetchPlayers(); // 重新加载数据
            alert('玩家删除成功');
          } else {
            const errorText = await response.text();
            let errorMessage = `删除玩家失败: ${response.status} ${response.statusText}`;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.message) {
                errorMessage = `删除玩家失败: ${errorJson.message}`;
              }
            } catch (e) {
              // 如果不是JSON格式，使用原始文本
              if (errorText) {
                errorMessage = `删除玩家失败: ${errorText}`;
              }
            }
            alert(errorMessage);
          }
        } catch (error) {
          console.error('删除玩家时发生错误:', error);
          alert('删除玩家时发生网络错误: ' + error.message);
        }
      }
    },
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    }
  },
  mounted() {
    this.fetchPlayers();
  }
}
</script>

<style scoped>
.players-container {
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.players-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #8b4513;
}

.players-header h1 {
  margin: 0;
  color: #8b4513;
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #8b4513;
  border-radius: 5px;
  background: #fff;
  font-size: 14px;
  width: 200px;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 5px rgba(139, 69, 19, 0.5);
}

.add-btn {
  padding: 10px 20px;
  background: linear-gradient(45deg, #8b4513, #d2691e);
  color: #f5deb3;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: linear-gradient(45deg, #a0522d, #cd853f);
  transform: translateY(-2px);
}

.players-table {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #8b4513;
  margin-bottom: 30px;
}

.table-header {
  display: flex;
  background: #8b4513;
  color: #f5deb3;
  font-weight: bold;
  padding: 15px 0;
}

.table-row {
  display: flex;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-cell {
  flex: 1;
  text-align: center;
  padding: 0 10px;
  word-break: break-all;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-cell:first-child {
  flex: 0.5;
}

.table-cell:nth-child(2) {
  flex: 1.5;
}

.delete-btn {
  padding: 5px 10px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.delete-btn:hover {
  background: #d32f2f;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.page-btn {
  padding: 8px 15px;
  background: #8b4513;
  color: #f5deb3;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #a0522d;
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  color: #333;
  font-weight: bold;
}

/* Modal styles */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close {
  position: absolute;
  right: 15px;
  top: 15px;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.save-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.cancel-btn {
  background: #ccc;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .players-header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-input {
    width: auto;
    flex: 1;
  }
  
  .table-header,
  .table-row {
    flex-wrap: wrap;
    padding: 10px 0;
  }
  
  .table-cell {
    flex: 0 0 50%;
    text-align: left;
    padding: 5px 10px;
  }
  
  .table-cell:before {
    content: attr(data-label) ": ";
    font-weight: bold;
    display: inline-block;
    width: 80px;
  }
  
  .modal-content {
    width: 95%;
    padding: 15px;
  }
}
</style>