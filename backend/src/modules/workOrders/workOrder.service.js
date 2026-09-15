import * as snapshotRepository from './workOrderSnapshot.repository.js';

export async function createSnapshot(db, workOrder, item, context = {}) {
  return snapshotRepository.createSnapshot(db, {
    workOrderId: workOrder.id,
    customerName: context.customerName || null,
    productName: context.productName || 'Unknown Product',
    quantity: item.quantity,
    material: context.material || null,
    specification: context.specification || null,
    dimension: context.dimension || null,
    color: context.color || null,
    thickness: context.thickness || null,
    productionNotes: item.productionNotes || null,
    artworkFileUrl: item.artworkFileUrl || null,
    artworkDriveUrl: item.artworkDriveUrl || null,
  });
}
