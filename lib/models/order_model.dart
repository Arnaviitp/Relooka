enum PaymentType { upi, card }

/// A saved payment method. Only a display label is kept (UPI ID or masked
/// card); full card numbers and CVVs are never stored.
class PaymentMethod {
  final String id;
  final PaymentType type;
  final String label;

  const PaymentMethod(
      {required this.id, required this.type, required this.label});

  String get typeName => type == PaymentType.upi ? 'UPI' : 'Card';
}

class OrderLine {
  final String name;
  final String detail;
  final int price;
  final int deposit;

  const OrderLine({
    required this.name,
    required this.detail,
    required this.price,
    required this.deposit,
  });
}

class Order {
  final String id;
  final DateTime date;
  final List<OrderLine> lines;
  final int subtotal;
  final int deposits;
  final String paymentLabel;
  final String status;

  const Order({
    required this.id,
    required this.date,
    required this.lines,
    required this.subtotal,
    required this.deposits,
    required this.paymentLabel,
    this.status = 'Confirmed',
  });

  int get total => subtotal + deposits;

  String get dateLabel {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }
}
