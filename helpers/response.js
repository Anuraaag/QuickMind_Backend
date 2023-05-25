const generateResponse = (success = false, message = ``, data = [], error = {}, pushNotification = {}) => {
    const response = {
        'success': success,
        'payload': {
            'message': message,
            'data': data,
            'error': error
        },
        'pushNotification': pushNotification
    }
    return response;
}

module.exports = generateResponse;