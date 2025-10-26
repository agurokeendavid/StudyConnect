using StudyConnect.Constants;

namespace StudyConnect.Helpers;

public static class ResponseHelper
{
    public static object Success(string message, object data = null, string redirectUrl = null)
        {
            var response = new
            {
                MessageType = MessageTypes.SuccessString,
                Message = message
            };

            if (data != null)
            {
                return new
                {
                    response.MessageType,
                    response.Message,
                    Data = data,
                    RedirectUrl = redirectUrl
                };
            }

            if (!string.IsNullOrEmpty(redirectUrl))
            {
                return new
                {
                    response.MessageType,
                    response.Message,
                    RedirectUrl = redirectUrl
                };
            }

            return response;
        }

        public static object Failed(string message, object data = null)
        {
            var response = new
            {
                MessageType = MessageTypes.FailedString,
                Message = message
            };

            if (data != null)
            {
                return new
                {
                    response.MessageType,
                    response.Message,
                    Data = data
                };
            }

            return response;
        }

        public static object Error(string message, object data = null)
        {
            var response = new
            {
                MessageType = MessageTypes.ErrorString,
                Message = message
            };

            if (data != null)
            {
                return new
                {
                    response.MessageType,
                    response.Message,
                    Data = data
                };
            }

            return response;
        }

        public static object Question(string message, object data = null)
        {
            return new
            {
                MessageType = MessageTypes.QuestionString,
                Message = message,
                Data = data
            };
        }

        public static object Warning(string message, object data = null)
        {
            return new
            {
                MessageType = MessageTypes.WarningString,
                Message = message,
                Data = data
            };
        }

        public static object Info(string message, object data = null)
        {
            return new
            {
                MessageType = MessageTypes.InfoString,
                Message = message,
                Data = data
            };
        }

        // Special method for email verification responses
        public static object EmailVerificationRequired(string message, string email)
        {
            return new
            {
                MessageType = MessageTypes.FailedString,
                Message = message,
                ShowResendOption = true,
                Email = email
            };
        }
}