import * as service from './payment.service.js';

function statusFor(error) {
  if (error.code === 'VALIDATION_ERROR') return 400;
  if (error.code === 'NOT_FOUND') return 404;
  if (error.code === 'CONFLICT') return 409;
  return 500;
}

export async function create(request, response, next) {
  try {
    const data = await service.createPayment(request.app.locals.db, request.params.salesOrderId, request.body || {});
    response.status(201).json({ data });
  } catch (error) {
    if (error.code) return response.status(statusFor(error)).json({ error: { code: error.code, message: error.message, details: {} } });
    next(error);
  }
}

export async function list(request, response, next) {
  try {
    const data = await service.listPayments(request.app.locals.db, request.params.salesOrderId);
    response.json({ data });
  } catch (error) { next(error); }
}
