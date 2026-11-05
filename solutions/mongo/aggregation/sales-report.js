// Run: mongosh "mongodb://localhost:27017/s3_training" --file solutions/mongo/aggregation/sales-report.js
// Seed small deterministic fixtures with upserts so examples can be rerun.
const products = db.products;
[
  { _id: 'p-1', name: 'Keyboard', category: 'accessories', price: 50 },
  { _id: 'p-2', name: 'Monitor', category: 'displays', price: 200 },
  { _id: 'p-3', name: 'Mouse', category: 'accessories', price: 25 },
].forEach((doc) => products.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true }));

const sales = db.sales;
[
  { _id: 's-1', productId: 'p-1', quantity: 2, soldAt: ISODate('2026-10-01T10:00:00Z'), region: 'West' },
  { _id: 's-2', productId: 'p-2', quantity: 1, soldAt: ISODate('2026-10-02T10:00:00Z'), region: 'East' },
  { _id: 's-3', productId: 'p-3', quantity: 4, soldAt: ISODate('2026-10-03T10:00:00Z'), region: 'West' },
  { _id: 's-4', productId: 'p-1', quantity: 1, soldAt: ISODate('2026-11-01T10:00:00Z'), region: 'East' },
].forEach((doc) => sales.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true }));

print('1. October sales only ($match):');
sales.aggregate([
  { $match: { soldAt: { $gte: ISODate('2026-10-01T00:00:00Z'), $lt: ISODate('2026-11-01T00:00:00Z') } } }, // Select October.
  { $project: { _id: 1, productId: 1, quantity: 1, soldAt: 1 } }, // Return useful sale fields.
]).forEach(printjson);

print('2. Units and sales count by product ($group):');
sales.aggregate([
  { $group: { _id: '$productId', units: { $sum: '$quantity' }, saleCount: { $sum: 1 } } }, // Add up units and order count.
]).forEach(printjson);

print('3. Best selling products by units ($sort):');
sales.aggregate([
  { $group: { _id: '$productId', units: { $sum: '$quantity' } } }, // Aggregate units by product.
  { $sort: { units: -1, _id: 1 } }, // Highest volume first, deterministic tie-break.
]).forEach(printjson);

print('4. Sales joined to product details ($lookup):');
sales.aggregate([
  { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } }, // Join each sale to its product.
  { $unwind: '$product' }, // Turn the single matched product into an object.
]).forEach(printjson);

print('5. Revenue by product ($project):');
sales.aggregate([
  { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } }, // Attach unit price.
  { $unwind: '$product' }, // One product is expected per sale.
  { $project: { _id: 0, product: '$product.name', region: 1, quantity: 1, revenue: { $multiply: ['$quantity', '$product.price'] } } }, // Compute and shape sales report.
  { $sort: { revenue: -1 } }, // Highest revenue first.
]).forEach(printjson);
