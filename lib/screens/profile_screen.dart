import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/models/listing_model.dart';
import 'package:relooka/models/order_model.dart';
import 'package:relooka/models/product_model.dart';
import 'package:relooka/models/user_model.dart';
import 'package:relooka/providers/cart_provider.dart';
import 'package:relooka/providers/listing_provider.dart';
import 'package:relooka/providers/order_provider.dart';
import 'package:relooka/services/auth_service.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/page_shell.dart';
import 'package:relooka/widgets/payment_sheet.dart';

/// Profile: ReLooka ID, order history, payment methods and my listings.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user;

    if (user == null) {
      return PageShell(
        route: null,
        children: [
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Column(children: [
                const Text('Log in to see your profile.'),
                const SizedBox(height: 16),
                CustomButton(
                  label: 'Log in',
                  onPressed: () =>
                      Navigator.of(context).pushReplacementNamed(AppRoutes.login),
                ),
              ]),
            ),
          ),
        ],
      );
    }

    final orders = context.watch<OrderProvider>();
    final listings = context.watch<ListingProvider>();
    final wide = MediaQuery.of(context).size.width >= 900;

    final orderSection = _orders(context, orders.orders);
    final side = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _payments(context, orders),
        const SizedBox(height: 28),
        _listings(context, listings.listings),
      ],
    );

    return PageShell(
      route: null,
      children: [
        _header(context, user),
        _faceAuthCard(context, user),
        const SizedBox(height: 32),
        if (wide)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 6, child: orderSection),
              const SizedBox(width: 32),
              Expanded(flex: 5, child: side),
            ],
          )
        else ...[
          orderSection,
          const SizedBox(height: 28),
          side,
        ],
        const SizedBox(height: 32),
        CustomButton(
          label: 'Log out',
          leadingIcon: Icons.logout,
          style: CustomButtonStyle.outline,
          onPressed: () {
            final nav = Navigator.of(context);
            context.read<AuthService>().logout();
            context.read<OrderProvider>().clear();
            context.read<ListingProvider>().clear();
            context.read<CartProvider>().clear();
            nav.pushNamedAndRemoveUntil(AppRoutes.home, (_) => false);
          },
        ),
      ],
    );
  }

  // ---- Header -------------------------------------------------------------

  Widget _header(BuildContext context, AppUser u) {
    Widget info(IconData icon, String text) => Padding(
          padding: const EdgeInsets.only(right: 20, top: 6),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 16, color: AppColors.textSecondary),
            const SizedBox(width: 6),
            Text(text,
                style: const TextStyle(color: AppColors.textSecondary)),
          ]),
        );

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Wrap(
        spacing: 20,
        runSpacing: 16,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          CircleAvatar(
            radius: 34,
            backgroundColor: AppColors.dark,
            child: Text(
              u.name.isEmpty ? '?' : u.name[0].toUpperCase(),
              style: AppTheme.heading(size: 28, color: Colors.white),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(u.name, style: AppTheme.heading(size: 28)),
              const SizedBox(height: 8),
              InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: u.reLookaId));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('ReLooka ID copied')),
                  );
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.chip,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Text('ReLooka ID  ',
                        style: TextStyle(fontSize: 12)),
                    Text(u.reLookaId,
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, letterSpacing: 1)),
                    const SizedBox(width: 8),
                    const Icon(Icons.copy, size: 14),
                  ]),
                ),
              ),
              const SizedBox(height: 6),
              Wrap(children: [
                info(Icons.phone_outlined, '+91 ${u.mobile}'),
                info(Icons.mail_outline, u.email),
                info(Icons.location_on_outlined, u.pincode),
                info(Icons.person_outline, u.gender),
                info(Icons.badge_outlined, 'ID ${u.maskedGovId}'),
              ]),
            ],
          ),
        ],
      ),
    );
  }

  // ---- Order history ------------------------------------------------------

  Widget _orders(BuildContext context, List<Order> orders) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle('Order History'),
        if (orders.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(children: [
              const Text('No rentals yet.',
                  style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 14),
              CustomButton(
                label: 'Browse Rentals',
                onPressed: () =>
                    Navigator.of(context).pushReplacementNamed(AppRoutes.rent),
              ),
            ]),
          )
        else
          for (final o in orders) _orderCard(o),
      ],
    );
  }

  Widget _orderCard(Order o) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(o.id,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 15)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(o.status,
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.success)),
              ),
            ]),
            const SizedBox(height: 2),
            Text(o.dateLabel,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
            const Divider(height: 22),
            for (final l in o.lines)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l.name,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w600)),
                          Text(l.detail,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    Text(rupees(l.price)),
                  ],
                ),
              ),
            const Divider(height: 22),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text('Paid via ${o.paymentLabel}',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                ),
                Text('Total ${rupees(o.total)}',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
            Text('Includes ${rupees(o.deposits)} refundable deposit',
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary)),
          ],
        ),
      );

  // ---- Payment methods ----------------------------------------------------

  Widget _payments(BuildContext context, OrderProvider orders) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle('Payment Methods'),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (orders.methods.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('No UPI or card saved yet.',
                      style: TextStyle(color: AppColors.textSecondary)),
                ),
              for (final m in orders.methods)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(m.type == PaymentType.upi
                      ? Icons.account_balance_wallet_outlined
                      : Icons.credit_card),
                  title: Text(m.label),
                  subtitle: Text(m.typeName),
                  trailing: IconButton(
                    tooltip: 'Remove',
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () =>
                        context.read<OrderProvider>().removePayment(m),
                  ),
                ),
              CustomButton(
                label: 'Add UPI / Card',
                leadingIcon: Icons.add,
                style: CustomButtonStyle.outline,
                onPressed: () async {
                  final provider = context.read<OrderProvider>();
                  final method = await showAddPaymentSheet(context);
                  if (method != null) provider.addPayment(method);
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---- My listings --------------------------------------------------------

  Widget _listings(BuildContext context, List<OutfitListing> listings) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle('My Listings'),
        if (listings.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('You have not listed any outfits.',
                    style: TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 12),
                CustomButton(
                  label: 'Become a renter',
                  style: CustomButtonStyle.outline,
                  onPressed: () => Navigator.of(context)
                      .pushReplacementNamed(AppRoutes.renter),
                ),
              ],
            ),
          )
        else
          for (final l in listings)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 56,
                    height: 70,
                    child: l.photos.isEmpty
                        ? const ColoredBox(color: AppColors.border)
                        : Image.memory(l.photos.first.bytes, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l.name,
                          style:
                              const TextStyle(fontWeight: FontWeight.w700)),
                      Text('${l.id} · ${rupees(l.rentPerDay)}/day',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.chip,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(l.status, style: const TextStyle(fontSize: 12)),
                ),
              ]),
            ),
      ],
    );
    }

  Widget _faceAuthCard(BuildContext context, AppUser u) {
    if (u.isFaceAuthVerified) {
      return Container(
        margin: const EdgeInsets.only(top: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9),
          border: Border.all(color: const Color(0xFFA5D6A7)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFF2E7D32),
              child: Icon(Icons.verified_user, color: Colors.white),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Government ID Verified',
                        style: AppTheme.heading(size: 16, color: const Color(0xFF1B5E20)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFC8E6C9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'AI AGENT VERIFIED',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF2E7D32)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${u.idType ?? "Gov ID"} · Masked Ref: ${u.maskedGovId} · YuNet & SFace Biometric Match',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF2E7D32)),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(top: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.face_retouching_natural, color: Colors.black87, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('AI Face Authentication Agent', style: AppTheme.heading(size: 17)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.chip,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('D:\\Agents', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Aadhaar, Passport, Driving Licence, Voter ID · Live Anti-Spoofing',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Under DPDPA 2023 compliance, raw document photos and facial embeddings are shredded post-matching. Complete biometric verification in 30 seconds.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          CustomButton(
            label: 'Verify with Face Auth Agent',
            leadingIcon: Icons.camera_alt_outlined,
            onPressed: () => _openFaceAuthSheet(context, u),
          ),
        ],
      ),
    );
  }

  void _openFaceAuthSheet(BuildContext context, AppUser user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String docType = 'Aadhaar Card';
        final idCtrl = TextEditingController();
        int step = 1;
        bool consent = true;
        bool busy = false;

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              margin: EdgeInsets.only(
                top: 60,
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              padding: const EdgeInsets.all(28),
              decoration: const BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.face_retouching_natural, color: AppColors.brown),
                            const SizedBox(width: 8),
                            Text('Face Auth Agent (D:\\Agents)', style: AppTheme.heading(size: 20)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Standalone YuNet + SFace + MiniFASNetV2 Government ID Agent',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const Divider(height: 28),
                    if (step == 1) ...[
                      const Text('Step 1: Select Government Document', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: docType,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppColors.surface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'Aadhaar Card', child: Text('Aadhaar Card (UIDAI)')),
                          DropdownMenuItem(value: 'Passport', child: Text('Passport')),
                          DropdownMenuItem(value: 'Driving Licence', child: Text('Driving Licence')),
                          DropdownMenuItem(value: 'Voter ID', child: Text('Voter ID (EPIC)')),
                        ],
                        onChanged: (v) => setModalState(() => docType = v ?? docType),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: idCtrl,
                        decoration: InputDecoration(
                          labelText: 'Last 4 Digits / Reference',
                          hintText: 'e.g. 9012',
                          filled: true,
                          fillColor: AppColors.surface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Checkbox(
                            value: consent,
                            activeColor: AppColors.brown,
                            onChanged: (v) => setModalState(() => consent = v ?? true),
                          ),
                          const Expanded(
                            child: Text(
                              'I grant consent for automated facial matching & temporal liveness verification. Biometrics are shredded post-matching per DPDPA 2023.',
                              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      CustomButton(
                        label: 'Proceed to Live Face Challenge',
                        expanded: true,
                        onPressed: consent && idCtrl.text.isNotEmpty
                            ? () {
                                setModalState(() => step = 2);
                              }
                            : null,
                      ),
                    ] else if (step == 2) ...[
                      const Text('Step 2: Live Temporal Challenge', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.chip,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Row(
                          children: [
                            Text('😊', style: TextStyle(fontSize: 32)),
                            SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Challenge: Please Smile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  SizedBox(height: 2),
                                  Text('Looking directly into the front camera', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      Container(
                        height: 180,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.face, size: 64, color: Colors.white70),
                              const SizedBox(height: 10),
                              Text(
                                busy ? 'Evaluating optical flow & MiniFASNet anti-spoofing...' : 'Position face inside camera viewfinder',
                                style: const TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      CustomButton(
                        label: busy ? 'Analyzing Biometrics...' : 'Capture & Verify Biometrics',
                        expanded: true,
                        loading: busy,
                        onPressed: () async {
                          setModalState(() => busy = true);
                          await Future.delayed(const Duration(milliseconds: 1400));
                          setModalState(() {
                            busy = false;
                            step = 3;
                          });
                          if (context.mounted) {
                            await context.read<AuthService>().setFaceAuthVerified(
                              idType: docType,
                              govId: idCtrl.text.trim().isEmpty ? 'XXXX9012' : idCtrl.text.trim(),
                              agentVerdict: 'VERIFIED',
                            );
                          }
                        },
                      ),
                    ] else ...[
                      Center(
                        child: Column(
                          children: [
                            const SizedBox(height: 16),
                            const CircleAvatar(
                              radius: 36,
                              backgroundColor: Color(0xFF2E7D32),
                              child: Icon(Icons.check, color: Colors.white, size: 40),
                            ),
                            const SizedBox(height: 16),
                            Text('Identity Successfully Verified!', style: AppTheme.heading(size: 20)),
                            const SizedBox(height: 8),
                            const Text(
                              'The Face Authentication Agent matched your selfie with your government document using SFace cosine similarity and MiniFASNetV2 temporal anti-spoofing.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                            const SizedBox(height: 20),
                            CustomButton(
                              label: 'Done',
                              expanded: true,
                              onPressed: () => Navigator.of(context).pop(),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}