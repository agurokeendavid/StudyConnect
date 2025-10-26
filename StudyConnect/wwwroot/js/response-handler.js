// Response Handler Utility for consistent message handling
window.ResponseHandler = {
    
    // Check if response indicates success
    isSuccess: function(response) {
        return response && (response.MessageType === MessageTypes.SuccessString || response.MessageType === MessageTypes.Success);
    },
    
    // Check if response indicates failure
    isFailed: function(response) {
        return response && (response.MessageType === MessageTypes.FailedString || response.MessageType === MessageTypes.Failed);
    },
    
    // Check if response indicates error
    isError: function(response) {
        return response && response.MessageType === MessageTypes.ErrorString;
    },
    
    // Check if response indicates warning
    isWarning: function(response) {
        return response && response.MessageType === MessageTypes.WarningString;
    },
    
    // Check if response indicates question/confirmation needed
    isQuestion: function(response) {
        return response && (response.MessageType === MessageTypes.QuestionString || response.MessageType === MessageTypes.Question);
    },
    
    // Check if response indicates info
    isInfo: function(response) {
        return response && response.MessageType === MessageTypes.InfoString;
    },
    
    // Handle standard responses with SweetAlert
    handle: function(response, options = {}) {
        if (!response) return;
        
        const defaultOptions = {
            showRedirect: true,
            allowOutsideClick: true,
            customHandlers: {}
        };
        
        const opts = { ...defaultOptions, ...options };
        
        // Custom handler override
        if (opts.customHandlers[response.MessageType]) {
            return opts.customHandlers[response.MessageType](response, opts);
        }
        
        // Handle both string and numeric message types
        if (this.isSuccess(response)) {
            return this.handleSuccess(response, opts);
        }
        
        if (this.isFailed(response)) {
            return this.handleFailed(response, opts);
        }
        
        if (this.isError(response)) {
            return this.handleError(response, opts);
        }
        
        if (this.isWarning(response)) {
            return this.handleWarning(response, opts);
        }
        
        if (this.isQuestion(response)) {
            return this.handleQuestion(response, opts);
        }
        
        if (this.isInfo(response)) {
            return this.handleInfo(response, opts);
        }
        
        console.warn('Unknown MessageType:', response.MessageType);
        return this.handleError({ Message: 'Unknown response type' }, opts);
    },
    
    handleSuccess: function(response, opts) {
        const promise = Swal.fire({
            title: 'Success!',
            text: response.Message,
            icon: 'success',
            confirmButtonColor: '#28a745',
            allowOutsideClick: opts.allowOutsideClick
        });
        
        if (opts.showRedirect && response.RedirectUrl) {
            promise.then(() => {
                location.replace(response.RedirectUrl);
            });
        }
        
        return promise;
    },
    
    handleFailed: function(response, opts) {
        // Special handling for email verification
        if (response.ShowResendOption && response.Email) {
            return this.handleEmailVerification(response, opts);
        }
        
        return Swal.fire({
            title: 'Failed!',
            text: response.Message,
            icon: 'error',
            confirmButtonColor: '#dc3545',
            allowOutsideClick: opts.allowOutsideClick
        });
    },
    
    handleError: function(response, opts) {
        return Swal.fire({
            title: 'Error!',
            text: response.Message || 'An unexpected error occurred.',
            icon: 'error',
            confirmButtonColor: '#dc3545',
            allowOutsideClick: opts.allowOutsideClick
        });
    },
    
    handleWarning: function(response, opts) {
        return Swal.fire({
            title: 'Warning!',
            text: response.Message,
            icon: 'warning',
            confirmButtonColor: '#ffc107',
            allowOutsideClick: opts.allowOutsideClick
        });
    },
    
    handleQuestion: function(response, opts) {
        return Swal.fire({
            title: 'Confirmation',
            text: response.Message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#6c757d',
            allowOutsideClick: opts.allowOutsideClick
        });
    },
    
    handleInfo: function(response, opts) {
        return Swal.fire({
            title: 'Information',
            text: response.Message,
            icon: 'info',
            confirmButtonColor: '#17a2b8',
            allowOutsideClick: opts.allowOutsideClick
        });
    },
    
    handleEmailVerification: function(response, opts) {
        // Show inline notice if function exists
        if (typeof showEmailVerificationNotice === 'function') {
            showEmailVerificationNotice(response.Email, response.Message);
        }
        
        // Show SweetAlert dialog
        return Swal.fire({
            title: 'Email Not Verified',
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <p style="margin-bottom: 15px;">${response.Message}</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <p style="color: #856404; font-size: 14px; margin: 0;">
                            <strong>Account Email:</strong> ${response.Email}
                        </p>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '<i class="fa fa-envelope"></i> Send Verification Email',
            cancelButtonText: 'I\'ll verify later',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            allowOutsideClick: false,
            customClass: {
                popup: 'swal-email-verification'
            }
        }).then((result) => {
            if (result.isConfirmed && typeof window.resendVerificationEmail === 'function') {
                window.resendVerificationEmail(response.Email);
            }
            return result;
        });
    }
};

// Backward compatibility aliases
window.handleResponse = window.ResponseHandler.handle;
window.isSuccessResponse = window.ResponseHandler.isSuccess;
window.isFailedResponse = window.ResponseHandler.isFailed;