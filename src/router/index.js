import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import Home from '../views/Home.vue'
import Profile from '../views/Profile.vue'

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
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

