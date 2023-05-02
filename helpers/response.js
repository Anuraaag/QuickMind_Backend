const generateResponse = (success = false, message = ``, data = [], error = {}) => {
    const response = {
        'success': success,
        'payload': {
            'message': message,
            'data': data,
            'error': error
        }
    }
    return response;
}

module.exports = generateResponse;