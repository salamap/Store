/**
 * Created by petersalama on 12/30/14.
 */
ProductCollection = new Mongo.Collection('Product');
CustomerCollection = new Mongo.Collection('Customers');
SoldCollection = new Mongo.Collection('Sold');
PurchaseReceiptCollection = new Mongo.Collection('PurchaseReceipts');
ExchangeReceiptCollection = new Mongo.Collection('ExchangeReceipts');
ReturnReceiptCollection = new Mongo.Collection('ReturnReceipts');

EasySearch.createSearchIndex('Product', {
  collection: ProductCollection,
  field: ['BarCode', 'Description'],
  use: 'mongo-db',
});

EasySearch.createSearchIndex('Sold', {
  collection: SoldCollection,
  field: ['BarCode', 'Description'],
  use: 'mongo-db',
});

EasySearch.createSearchIndex('PurchaseReceipts', {
  collection: PurchaseReceiptCollection,
  field: ['BarCode'],
  use: 'mongo-db',
});

EasySearch.createSearchIndex('ExchangeReceipts', {
  collection: ExchangeReceiptCollection,
  field: ['BarCode'],
  use: 'mongo-db',
});

EasySearch.createSearchIndex('ReturnReceipts', {
  collection: ReturnReceiptCollection,
  field: ['BarCode'],
  use: 'mongo-db',
});
