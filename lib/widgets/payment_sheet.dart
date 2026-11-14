import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/core/validators.dart';
import 'package:relooka/models/order_model.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/custom_text_field.dart';

/// Bottom sheet to add a UPI ID or a card. Returns the new [PaymentMethod],
/// or null if dismissed. Only a masked label is kept; the full card number
/// and CVV are discarded. In production, collect cards through your payment
/// gateway's SDK (Razorpay, Stripe, ...) instead of this form.
Future<PaymentMethod?> showAddPaymentSheet(BuildContext context) {
  return showModalBottomSheet<PaymentMethod>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.background,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => const _AddPaymentSheet(),
  );
}

class _AddPaymentSheet extends StatefulWidget {
  const _AddPaymentSheet();

  @override
  State<_AddPaymentSheet> createState() => _AddPaymentSheetState();
}

class _AddPaymentSheetState extends State<_AddPaymentSheet> {
  final _formKey = GlobalKey<FormState>();
  final _upi = TextEditingController();
  final _cardNumber = TextEditingController();
  final _cardName = TextEditingController();
  final _expiry = TextEditingController();
  final _cvv = TextEditingController();
  PaymentType _type = PaymentType.upi;

  @override
  void dispose() {
    _upi.dispose();
    _cardNumber.dispose();
    _cardName.dispose();
    _expiry.dispose();
    _cvv.dispose();
    super.dispose();
  }

  String _brand(String digits) {
    if (digits.startsWith('4')) return 'Visa';
    if (digits.startsWith('5')) return 'Mastercard';
    if (digits.startsWith('6')) return 'RuPay';
    return 'Card';
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final id = DateTime.now().microsecondsSinceEpoch.toString();
    if (_type == PaymentType.upi) {
      Navigator.pop(context,
          PaymentMethod(id: id, type: PaymentType.upi, label: _upi.text.trim()));
    } else {
      final digits = _cardNumber.text.replaceAll(' ', '');
      final last4 = digits.substring(digits.length - 4);
      Navigator.pop(
        context,
        PaymentMethod(
            id: id,
            type: PaymentType.card,
            label: '${_brand(digits)} •••• $last4'),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
            20, 20, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Add payment method', style: AppTheme.heading(size: 22)),
              const SizedBox(height: 16),
              SegmentedButton<PaymentType>(
                segments: const [
                  ButtonSegment(
                      value: PaymentType.upi,
                      label: Text('UPI'),
                      icon: Icon(Icons.account_balance_wallet_outlined)),
                  ButtonSegment(
                      value: PaymentType.card,
                      label: Text('Card'),
                      icon: Icon(Icons.credit_card)),
                ],
                selected: {_type},
                onSelectionChanged: (s) => setState(() => _type = s.first),
              ),
              const SizedBox(height: 20),
              if (_type == PaymentType.upi)
                CustomTextField(
                  label: 'UPI ID',
                  hint: 'name@upi',
                  controller: _upi,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.alternate_email,
                  validator: Validators.upi,
                )
              else ...[
                CustomTextField(
                  label: 'Card number',
                  hint: '1234 5678 9012 3456',
                  controller: _cardNumber,
                  keyboardType: TextInputType.number,
                  prefixIcon: Icons.credit_card,
                  inputFormatters: [_CardNumberFormatter()],
                  validator: Validators.cardNumber,
                ),
                const SizedBox(height: 14),
                CustomTextField(
                  label: 'Name on card',
                  controller: _cardName,
                  validator: Validators.name,
                ),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: CustomTextField(
                        label: 'Expiry',
                        hint: 'MM/YY',
                        controller: _expiry,
                        keyboardType: TextInputType.number,
                        inputFormatters: [_ExpiryFormatter()],
                        validator: Validators.expiry,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: CustomTextField(
                        label: 'CVV',
                        controller: _cvv,
                        obscureText: true,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(4),
                        ],
                        validator: Validators.cvv,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 22),
              CustomButton(label: 'Save', expanded: true, onPressed: _save),
            ],
          ),
        ),
      ),
    );
  }
}

/// Groups digits as "1234 5678 9012 3456" (max 19 digits).
class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    var d = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (d.length > 19) d = d.substring(0, 19);
    final buf = StringBuffer();
    for (var i = 0; i < d.length; i++) {
      if (i > 0 && i % 4 == 0) buf.write(' ');
      buf.write(d[i]);
    }
    final t = buf.toString();
    return TextEditingValue(
        text: t, selection: TextSelection.collapsed(offset: t.length));
  }
}

/// Formats digits as "MM/YY".
class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    var d = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (d.length > 4) d = d.substring(0, 4);
    final t = d.length > 2 ? '${d.substring(0, 2)}/${d.substring(2)}' : d;
    return TextEditingValue(
        text: t, selection: TextSelection.collapsed(offset: t.length));
  }
}
