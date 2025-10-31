<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import MenuView from '../components/MenuView.vue'
import AuthModal from '../components/AuthModal.vue'

const router = useRouter()
const route = useRoute()
const user = ref(null)
const authModalOpen = ref(false)

const hallName = ref(route.params.hallName || '')
const selectedMeal = ref('breakfast')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const menuItems = ref([])
const loadingMenu = ref(false)
const menuError = ref('')

const meals = [
  { value: 'breakfast', label: 'Breakfast', number: 1 },
  { value: 'lunch', label: 'Lunch', number: 2 },
  { value: 'dinner', label: 'Dinner', number: 3 }
]

onMounted(async () => {
  await checkUser()
  if (hallName.value) {
    fetchMenu()
  }
})

const checkUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
}

const isoDate = (date) => {
  if (typeof date === 'string') {
    return date
  }
  return date.toISOString().split('T')[0]
}

const fetchMenu = async () => {
  if (!hallName.value) return
  
  loadingMenu.value = true
  menuError.value = ''
  menuItems.value = []
  
  try {
    const meal = meals.find(m => m.value === selectedMeal.value)
    if (!meal) return
    
    const isoDateStr = isoDate(selectedDate.value)
    
    const { data, error } = await supabase.rpc('fetch_menu', {
      p_location: hallName.value,
      p_serve_date: isoDateStr,
      p_meal_number: meal.number
    })
    
    if (error) throw error
    
    menuItems.value = data || []
    
    if (menuItems.value.length > 0) {
      console.log('Menu item structure:', menuItems.value[0])
    }
    
    if (menuItems.value.length === 0) {
      menuError.value = 'No menu items available for this date and meal.'
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    menuError.value = error.message || 'Failed to fetch menu. Please try again.'
  } finally {
    loadingMenu.value = false
  }
}

const handleMealChange = () => {
  fetchMenu()
}

const handleDateChange = () => {
  fetchMenu()
}

const handleSelectedDateUpdate = (date) => {
  selectedDate.value = date
}

const handleSelectedMealUpdate = (meal) => {
  selectedMeal.value = meal
}

const handleBack = () => {
  router.push('/')
}

const openLoginModal = () => {
  authModalOpen.value = true
}

const closeAuthModal = () => {
  authModalOpen.value = false
}

const handleAuthSuccess = () => {
  authModalOpen.value = false
  checkUser()
}

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  } else {
    user.value = null
    router.push('/')
  }
}
</script>

<template>
  <div class="dining-hall-page">
    <nav class="navbar">
      <div class="navbar-left">
        <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
        <router-link to="/browse" class="nav-link">Browse Dining Halls</router-link>
      </div>
      <div class="nav-buttons">
        <div v-if="user" class="user-info">
          <router-link to="/profile" class="user-email">{{ user.email }}</router-link>
          <button class="nav-button logout" @click="handleLogout">Log out</button>
        </div>
        <template v-else>
          <button class="nav-button login" @click="openLoginModal">Log in</button>
          <button class="nav-button signup" @click="openLoginModal">Sign up</button>
        </template>
      </div>
    </nav>
    
    <main class="dining-hall-content">
      <MenuView
        v-if="hallName"
        :hall-name="hallName"
        v-model:selected-date="selectedDate"
        v-model:selected-meal="selectedMeal"
        :meals="meals"
        :menu-items="menuItems"
        :loading-menu="loadingMenu"
        :menu-error="menuError"
        @back="handleBack"
        @date-change="handleDateChange"
        @meal-change="handleMealChange"
      />
      <div v-else class="error-container">
        <p>Dining hall not found</p>
        <button class="back-button" @click="handleBack">Go Home</button>
      </div>
    </main>
    
    <AuthModal
      :is-open="authModalOpen"
      mode="login"
      @close="closeAuthModal"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<style scoped>
.nav-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  text-decoration: underline;
}

.dining-hall-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.dining-hall-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.error-container {
  text-align: center;
  padding: 3rem;
}

.back-button {
  padding: 0.75rem 1.5rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  font-family: "SubVario OT W03 Medium", sans-serif;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.back-button:hover {
  background-color: #333;
}
</style>
