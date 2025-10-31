import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import Home from '../views/Home.vue'
import Profile from '../views/Profile.vue'
import ChangePassword from '../views/ChangePassword.vue'
import ResetPassword from '../views/ResetPassword.vue'
import MenuItemDetail from '../views/MenuItemDetail.vue'
import DiningHall from '../views/DiningHall.vue'
import BrowseDiningHalls from '../views/BrowseDiningHalls.vue'

const routes = [
  {
    path: '/',
    component: App,
    children: [
      {
        path: '',
        name: 'Home',
        component: Home
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: 'change-password',
        name: 'ChangePassword',
        component: ChangePassword
      },
      {
        path: 'dish/:recipeNumber',
        name: 'MenuItemDetail',
        component: MenuItemDetail,
        props: true
      },
      {
        path: 'hall/:hallName',
        name: 'DiningHall',
        component: DiningHall,
        props: true
      },
      {
        path: 'browse',
        name: 'BrowseDiningHalls',
        component: BrowseDiningHalls
      }
    ]
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

