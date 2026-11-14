import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/models/order_model.dart';
import 'package:relooka/models/product_model.dart';
import 'package:relooka/providers/cart_provider.dart';
import 'package:relooka/providers/order_provider.dart';
import 'package:relooka/services/auth_service.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/page_shell.dart';
import 'package:relooka/widgets/payment_sheet.dart';
import 'package:relooka/widgets/product_card.dart';

/// Cart + checkout: pick UPI / card, then place the rental order.
class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  String? _selectedMethodId;

  Future<void> _addMethod() async {
    final orders = context.read<OrderProvider>();
    final method = await showAddPaymentSheet(context);
    if (method == null) return;
    orders.addPayment(method);
    setState(() => _selectedMethodId = method.id);
  }

  void _checkout(CartProvider cart, OrderProvider orders, PaymentMethod method) {
    final order = orders.placeOrder(cart, method);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Order ${order.id} placed. Thank you!')),
    );
    Navigator.of(context).pushReplacementNamed(AppRoutes.profile);
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final orders = context.watch<OrderProvider>();
    final auth = context.watch<AuthService>();

    return PageShell(
      route: null,
      children: [
        SectionTitle('Your Cart', trailing: '(${cart.count} items)'),
        if (cart.items.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 48),
            child: Center(
              child: Column(children: [
                const Text('Your cart is empty.'),
                const SizedBox(height: 16),
                CustomButton(
                  label: 'Browse Rentals',
                  onPressed: () => Navigator.of(context)
                      .pushReplacementNamed(AppRoutes.rent),
                ),
              ]),
            ),
          )
        else ...[
          for (final item in cart.items) _itemTile(cart, item),
          const SizedBox(height: 16),
          LayoutBuilder(builder: (context, c) {
            final wide = c.maxWidth >= 800;
            final payment = _paymentSection(auth, orders);
            final summary = _summary(cart, orders, auth);
            if (wide) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: payment),
                  const SizedBox(width: 24),
                  SizedBox(width: 360, child: summary),
                ],
              );
            }
            return Column(children: [
              payment,
              const SizedBox(height: 20),
              summary,
            ]);
          }),
        ],
      ],
    );
  }

  Widget _itemTile(CartProvider cart, CartItem item) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 72,
              height: 90,
              child: ProductImage(product: item.product),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.product.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 4),
                Text(item.label,
                    style: const TextStyle(color: AppColors.textSecondary)),
                Text('Refundable deposit ${rupees(item.deposit)}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Text(rupees(item.price),
              style: const TextStyle(fontWeight: FontWeight.w700)),
          IconButton(
            tooltip: 'Remove',
            icon: const Icon(Icons.delete_outline),
            onPressed: () => cart.remove(item),
          ),
        ]),
      );

  Widget _paymentSection(AuthService auth, OrderProvider orders) {
    final loggedIn = auth.isLoggedIn;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Payment method',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 12),
          if (!loggedIn)
            const Text('Log in to choose how you want to pay.',
                style: TextStyle(color: AppColors.textSecondary))
          else ...[
            if (orders.methods.isEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text('No payment method yet. Add UPI or a card.',
                    style: TextStyle(color: AppColors.textSecondary)),
              ),
            for (final m in orders.methods)
              RadioListTile<String>(
                contentPadding: EdgeInsets.zero,
                value: m.id,
                groupValue: _selectedMethodId,
                activeColor: AppColors.dark,
                onChanged: (v) => setState(() => _selectedMethodId = v),
                title: Text(m.label),
                subtitle: Text(m.typeName),
                secondary: Icon(m.type == PaymentType.upi
                    ? Icons.account_balance_wallet_outlined
                    : Icons.credit_card),
              ),
            const SizedBox(height: 4),
            CustomButton(
              label: 'Add UPI / Card',
              leadingIcon: Icons.add,
              style: CustomButtonStyle.outline,
              onPressed: _addMethod,
            ),
          ],
        ],
      ),
    );
  }

  Widget _summary(CartProvider cart, OrderProvider orders, AuthService auth) {
    PaymentMethod? selected;
    for (final m in orders.methods) {
      if (m.id == _selectedMethodId) selected = m;
    }

    return Column(children: [
      _row('Subtotal', rupees(cart.subtotal)),
      _row('Refundable deposit', rupees(cart.deposits)),
      const Divider(),
      _row('Total', rupees(cart.total), bold: true),
      const SizedBox(height: 16),
      if (!auth.isLoggedIn)
        CustomButton(
          label: 'Log in to checkout',
          expanded: true,
          onPressed: () => Navigator.of(context).pushNamed(AppRoutes.login),
        )
      else
        CustomButton(
          label: selected == null ? 'Select a payment method' : 'Place Order',
          expanded: true,
          onPressed: selected == null
              ? null
              : () => _checkout(cart, orders, selected!),
        ),
    ]);
  }

  Widget _row(String l, String r, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l,
                style: TextStyle(
                    fontWeight: bold ? FontWeight.w700 : FontWeight.w400)),
            Text(r,
                style: TextStyle(
                    fontWeight: bold ? FontWeight.w700 : FontWeight.w500)),
          ],
        ),
      );
}
