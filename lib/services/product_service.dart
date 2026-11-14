import 'package:flutter/material.dart';

import 'package:relooka/models/product_model.dart';

/// Fetching product information.
///
/// Currently returns in-memory sample data. Replace the bodies with real
/// HTTP / Firebase calls later; the rest of the app only depends on these
/// method signatures.
class ProductService {
  Future<List<Product>> fetchProducts() async {
    await Future.delayed(const Duration(milliseconds: 250));
    return _products;
  }

  Future<List<Product>> search(String query) async {
    final all = await fetchProducts();
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return all;
    return all
        .where((p) =>
            p.name.toLowerCase().contains(q) ||
            p.category.toLowerCase().contains(q) ||
            p.fabric.toLowerCase().contains(q))
        .toList();
  }

  Future<List<Product>> related(Product product, {int limit = 4}) async {
    final all = await fetchProducts();
    return all.where((p) => p.id != product.id).take(limit).toList();
  }

  static const _desc =
      'A traditional piece with detailed embroidery, perfect for weddings '
      'and festive occasions.';

  static const List<Product> _products = [
    Product(
      id: 'p1',
      name: 'Embroidered Anarkali Set',
      category: 'Anarkali',
      gender: 'Women',
      rentPerDay: 600,
      condition: 'Like New',
      fabric: 'Georgette',
      setIncludes: 'Kurta, Bottom, Dupatta',
      description:
          'A traditional Anarkali set with detailed embroidery, perfect for '
          'weddings and festive occasions. The set includes a flared kurta, '
          'matching bottom and a dupatta.',
      color: Color(0xFF7A1424),
    ),
    Product(
      id: 'p2',
      name: 'Maroon Silk Saree',
      category: 'Saree',
      gender: 'Women',
      rentPerDay: 499,
      condition: 'Like New',
      fabric: 'Silk',
      setIncludes: 'Saree, Blouse piece',
      description: _desc,
      color: Color(0xFF9B1B30),
      deposit: 1500,
      sizes: ['Free'],
    ),
    Product(
      id: 'p3',
      name: 'Festive Lehenga',
      category: 'Lehenga',
      gender: 'Women',
      rentPerDay: 799,
      condition: 'Gently Used',
      fabric: 'Net & Silk',
      setIncludes: 'Lehenga, Blouse, Dupatta',
      description: _desc,
      color: Color(0xFFF2A900),
    ),
    Product(
      id: 'p4',
      name: 'Classic Beige Kurta',
      category: 'Kurta Set',
      gender: 'Men',
      rentPerDay: 699,
      condition: 'Like New',
      fabric: 'Cotton Silk',
      setIncludes: 'Kurta, Pyjama',
      description: _desc,
      color: Color(0xFFC9B79C),
      deposit: 1000,
      sizes: ['M', 'L', 'XL'],
    ),
    Product(
      id: 'p5',
      name: 'Embroidered Anarkali',
      category: 'Anarkali',
      gender: 'Women',
      rentPerDay: 650,
      condition: 'Well Loved',
      fabric: 'Georgette',
      setIncludes: 'Kurta, Bottom, Dupatta',
      description: _desc,
      color: Color(0xFFE9DCC8),
    ),
    Product(
      id: 'p6',
      name: 'Embroidered Saree',
      category: 'Saree',
      gender: 'Women',
      rentPerDay: 520,
      condition: 'Like New',
      fabric: 'Organza',
      setIncludes: 'Saree, Blouse piece',
      description: _desc,
      color: Color(0xFFD9A441),
      sizes: ['Free'],
    ),
    Product(
      id: 'p7',
      name: 'Sequin Lehenga Set',
      category: 'Lehenga',
      gender: 'Women',
      rentPerDay: 720,
      condition: 'Gently Used',
      fabric: 'Net',
      setIncludes: 'Lehenga, Blouse, Dupatta',
      description: _desc,
      color: Color(0xFFE8D5B5),
    ),
    Product(
      id: 'p8',
      name: 'Silk Gown',
      category: 'Dress',
      gender: 'Women',
      rentPerDay: 600,
      condition: 'Like New',
      fabric: 'Silk',
      setIncludes: 'Gown, Dupatta',
      description: _desc,
      color: Color(0xFF6B2A55),
    ),
    Product(
      id: 'p9',
      name: 'Anarkali Set',
      category: 'Anarkali',
      gender: 'Women',
      rentPerDay: 560,
      condition: 'Gently Used',
      fabric: 'Chinon',
      setIncludes: 'Kurta, Bottom, Dupatta',
      description: _desc,
      color: Color(0xFFD9726B),
    ),
    Product(
      id: 'p10',
      name: 'Ivory Sherwani',
      category: 'Sherwani',
      gender: 'Men',
      rentPerDay: 900,
      condition: 'Like New',
      fabric: 'Brocade',
      setIncludes: 'Sherwani, Churidar, Stole',
      description: _desc,
      color: Color(0xFFEDE3D0),
      sizes: ['M', 'L', 'XL'],
    ),
    Product(
      id: 'p11',
      name: 'Pastel Co-ord Set',
      category: 'Co-ord',
      gender: 'Women',
      rentPerDay: 399,
      condition: 'Well Loved',
      fabric: 'Linen',
      setIncludes: 'Top, Trousers',
      description: _desc,
      color: Color(0xFFBFD3C1),
      deposit: 1000,
    ),
    Product(
      id: 'p12',
      name: 'Floral Cotton Kurta',
      category: 'Kurta Set',
      gender: 'Women',
      rentPerDay: 349,
      condition: 'Like New',
      fabric: 'Cotton',
      setIncludes: 'Kurta, Palazzo',
      description: _desc,
      color: Color(0xFFE6C9A8),
      deposit: 800,
    ),
  ];
}
