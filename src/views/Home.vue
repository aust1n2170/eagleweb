<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { supabase } from '../lib/supabase'
import AuthModal from '../components/AuthModal.vue'
import DiningHallsList from '../components/DiningHallsList.vue'
import MenuView from '../components/MenuView.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const authModalOpen = ref(false)
const authModalMode = ref('login')
const successMessage = ref('')

const allHalls = [
  "Lower Live",
  "Carney's",
  "Stuart Hall",
  "Lyons Hall",
  "Addies",
  "Eagles Nest",
  "Brookline Dining",
  "Hillside"
]

const selectedHall = ref(null)
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

onMounted(() => {
  checkUser()
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
})

const checkUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
}

const openLoginModal = () => {
  authModalMode.value = 'login'
  authModalOpen.value = true
  successMessage.value = ''
}

const openSignupModal = () => {
  authModalMode.value = 'signup'
  authModalOpen.value = true
  successMessage.value = ''
}

const closeAuthModal = () => {
  authModalOpen.value = false
  successMessage.value = ''
}

const handleAuthSuccess = (data) => {
  successMessage.value = data.message
  if (authModalMode.value === 'login') {
    setTimeout(() => {
      closeAuthModal()
    }, 1500)
  } else {
    setTimeout(() => {
      closeAuthModal()
    }, 3000)
  }
}

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  } else {
    user.value = null
    successMessage.value = 'Logged out successfully'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
}

const hallsListRef = ref(null)
const menuViewRef = ref(null)

const selectHall = async (hall) => {
  // Animate halls list sliding out to the left
  if (hallsListRef.value) {
    gsap.to(hallsListRef.value, {
      x: '-100%',
      opacity: 0,
      filter: 'blur(4px)',
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        selectedHall.value = hall
        nextTick(() => {
          // Animate menu view sliding in from the right
          if (menuViewRef.value) {
            // Set initial position off-screen
            gsap.set(menuViewRef.value, {
              x: '100%',
              opacity: 0,
              filter: 'blur(4px)'
            })
            // Animate in
            gsap.to(menuViewRef.value, {
              x: '0%',
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.25,
              ease: 'power2.out'
            })
          }
          fetchMenu()
        })
      }
    })
  } else {
    // Fallback if refs not available
    selectedHall.value = hall
    fetchMenu()
  }
}

const closeMenu = async () => {
  // Animate menu view sliding out to the right
  if (menuViewRef.value) {
    gsap.to(menuViewRef.value, {
      x: '100%',
      opacity: 0,
      filter: 'blur(4px)',
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        selectedHall.value = null
        menuItems.value = []
        menuError.value = ''
        nextTick(() => {
          // Animate halls list sliding in from the left
          if (hallsListRef.value) {
            // Set initial position off-screen
            gsap.set(hallsListRef.value, {
              x: '-100%',
              opacity: 0,
              filter: 'blur(4px)'
            })
            // Animate in
            gsap.to(hallsListRef.value, {
              x: '0%',
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.25,
              ease: 'power2.out'
            })
          }
        })
      }
    })
  } else {
    // Fallback if refs not available
    selectedHall.value = null
    menuItems.value = []
    menuError.value = ''
  }
}

const isoDate = (date) => {
  // Convert date string to ISO format (YYYY-MM-DD)
  if (typeof date === 'string') {
    return date
  }
  return date.toISOString().split('T')[0]
}

const fetchMenu = async () => {
  if (!selectedHall.value) return
  
  loadingMenu.value = true
  menuError.value = ''
  menuItems.value = []
  
  try {
    const meal = meals.find(m => m.value === selectedMeal.value)
    if (!meal) return
    
    const isoDateStr = isoDate(selectedDate.value)
    
    const { data, error } = await supabase.rpc('fetch_menu', {
      p_location: selectedHall.value,
      p_serve_date: isoDateStr,
      p_meal_number: meal.number
    })
    
    if (error) throw error
    
    menuItems.value = data || []
    
    // Debug: log first item to see structure
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
  if (selectedHall.value) {
    fetchMenu()
  }
}

const handleDateChange = () => {
  if (selectedHall.value) {
    fetchMenu()
  }
}

</script>

<template>
  <nav class="navbar">
    <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
    <div class="nav-buttons">
      <div v-if="user" class="user-info">
        <router-link to="/profile" class="user-email">{{ user.email }}</router-link>
        <button class="nav-button logout" @click="handleLogout">Log out</button>
      </div>
      <template v-else>
        <button class="nav-button login" @click="openLoginModal">Log in</button>
        <button class="nav-button signup" @click="openSignupModal">Sign up</button>
      </template>
    </div>
  </nav>
  
  <main class="home-content">
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    
    <!-- Dining Halls List -->
    <div
      v-if="!selectedHall"
      ref="hallsListRef"
      class="animation-container"
    >
      <DiningHallsList
        :halls="allHalls"
        @select-hall="selectHall"
      />
    </div>
    
    <!-- Menu View -->
    <div
      v-if="selectedHall"
      ref="menuViewRef"
      class="animation-container"
    >
      <MenuView
        :hall-name="selectedHall"
        v-model:selected-date="selectedDate"
        v-model:selected-meal="selectedMeal"
        :meals="meals"
        :menu-items="menuItems"
        :loading-menu="loadingMenu"
        :menu-error="menuError"
        @back="closeMenu"
        @date-change="handleDateChange"
        @meal-change="handleMealChange"
      />
    </div>
  </main>
  
  <AuthModal
    :is-open="authModalOpen"
    :mode="authModalMode"
    @close="closeAuthModal"
    @success="handleAuthSuccess"
  />
</template>

<style scoped>
.user-email {
  color: #ffffff;
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.user-email:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.home-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.animation-container {
  width: 100%;
}
</style>