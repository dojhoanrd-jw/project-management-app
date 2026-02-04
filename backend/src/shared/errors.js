class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, 401);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Invalid input data') {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

module.exports = { AppError, UnauthorizedError, ValidationError, NotFoundError, ForbiddenError };
