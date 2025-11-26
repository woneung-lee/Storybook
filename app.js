// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBuTvxrgJIWVhBQtTz3FZWScfE-4tIgUkQ",
  authDomain: "storybook-ad93a.firebaseapp.com",
  databaseURL: "https://storybook-ad93a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "storybook-ad93a",
  storageBucket: "storybook-ad93a.firebasestorage.app",
  messagingSenderId: "732882396160",
  appId: "1:732882396160:web:6210b8074c8656aba264e5"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentUser = {
    role: null,
    name: null,
    team: null
};

let editingMessageId = null;
let teamMembers = {};
let allStudents = [];
let teamCount = 5;
let allStoriesData = {};

// DOM이 로드된 후 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');
    
    // 역할 선택 버튼
    document.getElementById('teacherRoleBtn').addEventListener('click', function() {
        selectRole('teacher');
    });
    
    document.getElementById('studentRoleBtn').addEventListener('click', function() {
        selectRole('student');
    });

    // 로그인 버튼
    document.getElementById('teacherSubmitBtn').addEventListener('click', teacherLogin);
    document.getElementById('studentSubmitBtn').addEventListener('click', studentLogin);

    // 나가기 버튼
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('studentLogoutBtn').addEventListener('click', logout);

    // 선생님 제어판 버튼들
    document.getElementById('decreaseTeamBtn').addEventListener('click', () => changeTeamCount(-1));
    document.getElementById('increaseTeamBtn').addEventListener('click', () => changeTeamCount(1));
    document.getElementById('setTopicBtn').addEventListener('click', setTopic);
    document.getElementById('addStudentBtn').addEventListener('click', addStudent);
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('endGameBtn').addEventListener('click', endGame);
    document.getElementById('resetGameBtn').addEventListener('click', resetGame);

    // 학생 버튼
    document.getElementById('submitBtn').addEventListener('click', submitSentence);
    document.getElementById('viewMyTeamStoryBtn').addEventListener('click', viewMyTeamStory);

    // 모달 버튼
    document.getElementById('closeTeamDetailBtn').addEventListener('click', closeTeamDetail);
    document.getElementById('closeResultsBtn').addEventListener('click', closeResults);
    document.getElementById('backToSelectionBtn').addEventListener('click', backToTeamSelection);

    // 학생 입력창 이벤트
    const storyInput = document.getElementById('storyInput');
    storyInput.addEventListener('focus', setActiveWriter);
    storyInput.addEventListener('blur', () => {
        if (!editingMessageId && !storyInput.value.trim()) {
            removeActiveWriter();
        }
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        const teamModal = document.getElementById('teamDetailModal');
        const resultsModal = document.getElementById('resultsModal');
        if (event.target == teamModal) {
            teamModal.style.display = 'none';
        }
        if (event.target == resultsModal) {
            resultsModal.style.display = 'none';
        }
    });
});

function selectRole(role) {
    currentUser.role = role;
    
    const loginForm = document.getElementById('loginForm');
    const teacherLogin = document.getElementById('teacherLogin');
    const studentLogin = document.getElementById('studentLogin');
    
    loginForm.classList.remove('hidden');
    
    if (role === 'teacher') {
        teacherLogin.classList.remove('hidden');
        studentLogin.classList.add('hidden');
    } else {
        studentLogin.classList.remove('hidden');
        teacherLogin.classList.add('hidden');
    }
}

function teacherLogin() {
    const password = document.getElementById('teacherPassword').value;
    
    if (password === 'teacher1234') {
        currentUser.name = '선생님';
        showNotification('환영합니다, 선생님! 🎉', 'success');
        showGameScreen('teacher');
        loadTeamCount();
        loadStudents();
        startMonitoring();
    } else {
        showNotification('비밀번호가 틀렸습니다! ❌', 'error');
    }
}

function studentLogin() {
    const name = document.getElementById('studentName').value.trim();
    
    if (!name) {
        showNotification('이름을 입력해주세요! 📝', 'error');
        return;
    }

    database.ref('students').once('value', (snapshot) => {
        const students = snapshot.val() || {};
        const student = Object.values(students).find(s => s.name === name);

        if (student) {
            currentUser.name = name;
            currentUser.team = student.team;
            showNotification(`환영합니다, ${name}님! 🎉`, 'success');
            showGameScreen('student');
            loadTeamStory();
            startStudentMonitoring();
        } else {
            showNotification('등록되지 않은 학생입니다! 선생님께 문의하세요. ❌', 'error');
        }
    });
}

function showGameScreen(role) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    if (role === 'teacher') {
        document.getElementById('headerBar').classList.remove('hidden');
        document.getElementById('teacherView').classList.remove('hidden');
    } else {
        document.getElementById('headerBar').classList.add('hidden');
        document.getElementById('studentView').classList.remove('hidden');
    }
}

function loadTeamCount() {
    database.ref('game/teamCount').once('value', (snapshot) => {
        teamCount = snapshot.val() || 5;
        updateTeamCountDisplay();
        updateTeamSelectOptions();
    });

    database.ref('game/teamCount').on('value', (snapshot) => {
        teamCount = snapshot.val() || 5;
        updateTeamCountDisplay();
        updateTeamSelectOptions();
    });
}

function changeTeamCount(delta) {
    const newCount = teamCount + delta;
    if (newCount >= 1 && newCount <= 10) {
        teamCount = newCount;
        database.ref('game/teamCount').set(teamCount);
        updateTeamCountDisplay();
        updateTeamSelectOptions();
        showNotification(`조 개수가 ${teamCount}개로 변경되었습니다! ✅`, 'success');
    }
}

function updateTeamCountDisplay() {
    document.getElementById('teamCountDisplay').textContent = teamCount + '개조';
    document.getElementById('decreaseTeamBtn').disabled = teamCount <= 1;
    document.getElementById('increaseTeamBtn').disabled = teamCount >= 10;
}

function updateTeamSelectOptions() {
    const select = document.getElementById('studentTeam');
    select.innerHTML = '<option value="">조 선택</option>';
    
    for (let i = 1; i <= teamCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i + '조';
        select.appendChild(option);
    }
}

function addStudent() {
    const name = document.getElementById('newStudentName').value.trim();
    const team = document.getElementById('studentTeam').value;

    if (!name || !team) {
        showNotification('이름과 조를 모두 입력해주세요! 📝', 'error');
        return;
    }

    const studentId = Date.now().toString();
    database.ref('students/' + studentId).set({
        id: studentId,
        name: name,
        team: team,
        createdAt: Date.now()
    }).then(() => {
        showNotification(`${name} 학생이 ${team}조에 추가되었습니다! ✅`, 'success');
        document.getElementById('newStudentName').value = '';
        document.getElementById('studentTeam').value = '';
        loadStudents();
    });
}

function loadStudents() {
    database.ref('students').on('value', (snapshot) => {
        const students = snapshot.val() || {};
        const studentList = document.getElementById('studentList');
        studentList.innerHTML = '';

        teamMembers = {};
        allStudents = Object.values(students);
        
        allStudents.forEach(student => {
            if (!teamMembers[student.team]) {
                teamMembers[student.team] = [];
            }
            teamMembers[student.team].push(student.name);

            const div = document.createElement('div');
            div.className = 'student-item';
            div.innerHTML = `
                <span class="student-name">${student.name}</span>
                <span class="student-team">${student.team}조</span>
                <button class="delete-btn" data-student-id="${student.id}">삭제</button>
            `;
            
            div.querySelector('.delete-btn').addEventListener('click', function() {
                deleteStudent(this.getAttribute('data-student-id'));
            });
            
            studentList.appendChild(div);
        });

        updateStudentCount(Object.keys(students).length);
    });
}

function deleteStudent(studentId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        database.ref('students/' + studentId).remove().then(() => {
            showNotification('학생이 삭제되었습니다! ✅', 'success');
        });
    }
}

function setTopic() {
    const topic = document.getElementById('storyTopic').value.trim();
    
    if (!topic) {
        showNotification('주제를 입력해주세요! 📝', 'error');
        return;
    }

    database.ref('game/topic').set(topic).then(() => {
        showNotification('주제가 설정되었습니다! 🎯', 'success');
    });
}

function startGame() {
    const maxRounds = parseInt(document.getElementById('maxRounds').value) || 0;
    
    database.ref('game').update({
        status: 'playing',
        maxRounds: maxRounds,
        teamCount: teamCount
    }).then(() => {
        for (let team = 1; team <= teamCount; team++) {
            if (teamMembers[team] && teamMembers[team].length > 0) {
                database.ref(`turnOrder/team${team}`).set({
                    currentTurn: 0,
                    members: teamMembers[team],
                    maxRounds: maxRounds
                });
            }
        }
        showNotification('게임이 시작되었습니다! 🚀', 'success');
    });
}

function endGame() {
    if (confirm('게임을 종료하시겠습니까? 결과 화면이 표시됩니다.')) {
        database.ref('game/status').set('ended').then(() => {
            showNotification('게임이 종료되었습니다! 🏁', 'success');
            showResults();
        });
    }
}

function showResults() {
    database.ref('stories').once('value', (snapshot) => {
        allStoriesData = snapshot.val() || {};
        
        const teamSelectionGrid = document.getElementById('teamSelectionGrid');
        teamSelectionGrid.innerHTML = '';

        for (let team = 1; team <= teamCount; team++) {
            const teamStories = Object.values(allStoriesData).filter(s => s.team == team);
            const members = teamMembers[team] || [];
            
            const card = document.createElement('div');
            card.className = 'team-select-card' + (teamStories.length === 0 ? ' disabled' : '');
            
            if (teamStories.length > 0) {
                card.addEventListener('click', () => showTeamResult(team));
            }
            
            card.innerHTML = `
                <div class="team-select-number">${team}조</div>
                <div class="team-select-members">
                    ${members.length > 0 ? members.join(', ') : '없음'}<br>
                    ${teamStories.length}개 문장
                </div>
            `;
            
            teamSelectionGrid.appendChild(card);
        }

        document.getElementById('teamSelectionView').classList.remove('hidden');
        document.getElementById('teamResultView').classList.add('hidden');
        document.getElementById('resultsModal').style.display = 'block';
    });
}

function showTeamResult(team) {
    const teamStories = Object.values(allStoriesData).filter(s => s.team == team);
    teamStories.sort((a, b) => a.timestamp - b.timestamp);

    const members = teamMembers[team] || [];
    const authorCounts = {};
    teamStories.forEach(story => {
        authorCounts[story.author] = (authorCounts[story.author] || 0) + 1;
    });

    const fullStoryText = teamStories.map(s => s.text).join(' ');
    
    const statsHTML = Object.entries(authorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([author, count]) => `
            <div class="author-stat-item">
                <span class="author-stat-name">${author}</span>
                <span class="author-stat-count">${count}문장</span>
            </div>
        `).join('');

    const resultHTML = `
        <div class="team-result-card">
            <div class="team-result-header">${team}조 (${members.join(', ')})</div>
            <div class="full-story">${fullStoryText}</div>
            <div class="author-stats">
                <h3 class="author-stats-title">👥 작성자별 통계</h3>
                ${statsHTML}
            </div>
        </div>
    `;

    document.getElementById('selectedTeamResult').innerHTML = resultHTML;
    document.getElementById('teamSelectionView').classList.add('hidden');
    document.getElementById('teamResultView').classList.remove('hidden');
}

function backToTeamSelection() {
    document.getElementById('teamSelectionView').classList.remove('hidden');
    document.getElementById('teamResultView').classList.add('hidden');
}

function closeResults() {
    document.getElementById('resultsModal').style.display = 'none';
}

function resetGame() {
    if (confirm('정말 게임을 초기화하시겠습니까? 모든 내용이 삭제됩니다.')) {
        database.ref('stories').remove();
        database.ref('game').update({
            status: 'waiting',
            topic: '',
            maxRounds: 0
        });
        database.ref('activeWriters').remove();
        database.ref('turnOrder').remove();
        showNotification('게임이 초기화되었습니다! 🔄', 'success');
    }
}

function startMonitoring() {
    database.ref('game/topic').on('value', (snapshot) => {
        const topic = snapshot.val();
        const display = document.getElementById('currentTopicDisplay');
        const text = document.getElementById('currentTopicText');
        
        if (topic) {
            display.classList.remove('hidden');
            text.textContent = topic;
        } else {
            display.classList.add('hidden');
        }
    });

    database.ref('stories').on('value', (snapshot) => {
        const stories = snapshot.val() || {};
        const monitor = document.getElementById('teamsMonitor');
        monitor.innerHTML = '';

        for (let team = 1; team <= teamCount; team++) {
            const teamStories = Object.values(stories).filter(s => s.team == team);
            
            const panel = document.createElement('div');
            panel.className = 'team-comic-panel';
            panel.addEventListener('click', () => showTeamDetail(team));
            
            const members = teamMembers[team] || [];
            const authorCounts = {};
            teamStories.forEach(story => {
                authorCounts[story.author] = (authorCounts[story.author] || 0) + 1;
            });

            const statsPreview = Object.entries(authorCounts)
                .map(([author, count]) => `${author}(${count})`)
                .join(', ');

            panel.innerHTML = `
                <div class="team-badge">${team}조</div>
                <div class="team-content">
                    <div class="team-members-list">
                        👥 ${members.join(', ') || '없음'}
                    </div>
                    <div class="team-members-list" style="color: #5f27cd; font-weight: 700;">
                        📊 ${statsPreview || '작성 전'}
                    </div>
                    <div class="story-preview">
                        ${teamStories.length > 0 ? 
                            teamStories.slice(0, 2).map(s => `<p><strong>${s.author}:</strong> ${s.text}</p>`).join('') + 
                            (teamStories.length > 2 ? '<p style="color: #95a5a6; text-align: center; font-weight: 700;">...클릭해서 전체보기</p>' : '') :
                            '<p style="color: #95a5a6;">아직 작성된 문장이 없습니다.</p>'
                        }
                    </div>
                </div>
            `;

            monitor.appendChild(panel);
        }

        updateTotalSentences(Object.keys(stories).length);
    });

    database.ref('game/status').on('value', (snapshot) => {
        const status = snapshot.val() || 'waiting';
        document.getElementById('gameStatus').textContent = 
            status === 'playing' ? '진행중 🎮' : status === 'ended' ? '종료됨 🏁' : '대기중 ⏸️';
    });
}

function showTeamDetail(team) {
    document.getElementById('modalTeamTitle').textContent = `${team}조 상세보기`;
    
    database.ref('stories').orderByChild('team').equalTo(team).once('value', (snapshot) => {
        const stories = [];
        snapshot.forEach(child => {
            stories.push({...child.val(), id: child.key});
        });

        stories.sort((a, b) => a.timestamp - b.timestamp);

        const totalSentences = stories.length;
        const members = teamMembers[team] || [];
        const authorCounts = {};

        stories.forEach(story => {
            authorCounts[story.author] = (authorCounts[story.author] || 0) + 1;
        });

        document.getElementById('modalTotalSentences').textContent = totalSentences;
        document.getElementById('modalMemberCount').textContent = members.length + '명';

        const fullStoryText = stories.map(s => s.text).join(' ');
        document.getElementById('modalFullStory').textContent = fullStoryText || '아직 작성된 이야기가 없습니다.';

        // 작성자별 통계
        const authorStatsList = document.getElementById('authorStatsList');
        authorStatsList.innerHTML = '';
        
        const sortedAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]);
        
        sortedAuthors.forEach(([author, count]) => {
            const item = document.createElement('div');
            item.className = 'author-stat-item';
            item.innerHTML = `
                <span class="author-stat-name">${author}</span>
                <span class="author-stat-count">${count}문장</span>
            `;
            authorStatsList.appendChild(item);
        });

        members.forEach(member => {
            if (!authorCounts[member]) {
                const item = document.createElement('div');
                item.className = 'author-stat-item';
                item.style.opacity = '0.5';
                item.innerHTML = `
                    <span class="author-stat-name">${member}</span>
                    <span class="author-stat-count">0문장</span>
                `;
                authorStatsList.appendChild(item);
            }
        });

        // 문장별 상세
        const content = document.getElementById('modalStoryContent');
        content.innerHTML = '';

        stories.forEach(story => {
            const bubble = document.createElement('div');
            bubble.className = 'speech-bubble';
            bubble.innerHTML = `
                <div class="author-tag">${story.author}</div>
                <div class="sentence-text">${story.text}</div>
            `;
            content.appendChild(bubble);
        });

        if (stories.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #95a5a6; padding: 40px;">아직 작성된 문장이 없습니다.</p>';
        }

        document.getElementById('teamDetailModal').style.display = 'block';
    });
}

function closeTeamDetail() {
    document.getElementById('teamDetailModal').style.display = 'none';
}

function viewMyTeamStory() {
    showTeamDetail(currentUser.team);
}

function loadTeamStory() {
    const team = currentUser.team;
    document.getElementById('teamTitle').textContent = `${team}조 이야기책 📖`;

    database.ref('game/topic').on('value', (snapshot) => {
        const topic = snapshot.val();
        if (topic) {
            document.getElementById('topicDisplay').classList.remove('hidden');
            document.getElementById('topicText').textContent = topic;
        }
    });

    database.ref('stories').on('value', (snapshot) => {
        const stories = snapshot.val() || {};
        const teamStories = Object.values(stories).filter(s => s.team == team);

        teamStories.sort((a, b) => a.timestamp - b.timestamp);

        const container = document.getElementById('sentencesContainer');
        container.innerHTML = '';

        teamStories.forEach(story => {
            const bubble = document.createElement('div');
            bubble.className = 'speech-bubble' + (story.author === currentUser.name ? ' my-sentence' : '');
            
            const editButton = story.author === currentUser.name ? 
                `<button class="edit-btn" data-story-id="${story.id}" data-story-text="${story.text.replace(/"/g, '&quot;')}">✏️ 수정</button>` : 
                '';
            
            bubble.innerHTML = `
                <div class="author-tag">${story.author}</div>
                <div class="sentence-text">${story.text}</div>
                ${editButton}
            `;
            
            if (story.author === currentUser.name) {
                const btn = bubble.querySelector('.edit-btn');
                btn.addEventListener('click', function() {
                    editSentence(this.getAttribute('data-story-id'), this.getAttribute('data-story-text'));
                });
            }
            
            container.appendChild(bubble);
        });

        container.scrollTop = container.scrollHeight;
    });
}

function startStudentMonitoring() {
    const team = currentUser.team;

    database.ref(`turnOrder/team${team}`).on('value', (snapshot) => {
        const turnData = snapshot.val();
        
        database.ref('game/status').once('value', (statusSnapshot) => {
            const gameStatus = statusSnapshot.val();

            if (gameStatus === 'ended') {
                updateTurnStatus('🏁 게임이 종료되었습니다!', false, false);
                return;
            }

            if (!turnData) {
                updateTurnStatus('게임이 시작되기를 기다리는 중...', false, false);
                return;
            }

            const members = turnData.members || [];
            const currentTurnIndex = turnData.currentTurn || 0;
            const maxRounds = turnData.maxRounds || 0;
            const totalTurns = members.length * maxRounds;

            if (maxRounds > 0 && currentTurnIndex >= totalTurns) {
                updateTurnStatus('🎉 우리 조는 모든 바퀴를 완료했습니다!', false, false, true);
                return;
            }

            const currentTurnPlayer = members[currentTurnIndex % members.length];
            const isMyTurn = currentTurnPlayer === currentUser.name;

            const currentRound = Math.floor(currentTurnIndex / members.length) + 1;
            const roundInfo = maxRounds > 0 ? ` (${currentRound}/${maxRounds}바퀴)` : '';

            database.ref('activeWriters').once('value', (writerSnapshot) => {
                const writers = writerSnapshot.val() || {};
                const teamWriters = Object.values(writers).filter(w => w.team == team && w.name !== currentUser.name);

                if (teamWriters.length > 0) {
                    updateTurnStatus(`${teamWriters[0].name}님이 문장을 쓰고 있어요... ✍️${roundInfo}`, false, true);
                } else if (isMyTurn) {
                    updateTurnStatus(`✨ 지금은 내 차례예요! 문장을 작성해주세요! 🎉${roundInfo}`, true, false);
                } else {
                    updateTurnStatus(`${currentTurnPlayer}님의 차례입니다. 잠시만 기다려주세요!${roundInfo}`, false, false);
                }
            });
        });
    });
}

function updateTurnStatus(message, canWrite, someoneWriting, completed = false) {
    const status = document.getElementById('writingStatus');
    const input = document.getElementById('storyInput');
    const submitBtn = document.getElementById('submitBtn');

    status.textContent = message;
    
    if (completed) {
        status.className = 'writing-status completed';
        input.disabled = true;
        submitBtn.disabled = true;
    } else if (canWrite) {
        status.className = 'writing-status my-turn';
        input.disabled = false;
        submitBtn.disabled = false;
    } else {
        if (someoneWriting) {
            status.className = 'writing-status active';
        } else {
            status.className = 'writing-status';
        }
        input.disabled = true;
        submitBtn.disabled = true;
    }
}

function submitSentence() {
    const text = document.getElementById('storyInput').value.trim();
    
    if (!text) {
        showNotification('문장을 입력해주세요! 📝', 'error');
        return;
    }

    const team = currentUser.team;

    database.ref(`turnOrder/team${team}`).once('value', (snapshot) => {
        const turnData = snapshot.val();
        if (!turnData) return;

        const members = turnData.members || [];
        const currentTurnIndex = turnData.currentTurn || 0;
        const maxRounds = turnData.maxRounds || 0;
        const totalTurns = members.length * maxRounds;

        if (maxRounds > 0 && currentTurnIndex >= totalTurns) {
            showNotification('모든 바퀴를 완료했습니다! 🎉', 'warning');
            return;
        }

        const currentTurnPlayer = members[currentTurnIndex % members.length];

        if (editingMessageId) {
            if (currentTurnPlayer !== currentUser.name) {
                showNotification('지금은 수정할 수 없어요! 내 차례를 기다려주세요. ⚠️', 'warning');
                return;
            }

            database.ref('stories/' + editingMessageId).update({
                text: text,
                edited: true,
                editedAt: Date.now()
            }).then(() => {
                showNotification('문장이 수정되었습니다! ✅', 'success');
                document.getElementById('storyInput').value = '';
                editingMessageId = null;
                removeActiveWriter();
            });
        } else {
            if (currentTurnPlayer !== currentUser.name) {
                showNotification('지금은 내 차례가 아니에요! ⚠️', 'warning');
                return;
            }

            const storyId = Date.now().toString();
            database.ref('stories/' + storyId).set({
                id: storyId,
                team: team,
                author: currentUser.name,
                text: text,
                timestamp: Date.now()
            }).then(() => {
                database.ref(`turnOrder/team${team}/currentTurn`).set(currentTurnIndex + 1);
                
                showNotification('문장이 제출되었습니다! 🎉', 'success');
                document.getElementById('storyInput').value = '';
                removeActiveWriter();
            });
        }
    });
}

function editSentence(id, text) {
    const team = currentUser.team;

    database.ref(`turnOrder/team${team}`).once('value', (turnSnapshot) => {
        const turnData = turnSnapshot.val();
        if (!turnData) return;

        const members = turnData.members || [];
        const currentTurnIndex = turnData.currentTurn || 0;
        const currentTurnPlayer = members[currentTurnIndex % members.length];

        if (currentTurnPlayer !== currentUser.name) {
            showNotification('수정은 내 차례일 때만 가능해요! ⚠️', 'warning');
            return;
        }

        database.ref('activeWriters').once('value', (snapshot) => {
            const writers = snapshot.val() || {};
            const teamWriters = Object.values(writers).filter(w => w.team == team && w.name !== currentUser.name);

            if (teamWriters.length > 0) {
                showNotification(`${teamWriters[0].name}님이 입력 중이라 수정할 수 없어요! ⚠️`, 'warning');
                return;
            }

            editingMessageId = id;
            document.getElementById('storyInput').value = text;
            document.getElementById('storyInput').focus();
            setActiveWriter();
            showNotification('문장을 수정하고 제출 버튼을 눌러주세요! ✏️', 'success');
        });
    });
}

function setActiveWriter() {
    if (currentUser.role === 'student') {
        database.ref('activeWriters/' + currentUser.name.replace(/\./g, '_')).set({
            name: currentUser.name,
            team: currentUser.team,
            timestamp: Date.now()
        });
    }
}

function removeActiveWriter() {
    if (currentUser.role === 'student') {
        database.ref('activeWriters/' + currentUser.name.replace(/\./g, '_')).remove();
    }
}

function updateStudentCount(count) {
    document.getElementById('studentCount').textContent = count + '명';
}

function updateTotalSentences(count) {
    document.getElementById('totalSentences').textContent = count + '개';
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="font-size: 24px; font-weight: 700;">${message}</div>
    `;

    document.getElementById('notificationArea').appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    if (confirm('정말 나가시겠습니까?')) {
        removeActiveWriter();
        location.reload();
    }
}

window.addEventListener('beforeunload', removeActiveWriter);
