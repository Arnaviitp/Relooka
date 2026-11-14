import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/models/listing_model.dart';
import 'package:relooka/models/product_model.dart';
import 'package:relooka/providers/listing_provider.dart';
import 'package:relooka/services/auth_service.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/page_shell.dart';

/// Renter page: for people who rent out their own outfits. Shows their
/// wardrobe (every outfit they have listed) and leads to the camera-verified
/// "List an outfit" form.
class RenterScreen extends StatefulWidget {
  const RenterScreen({super.key});

  @override
  State<RenterScreen> createState() => _RenterScreenState();
}

class _RenterScreenState extends State<RenterScreen> {
  String _category = 'All';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final all = context.watch<ListingProvider>().listings;
    final nav = Navigator.of(context);

    // Category chips only for categories present in the wardrobe.
    final categories = <String>{for (final l in all) l.category}.toList()
      ..sort();
    final active = categories.contains(_category) ? _category : 'All';
    final shown =
        all.where((l) => active == 'All' || l.category == active).toList();

    return PageShell(
      route: AppRoutes.renter,
      children: [
        HeroBanner(
          title: 'Rent Out Your Wardrobe',
          subtitle:
              'Become a ReLooka renter. List outfits you rarely wear\nand earn every time someone rents them.',
          buttonLabel: 'List an Outfit',
          imageColor: AppColors.brown,
          onPressed: () => nav.pushNamed(AppRoutes.list),
        ),
        const SizedBox(height: 32),
        Row(children: [
          Expanded(
            child: SectionTitle('My Wardrobe',
                trailing: auth.isLoggedIn ? '(${all.length} outfits)' : null),
          ),
          if (auth.isLoggedIn && all.isNotEmpty)
            CustomButton(
              label: 'Add outfit',
              leadingIcon: Icons.add_a_photo_outlined,
              onPressed: () => nav.pushNamed(AppRoutes.list),
            ),
        ]),
        if (!auth.isLoggedIn)
          _box(Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Log in to see your wardrobe.',
                  style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 14),
              Wrap(spacing: 12, runSpacing: 12, children: [
                CustomButton(
                  label: 'Log in',
                  onPressed: () => nav.pushNamed(AppRoutes.login),
                ),
                CustomButton(
                  label: 'Create account',
                  style: CustomButtonStyle.outline,
                  onPressed: () => nav.pushNamed(AppRoutes.register),
                ),
              ]),
            ],
          ))
        else if (all.isEmpty)
          _box(Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                  'Your wardrobe is empty. Add your first outfit to start earning.',
                  style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 14),
              CustomButton(
                label: 'List your first outfit',
                leadingIcon: Icons.add_a_photo_outlined,
                onPressed: () => nav.pushNamed(AppRoutes.list),
              ),
            ],
          ))
        else ...[
          _stats(all),
          const SizedBox(height: 16),
          if (categories.length > 1)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Wrap(spacing: 8, runSpacing: 8, children: [
                for (final c in ['All', ...categories])
                  ChoiceChip(
                    label: Text(c),
                    selected: active == c,
                    selectedColor: AppColors.dark,
                    showCheckmark: false,
                    labelStyle: TextStyle(
                        color:
                            active == c ? Colors.white : AppColors.textPrimary),
                    onSelected: (_) => setState(() => _category = c),
                  ),
              ]),
            ),
          LayoutBuilder(builder: (context, c) {
            final cols = c.maxWidth >= 860
                ? 4
                : c.maxWidth >= 620
                    ? 3
                    : 2;
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: shown.length,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: cols,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.7,
              ),
              itemBuilder: (_, i) => _WardrobeCard(
                listing: shown[i],
                onTap: () => _openDetail(shown[i]),
              ),
            );
          }),
        ],
        const SizedBox(height: 32),
        const SectionTitle('How it works'),
        _steps(),
      ],
    );
  }

  void _openDetail(OutfitListing listing) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _WardrobeDetail(listing: listing),
    );
  }

  Widget _stats(List<OutfitListing> all) {
    final review = all.where((l) => l.status == 'Under review').length;
    final live = all.length - review;
    Widget stat(String value, String label) => Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(children: [
              Text(value, style: AppTheme.heading(size: 26)),
              const SizedBox(height: 2),
              Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary)),
            ]),
          ),
        );
    return Row(children: [
      stat('${all.length}', 'In wardrobe'),
      const SizedBox(width: 12),
      stat('$review', 'Under review'),
      const SizedBox(width: 12),
      stat('$live', 'Live'),
    ]);
  }

  Widget _box(Widget child) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
        ),
        child: child,
      );

  Widget _steps() {
    const steps = [
      (Icons.photo_camera_outlined, '1. Capture',
          'Take at least 4 live photos from different angles.'),
      (Icons.verified_outlined, '2. Get verified',
          'We review your photos and approve the listing.'),
      (Icons.payments_outlined, '3. Earn',
          'Your outfit goes live and you earn on every rental.'),
    ];
    return LayoutBuilder(builder: (context, c) {
      final cols = c.maxWidth >= 800 ? 3 : 1;
      const gap = 16.0;
      final w = (c.maxWidth - gap * (cols - 1)) / cols;
      return Wrap(spacing: gap, runSpacing: gap, children: [
        for (final s in steps)
          SizedBox(
            width: w,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
              ),
              child:
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Icon(s.$1, size: 30, color: AppColors.brown),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.$2,
                          style: AppTheme.heading(
                              size: 18, weight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text(s.$3,
                          style: const TextStyle(
                              color: AppColors.textSecondary, height: 1.4)),
                    ],
                  ),
                ),
              ]),
            ),
          ),
      ]);
    });
  }
}

/// One outfit in the wardrobe grid.
class _WardrobeCard extends StatelessWidget {
  final OutfitListing listing;
  final VoidCallback onTap;
  const _WardrobeCard({required this.listing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = listing;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(fit: StackFit.expand, children: [
                l.photos.isEmpty
                    ? const ColoredBox(color: AppColors.border)
                    : Image.memory(l.photos.first.bytes, fit: BoxFit.cover),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.chip,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(l.status, style: const TextStyle(fontSize: 11)),
                  ),
                ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text('${l.category} · ${rupees(l.rentPerDay)}/day',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Bottom sheet with every photo of an outfit, its details and a remove
/// button.
class _WardrobeDetail extends StatefulWidget {
  final OutfitListing listing;
  const _WardrobeDetail({required this.listing});

  @override
  State<_WardrobeDetail> createState() => _WardrobeDetailState();
}

class _WardrobeDetailState extends State<_WardrobeDetail> {
  int _page = 0;

  Future<void> _remove() async {
    final provider = context.read<ListingProvider>();
    final nav = Navigator.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: const Text('Remove from wardrobe?'),
        content: Text('${widget.listing.name} will no longer be listed.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialog, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(dialog, true),
              child: const Text('Remove')),
        ],
      ),
    );
    if (ok == true) {
      provider.remove(widget.listing.id);
      nav.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = widget.listing;
    Widget row(String k, String v) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(
                width: 110,
                child: Text(k,
                    style: const TextStyle(color: AppColors.textSecondary))),
            Expanded(child: Text(v)),
          ]),
        );

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(l.name, style: AppTheme.heading(size: 24))),
              IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context)),
            ]),
            const SizedBox(height: 12),
            SizedBox(
              height: 320,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Stack(children: [
                  PageView.builder(
                    itemCount: l.photos.length,
                    onPageChanged: (i) => setState(() => _page = i),
                    itemBuilder: (_, i) => SizedBox.expand(
                        child:
                            Image.memory(l.photos[i].bytes, fit: BoxFit.cover)),
                  ),
                  Positioned(
                    left: 12,
                    bottom: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                          '${l.photos[_page].angle}  ·  ${_page + 1}/${l.photos.length}',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12)),
                    ),
                  ),
                ]),
              ),
            ),
            const SizedBox(height: 16),
            row('Listing ID', l.id),
            row('Status', l.status),
            row('Category', l.category),
            row('Size', l.size),
            row('Condition', l.condition),
            row('Rent', '${rupees(l.rentPerDay)} / day'),
            row('Deposit', '${rupees(l.deposit)} (refundable)'),
            if (l.description.isNotEmpty) row('Description', l.description),
            const SizedBox(height: 18),
            CustomButton(
              label: 'Remove from wardrobe',
              leadingIcon: Icons.delete_outline,
              style: CustomButtonStyle.outline,
              expanded: true,
              onPressed: _remove,
            ),
          ],
        ),
      ),
    );
  }
}
