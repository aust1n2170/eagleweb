<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import AuthModal from '../components/AuthModal.vue'
import DiningHallsList from '../components/DiningHallsList.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const authModalOpen = ref(false)
const authModalMode = ref('login')

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

const selectHall = (hall) => {
  // Navigate to the dining hall route
  router.push(`/hall/${encodeURIComponent(hall)}`)
}

const openLoginModal = () => {
  authModalMode.value = 'login'
  authModalOpen.value = true
}

const openSignupModal = () => {
  authModalMode.value = 'signup'
  authModalOpen.value = true
}

const closeAuthModal = () => {
  authModalOpen.value = false
}

const handleAuthSuccess = (data) => {
  closeAuthModal()
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
        <button class="nav-button signup" @click="openSignupModal">Sign up</button>
      </template>
    </div>
  </nav>
  
  <main class="browse-content">
    <DiningHallsList
      :halls="allHalls"
      @select-hall="selectHall"
    />
  </main>
  
  <AuthModal
    :is-open="authModalOpen"
    :mode="authModalMode"
    @close="closeAuthModal"
    @success="handleAuthSuccess"
  />
</template>

<style scoped>
.browse-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

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
</style>
