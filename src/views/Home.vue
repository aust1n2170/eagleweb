<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import AuthModal from '../components/AuthModal.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const authModalOpen = ref(false)
const authModalMode = ref('login')
const successMessage = ref('')

onMounted(() => {
  checkUser()
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user ?? null
    // Refresh user data to get latest metadata
    if (user.value) {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        user.value = data.user
      }
    }
  })
})

const checkUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
}

// Computed property to get display name
const displayName = computed(() => {
  if (!user.value) return ''
  
  const firstName = user.value.user_metadata?.first_name
  const lastName = user.value.user_metadata?.last_name
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  } else if (firstName) {
    return firstName
  } else if (lastName) {
    return lastName
  } else {
    return user.value.email || ''
  }
})

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
</script>

<template>
  <nav class="navbar">
    <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
    <div class="nav-buttons">
      <div v-if="user" class="user-info">
        <router-link to="/profile" class="user-email">{{ displayName }}</router-link>
        <button class="nav-button logout" @click="handleLogout">Log out</button>
      </div>
      <template v-else>
        <button class="nav-button login" @click="openLoginModal">Log in</button>
        <button class="nav-button signup" @click="openSignupModal">Sign up</button>
      </template>
    </div>
  </nav>
  
  <main>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <!-- Content goes here -->
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
</style>

