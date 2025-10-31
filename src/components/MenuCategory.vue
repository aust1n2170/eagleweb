<script setup>
import { ref, nextTick } from 'vue'
import { gsap } from 'gsap'
import MenuItem from './MenuItem.vue'

const props = defineProps({
  category: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  }
})

const categoryElement = ref(null)
const isCollapsed = ref(false)

const setRef = (el) => {
  categoryElement.value = el
}

const toggleCategory = async () => {
  if (isCollapsed.value) {
    isCollapsed.value = false
    await nextTick()
    animateExpand()
  } else {
    animateCollapse(() => {
      isCollapsed.value = true
    })
  }
}

const animateExpand = () => {
  if (!categoryElement.value) return
  
  gsap.killTweensOf(categoryElement.value)
  
  gsap.set(categoryElement.value, {
    height: 0,
    opacity: 0,
    display: 'grid'
  })
  
  const height = categoryElement.value.scrollHeight
  
  gsap.to(categoryElement.value, {
    height: height,
    opacity: 1,
    duration: 0.4,
    ease: 'power2.out',
    clearProps: 'height'
  })
}

const animateCollapse = (onComplete) => {
  if (!categoryElement.value) {
    if (onComplete) onComplete()
    return
  }
  
  gsap.killTweensOf(categoryElement.value)
  
  const height = categoryElement.value.scrollHeight
  
  gsap.to(categoryElement.value, {
    height: 0,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      gsap.set(categoryElement.value, {
        display: 'none'
      })
      if (onComplete) onComplete()
    }
  })
}

// Initialize as expanded
nextTick(() => {
  if (categoryElement.value) {
    gsap.set(categoryElement.value, {
      height: 'auto',
      opacity: 1,
      display: 'grid'
    })
  }
})
</script>

<template>
  <div class="menu-category">
    <button 
      class="category-header"
      @click="toggleCategory"
    >
      <h2 class="category-name">{{ category }}</h2>
      <svg 
        class="collapse-icon"
        :class="{ collapsed: isCollapsed }"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
    <div 
      :ref="setRef"
      class="category-items"
    >
      <MenuItem
        v-for="(item, index) in items"
        :key="item.recipe_number || index"
        :item="item"
      />
    </div>
  </div>
</template>

<style scoped>
.menu-category {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.2s ease;
  position: relative;
  z-index: 2;
}

.category-header:hover {
  opacity: 0.8;
}

.category-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #000;
  flex: 1;
  font-family: "SubVario OT W03 Medium", sans-serif;
}

.collapse-icon {
  width: 24px;
  height: 24px;
  stroke: #000;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  margin-left: 1rem;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.category-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  overflow: visible;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .category-items {
    grid-template-columns: 1fr;
  }
}
</style>
