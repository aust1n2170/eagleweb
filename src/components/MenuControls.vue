<script setup>
defineProps({
  selectedDate: {
    type: String,
    required: true
  },
  selectedMeal: {
    type: String,
    required: true
  },
  meals: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:selectedDate', 'update:selectedMeal', 'dateChange', 'mealChange'])

const handleDateChange = (event) => {
  emit('update:selectedDate', event.target.value)
  emit('dateChange', event.target.value)
}

const handleMealClick = (mealValue) => {
  emit('update:selectedMeal', mealValue)
  emit('mealChange', mealValue)
}
</script>

<template>
  <div class="menu-controls">
    <div class="control-group">
      <label for="date-picker">Date:</label>
      <input
        id="date-picker"
        :value="selectedDate"
        type="date"
        class="date-input"
        @change="handleDateChange"
      />
    </div>
    
    <div class="control-group">
      <label>Meal:</label>
      <div class="meal-picker">
        <button
          v-for="meal in meals"
          :key="meal.value"
          class="meal-button"
          :class="{ active: selectedMeal === meal.value }"
          @click="handleMealClick(meal.value)"
        >
          {{ meal.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.control-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.date-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  max-width: 200px;
}

.date-input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.meal-picker {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.meal-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: #fff;
  color: #000;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.meal-button:hover {
  border-color: #000;
  background-color: #f5f5f5;
}

.meal-button.active {
  background-color: #000;
  color: #fff;
  border-color: #000;
}

@media (max-width: 768px) {
  .menu-controls {
    padding: 1rem;
  }
  
  .meal-picker {
    flex-direction: column;
  }
  
  .meal-button {
    width: 100%;
  }
}
</style>
