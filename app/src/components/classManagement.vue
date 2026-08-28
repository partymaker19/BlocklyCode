<template>
  <div class="class-management">
    <div class="class-header">
      <h2>{{ t?.Classes || (isRussian ? 'Мои классы' : 'My Classes') }}</h2>
      <button class="btn-primary" @click="showCreateClassModal">
        {{ t?.CreateClass || (isRussian ? 'Создать класс' : 'Create Class') }}
      </button>
    </div>

    <div v-if="loading" class="loading">{{ isRussian ? 'Загрузка...' : 'Loading...' }}</div>

    <div v-else-if="classes.length === 0" class="empty-state">
      <p>{{ isRussian ? 'У вас пока нет классов' : 'You don\'t have any classes yet' }}</p>
    </div>

    <div v-else class="classes-grid">
      <div v-for="class in classes" :key="class.id" class="class-card">
        <div class="class-card-header">
          <h3>{{ class.name }}</h3>
          <div class="class-actions">
            <button class="btn-icon" @click="viewClass(class)" title="{{ isRussian ? 'Просмотр' : 'View' }}">
              👁️
            </button>
            <button class="btn-icon" @click="editClass(class)" title="{{ isRussian ? 'Редактировать' : 'Edit' }}">
              ✏️
            </button>
            <button class="btn-icon btn-danger" @click="deleteClass(class)" title="{{ isRussian ? 'Удалить' : 'Delete' }}">
              🗑️
            </button>
          </div>
        </div>
        <div class="class-card-body">
          <p class="class-description">{{ class.description || (isRussian ? 'Нет описания' : 'No description') }}</p>
          <div class="class-meta">
            <span class="students-count">
              👥 {{ class._studentsCount || 0 }} {{ isRussian ? 'учеников' : 'students' }}
            </span>
            <span class="created-at">
              📅 {{ formatDate(class.created_at) }}
            </span>
          </div>
        </div>
        <div class="class-card-footer">
          <button class="btn-secondary" @click="manageStudents(class)">
            {{ isRussian ? 'Управление учениками' : 'Manage Students' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Class Modal -->
    <div v-if="showClassModal" class="modal-overlay" @click="closeClassModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            {{ editingClass 
              ? (t?.EditClass || (isRussian ? 'Редактировать класс' : 'Edit Class'))
              : (t?.CreateClass || (isRussian ? 'Создать класс' : 'Create Class'))
            }}
          </h3>
          <button class="close-btn" @click="closeClassModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveClass">
            <div class="form-group">
              <label for="className">{{ isRussian ? 'Название класса*' : 'Class Name*' }}</label>
              <input
                id="className"
                v-model="classForm.name"
                type="text"
                required
                :placeholder="isRussian ? 'Введите название класса' : 'Enter class name'"
              />
            </div>
            <div class="form-group">
              <label for="classDescription">{{ isRussian ? 'Описание' : 'Description' }}</label>
              <textarea
                id="classDescription"
                v-model="classForm.description"
                rows="3"
                :placeholder="isRussian ? 'Описание класса (необязательно)' : 'Class description (optional)'"
              ></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeClassModal">
                {{ isRussian ? 'Отмена' : 'Cancel' }}
              </button>
              <button type="submit" class="btn-primary">
                {{ editingClass 
                  ? (t?.Save || (isRussian ? 'Сохранить' : 'Save'))
                  : (t?.Create || (isRussian ? 'Создать' : 'Create'))
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Students Management Modal -->
    <div v-if="showStudentsModal" class="modal-overlay" @click="closeStudentsModal">
      <div class="modal-content students-modal" @click.stop>
        <div class="modal-header">
          <h3>
            {{ isRussian ? 'Управление учениками' : 'Manage Students' }}
            <span class="class-name">({{ selectedClass?.name }})</span>
          </h3>
          <button class="close-btn" @click="closeStudentsModal">×</button>
        </div>
        <div class="modal-body">
          <div class="students-management">
            <div class="students-list-section">
              <h4>{{ isRussian ? 'Текущие ученики' : 'Current Students' }}</h4>
              <div v-if="studentsLoading" class="loading-small">
                {{ isRussian ? 'Загрузка...' : 'Loading...' }}
              </div>
              <div v-else-if="students.length === 0" class="empty-small">
                {{ isRussian ? 'В классе пока нет учеников' : 'No students in class yet' }}
              </div>
              <div v-else class="students-list">
                <div v-for="student in students" :key="student.id" class="student-item">
                  <div class="student-info">
                    <div class="student-avatar">
                      {{ student.user?.name?.charAt(0) || student.user?.email?.charAt(0) || '?' }}
                    </div>
                    <div class="student-details">
                      <div class="student-name">{{ student.user?.name || student.user?.email }}</div>
                      <div class="student-email">{{ student.user?.email }}</div>
                    </div>
                  </div>
                  <div class="student-actions">
                    <button class="btn-icon btn-danger" @click="removeStudent(student)">
                      {{ isRussian ? 'Удалить' : 'Remove' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="add-student-section">
              <h4>{{ isRussian ? 'Добавить ученика' : 'Add Student' }}</h4>
              <form @submit.prevent="addStudent" class="add-student-form">
                <div class="form-group">
                  <label for="studentId">{{ isRussian ? 'Email ученика' : 'Student Email' }}</label>
                  <input
                    id="studentId"
                    v-model="newStudentEmail"
                    type="email"
                    required
                    :placeholder="isRussian ? 'example@school.com' : 'student@example.com'"
                  />
                </div>
                <button type="submit" class="btn-primary" :disabled="!newStudentEmail || addingStudent">
                  {{ addingStudent
                    ? (isRussian ? 'Добавление...' : 'Adding...')
                    : (isRussian ? 'Добавить' : 'Add')
                  }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Class View Modal (Teacher View) -->
    <div v-if="showClassViewModal" class="modal-overlay" @click="closeClassViewModal">
      <div class="modal-content class-view-modal" @click.stop>
        <div class="modal-header">
          <h3>
            {{ isRussian ? 'Прогресс учеников в классе' : 'Class Student Progress' }}
            <span class="class-name">({{ selectedClass?.name }})</span>
          </h3>
          <button class="close-btn" @click="closeClassViewModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="classViewLoading" class="loading">
            {{ isRussian ? 'Загрузка прогресса...' : 'Loading progress...' }}
          </div>
          <div v-else-if="classStudents.length === 0" class="empty-state">
            {{ isRussian ? 'В классе нет учеников' : 'No students in class' }}
          </div>
          <div v-else class="students-progress-table">
            <table class="progress-table">
              <thead>
                <tr>
                  <th>{{ isRussian ? 'Ученик' : 'Student' }}</th>
                  <th>{{ isRussian ? 'Email' : 'Email' }}</th>
                  <th>{{ isRussian ? 'Задачи решено' : 'Tasks Solved' }}</th>
                  <th>{{ isRussian ? 'Всего задач' : 'Total Tasks' }}</th>
                  <th>{{ isRussian ? 'Звёзды' : 'Stars' }}</th>
                  <th>{{ isRussian ? 'Последняя активность' : 'Last Activity' }}</th>
                  <th>{{ isRussian ? 'Действия' : 'Actions' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in classStudents" :key="student.id">
                  <td>
                    <div class="student-cell">
                      <div class="student-avatar small">
                        {{ student.user?.name?.charAt(0) || student.user?.email?.charAt(0) || '?' }}
                      </div>
                      <div class="student-name">{{ student.user?.name || student.user?.email }}</div>
                    </div>
                  </td>
                  <td>{{ student.user?.email }}</td>
                  <td>{{ student.stats?.tasksSolved || 0 }}</td>
                  <td>{{ student.stats?.tasksTotal || 0 }}</td>
                  <td>
                    <div class="stars-cell">
                      <span v-for="star in Array(student.stats?.stars || 0)" :key="star" class="star">⭐</span>
                    </div>
                  </td>
                  <td>{{ formatDate(student.stats?.lastActivity) || (isRussian ? 'Нет данных' : 'No data') }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-small" @click="viewStudentProgress(student)">
                        {{ isRussian ? 'Прогресс' : 'Progress' }}
                      </button>
                      <button class="btn-small btn-secondary" @click="assignTaskToStudent(student)">
                        {{ isRussian ? 'Задание' : 'Assign Task' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Progress View -->
    <div v-if="showStudentProgressModal" class="modal-overlay" @click="closeStudentProgressModal">
      <div class="modal-content student-progress-modal" @click.stop>
        <div class="modal-header">
          <h3>
            {{ isRussian ? 'Прогресс ученика' : 'Student Progress' }}
            <span class="student-name">({{ selectedStudent?.user?.name || selectedStudent?.user?.email }})</span>
          </h3>
          <button class="close-btn" @click="closeStudentProgressModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="studentProgressLoading" class="loading">
            {{ isRussian ? 'Загрузка...' : 'Loading...' }}
          </div>
          <div v-else class="student-progress-content">
            <div class="student-summary">
              <div class="progress-stats">
                <div class="stat-item">
                  <div class="stat-value">{{ studentProgressStats?.solved || 0 }}</div>
                  <div class="stat-label">{{ isRussian ? 'Решено задач' : 'Tasks Solved' }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ studentProgressStats?.total || 0 }}</div>
                  <div class="stat-label">{{ isRussian ? 'Всего задач' : 'Total Tasks' }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ studentProgressStats?.stars || 0 }}</div>
                  <div class="stat-label">{{ isRussian ? 'Звёзды' : 'Stars' }}</div>
                </div>
              </div>
            </div>

            <div class="progress-chart">
              <h4>{{ isRussian ? 'Прогресс по задачам' : 'Progress by Tasks' }}</h4>
              <div class="task-progress-list">
                <div v-for="task in studentProgressTasks" :key="task.taskId" class="task-progress-item">
                  <div class="task-info">
                    <div class="task-name">{{ task.taskId }}</div>
                    <div class="task-status" :class="{ solved: task.solved }">
                      {{ task.solved
                        ? (isRussian ? 'Решено' : 'Solved')
                        : (isRussian ? 'Не решено' : 'Not solved')
                      }}
                    </div>
                  </div>
                  <div class="task-stars">
                    <span v-for="star in Array(task.stars)" :key="star" class="star">⭐</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';

export default {
  name: 'ClassManagement',
  setup() {
    const isRussian = ref(true);
    const loading = ref(false);
    const classes = ref<any[]>([]);
    const showClassModal = ref(false);
    const showStudentsModal = ref(false);
    const showClassViewModal = ref(false);
    const showStudentProgressModal = ref(false);
    const studentsLoading = ref(false);
    const classViewLoading = ref(false);
    const studentProgressLoading = ref(false);
    const addingStudent = ref(false);

    const editingClass = ref(false);
    const selectedClass = ref<any>(null);
    const selectedStudent = ref<any>(null);

    const classForm = reactive({
      name: '',
      description: '',
    });

    const newStudentEmail = ref('');
    const students = ref<any[]>([]);
    const classStudents = ref<any[]>([]);
    const studentProgressTasks = ref<any[]>([]);
    const studentProgressStats = ref<any>(null);

    const t = computed(() => window._currentLocalizedStrings || {});

    onMounted(() => {
      loadClasses();
    });

    const loadClasses = async () => {
      loading.value = true;
      try {
        const response = await fetch('/api/classes', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          classes.value = data.classes || [];
        }
      } catch (error) {
        console.error('Failed to load classes:', error);
      } finally {
        loading.value = false;
      }
    };

    const showCreateClassModal = () => {
      editingClass.value = false;
      Object.assign(classForm, { name: '', description: '' });
      showClassModal.value = true;
    };

    const editClass = (classItem: any) => {
      editingClass.value = true;
      selectedClass.value = classItem;
      Object.assign(classForm, {
        name: classItem.name,
        description: classItem.description || '',
      });
      showClassModal.value = true;
    };

    const closeClassModal = () => {
      showClassModal.value = false;
      editingClass.value = false;
      selectedClass.value = null;
    };

    const saveClass = async () => {
      try {
        const url = editingClass.value && selectedClass.value
          ? `/api/classes/${selectedClass.value.id}`
          : '/api/classes';

        const method = editingClass.value ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(classForm),
        });

        if (response.ok) {
          await loadClasses();
          closeClassModal();
        } else {
          const error = await response.json();
          alert(error.error || (isRussian.value ? 'Ошибка сохранения' : 'Save error'));
        }
      } catch (error) {
        console.error('Failed to save class:', error);
        alert(isRussian.value ? 'Ошибка сохранения класса' : 'Failed to save class');
      }
    };

    const deleteClass = async (classItem: any) => {
      if (!confirm(isRussian.value
        ? `Удалить класс "${classItem.name}"? Все ученики будут удалены.`
        : `Delete class "${classItem.name}"? All students will be removed.`)) {
        return;
      }

      try {
        const response = await fetch(`/api/classes/${classItem.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          await loadClasses();
        } else {
          const error = await response.json();
          alert(error.error || (isRussian.value ? 'Ошибка удаления' : 'Delete error'));
        }
      } catch (error) {
        console.error('Failed to delete class:', error);
        alert(isRussian.value ? 'Ошибка удаления класса' : 'Failed to delete class');
      }
    };

    const viewClass = (classItem: any) => {
      selectedClass.value = classItem;
      showClassViewModal.value = true;
      loadClassStudents(classItem.id);
    };

    const closeClassViewModal = () => {
      showClassViewModal.value = false;
      selectedClass.value = null;
      classStudents.value = [];
    };

    const loadClassStudents = async (classId: string) => {
      classViewLoading.value = true;
      try {
        const response = await fetch(`/api/classes/${classId}/students`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          classStudents.value = data.students || [];
        }
      } catch (error) {
        console.error('Failed to load class students:', error);
      } finally {
        classViewLoading.value = false;
      }
    };

    const manageStudents = (classItem: any) => {
      selectedClass.value = classItem;
      showStudentsModal.value = true;
      loadStudents(classItem.id);
    };

    const closeStudentsModal = () => {
      showStudentsModal.value = false;
      selectedClass.value = null;
      students.value = [];
      newStudentEmail.value = '';
    };

    const loadStudents = async (classId: string) => {
      studentsLoading.value = true;
      try {
        const response = await fetch(`/api/classes/${classId}/students`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          students.value = data.students || [];
        }
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        studentsLoading.value = false;
      }
    };

    const addStudent = async () => {
      if (!selectedClass.value || !newStudentEmail.value) return;

      addingStudent.value = true;
      try {
        const response = await fetch(`/api/classes/${selectedClass.value.id}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ studentId: newStudentEmail.value }),
        });

        if (response.ok) {
          await loadStudents(selectedClass.value.id);
          newStudentEmail.value = '';
        } else {
          const error = await response.json();
          alert(error.error || (isRussian.value ? 'Ошибка добавления ученика' : 'Failed to add student'));
        }
      } catch (error) {
        console.error('Failed to add student:', error);
        alert(isRussian.value ? 'Ошибка добавления ученика' : 'Failed to add student');
      } finally {
        addingStudent.value = false;
      }
    };

    const removeStudent = async (student: any) => {
      if (!confirm(isRussian.value
        ? `Удалить ученика "${student.user?.name || student.user?.email}" из класса?`
        : `Remove student "${student.user?.name || student.user?.email}" from class?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/classes/${selectedClass.value.id}/students`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ studentId: student.user.id }),
        });

        if (response.ok) {
          await loadStudents(selectedClass.value.id);
        } else {
          const error = await response.json();
          alert(error.error || (isRussian.value ? 'Ошибка удаления ученика' : 'Failed to remove student'));
        }
      } catch (error) {
        console.error('Failed to remove student:', error);
        alert(isRussian.value ? 'Ошибка удаления ученика' : 'Failed to remove student');
      }
    };

    const viewStudentProgress = async (student: any) => {
      selectedStudent.value = student;
      showStudentProgressModal.value = true;
      studentProgressLoading.value = true;
      try {
        const response = await fetch(`/api/profile?userId=${student.user.id}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          studentProgressStats.value = data.stats || {};
          studentProgressTasks.value = Object.entries(data.stats?.progress || {}),
            map(([taskId, progress]) => ({ taskId, ...progress }));
        }
      } catch (error) {
        console.error('Failed to load student progress:', error);
      } finally {
        studentProgressLoading.value = false;
      }
    };

    const closeStudentProgressModal = () => {
      showStudentProgressModal.value = false;
      selectedStudent.value = null;
      studentProgressTasks.value = [];
      studentProgressStats.value = null;
    };

    const assignTaskToStudent = (student: any) => {
      alert(isRussian.value
        ? `Функция назначения заданий будет реализована в следующей версии`
        : 'Task assignment will be implemented in a future version');
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    return {
      isRussian,
      loading,
      classes,
      showClassModal,
      showStudentsModal,
      showClassViewModal,
      showStudentProgressModal,
      studentsLoading,
      classViewLoading,
      studentProgressLoading,
      addingStudent,
      editingClass,
      selectedClass,
      selectedStudent,
      classForm,
      newStudentEmail,
      students,
      classStudents,
      studentProgressTasks,
      studentProgressStats,
      t,
      showCreateClassModal,
      editClass,
      closeClassModal,
      saveClass,
      deleteClass,
      viewClass,
      closeClassViewModal,
      loadClassStudents,
      manageStudents,
      closeStudentsModal,
      loadStudents,
      addStudent,
      removeStudent,
      viewStudentProgress,
      closeStudentProgressModal,
      assignTaskToStudent,
      formatDate,
    };
  },
};
</script>

<style scoped>
.class-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.class-header h2 {
  margin: 0;
  color: #333;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.class-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s;
}

.class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.class-card-header {
  padding: 15px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.class-card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1em;
}

.class-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  font-size: 1.2em;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: rgba(0,0,0,0.1);
}

.btn-danger {
  color: #d32f2f;
}

.class-card-body {
  padding: 15px;
}

.class-description {
  color: #666;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.class-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9em;
  color: #777;
}

.class-card-footer {
  padding: 15px;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary {
  width: 100%;
  padding: 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #1976D2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  btn-icon:hover {
  background: rgba(0,0,0,0.1);
}

.btn-danger {
  color: #d32f2f;
}

.class-card-body {
  padding: 15px;
}

.class-description {
  color: #666;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.class-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9em;
  color: #777;
}

.class-card-footer {
  padding: 15px;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary {
  width: 100%;
  padding: 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #1976D2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

.form-group textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-primary {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1976D2;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.students-management {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.students-list-section,
.add-student-section {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.students-list-section h4,
.add-student-section h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.students-list {
  max-height: 300px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  margin-bottom: 10px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-avatar {
  width: 32px;
  height: 32px;
  background: #2196F3;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.student-details {
  flex: 1;
}

.student-name {
  font-weight: 500;
  color: #333;
}

.student-email {
  font-size: 0.9em;
  color: #666;
}

.student-actions {
  display: flex;
  gap: 5px;
}

.btn-small {
  padding: 4px 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-small:hover {
  background: #1976D2;
}

.add-student-form {
  margin-top: 15px;
}

.loading-small {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 0.9em;
}

.empty-small {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 0.9em;
}

.students-modal {
  max-width: 800px;
  max-height: 80vh;
}

.class-view-modal {
  max-width: 1000px;
  max-height: 80vh;
}

.progress-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.progress-table th,
.progress-table td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  text-align: left;
}

.progress-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #555;
}

.progress-table tbody tr:hover {
  background: #f9f9f9;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-cell .student-avatar.small {
  width: 28px;
  height: 28px;
  font-size: 0.8em;
}

.stars-cell {
  display: flex;
  gap: 2px;
}

.star {
  color: #ffc107;
  font-size: 1.1em;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.student-progress-modal {
  max-width: 600px;
}

.student-progress-content {
  margin-bottom: 20px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 15px 0;
}

.stat-item {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 1.8em;
  font-weight: bold;
  color: #2196F3;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
}

.task-progress-list {
  max-height: 300px;
  overflow-y: auto;
}

.task-progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 8px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.task-name {
  font-weight: 500;
  color: #333;
}

.task-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
}

.task-status.solved {
  background: #e8f5e9;
  color: #2e7d32;
}

.task-status:not(.solved) {
  background: #ffebee;
  color: #c62828;
}

@media (max-width: 768px) {
  classes-grid {
    grid-template-columns: 1fr;
  }

  .students-management {
    grid-template-columns: 1fr;
  }

  .progress-stats {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
  }
}
</style>
