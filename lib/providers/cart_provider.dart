import 'package:flutter/foundation.dart';

import 'package:relooka/models/product_model.dart';

class CartItem {
  final Product product;
  final int days;
  final String size;

  const CartItem({
    required this.product,
    required this.days,
    required this.size,
  });

  int get price => product.rentPrice(days);
  int get deposit => product.deposit;
  String get label => 'Rent · $days days · $size';
}

/// Rental cart state.
class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);
  int get count => _items.length;
  int get subtotal => _items.fold(0, (s, i) => s + i.price);
  int get deposits => _items.fold(0, (s, i) => s + i.deposit);
  int get total => subtotal + deposits;

  void add(CartItem item) {
    _items.add(item);
    notifyListeners();
  }

  void remove(CartItem item) {
    _items.remove(item);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
