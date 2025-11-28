// ===== Question Management Functions =====

function loadQuestions() {
    $.ajax({
        url: '/StudyGroups/GetQuestions',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderQuestions(response.data);
                $('#questionsEmpty').hide();
                $('#questionsList').show();
            } else {
                $('#questionsEmpty').show();
                $('#questionsList').empty();
            }
        },
        error: function () {
            console.error('Error loading questions');
            $('#questionsEmpty').show();
        }
    });
}

function renderQuestions(questions) {
    var container = $('#questionsList');
    container.empty();

    questions.forEach(function (question, index) {
        var card = createQuestionCard(question, index + 1);
        container.append(card);
    });
}

function createQuestionCard(question, number) {
    var answerSection = '';
    var actionButtons = '';

    if (question.hasAnswered && question.userAnswer) {
        // Show user's answer
        var resultClass = question.userAnswer.isCorrect ? 'alert-success' : 'alert-danger';
        var resultIcon = question.userAnswer.isCorrect ? 'ti-check' : 'ti-x';
        var resultText = question.userAnswer.isCorrect ? 'Correct!' : 'Incorrect';
        
        answerSection = `
            <div class="alert ${resultClass} mb-0 mt-3">
                <div class="d-flex align-items-center">
                    <i class="ti ${resultIcon} me-2"></i>
                    <div class="flex-grow-1">
                        <strong>${resultText}</strong> Your answer: ${escapeHtml(question.userAnswer.answer)}
                        <div class="mt-1">
                            <span class="badge bg-light text-dark">+${question.userAnswer.pointsEarned} points</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (isMember) {
        // Show answer button for members who haven't answered
        var questionJson = JSON.stringify(question).replace(/"/g, '&quot;');
        answerSection = `
            <div class="mt-3">
                <button class="btn btn-primary btn-sm w-100" onclick='openAnswerModal(${question.id}, "${escapeHtml(question.questionText).replace(/"/g, '&quot;')}", "${question.questionType}", ${questionJson})'>
                    <i class="ti ti-pencil me-1"></i>Answer This Question
                </button>
            </div>
        `;
    }

    if (isOwner) {
        actionButtons = `
            <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-outline-info" onclick="viewQuestionAnswers(${question.id})" title="View Answers">
                    <i class="ti ti-eye"></i>
                </button>
                <button type="button" class="btn btn-outline-primary" onclick="editQuestion(${question.id})" title="Edit Question">
                    <i class="ti ti-edit"></i>
                </button>
                <button type="button" class="btn btn-outline-danger" onclick="deleteQuestion(${question.id})" title="Delete Question">
                    <i class="ti ti-trash"></i>
                </button>
            </div>
        `;
    }

    var optionsHtml = '';
    if (question.questionType === 'MultipleChoice') {
        var options = [
            { label: 'A', text: question.optionA },
            { label: 'B', text: question.optionB },
            { label: 'C', text: question.optionC },
            { label: 'D', text: question.optionD }
        ].filter(opt => opt.text);

        optionsHtml = '<div class="mt-2">';
        options.forEach(function (opt) {
            var isCorrect = isOwner && opt.label === question.correctAnswer;
            var correctBadge = isCorrect ? '<span class="badge bg-success-subtle text-success ms-2">Correct</span>' : '';
            optionsHtml += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" disabled>
                    <label class="form-check-label">
                        <strong>${opt.label}.</strong> ${escapeHtml(opt.text)} ${correctBadge}
                    </label>
                </div>
            `;
        });
        optionsHtml += '</div>';
    } else if (question.questionType === 'TrueFalse') {
        optionsHtml = `
            <div class="mt-2">
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" disabled>
                    <label class="form-check-label">True ${isOwner && question.correctAnswer === 'True' ? '<span class="badge bg-success-subtle text-success ms-2">Correct</span>' : ''}</label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" disabled>
                    <label class="form-check-label">False ${isOwner && question.correctAnswer === 'False' ? '<span class="badge bg-success-subtle text-success ms-2">Correct</span>' : ''}</label>
                </div>
            </div>
        `;
    }

    var card = `
        <div class="card mb-3" id="question-${question.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        <h6 class="fw-semibold mb-2">
                            <span class="badge bg-primary-subtle text-primary me-2">#${number}</span>
                            ${escapeHtml(question.questionText)}
                        </h6>
                        <div class="d-flex gap-2 flex-wrap mb-2">
                            <span class="badge bg-info-subtle text-info">
                                <i class="ti ti-star me-1"></i>${question.points} ${question.points === 1 ? 'Point' : 'Points'}
                            </span>
                            <span class="badge bg-secondary-subtle text-secondary">
                                ${question.questionType === 'MultipleChoice' ? 'Multiple Choice' : question.questionType === 'TrueFalse' ? 'True/False' : 'Short Answer'}
                            </span>
                        </div>
                        ${optionsHtml}
                        ${answerSection}
                    </div>
                    ${actionButtons ? '<div class="ms-2">' + actionButtons + '</div>' : ''}
                </div>
                <div class="text-muted small mt-2">
                    <i class="ti ti-user me-1"></i>Created by ${escapeHtml(question.createdByName)} on ${question.createdAt}
                </div>
            </div>
        </div>
    `;

    return card;
}

function openCreateQuestionModal() {
    $('#questionId').val('');
    $('#questionForm')[0].reset();
    $('#questionModalTitle').text('Create Question');
    $('#btnSubmitQuestion').html('<i class="ti ti-device-floppy me-1"></i>Save Question');
    $('#questionType').val('MultipleChoice').trigger('change');
    $('#questionModal').modal('show');
}

function editQuestion(questionId) {
    // Get question data
    $.ajax({
        url: '/StudyGroups/GetQuestions',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            var question = response.data.find(q => q.id === questionId);
            if (question) {
                populateQuestionForm(question);
                $('#questionModal').modal('show');
            }
        },
        error: function () {
            Swal.fire('Error', 'Failed to load question details', 'error');
        }
    });
}

function populateQuestionForm(question) {
    $('#questionId').val(question.id);
    $('#questionText').val(question.questionText);
    $('#questionType').val(question.questionType).trigger('change');
    $('#optionA').val(question.optionA || '');
    $('#optionB').val(question.optionB || '');
    $('#optionC').val(question.optionC || '');
    $('#optionD').val(question.optionD || '');
    $('#correctAnswer').val(question.correctAnswer);
    $('#questionPoints').val(question.points);

    $('#questionModalTitle').text('Edit Question');
    $('#btnSubmitQuestion').html('<i class="ti ti-device-floppy me-1"></i>Update Question');
}

function handleQuestionTypeChange() {
    var type = $('#questionType').val();
    
    if (type === 'MultipleChoice') {
        $('#multipleChoiceOptions').show();
        $('#optionA, #optionB').prop('required', true);
        $('#correctAnswerHint').text('Enter A, B, C, or D');
    } else if (type === 'TrueFalse') {
        $('#multipleChoiceOptions').hide();
        $('#optionA, #optionB, #optionC, #optionD').prop('required', false).val('');
        $('#correctAnswerHint').text('Enter True or False');
    } else if (type === 'ShortAnswer') {
        $('#multipleChoiceOptions').hide();
        $('#optionA, #optionB, #optionC, #optionD').prop('required', false).val('');
        $('#correctAnswerHint').text('Enter the expected text answer');
    }
}

function submitQuestion() {
    var questionId = $('#questionId').val();
    var questionText = $('#questionText').val().trim();
    var questionType = $('#questionType').val();
    var correctAnswer = $('#correctAnswer').val().trim();
    var points = parseInt($('#questionPoints').val());

    if (!questionText || !correctAnswer) {
        Swal.fire('Error', 'Please fill in all required fields', 'error');
        return;
    }

    var data = {
        studyGroupId: studyGroupId,
        questionText: questionText,
        questionType: questionType,
        correctAnswer: correctAnswer,
        points: points
    };

    if (questionType === 'MultipleChoice') {
        data.optionA = $('#optionA').val().trim();
        data.optionB = $('#optionB').val().trim();
        data.optionC = $('#optionC').val().trim();
        data.optionD = $('#optionD').val().trim();

        if (!data.optionA || !data.optionB) {
            Swal.fire('Error', 'Please provide at least options A and B', 'error');
            return;
        }
    }

    var url = '/StudyGroups/CreateQuestion';
    var successMessage = 'Question created successfully!';

    if (questionId) {
        url = '/StudyGroups/UpdateQuestion';
        data.questionId = parseInt(questionId);
        successMessage = 'Question updated successfully!';
    }

    AmagiLoader.show();

    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                Swal.fire('Success', successMessage, 'success');
                $('#questionModal').modal('hide');
                loadQuestions();
                loadUserScore();
            } else {
                Swal.fire('Error', response.Message || 'Failed to save question', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while saving the question', 'error');
        }
    });
}

function deleteQuestion(questionId) {
    Swal.fire({
        title: 'Delete Question?',
        text: 'This will also delete all associated answers. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/StudyGroups/DeleteQuestion',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(questionId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Deleted!', 'Question has been deleted.', 'success');
                        $(`#question-${questionId}`).fadeOut(300, function () {
                            $(this).remove();
                            if ($('#questionsList .card').length === 0) {
                                $('#questionsEmpty').show();
                                $('#questionsList').hide();
                            }
                        });
                        loadUserScore();
                        loadLeaderboard();
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to delete question', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while deleting the question', 'error');
                }
            });
        }
    });
}

function selectAnswerOption(optionValue) {
    console.log('=== selectAnswerOption START ===');
    console.log('Option value:', optionValue);
    
    // Use unique ID prefix for answer modal radio buttons
    var inputId = 'answerOption' + optionValue;
    console.log('Looking for input with ID:', inputId);
    
    var radio = document.getElementById(inputId);
    console.log('Found radio element:', radio);
    console.log('Radio type:', radio ? radio.type : 'N/A');
    
    if (radio) {
        console.log('Radio BEFORE - checked:', radio.checked, 'value:', radio.value);
        
        // Force the radio to be checked
        radio.checked = true;
        
        console.log('Radio AFTER - checked:', radio.checked, 'value:', radio.value);
        
        // Verify using jQuery as well
        console.log('jQuery check - is checked:', $('input[name="answerOption"]:checked').length);
        console.log('jQuery check - value:', $('input[name="answerOption"]:checked').val());
        
        // Trigger change event
        $(radio).trigger('change');
    } else {
        console.error('? Radio button NOT FOUND with ID:', inputId);
        console.log('Available radio buttons:', $('input[name="answerOption"]').length);
        $('input[name="answerOption"]').each(function() {
            console.log('  - ID:', this.id, 'Type:', this.type, 'Value:', this.value);
        });
    }
    console.log('=== selectAnswerOption END ===');
}

function openAnswerModal(questionId, questionText, questionType, question) {
    $('#answerQuestionId').val(questionId);
    $('#answerQuestionText').text(questionText);

    // Clear previous content
    $('#answerOptionsContainer').empty();
    $('#answerTextContainer').hide();

    if (questionType === 'MultipleChoice') {
        var options = [
            { label: 'A', text: question.optionA },
            { label: 'B', text: question.optionB },
            { label: 'C', text: question.optionC },
            { label: 'D', text: question.optionD }
        ].filter(opt => opt.text);

        var optionsHtml = '<div class="answer-options-grid">';
        options.forEach(function (opt) {
            optionsHtml += `
                <div class="answer-option-card" data-option="${opt.label}" onclick="selectAnswerOption('${opt.label}')">
                    <input class="form-check-input answer-option-input" type="radio" name="answerOption" id="answerOption${opt.label}" value="${opt.label}">
                    <label class="answer-option-label-wrapper" for="answerOption${opt.label}">
                        <div class="answer-option-content">
                            <span class="answer-option-label">${opt.label}</span>
                            <span class="answer-option-text">${escapeHtml(opt.text)}</span>
                        </div>
                        <div class="answer-option-check">
                            <i class="ti ti-circle"></i>
                            <i class="ti ti-circle-check-filled"></i>
                        </div>
                    </label>
                </div>
            `;
        });
        optionsHtml += '</div>';
        $('#answerOptionsContainer').html(optionsHtml).show();
    } else if (questionType === 'TrueFalse') {
        var optionsHtml = `
            <div class="answer-options-grid">
                <div class="answer-option-card answer-option-true" data-option="True" onclick="selectAnswerOption('True')">
                    <input class="form-check-input answer-option-input" type="radio" name="answerOption" id="answerOptionTrue" value="True">
                    <label class="answer-option-label-wrapper" for="answerOptionTrue">
                        <div class="answer-option-content">
                            <span class="answer-option-icon"><i class="ti ti-check"></i></span>
                            <span class="answer-option-text">True</span>
                        </div>
                        <div class="answer-option-check">
                            <i class="ti ti-circle"></i>
                            <i class="ti ti-circle-check-filled"></i>
                        </div>
                    </label>
                </div>
                <div class="answer-option-card answer-option-false" data-option="False" onclick="selectAnswerOption('False')">
                    <input class="form-check-input answer-option-input" type="radio" name="answerOption" id="answerOptionFalse" value="False">
                    <label class="answer-option-label-wrapper" for="answerOptionFalse">
                        <div class="answer-option-content">
                            <span class="answer-option-icon"><i class="ti ti-x"></i></span>
                            <span class="answer-option-text">False</span>
                        </div>
                        <div class="answer-option-check">
                            <i class="ti ti-circle"></i>
                            <i class="ti ti-circle-check-filled"></i>
                        </div>
                    </label>
                </div>
            </div>
        `;
        $('#answerOptionsContainer').html(optionsHtml).show();
    } else {
        $('#answerTextContainer').show();
        $('#answerText').val('');
    }

    $('#answerModal').modal('show');
}

function submitAnswer() {
console.log('=== submitAnswer START ===');
    
var questionId = parseInt($('#answerQuestionId').val());
console.log('Question ID:', questionId);
    
var userAnswer = '';

// Debug: Check all radio buttons
console.log('Total radio buttons:', $('input[name="answerOption"]').length);
$('input[name="answerOption"]').each(function(index) {
    console.log(`Radio ${index}: ID=${this.id}, Value=${this.value}, Checked=${this.checked}`);
});

// Get the answer based on question type
var selectedOption = $('input[name="answerOption"]:checked').val();
console.log('Selected option value:', selectedOption);
console.log('Number of checked radios:', $('input[name="answerOption"]:checked').length);
    
if (selectedOption) {
    userAnswer = selectedOption;
    console.log('Using radio answer:', userAnswer);
} else {
    userAnswer = $('#answerText').val().trim();
    console.log('Using text answer:', userAnswer);
}

console.log('Final userAnswer:', userAnswer);

if (!userAnswer) {
    console.error('? No answer provided!');
    Swal.fire('Error', 'Please provide an answer', 'error');
    return;
}
    
console.log('? Answer valid, submitting...');

    var data = {
        questionId: questionId,
        userAnswer: userAnswer
    };

    AmagiLoader.show();

    $.ajax({
        url: '/StudyGroups/SubmitAnswer',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                $('#answerModal').modal('hide');
                
                var resultData = response.Data;
                var icon = resultData.isCorrect ? 'success' : 'error';
                var title = resultData.isCorrect ? 'Correct!' : 'Incorrect';
                var message = resultData.isCorrect 
                    ? `Great job! You earned ${resultData.pointsEarned} points!`
                    : `The correct answer was: ${resultData.correctAnswer}`;

                Swal.fire({
                    title: title,
                    text: message,
                    icon: icon,
                    confirmButtonText: 'OK'
                }).then(() => {
                    loadQuestions();
                    loadUserScore();
                    loadLeaderboard();
                });
            } else {
                Swal.fire('Error', response.Message || 'Failed to submit answer', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while submitting the answer', 'error');
        }
    });
}

function loadUserScore() {
    $.ajax({
        url: '/StudyGroups/GetUserScore',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.MessageType === 'Success' && response.Data) {
                var data = response.Data;
                $('#userTotalScore').text(data.totalScore);
                $('#userAnsweredCount').text(data.answeredCount);
                $('#totalQuestionsCount').text(data.totalQuestions);
                $('#scorePercentage').text(data.percentage.toFixed(1) + '%');
                
                var progressWidth = data.totalPossible > 0 ? (data.totalScore / data.totalPossible * 100) : 0;
                $('#scoreProgress').css('width', progressWidth + '%');
            }
        },
        error: function () {
            console.error('Error loading user score');
        }
    });
}

function loadLeaderboard() {
    $.ajax({
        url: '/StudyGroups/GetLeaderboard',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderLeaderboard(response.data);
                $('#leaderboardEmpty').hide();
                $('#leaderboardList').show();
            } else {
                $('#leaderboardEmpty').show();
                $('#leaderboardList').empty();
            }
        },
        error: function () {
            console.error('Error loading leaderboard');
            $('#leaderboardEmpty').show();
        }
    });
}

function renderLeaderboard(data) {
    var container = $('#leaderboardList');
    container.empty();

    // Show top 5 only
    var topFive = data.slice(0, 5);

    topFive.forEach(function (entry) {
        var rankBadge = '';
        if (entry.rank === 1) {
            rankBadge = '<span class="badge bg-warning text-dark"><i class="ti ti-trophy"></i></span>';
        } else if (entry.rank === 2) {
            rankBadge = '<span class="badge bg-secondary"><i class="ti ti-medal"></i></span>';
        } else if (entry.rank === 3) {
            rankBadge = '<span class="badge bg-bronze" style="background-color: #cd7f32;"><i class="ti ti-medal"></i></span>';
        } else {
            rankBadge = `<span class="badge bg-light text-dark">#${entry.rank}</span>`;
        }

        var currentUserClass = entry.isCurrentUser ? 'bg-primary-subtle' : '';
        
        var item = `
            <div class="d-flex align-items-center justify-content-between mb-3 p-2 rounded ${currentUserClass}">
                <div class="d-flex align-items-center flex-grow-1">
                    ${rankBadge}
                    <div class="ms-2 flex-grow-1">
                        <div class="fw-semibold small">${escapeHtml(entry.userName)} ${entry.isCurrentUser ? '<span class="badge bg-info-subtle text-info">You</span>' : ''}</div>
                        <small class="text-muted">${entry.answeredCount} answered</small>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-primary">${entry.totalScore}</div>
                    <small class="text-muted">points</small>
                </div>
            </div>
        `;
        container.append(item);
    });
}

function viewQuestionAnswers(questionId) {
    AmagiLoader.show();

    $.ajax({
        url: '/StudyGroups/GetQuestionAnswers',
        type: 'GET',
        data: { questionId: questionId },
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success' && response.Data) {
                showAnswersModal(response.Data);
            } else {
                Swal.fire('Error', response.Message || 'Failed to load answers', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while loading answers', 'error');
        }
    });
}

function showAnswersModal(data) {
    var correctPercentage = data.totalAnswers > 0 ? ((data.correctAnswers / data.totalAnswers) * 100).toFixed(1) : 0;
    
    var answersHtml = '';
    if (data.answers && data.answers.length > 0) {
        data.answers.forEach(function (answer) {
            var statusBadge = answer.isCorrect 
                ? '<span class="badge bg-success"><i class="ti ti-check me-1"></i>Correct</span>'
                : '<span class="badge bg-danger"><i class="ti ti-x me-1"></i>Incorrect</span>';
            
            answersHtml += `
                <div class="card mb-2">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="mb-1">${escapeHtml(answer.userName)}</h6>
                                <small class="text-muted">${answer.userEmail}</small>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="mb-2">
                            <strong>Answer:</strong> <span class="text-primary">${escapeHtml(answer.userAnswer)}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted"><i class="ti ti-clock me-1"></i>${answer.answeredAt}</small>
                            <span class="badge bg-info-subtle text-info">+${answer.pointsEarned} points</span>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        answersHtml = '<div class="text-center py-4 text-muted"><i class="ti ti-inbox" style="font-size: 48px;"></i><p class="mt-2">No answers submitted yet</p></div>';
    }

    var modalContent = `
        <div class="modal fade" id="viewAnswersModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Member Answers</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info mb-3">
                            <h6 class="mb-2"><strong>Question:</strong> ${escapeHtml(data.questionText)}</h6>
                            <p class="mb-0"><strong>Correct Answer:</strong> <span class="text-success">${escapeHtml(data.correctAnswer)}</span></p>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <div class="card bg-primary-subtle border-0">
                                    <div class="card-body text-center">
                                        <h3 class="mb-0 fw-bold text-primary">${data.totalAnswers}</h3>
                                        <small class="text-muted">Total Answers</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-success-subtle border-0">
                                    <div class="card-body text-center">
                                        <h3 class="mb-0 fw-bold text-success">${data.correctAnswers}</h3>
                                        <small class="text-muted">Correct</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-warning-subtle border-0">
                                    <div class="card-body text-center">
                                        <h3 class="mb-0 fw-bold text-warning">${correctPercentage}%</h3>
                                        <small class="text-muted">Success Rate</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h6 class="mb-3">All Submissions:</h6>
                        <div style="max-height: 400px; overflow-y: auto;">
                            ${answersHtml}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    $('#viewAnswersModal').remove();
    
    // Append and show new modal
    $('body').append(modalContent);
    var modal = new bootstrap.Modal(document.getElementById('viewAnswersModal'));
    modal.show();
    
    // Clean up modal after it's hidden
    $('#viewAnswersModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}
