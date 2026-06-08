import { Response } from 'express';

export class ResponseUtils {
  static success(res: Response, data: any, statusCode = 200) {
    return res.status(statusCode).json(data);
  }

  static created(res: Response, data: any) {
    return res.status(201).json(data);
  }

  static error(res: Response, message: string, statusCode = 500, details?: any) {
    return res.status(statusCode).json({
      status: statusCode,
      error: message,
      ...(details && { details }),
    });
  }

  static notFound(res: Response, message = 'Resource not found') {
    return res.status(404).json({ status: 404, error: message });
  }

  static badRequest(res: Response, message = 'Bad request', details?: any) {
    return res.status(400).json({
      status: 400,
      error: message,
      ...(details && { details }),
    });
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return res.status(401).json({ status: 401, error: message });
  }

  static conflict(res: Response, message = 'Conflict') {
    return res.status(409).json({ status: 409, error: message });
  }

  static bulkResult(
    res: Response,
    label: string,
    results: any[],
    errors: any[],
    statusCode = 200
  ) {
    return res.status(statusCode).json({
      status: statusCode,
      message:
        errors.length === 0
          ? `${results.length} ${label} processed successfully`
          : `${label} completed with ${errors.length} error(s)`,
      count: results.length,
      results,
      ...(errors.length > 0 && { errors }),
    });
  }

  static paginated(res: Response, data: any[], pagination: object) {
    return res.status(200).json({ data, pagination });
  }
}
