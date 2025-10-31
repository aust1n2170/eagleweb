<script setup>
defineProps({
  halls: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['selectHall'])
</script>

<template>
  <div class="dining-halls-section">
    <h1>Dining Halls</h1>
    <div class="halls-grid">
      <div 
        v-for="hall in halls" 
        :key="hall" 
        class="hall-card"
        @click="emit('selectHall', hall)"
      >
        {{ hall }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.dining-halls-section {
  margin-top: 2rem;
}

.dining-halls-section h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #000;
  font-weight: 600;
}

.halls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.hall-card {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  color: #000;
  transition: all 0.2s ease;
  cursor: pointer;
}

.hall-card:hover {
  background-color: #000;
  color: #fff;
  border-color: #000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .halls-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .hall-card {
    padding: 1rem;
    font-size: 1rem;
  }
}
</style>
