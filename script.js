// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAvz-3_19kX5nhjtzPleFWNo_ICJaZsTbg",
    authDomain: "task-manager-265da.firebaseapp.com",
    databaseURL: "https://task-manager-265da.firebaseio.com",
    projectId: "task-manager-265da",
    storageBucket: "task-manager-265da.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.database();
  
  // DOM Elements
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const taskProgress = document.getElementById('task-progress');
  const progressText = document.getElementById('progress-text');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const confirmationModal = document.getElementById('confirmation-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  
  let currentUser = null;
  let tasks = [];
  let currentFilter = 'all';
  
  // Auth State Observer
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      authContainer.style.display = 'none';
      appContainer.style.display = 'block';
      loadTasks();
    } else {
      currentUser = null;
      authContainer.style.display = 'block';
      appContainer.style.display = 'none';
      tasks = [];
      renderTasks();
    }
  });
  
  // Auth Event Listeners
  loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email, password)
      .catch(error => showNotification(error.message, 'error'));
  });
  
  signupBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.createUserWithEmailAndPassword(email, password)
      .catch(error => showNotification(error.message, 'error'));
  });
  
  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });
  
  // Filter Event Listeners
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.dataset.filter;
      renderTasks();
    });
  });
  
  // Task Form Submit
  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText !== '') {
      const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        userId: currentUser.uid,
        createdAt: Date.now()
      };
      saveTask(task);
      taskInput.value = '';
      showNotification('Task added successfully!', 'success');
    }
  });
  
  function renderTasks() {
    taskList.innerHTML = '';
    
    // Filter tasks based on current filter
    const filteredTasks = tasks.filter(task => {
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true;
    });
    
    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="${task.completed ? 'completed' : ''}">${task.text}</span>
        <div class="task-actions">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
          <button onclick="editTask(${task.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
          <button onclick="deleteTask(${task.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
      `;
      taskList.appendChild(li);
    });
    updateProgress();
  }
  
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTask(task);
      renderTasks();
      showNotification(`Task marked as ${task.completed ? 'completed' : 'active'}`, 'success');
    }
  }
  
  function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const li = taskList.querySelector(`li:has(button[onclick="editTask(${id})"])`);
      const span = li.querySelector('span');
      const currentText = task.text;
      
      li.innerHTML = `
        <div class="edit-mode">
          <input type="text" value="${currentText}" class="edit-input">
          <div class="task-actions">
            <button onclick="saveEdit(${id})" class="save-btn"><i class="fas fa-save"></i></button>
            <button onclick="cancelEdit(${id}, '${currentText}')" class="cancel-btn"><i class="fas fa-times"></i></button>
          </div>
        </div>
      `;
      
      const input = li.querySelector('.edit-input');
      input.focus();
      input.select();
    }
  }
  
  function saveEdit(id) {
    const li = taskList.querySelector(`li:has(button[onclick="saveEdit(${id})"])`);
    const input = li.querySelector('.edit-input');
    const newText = input.value.trim();
    
    if (newText !== '') {
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.text = newText;
        saveTask(task);
        renderTasks();
        showNotification('Task updated successfully!', 'success');
      }
    }
  }
  
  function cancelEdit(id, originalText) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = originalText;
      renderTasks();
    }
  }
  
  function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        db.ref(`tasks/${currentUser.uid}/${id}`).remove();
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
        showNotification('Task deleted successfully!', 'success');
      }
    }
  }
  
  function updateProgress() {
    const completed = tasks.filter(t => t.completed).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    taskProgress.value = percent;
    progressText.textContent = `${percent}%`;
    
    // Add animation class to progress bar
    taskProgress.classList.add('animate-progress');
    setTimeout(() => {
      taskProgress.classList.remove('animate-progress');
    }, 500);
  }
  
  function saveTask(task) {
    db.ref(`tasks/${currentUser.uid}/${task.id}`).set(task);
    const existingTaskIndex = tasks.findIndex(t => t.id === task.id);
    if (existingTaskIndex !== -1) {
      tasks[existingTaskIndex] = task;
    } else {
      tasks.push(task);
    }
    renderTasks();
  }
  
  function loadTasks() {
    db.ref(`tasks/${currentUser.uid}`).on('value', snapshot => {
      tasks = [];
      snapshot.forEach(childSnapshot => {
        tasks.push(childSnapshot.val());
      });
      renderTasks();
    });
  }
  
  // Notification function
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
