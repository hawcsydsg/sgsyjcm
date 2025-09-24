import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from "@/views/Login.vue";
//1、导入路由组件
import Index from "@/views/Index.vue";
import Generals from "@/views/Generals.vue";
import Home from "@/views/Home.vue";
import Players from "@/views/Players.vue";
import BattleRooms from "@/views/BattleRooms.vue";
import BattleRoom from "@/views/BattleRoom.vue";
import BattleScene from "@/views/BattleScene.vue";
import Friends from "@/views/Friends.vue";
import Shop from "@/views/Shop.vue";
import Recharge from "@/views/Recharge.vue";
import GameCards from "@/views/GameCards.vue";
// import HomeView from '../views/HomeView.vue'
//2、安装路由
Vue.use(VueRouter)
//3,配置路由
const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
    //将组件配置到我们的路由中
  {
    path: '/index',
    // 移除name属性，避免与默认子路由冲突
    // name: 'Index',
    component: Index,
    meta: { 
      requiresAuth: true 
    },
    children: [
      {
        path: '',
        name: 'Home',
        component: Home
      },
      {
        path: 'generals',
        name: 'Generals',
        component: Generals
      },
      {
        path: 'players',
        name: 'Players',
        component: Players
      },
        {
        path: 'gamecards',
        name: 'GameCards',
        component: GameCards
      },
      {
        path: 'battle-rooms',
        name: 'BattleRooms',
        component: BattleRooms
      },
      {
        path: 'battle-room/:roomId',
        name: 'BattleRoom',
        component: BattleRoom
      },
      {
        path: 'battle/:roomId',
        name: 'BattleScene',
        component: BattleScene
      },
      {
        path: 'friends',
        name: 'Friends',
        component: Friends
      },
      {
        path: 'shop',
        name: 'Shop',
        component: Shop
      },
      {
        path: 'recharge',
        name: 'Recharge',
        component: Recharge
      }
    ]
  }
  // {
  //   path: '/',
  //   name: 'home',
  //   component: HomeView
  // },
  // {
  //   path: '/about',
  //   name: 'about',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  // }
]
//4、创建路由实例并传递 `routes` 配置
const router = new VueRouter({
  // mode: 'history',//路由模式
  base: process.env.BASE_URL,//基础路径http://192.168.107.189:8080/
  routes
})

//5，路由前卫（也就是我们的拦截器，最先跳转到哪里）
// 添加路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否已登录（这里使用sessionStorage模拟）
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!isLoggedIn || !currentUser) {
      // 如果未登录，重定向到登录页面
      next({
        path: '/',
        query: { redirect: to.fullPath }
      });
    } else {
      // 如果已登录，允许访问
      next();
    }
  } else {
    // 不需要认证的页面，直接访问
    next();
  }
});

export default router