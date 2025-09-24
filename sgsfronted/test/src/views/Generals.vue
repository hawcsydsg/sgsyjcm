<template>
  <div class="generals-container">
    <div class="generals-header">
      <h1>武将列表</h1>
      <div class="header-actions">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="搜索武将..." 
          class="search-input"
        />
        <button class="add-btn" @click="showAddModal">新增武将</button>
      </div>
    </div>

    <!-- 新增/编辑武将模态框 -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>{{ isEdit ? '编辑武将' : '新增武将' }}</h2>
        <form @submit.prevent="saveGeneral">
          <div class="form-group">
            <label>姓名:</label>
            <input type="text" v-model="currentGeneral.name" required />
          </div>
          <div class="form-group">
            <label>描述:</label>
            <textarea v-model="currentGeneral.description"></textarea>
          </div>
          <div class="form-group">
            <label>势力:</label>
            <select v-model="currentGeneral.heroType">
              <option value="魏">魏</option>
              <option value="蜀">蜀</option>
              <option value="吴">吴</option>
              <option value="群">群</option>
            </select>
          </div>
          <div class="form-group">
            <label>武将类型:</label>
            <input type="text" v-model="currentGeneral.forceType" />
          </div>
          <div class="form-group">
            <label>武力:</label>
            <input type="number" v-model.number="currentGeneral.combatPower" />
          </div>
          <div class="form-group">
            <label>谋略:</label>
            <input type="number" v-model.number="currentGeneral.strategyPower" />
          </div>
          <div class="form-group">
            <label>防御:</label>
            <input type="number" v-model.number="currentGeneral.defensePower" />
          </div>
          <div class="form-group">
            <label>速度:</label>
            <input type="number" v-model.number="currentGeneral.speed" />
          </div>
          <div class="form-group">
            <label>稀有度:</label>
            <select v-model="currentGeneral.rarity">
              <option value="普通">普通</option>
              <option value="稀有">稀有</option>
              <option value="史诗">史诗</option>
              <option value="传说">传说</option>
            </select>
          </div>
          <div class="form-group">
            <label>技能:</label>
            <textarea v-model="currentGeneral.skills"></textarea>
          </div>
          <!-- 恢复图片URL输入框 -->
          <div class="form-group">
            <label>图片URL:</label>
            <input type="text" v-model="currentGeneral.imageUrl" />
          </div>
          <div class="form-actions">
            <button type="submit" class="save-btn">{{ isEdit ? '更新' : '保存' }}</button>
            <button type="button" class="cancel-btn" @click="closeModal">取消</button>
          </div>
        </form>
      </div>
    </div>

    <div class="generals-content">
      <div class="filters">
        <div class="filter-group">
          <label>势力:</label>
          <select v-model="selectedFaction">
            <option value="">全部</option>
            <option value="魏">魏</option>
            <option value="蜀">蜀</option>
            <option value="吴">吴</option>
            <option value="群">群</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>稀有度:</label>
          <select v-model="selectedRarity">
            <option value="">全部</option>
            <option value="普通">普通</option>
            <option value="稀有">稀有</option>
            <option value="史诗">史诗</option>
            <option value="传说">传说</option>
          </select>
        </div>
      </div>

      <div class="generals-grid">
        <div 
          v-for="general in paginatedGenerals" 
          :key="general.id" 
          class="general-card"
          @click="showEditModal(general)"
        >
          <div class="general-avatar">
            <div class="avatar-placeholder" v-if="(!general.imageUrl || general.imageUrl.trim() === '') && !getLocalImage(general.name)">
              {{ general.name.charAt(0) }}
            </div>
            <img
              v-else-if="general.imageUrl && general.imageUrl.trim() !== ''"
              :src="getLocalImagePath(general.imageUrl)"
              :alt="general.name"
              class="avatar-image"
              @error="handleImageError"
            />
            <img
              v-else
              :src="getLocalImage(general.name)"
              :alt="general.name"
              class="avatar-image"
              @error="handleImageError"
            />
            <!-- 拥有状态标识 -->
            <div v-if="general.owned" class="ownership-badge owned">已拥有</div>
            <div v-else class="ownership-badge not-owned">未拥有</div>
          </div>
          <div class="general-info">
            <h3>{{ general.name }}</h3>
            <div class="general-meta">
              <span class="faction" :class="general.heroType">{{ general.heroType }}</span>
              <span class="rarity">{{ general.rarity }}</span>
            </div>
            <p class="general-desc">{{ general.description }}</p>
            <div class="general-stats">
              <div class="stat-item">
                <div class="stat-label">武力</div>
                <div class="stat-value">{{ general.combatPower }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">谋略</div>
                <div class="stat-value">{{ general.strategyPower }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">防御</div>
                <div class="stat-value">{{ general.defensePower }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">速度</div>
                <div class="stat-value">{{ general.speed }}</div>
              </div>
            </div>
            <div class="general-actions">
              <button class="edit-btn" @click.stop="showEditModal(general)">编辑</button>
              <button class="delete-btn" @click.stop="deleteGeneral(general.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="paginatedGenerals.length > 0">
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
// 导入本地图片资源
import caocaoImage from '../assets/heroes/caocao.png';
import guanyuImage from '../assets/heroes/guanyu.png';
import liubeiImage from '../assets/heroes/liubei.png';
import lvbuImage from '../assets/heroes/lvbu.png';
import simayiImage from '../assets/heroes/simayi.png';
import sunquanImage from '../assets/heroes/sunquan.png';
import zhangfeiImage from '../assets/heroes/zhangfei.png';
import zhaoyunImage from '../assets/heroes/zhaoyun.png';
import zhouyuImage from '../assets/heroes/zhouyu.png';
import zhugeliangImage from '../assets/heroes/zhugeliang.png';
import diaochanImage from '../assets/heroes/diaochan.png';
import authorImage from '../assets/heroes/author.png';
import qinghegongzhuImage from '../assets/heroes/qinghegongzhu.png';

export default {
  name: 'Generals',
  data() {
    return {
      searchTerm: '',
      selectedFaction: '',
      selectedRarity: '',
      currentPage: 1,
      pageSize: 8,
      generals: [],
      showModal: false,
      isEdit: false,
      // 移除 imageLoadErrors，因为我们不再需要处理图片加载错误
      currentGeneral: {
        id: null,
        name: '',
        description: '',
        heroType: '蜀',
        forceType: '',
        combatPower: 0,
        strategyPower: 0,
        defensePower: 0,
        speed: 0,
        skills: '',
        rarity: '普通',
        imageUrl: '' // 恢复 imageUrl 字段
      },
      // 定义本地图片映射
      localImages: {
        '武关羽': guanyuImage,
        '神张飞': zhangfeiImage,
        '谋司马懿': simayiImage,
        '神曹操': caocaoImage,
        '武诸葛': zhugeliangImage,
        '威孙权': sunquanImage,
        '乐周瑜': zhouyuImage,
        '威吕布': lvbuImage,
        '神赵云': zhaoyunImage,
        '神刘备': liubeiImage,
        '作者本人': authorImage,
        '乐貂蝉': diaochanImage,
        '清河公主': qinghegongzhuImage
      }
    }
  },
  computed: {
    filteredGenerals() {
      return this.generals.filter(general => {
        const matchesSearch = general.name.includes(this.searchTerm) || 
                             (general.description && general.description.includes(this.searchTerm));
        const matchesFaction = this.selectedFaction ? general.heroType === this.selectedFaction : true;
        const matchesRarity = this.selectedRarity ? general.rarity === this.selectedRarity : true;
        
        return matchesSearch && matchesFaction && matchesRarity;
      });
    },
    paginatedGenerals() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredGenerals.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredGenerals.length / this.pageSize);
    }
  },
  watch: {
    filteredGenerals() {
      this.currentPage = 1;
    }
  },
  created() {
    this.fetchGenerals();
  },
  methods: {
    async fetchGenerals() {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const userId = currentUser.id;
        const response = await fetch(`/api/heroes/list${userId ? `?userId=${userId}` : ''}`);
        if (response.ok) {
          this.generals = await response.json();
        } else {
          console.error('获取武将列表失败:', response.status);
        }
      } catch (error) {
        console.error('获取武将列表时发生错误:', error);
      }
    },
    // 获取本地图片的方法
    getLocalImage(generalName) {
      console.log('获取本地图片，武将名称:', generalName);
      const image = this.localImages[generalName];
      // 确保图片存在且不为null
      if (image) {
        console.log('找到本地图片:', generalName);
        return image;
      } else {
        console.log('未找到本地图片:', generalName);
        return null;
      }
    },
    // 处理本地图片路径
    getLocalImagePath(imageUrl) {
      console.log('处理图片路径:', imageUrl);
      // 去除前导和尾随空格
      const trimmedImageUrl = imageUrl ? imageUrl.trim() : '';
      // 如果是相对路径，转换为实际的资源路径
      if (trimmedImageUrl && (trimmedImageUrl.startsWith('@') || trimmedImageUrl.startsWith('../'))) {
        // 这里需要特殊处理，因为import语句不能动态使用
        // 所以我们提供一个映射表来处理常见的本地图片路径
        const localPathMap = {
          '@/assets/author.png': authorImage,
          '@/assets/guanyu.png': guanyuImage,
          '@/assets/heroes/caocao.png': caocaoImage,
          '@/assets/heroes/guanyu.png': guanyuImage,
          '@/assets/heroes/liubei.png': liubeiImage,
          '@/assets/heroes/lvbu.png': lvbuImage,
          '@/assets/heroes/simayi.png': simayiImage,
          '@/assets/heroes/sunquan.png': sunquanImage,
          '@/assets/heroes/zhangfei.png': zhangfeiImage,
          '@/assets/heroes/zhaoyun.png': zhaoyunImage,
          '@/assets/heroes/zhouyu.png': zhouyuImage,
          '@/assets/heroes/zhugeliang.png': zhugeliangImage,
          '@/assets/heroes/qinghegongzhu.png': qinghegongzhuImage,
          '@/assets/heroes/lediaochan.png': diaochanImage,

        };
        
        // 如果找到映射，则返回对应的图片资源
        if (localPathMap[trimmedImageUrl]) {
          console.log('找到映射图片:', trimmedImageUrl);
          return localPathMap[trimmedImageUrl];
        }
        
        // 如果没有找到映射，尝试处理可能的路径问题
        const fileName = trimmedImageUrl.split('/').pop();
        const fullPath = `../assets/heroes/${fileName}`;
        console.log('尝试完整路径:', fullPath);
        if (localPathMap[fullPath]) {
          console.log('找到完整路径映射:', fullPath);
          return localPathMap[fullPath];
        }
        
        console.log('未找到映射，返回原路径:', trimmedImageUrl);
        return trimmedImageUrl;
      }
      console.log('不是本地资源路径，直接返回:', trimmedImageUrl);
      return trimmedImageUrl;
    },
    // 处理图片加载错误
    handleImageError(event) {
      // 当图片加载失败时，隐藏图片并显示占位符
      event.target.style.display = 'none';
      // 找到对应的占位符元素并显示
      const avatarContainer = event.target.closest('.general-avatar');
      if (avatarContainer) {
        const placeholder = avatarContainer.querySelector('.avatar-placeholder');
        if (placeholder) {
          placeholder.style.display = 'flex';
        }
      }
    },
    showAddModal() {
      this.isEdit = false;
      this.currentGeneral = {
        id: null,
        name: '',
        description: '',
        heroType: '蜀',
        forceType: '',
        combatPower: 0,
        strategyPower: 0,
        defensePower: 0,
        speed: 0,
        skills: '',
        rarity: '普通',
        imageUrl: '' // 恢复 imageUrl 字段
      };
      this.showModal = true;
    },
    showEditModal(general) {
      this.isEdit = true;
      // 深拷贝对象以避免直接修改原对象，包含 imageUrl 字段
      this.currentGeneral = {
        id: general.id,
        name: general.name,
        description: general.description,
        heroType: general.heroType,
        forceType: general.forceType,
        combatPower: general.combatPower,
        strategyPower: general.strategyPower,
        defensePower: general.defensePower,
        speed: general.speed,
        skills: general.skills,
        rarity: general.rarity,
        imageUrl: general.imageUrl // 恢复 imageUrl 字段
      };
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async saveGeneral() {
      try {
        let response;
        if (this.isEdit) {
          response = await fetch(`/api/heroes/update/${this.currentGeneral.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.currentGeneral)
          });
        } else {
          response = await fetch('/api/heroes/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.currentGeneral)
          });
        }
        
        if (response.ok) {
          this.closeModal();
          this.fetchGenerals(); // 重新加载数据
        } else {
          console.error('保存武将失败:', response.status);
        }
      } catch (error) {
        console.error('保存武将时发生错误:', error);
      }
    },
    async deleteGeneral(id) {
      if (confirm('确定要删除这个武将吗？')) {
        try {
          const response = await fetch(`/api/heroes/delete/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            this.fetchGenerals(); // 重新加载数据
          } else {
            console.error('删除武将失败:', response.status);
          }
        } catch (error) {
          console.error('删除武将时发生错误:', error);
        }
      }
    }
  }
}
</script>

<style scoped>
.generals-container {
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
}

.generals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.generals-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  padding: 12px 15px;
  border: 2px solid #3498db;
  border-radius: 25px;
  background: #fff;
  font-size: 14px;
  width: 250px;
  transition: all 0.3s ease;
  outline: none;
}

.search-input:focus {
  border-color: #2980b9;
  box-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
}

.add-btn {
  padding: 12px 25px;
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.add-btn:hover {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.4);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-weight: bold;
  color: #2c3e50;
  white-space: nowrap;
}

.filter-group select {
  padding: 10px 15px;
  border: 2px solid #3498db;
  border-radius: 20px;
  background: #fff;
  color: #333;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-group select:focus {
  border-color: #2980b9;
  box-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
}

.generals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.general-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 2px solid #3498db;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.general-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: #2980b9;
}

.general-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(90deg, #3498db, #2980b9);
}

.general-avatar {
  flex-shrink: 0;
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.ownership-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.ownership-badge.owned {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.ownership-badge.not-owned {
  background: linear-gradient(135deg, #dc3545, #fd7e14);
  color: white;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(45deg, #3498db, #2980b9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  font-weight: bold;
  margin: 0 auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border: 3px solid white;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  border: 3px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.general-info {
  flex: 1;
  text-align: center;
}

.general-info h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 22px;
  font-weight: bold;
}

.general-meta {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.faction {
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.faction.魏 {
  background: linear-gradient(45deg, #3498db, #2980b9);
}

.faction.蜀 {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
}

.faction.吴 {
  background: linear-gradient(45deg, #2ecc71, #27ae60);
}

.faction.群 {
  background: linear-gradient(45deg, #f39c12, #d35400);
}

.rarity {
  background: linear-gradient(45deg, #9b59b6, #8e44ad);
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.general-desc {
  margin: 0 0 20px 0;
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
  min-height: 60px;
}

.general-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-item {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
}

.general-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.edit-btn, .delete-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.edit-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.edit-btn:hover {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.delete-btn {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.delete-btn:hover {
  background: linear-gradient(45deg, #c0392b, #a93226);
  transform: translateY(-2px);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.page-btn {
  padding: 10px 20px;
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.4);
}

.page-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-info {
  color: #2c3e50;
  font-weight: bold;
  font-size: 16px;
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
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.close {
  position: absolute;
  right: 20px;
  top: 20px;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  color: #7f8c8d;
  transition: color 0.3s ease;
}

.close:hover {
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #3498db;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  outline: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #2980b9;
  box-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.save-btn, .cancel-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.save-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.save-btn:hover {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.4);
}

.cancel-btn {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
  box-shadow: 0 4px 8px rgba(149, 165, 166, 0.3);
}

.cancel-btn:hover {
  background: linear-gradient(45deg, #7f8c8d, #6c7a7c);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(149, 165, 166, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .generals-header {
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
  
  .filters {
    flex-direction: column;
    gap: 15px;
  }
  
  .generals-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .save-btn, .cancel-btn {
    width: 100%;
  }
}
</style>