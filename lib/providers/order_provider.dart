import 'package:flutter/foundation.dart';

import 'package:relooka/models/order_model.dart';
import 'package:relooka/providers/cart_provider.dart';

/// Order history and saved payment methods (UPI / card).
class OrderProvider extends ChangeNotifier {
  final List<Order> _orders = [];
  final List<PaymentMethod> _methods = [];

  /// Newest first.
  List<Order> get orders => List.unmodifiable(_orders.reversed);
  List<PaymentMethod> get methods => List.unmodifiable(_methods);

  void addPayment(PaymentMethod method) {
    _methods.add(method);
    notifyListeners();
  }

  void removePayment(PaymentMethod method) {
    _methods.removeWhere((m) => m.id == method.id);
    notifyListeners();
  }

  /// Turns the cart into an order, then empties the cart.
  Order placeOrder(CartProvider cart, PaymentMethod method) {
    final order = Order(
      id: 'RLK-ORD-${1001 + _orders.length}',
      date: DateTime.now(),
      lines: [
        for (final i in cart.items)
          OrderLine(
            name: i.product.name,
            detail: i.label,
            price: i.price,
            deposit: i.deposit,
          ),
      ],
      subtotal: cart.subtotal,
      deposits: cart.deposits,
      paymentLabel: '${method.typeName} · ${method.label}',
    );
    _orders.add(order);
    cart.clear();
    notifyListeners();
    return order;
  }

  void clear() {
    _orders.clear();
    _methods.clear();
    notifyListeners();
  }
}
